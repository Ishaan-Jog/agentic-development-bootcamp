import { v4 as uuidv4 } from 'uuid';
import db from '../db/index.js';

export async function getPublicEvents(req, res) {
  try {
    const { search, category, type, status } = req.query;

    let query = `
      SELECT e.*, c.name as category_name, u.name as organizer_name,
        (SELECT COUNT(*) FROM registrations r WHERE r.event_id = e.id AND r.status = 'CONFIRMED') as confirmed_count
      FROM events e
      LEFT JOIN categories c ON e.category_id = c.id
      LEFT JOIN users u ON e.organizer_id = u.id
      WHERE 1=1
    `;
    const params = [];

    // Default status to PUBLISHED for public API unless explicitly requested by authorized user
    if (status) {
      query += ' AND e.status = ?';
      params.push(status);
    } else {
      query += " AND e.status = 'PUBLISHED'";
    }

    if (search) {
      query += ' AND (e.title LIKE ? OR e.description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (category) {
      query += ' AND (c.slug = ? OR c.id = ?)';
      params.push(category, category);
    }

    if (type) {
      query += ' AND e.type = ?';
      params.push(type);
    }

    query += ' ORDER BY e.start_time ASC';

    const events = db.prepare(query).all(...params);
    return res.json({ success: true, count: events.length, data: { events } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function getEventById(req, res) {
  try {
    const { id } = req.params;
    const event = db.prepare(`
      SELECT e.*, c.name as category_name, u.name as organizer_name, u.email as organizer_email,
        (SELECT COUNT(*) FROM registrations r WHERE r.event_id = e.id AND r.status = 'CONFIRMED') as confirmed_count,
        (SELECT COUNT(*) FROM registrations r WHERE r.event_id = e.id AND r.status = 'WAITLIST') as waitlist_count
      FROM events e
      LEFT JOIN categories c ON e.category_id = c.id
      LEFT JOIN users u ON e.organizer_id = u.id
      WHERE e.id = ?
    `).get(id);

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    return res.json({ success: true, data: { event } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function createEvent(req, res) {
  try {
    const { title, description, bannerUrl, type, location, startTime, endTime, capacity, price, status, categoryId } = req.body;

    if (!title || !description || !type || !startTime || !endTime || capacity === undefined) {
      return res.status(400).json({ success: false, message: 'Missing required event fields.' });
    }

    const id = uuidv4();
    const eventStatus = status || 'DRAFT';

    db.prepare(`
      INSERT INTO events (id, title, description, banner_url, type, location, start_time, end_time, capacity, price, status, organizer_id, category_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      title,
      description,
      bannerUrl || null,
      type,
      location || null,
      startTime,
      endTime,
      capacity,
      price || 0.00,
      eventStatus,
      req.user.id,
      categoryId || null
    );

    const created = db.prepare('SELECT * FROM events WHERE id = ?').get(id);
    return res.status(201).json({ success: true, message: 'Event created successfully.', data: { event: created } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function updateEvent(req, res) {
  try {
    const { id } = req.params;
    const { title, description, bannerUrl, type, location, startTime, endTime, capacity, price, categoryId } = req.body;

    db.prepare(`
      UPDATE events
      SET title = COALESCE(?, title),
          description = COALESCE(?, description),
          banner_url = COALESCE(?, banner_url),
          type = COALESCE(?, type),
          location = COALESCE(?, location),
          start_time = COALESCE(?, start_time),
          end_time = COALESCE(?, end_time),
          capacity = COALESCE(?, capacity),
          price = COALESCE(?, price),
          category_id = COALESCE(?, category_id),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(title, description, bannerUrl, type, location, startTime, endTime, capacity, price, categoryId, id);

    const updated = db.prepare('SELECT * FROM events WHERE id = ?').get(id);
    return res.json({ success: true, message: 'Event updated successfully.', data: { event: updated } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function updateEventStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['DRAFT', 'PUBLISHED', 'ONGOING', 'COMPLETED', 'CANCELLED'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: `Status must be one of: ${validStatuses.join(', ')}` });
    }

    db.prepare('UPDATE events SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, id);
    return res.json({ success: true, message: `Event status updated to ${status}.` });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function deleteEvent(req, res) {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM events WHERE id = ?').run(id);
    return res.json({ success: true, message: 'Event deleted successfully.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function getOrganizerEvents(req, res) {
  try {
    const events = db.prepare(`
      SELECT e.*, c.name as category_name,
        (SELECT COUNT(*) FROM registrations r WHERE r.event_id = e.id AND r.status = 'CONFIRMED') as confirmed_count,
        (SELECT COUNT(*) FROM registrations r WHERE r.event_id = e.id AND r.status = 'CHECKED_IN') as checked_in_count
      FROM events e
      LEFT JOIN categories c ON e.category_id = c.id
      WHERE e.organizer_id = ?
      ORDER BY e.created_at DESC
    `).all(req.user.id);

    return res.json({ success: true, count: events.length, data: { events } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function getCategories(req, res) {
  try {
    const categories = db.prepare('SELECT * FROM categories ORDER BY name ASC').all();
    return res.json({ success: true, data: { categories } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
