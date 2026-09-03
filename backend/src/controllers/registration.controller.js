import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import db from '../db/index.js';
import { config } from '../config/env.js';

function generateSignedQRPayload(ticketCode, eventId, userId) {
  const data = `${ticketCode}:${eventId}:${userId}`;
  const hmac = crypto.createHmac('sha256', config.qrSecret).update(data).digest('hex');
  return JSON.stringify({ ticketCode, eventId, userId, signature: hmac });
}

export async function registerForEvent(req, res) {
  try {
    const { id: eventId } = req.params;
    const userId = req.user.id;

    const event = db.prepare('SELECT * FROM events WHERE id = ?').get(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    if (event.status !== 'PUBLISHED' && event.status !== 'ONGOING') {
      return res.status(400).json({ success: false, message: 'This event is not open for registration.' });
    }

    // Check existing registration
    const existing = db.prepare('SELECT * FROM registrations WHERE event_id = ? AND user_id = ?').get(eventId, userId);
    if (existing) {
      return res.status(400).json({ success: false, message: 'You are already registered for this event.', data: { registration: existing } });
    }

    // Atomic transaction for capacity calculation
    const result = db.transaction(() => {
      const confirmedCount = db.prepare(
        "SELECT COUNT(*) as count FROM registrations WHERE event_id = ? AND status = 'CONFIRMED'"
      ).get(eventId).count;

      const isFull = confirmedCount >= event.capacity;
      const status = isFull ? 'WAITLIST' : 'CONFIRMED';
      const regId = uuidv4();
      const ticketCode = `TICK-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      const qrPayload = generateSignedQRPayload(ticketCode, eventId, userId);

      db.prepare(`
        INSERT INTO registrations (id, event_id, user_id, ticket_code, qr_code_payload, status)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(regId, eventId, userId, ticketCode, qrPayload, status);

      return {
        id: regId,
        eventId,
        userId,
        ticketCode,
        qrCodePayload: qrPayload,
        status,
        isWaitlisted: isFull
      };
    })();

    return res.status(201).json({
      success: true,
      statusCode: 201,
      message: result.isWaitlisted ? 'Event is at full capacity. You have been added to the waitlist.' : 'Registration successful! Your digital ticket is ready.',
      data: { registration: result }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function getViewerRegistrations(req, res) {
  try {
    const userId = req.user.id;
    const registrations = db.prepare(`
      SELECT r.*, e.title as event_title, e.description as event_description,
             e.start_time, e.end_time, e.location, e.type as event_type, e.banner_url,
             u.name as organizer_name
      FROM registrations r
      JOIN events e ON r.event_id = e.id
      JOIN users u ON e.organizer_id = u.id
      WHERE r.user_id = ?
      ORDER BY r.registered_at DESC
    `).all(userId);

    return res.json({ success: true, count: registrations.length, data: { registrations } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function cancelRegistration(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const registration = db.prepare('SELECT * FROM registrations WHERE id = ?').get(id);
    if (!registration) {
      return res.status(404).json({ success: false, message: 'Registration record not found.' });
    }

    if (registration.user_id !== userId && req.user.role !== 'HEAD_USER') {
      return res.status(403).json({ success: false, message: 'Forbidden: Cannot cancel another user registration.' });
    }

    db.prepare('DELETE FROM registrations WHERE id = ?').run(id);

    return res.json({ success: true, message: 'Registration cancelled successfully.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function getEventAttendees(req, res) {
  try {
    const { id: eventId } = req.params;
    const { status, search } = req.query;

    let query = `
      SELECT r.id as registration_id, r.ticket_code, r.status, r.registered_at, r.checked_in_at,
             u.id as user_id, u.name as user_name, u.email as user_email
      FROM registrations r
      JOIN users u ON r.user_id = u.id
      WHERE r.event_id = ?
    `;
    const params = [eventId];

    if (status) {
      query += ' AND r.status = ?';
      params.push(status);
    }

    if (search) {
      query += ' AND (u.name LIKE ? OR u.email LIKE ? OR r.ticket_code LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY r.registered_at DESC';

    const attendees = db.prepare(query).all(...params);
    return res.json({ success: true, count: attendees.length, data: { attendees } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function exportEventAttendeesCSV(req, res) {
  try {
    const { id: eventId } = req.params;

    const attendees = db.prepare(`
      SELECT r.ticket_code, r.status, r.registered_at, r.checked_in_at,
             u.name, u.email
      FROM registrations r
      JOIN users u ON r.user_id = u.id
      WHERE r.event_id = ?
      ORDER BY r.registered_at DESC
    `).all(eventId);

    const headers = ['Ticket Code', 'Status', 'Attendee Name', 'Attendee Email', 'Registered At', 'Checked In At'];
    const rows = attendees.map(a => [
      `"${a.ticket_code}"`,
      `"${a.status}"`,
      `"${a.name}"`,
      `"${a.email}"`,
      `"${a.registered_at}"`,
      `"${a.checked_in_at || 'N/A'}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="attendees_event_${eventId}.csv"`);
    return res.status(200).send(csvContent);
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
