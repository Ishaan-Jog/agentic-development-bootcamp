import express from 'express';
import * as authCtrl from '../controllers/auth.controller.js';
import * as eventCtrl from '../controllers/event.controller.js';
import * as regCtrl from '../controllers/registration.controller.js';
import * as ticketCtrl from '../controllers/ticket.controller.js';
import * as analyticsCtrl from '../controllers/analytics.controller.js';
import { authenticateJWT, authorizeRoles, verifyEventOwnership } from '../middlewares/auth.middleware.js';

const router = express.Router();

// 1. Auth Routes
router.post('/auth/register', authCtrl.register);
router.post('/auth/login', authCtrl.login);
router.get('/auth/me', authenticateJWT, authCtrl.getMe);

// 2. Category Routes
router.get('/categories', eventCtrl.getCategories);

// 3. Public Event Routes
router.get('/events', eventCtrl.getPublicEvents);
router.get('/events/:id', eventCtrl.getEventById);

// 4. Viewer / Attendee Routes
router.post('/events/:id/register', authenticateJWT, regCtrl.registerForEvent);
router.get('/viewer/registrations', authenticateJWT, regCtrl.getViewerRegistrations);
router.delete('/registrations/:id', authenticateJWT, regCtrl.cancelRegistration);

// 5. Head User / Organizer Routes (Restricted to HEAD_USER role)
router.post('/events', authenticateJWT, authorizeRoles('HEAD_USER'), eventCtrl.createEvent);
router.get('/organizer/events', authenticateJWT, authorizeRoles('HEAD_USER'), eventCtrl.getOrganizerEvents);
router.put('/events/:id', authenticateJWT, authorizeRoles('HEAD_USER'), verifyEventOwnership, eventCtrl.updateEvent);
router.patch('/events/:id/status', authenticateJWT, authorizeRoles('HEAD_USER'), verifyEventOwnership, eventCtrl.updateEventStatus);
router.delete('/events/:id', authenticateJWT, authorizeRoles('HEAD_USER'), verifyEventOwnership, eventCtrl.deleteEvent);

// Attendee Roster & Export
router.get('/events/:id/attendees', authenticateJWT, authorizeRoles('HEAD_USER'), verifyEventOwnership, regCtrl.getEventAttendees);
router.get('/events/:id/export', authenticateJWT, authorizeRoles('HEAD_USER'), verifyEventOwnership, regCtrl.exportEventAttendeesCSV);

// Ticket Verification & QR Check-in
router.post('/tickets/check-in', authenticateJWT, authorizeRoles('HEAD_USER'), ticketCtrl.checkInTicket);

// Analytics
router.get('/organizer/analytics', authenticateJWT, authorizeRoles('HEAD_USER'), analyticsCtrl.getOrganizerAnalytics);

export default router;
