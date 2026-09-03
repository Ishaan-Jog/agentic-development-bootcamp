# ⚙️ Event Management System (EMS) — Backend Architectural Specifications

## 1. Architectural Principles & Technology Stack

The **Event Management System (EMS)** backend is designed following **Clean Layered Architecture** principles to maintain strict separation of concerns, high testability, and enterprise-grade security.

### 🛠️ Core Stack Recommendations
* **Runtime / Framework:** Node.js (Express / NestJS) or Python (FastAPI / Django REST Framework).
* **Database & ORM:** PostgreSQL / SQLite paired with Prisma ORM or Drizzle ORM.
* **Authentication:** JWT (JSON Web Tokens) + `bcrypt` / `argon2` for password hashing.
* **QR Code & Utilities:** `qrcode` generation library, `crypto` for HMAC cryptographic signatures, `json2csv` for export processing.

---

## 2. Backend Project Directory Structure

```
backend/
├── src/
│   ├── config/              # Environment variables, DB connection, CORS, constants
│   ├── controllers/         # Request handling & HTTP response mapping
│   │   ├── auth.controller.js
│   │   ├── event.controller.js
│   │   ├── registration.controller.js
│   │   ├── ticket.controller.js
│   │   └── analytics.controller.js
│   ├── middlewares/         # Route guards & global interceptors
│   │   ├── auth.middleware.js         # JWT Verification
│   │   ├── role.middleware.js         # Head User vs Viewer Guard
│   │   ├── owner.middleware.js        # Event Ownership Verification
│   │   ├── validate.middleware.js     # Zod / Joi Schema Validator
│   │   └── errorHandler.middleware.js # Centralized Error Handler
│   ├── models/ or prisma/   # ORM schema definitions & migrations
│   │   └── schema.prisma
│   ├── repositories/        # Direct database querying layer
│   │   ├── user.repository.js
│   │   ├── event.repository.js
│   │   └── registration.repository.js
│   ├── services/            # Pure Business Logic
│   │   ├── auth.service.js
│   │   ├── event.service.js
│   │   ├── registration.service.js
│   │   ├── ticket.service.js
│   │   └── mailer.service.js
│   ├── utils/               # Cryptography, QR payload signers, CSV formatters
│   │   ├── crypto.util.js
│   │   ├── qrGenerator.util.js
│   │   └── logger.util.js
│   ├── app.js               # Express application initialization
│   └── server.js            # Entry point & HTTP listener
└── tests/                   # Unit & Integration tests
```

---

## 3. Middleware & Security Implementation

### 3.1. Authentication & RBAC Middleware Flow

```mermaid
graph TD
    Req[Incoming HTTP Request] --> JWT[authMiddleware: Verify Bearer Token]
    JWT -->|Invalid / Missing| Err401[Return 401 Unauthorized]
    JWT -->|Valid| Attach[Attach req.user = { id, email, role }]
    
    Attach --> RoleCheck{roleMiddleware: Required Role?}
    RoleCheck -->|Role mismatch e.g. Viewer requesting POST /events| Err403[Return 403 Forbidden]
    RoleCheck -->|Passed| OwnerCheck{ownerMiddleware: Requires Event Ownership?}
    
    OwnerCheck -->|No| Next[Proceed to Controller Service]
    OwnerCheck -->|Yes| QueryDB[Fetch Event from DB]
    QueryDB --> CheckMatch{event.organizerId === req.user.id?}
    CheckMatch -->|No| Err403
    CheckMatch -->|Yes| Next
```

### 3.2. Code Snippet: RBAC & Ownership Guard Blueprint
```javascript
// role.middleware.js
export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: Insufficient privileges for this action.'
      });
    }
    next();
  };
};

// owner.middleware.js
export const verifyEventOwnership = async (req, res, next) => {
  const eventId = req.params.id || req.body.eventId;
  const event = await eventRepository.findById(eventId);

  if (!event) {
    return res.status(404).json({ success: false, error: 'Event not found' });
  }

  if (event.organizerId !== req.user.id) {
    return res.status(403).json({
      success: false,
      error: 'Forbidden: You do not own this event.'
    });
  }

  req.event = event; // Attach event to request
  next();
};
```

---

## 4. Core Business Logic Services

### 4.1. Registration Service & Atomic Capacity Transaction
Prevents race conditions when multiple Normal Viewers attempt to register for limited seats simultaneously.

