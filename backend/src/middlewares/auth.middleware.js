import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import db from '../db/index.js';

export function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      statusCode: 401,
      error: 'UNAUTHORIZED',
      message: 'Access token missing or invalid format.'
    });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      statusCode: 401,
      error: 'INVALID_TOKEN',
      message: 'Token expired or invalid.'
    });
  }
}

export function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        statusCode: 403,
        error: 'FORBIDDEN',
        message: `Forbidden: Requires one of the following roles: ${allowedRoles.join(', ')}`
      });
    }
    next();
  };
}

export function verifyEventOwnership(req, res, next) {
  const eventId = req.params.id || req.body.eventId;
  if (!eventId) {
    return res.status(400).json({ success: false, error: 'Event ID is required.' });
  }

  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(eventId);

  if (!event) {
    return res.status(404).json({ success: false, error: 'Event not found.' });
  }

  if (event.organizer_id !== req.user.id) {
    return res.status(403).json({
      success: false,
      statusCode: 403,
      error: 'FORBIDDEN_NOT_OWNER',
      message: 'Access denied. You do not own this event.'
    });
  }

  req.event = event;
  next();
}
