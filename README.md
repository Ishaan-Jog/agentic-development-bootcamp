# Event Management System (EMS)

A full-stack Event Management System built with a Node.js/Express backend, SQLite database, and a React + Vite frontend styled with a modern blue theme.

---

## 📁 Project Structure

```text
agentic-development-bootcamp/
├── backend/                  # Express REST API & SQLite Database
│   ├── src/
│   │   ├── controllers/      # Route controllers (auth, events, registrations, etc.)
│   │   ├── db/               # SQLite schema, migrations, seed script
│   │   ├── middleware/       # JWT Auth & role authorization middlewares
│   │   ├── routes/           # Express API routers
│   │   └── server.js         # Backend server entry point
│   ├── data/                 # SQLite database file (ems.db)
│   └── package.json
│
├── frontend/                 # React (Vite) Single Page Application
│   ├── src/
│   │   ├── components/       # UI components (Navbar, Modal, QR Scanner, etc.)
│   │   ├── context/          # Auth Context & global state
│   │   ├── pages/            # App pages (Home, Events, Details, Dashboard, Admin, etc.)
│   │   ├── services/         # API client & endpoints
│   │   └── index.css         # Modern blue-themed design system
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── .agents/                  # Workspace customizations & skills
│   └── skills/architecture/  # Imported architecture skill framework
└── README.md
```

---

## 🚀 Prerequisites

- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

---

## 🛠️ Setup & Installation

### 1. Backend Setup

```bash
# Navigate to the backend directory
cd backend

# Install dependencies
npm install

# Seed the database with sample events and users (Optional but recommended)
npm run seed
```

### 2. Frontend Setup

```bash
# Navigate to the frontend directory (from project root)
cd frontend

# Install dependencies
npm install
```

---

## ▶️ Running the Application

To run the entire application, you need to start both the **Backend** and **Frontend** servers in separate terminal windows.

### Terminal 1: Backend Server

```bash
cd backend
npm run dev
```
- **Backend API URL**: `http://localhost:5000`
- **Health Check**: `http://localhost:5000/api/health`

### Terminal 2: Frontend Client

```bash
cd frontend
npm run dev
```
- **Frontend App URL**: `http://localhost:5173` (or the port shown in your terminal)

---

## 🔨 Building for Production

### Frontend Build

```bash
cd frontend
npm run build
```
The optimized production bundle will be generated in `frontend/dist/`.

To preview the production build locally:
```bash
npm run preview
```

### Backend Production Start

```bash
cd backend
npm start
```

---

## 🔑 Default Test Accounts (Seed Data)

If you ran `npm run seed` in the backend, you can sign in with:

| Role | Email | Password |
|------|-------|----------|
| **Admin** | `admin@ems.com` | `admin123` |
| **Organizer** | `organizer@ems.com` | `organizer123` |
| **User / Attendee** | `john@example.com` | `user123` |

---

## 🌟 Key Features

- **Authentication & Authorization**: Secure JWT-based auth with Role-Based Access Control (`admin`, `organizer`, `attendee`).
- **Event Discovery & Filtering**: Search, category filters, date filters, and event detail views.
- **Ticketing & Registration**: RSVP, capacity validation, and automated QR ticket generation.
- **Organizer Dashboard**: Event creation, attendee list management, and registration tracking.
- **Attendance Verification**: QR code ticket scanning & verification for check-in.
- **Modern Blue-Themed UI**: Polished glassmorphism cards, responsive layouts, and rich micro-interactions.