```javascript
// registration.service.js
export const registerForEvent = async (userId, eventId) => {
  return await prisma.$transaction(async (tx) => {
    // 1. Lock event row and fetch current confirmed registrations count
    const event = await tx.event.findUnique({
      where: { id: eventId },
      include: { _count: { select: { registrations: { where: { status: 'CONFIRMED' } } } } }
    });

    if (!event || event.status !== 'PUBLISHED') {
      throw new Error('Event is not available for registration.');
    }

    // 2. Check if user is already registered
    const existing = await tx.registration.findUnique({
      where: { eventId_userId: { eventId, userId } }
    });
    if (existing) {
      throw new Error('You are already registered for this event.');
    }

    // 3. Determine status (CONFIRMED vs WAITLIST)
    const confirmedCount = event._count.registrations;
    const isFull = confirmedCount >= event.capacity;
    const status = isFull ? 'WAITLIST' : 'CONFIRMED';

    // 4. Generate Ticket Code & Cryptographically Signed QR Payload
    const ticketCode = `TICK-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const qrPayload = generateSignedQRPayload(ticketCode, eventId, userId);

    // 5. Create Registration Record
    const registration = await tx.registration.create({
      data: {
        eventId,
        userId,
        ticketCode,
        qrCodePayload: qrPayload,
        status
      }
    });

    return { registration, isWaitlisted: isFull };
  });
};
```

---

### 4.2. Cryptographic QR Verification Service
Protects tickets against counterfeit QR codes presented during check-in.

```javascript
// ticket.service.js
import crypto from 'crypto';

const SECRET_KEY = process.env.QR_HMAC_SECRET || 'super-secret-key';

export const generateSignedQRPayload = (ticketCode, eventId, userId) => {
  const data = `${ticketCode}:${eventId}:${userId}`;
  const hmac = crypto.createHmac('sha256', SECRET_KEY).update(data).digest('hex');
  return JSON.stringify({ ticketCode, eventId, userId, signature: hmac });
};

export const verifyAndCheckInTicket = async (scannedPayload, organizerId) => {
  const { ticketCode, eventId, userId, signature } = JSON.parse(scannedPayload);

  // 1. Verify HMAC Signature
  const expectedHmac = crypto
    .createHmac('sha256', SECRET_KEY)
    .update(`${ticketCode}:${eventId}:${userId}`)
    .digest('hex');

  if (signature !== expectedHmac) {
    return { success: false, code: 'INVALID_SIGNATURE', message: 'Counterfeit or tampered ticket QR code.' };
  }

  // 2. Verify Event Ownership
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event || event.organizerId !== organizerId) {
    return { success: false, code: 'UNAUTHORIZED_EVENT', message: 'This ticket is for an event you do not organize.' };
  }

  // 3. Fetch Registration Record
  const registration = await prisma.registration.findUnique({
    where: { ticketCode },
    include: { user: { select: { name: true, email: true } } }
  });

  if (!registration) {
    return { success: false, code: 'TICKET_NOT_FOUND', message: 'Ticket registration record not found.' };
  }

  if (registration.status === 'CHECKED_IN') {
    return {
      success: false,
      code: 'ALREADY_CHECKED_IN',
      message: `Already checked in at ${registration.checkedInAt}`,
      attendee: registration.user
    };
  }

  // 4. Update Status to CHECKED_IN
  const updatedReg = await prisma.registration.update({
    where: { id: registration.id },
    data: { status: 'CHECKED_IN', checkedInAt: new Date() }
  });

  return {
    success: true,
    message: 'Check-in successful!',
    attendee: registration.user,
    checkedInAt: updatedReg.checkedInAt
  };
};
```

---

## 5. API Response Data Transfer Objects (DTOs)

### Standardized API Success Response Format
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Operation completed successfully",
  "data": {}
}
```

### Standardized API Error Response Format
```json
{
  "success": false,
  "statusCode": 400,
  "error": "BAD_REQUEST",
  "message": "Detailed error explanation for the client",
  "stack": null // Only rendered in development mode
}
```

---

## 6. Environment Variables (`.env.example`)

```ini
# Server Environment
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# Database Connection
DATABASE_URL="postgresql://ems_admin:secure_password@localhost:5432/ems_db?schema=public"

# Authentication Secrets
JWT_SECRET=super_secret_jwt_key_change_in_production
JWT_EXPIRES_IN=7d
QR_HMAC_SECRET=cryptographic_qr_signing_secret_key

# Email Service Config (SMTP)
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your_smtp_username
SMTP_PASS=your_smtp_password
EMAIL_FROM="EMS Notifications <no-reply@ems-app.com>"
```
