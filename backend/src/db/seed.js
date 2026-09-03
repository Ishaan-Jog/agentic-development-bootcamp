import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import db, { initDatabase } from './index.js';
import crypto from 'crypto';
import { config } from '../config/env.js';

function generateSignedQRPayload(ticketCode, eventId, userId) {
  const data = `${ticketCode}:${eventId}:${userId}`;
  const hmac = crypto.createHmac('sha256', config.qrSecret).update(data).digest('hex');
  return JSON.stringify({ ticketCode, eventId, userId, signature: hmac });
}

export function seedDatabase() {
  initDatabase();

  console.log('🌱 Seeding database...');

  // Reset Tables
  db.exec('DELETE FROM registrations');
  db.exec('DELETE FROM events');
  db.exec('DELETE FROM categories');
  db.exec('DELETE FROM users');

  const passwordHash = bcrypt.hashSync('Password123!', 10);

  // 1. Insert Head User & Normal Viewer
  const headUserId = 'u1111111-1111-1111-1111-111111111111';
  const viewerUserId = 'u2222222-2222-2222-2222-222222222222';

  const insertUser = db.prepare(
    'INSERT INTO users (id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)'
  );

  insertUser.run(headUserId, 'Alex Organizer (Head User)', 'head@ems.com', passwordHash, 'HEAD_USER');
  insertUser.run(viewerUserId, 'Sam Viewer (Normal Viewer)', 'viewer@ems.com', passwordHash, 'VIEWER');

  console.log('✅ Users seeded: head@ems.com (HEAD_USER), viewer@ems.com (VIEWER)');

  // 2. Insert Categories
  const catTechId = 'c1111111-1111-1111-1111-111111111111';
  const catWorkshopId = 'c2222222-2222-2222-2222-222222222222';

  const insertCat = db.prepare('INSERT INTO categories (id, name, slug) VALUES (?, ?, ?)');
  insertCat.run(catTechId, 'Technology & AI', 'technology-ai');
  insertCat.run(catWorkshopId, 'Workshops & Training', 'workshops-training');

  // 3. Insert Events
  const event1Id = 'e1111111-1111-1111-1111-111111111111';
  const event2Id = 'e2222222-2222-2222-2222-222222222222';

  const insertEvent = db.prepare(`
    INSERT INTO events (id, title, description, banner_url, type, location, start_time, end_time, capacity, price, status, organizer_id, category_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertEvent.run(
    event1Id,
    'Global AI & Agentic Bootcamp 2026',
    'Learn how to build next-generation agentic AI systems with modern web applications.',
    'https://images.unsplash.com/photo-1540575467063-178a50c2df87',
    'HYBRID',
    'Tech Convention Hub, SF & Live Stream',
    '2026-10-15 09:00:00',
    '2026-10-15 17:00:00',
    100,
    0.00,
    'PUBLISHED',
    headUserId,
    catTechId
  );

  insertEvent.run(
    event2Id,
    'Fullstack Node.js & React Masterclass',
    'Hands-on intensive workshop building scalable web APIs and glassmorphic dashboards.',
    'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4',
    'VIRTUAL',
    'Zoom Online Meeting',
    '2026-11-01 14:00:00',
    '2026-11-01 18:00:00',
    50,
    49.99,
    'PUBLISHED',
    headUserId,
    catWorkshopId
  );

  console.log('✅ Events seeded: 2 Published Events organized by head@ems.com');

  // 4. Insert Sample Registration for Normal Viewer
  const ticketCode = 'TICK-SAM-VIEWER-001';
  const qrPayload = generateSignedQRPayload(ticketCode, event1Id, viewerUserId);

  const insertReg = db.prepare(`
    INSERT INTO registrations (id, event_id, user_id, ticket_code, qr_code_payload, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertReg.run(uuidv4(), event1Id, viewerUserId, ticketCode, qrPayload, 'CONFIRMED');

  console.log('✅ Registration seeded: viewer@ems.com registered for Global AI Bootcamp');
  console.log('🚀 Seeding finished successfully!');
}

// Run if called directly
if (process.argv[1]?.endsWith('seed.js')) {
  seedDatabase();
}

