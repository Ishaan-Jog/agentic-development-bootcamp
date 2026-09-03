import crypto from 'crypto';
import db from '../db/index.js';
import { config } from '../config/env.js';

export async function checkInTicket(req, res) {
  try {
    const { scannedPayload, ticketCode } = req.body;
    let targetTicketCode = ticketCode;
    let targetEventId = null;
    let targetUserId = null;
    let signature = null;

    if (scannedPayload) {
      try {
        const parsed = typeof scannedPayload === 'string' ? JSON.parse(scannedPayload) : scannedPayload;
        targetTicketCode = parsed.ticketCode;
        targetEventId = parsed.eventId;
        targetUserId = parsed.userId;
        signature = parsed.signature;

        // Verify cryptographic HMAC-SHA256 signature
        const expectedHmac = crypto
          .createHmac('sha256', config.qrSecret)
          .update(`${targetTicketCode}:${targetEventId}:${targetUserId}`)
          .digest('hex');

        if (signature !== expectedHmac) {
          return res.status(400).json({
            success: false,
            statusCode: 400,
            error: 'INVALID_SIGNATURE',
            message: 'Counterfeit or tampered ticket QR code payload.'
          });
        }
      } catch (e) {
        return res.status(400).json({ success: false, message: 'Malformed QR payload format.' });
      }
    }

    if (!targetTicketCode) {
      return res.status(400).json({ success: false, message: 'Ticket code or QR payload is required.' });
    }

    // Lookup registration
    const registration = db.prepare(`
      SELECT r.*, e.organizer_id, e.title as event_title, u.name as attendee_name, u.email as attendee_email
      FROM registrations r
      JOIN events e ON r.event_id = e.id
      JOIN users u ON r.user_id = u.id
      WHERE r.ticket_code = ?
    `).get(targetTicketCode);

    if (!registration) {
      return res.status(404).json({ success: false, message: 'Ticket code not found in registration database.' });
    }

    // Verify Head User Ownership
    if (registration.organizer_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        statusCode: 403,
        error: 'FORBIDDEN_NOT_ORGANIZER',
        message: 'You are not authorized to check in tickets for an event you do not organize.'
      });
    }

    // Check status
    if (registration.status === 'CHECKED_IN') {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        error: 'ALREADY_CHECKED_IN',
        message: `Ticket already checked in at ${registration.checked_in_at}.`,
        data: {
          attendee: { name: registration.attendee_name, email: registration.attendee_email },
          checkedInAt: registration.checked_in_at
        }
      });
    }

    // Update status to CHECKED_IN
    const checkedInAt = new Date().toISOString();
    db.prepare(`
      UPDATE registrations
      SET status = 'CHECKED_IN', checked_in_at = ?
      WHERE id = ?
    `).run(checkedInAt, registration.id);

    return res.json({
      success: true,
      message: `Entry Granted! Checked in ${registration.attendee_name}.`,
      data: {
        attendee: { name: registration.attendee_name, email: registration.attendee_email },
        eventTitle: registration.event_title,
        ticketCode: registration.ticket_code,
        checkedInAt
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
