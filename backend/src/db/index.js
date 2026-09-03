import Database from 'better-sqlite3';
import { config } from '../config/env.js';

const db = new Database(config.dbPath);

// Enable Foreign Key support in SQLite
db.pragma('foreign_keys = ON');

export function initDatabase() {
  db.exec(`
    -- Users Table
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('HEAD_USER', 'VIEWER')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Categories Table
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      slug TEXT UNIQUE NOT NULL
    );

    -- Events Table
    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      banner_url TEXT,
      type TEXT NOT NULL CHECK (type IN ('VIRTUAL', 'IN_PERSON', 'HYBRID')),
      location TEXT,
      start_time DATETIME NOT NULL,
      end_time DATETIME NOT NULL,
      capacity INTEGER NOT NULL CHECK (capacity >= 0),
      price REAL NOT NULL DEFAULT 0.00 CHECK (price >= 0.00),
      status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PUBLISHED', 'ONGOING', 'COMPLETED', 'CANCELLED')),
      organizer_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Registrations (Tickets) Table
    CREATE TABLE IF NOT EXISTS registrations (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      ticket_code TEXT UNIQUE NOT NULL,
      qr_code_payload TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'CONFIRMED' CHECK (status IN ('CONFIRMED', 'WAITLIST', 'CANCELLED', 'CHECKED_IN')),
      registered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      checked_in_at DATETIME,
      UNIQUE(event_id, user_id)
    );

    -- Indexes
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_events_status ON events(status, start_time);
    CREATE INDEX IF NOT EXISTS idx_events_organizer ON events(organizer_id);
    CREATE INDEX IF NOT EXISTS idx_reg_ticket_code ON registrations(ticket_code);
    CREATE INDEX IF NOT EXISTS idx_reg_event_user ON registrations(event_id, user_id);
  `);
}

export default db;
