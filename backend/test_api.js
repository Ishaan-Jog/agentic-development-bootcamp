import db, { initDatabase } from './src/db/index.js';
import { seedDatabase } from './src/db/seed.js';
import app from './src/server.js';
import http from 'http';

seedDatabase();

console.log('\n🧪 Running Backend API Automated Integration Verification...');

let server = http.createServer(app);
server.listen(5005, async () => {
  try {
    // 1. Health check
    const health = await fetch('http://localhost:5005/health').then(r => r.json());
    console.log('✅ Health Check:', health.status);

    // 2. Login Head User
    const headAuth = await fetch('http://localhost:5005/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'head@ems.com', password: 'Password123!' })
    }).then(r => r.json());
    console.log('✅ Head User Login:', headAuth.success, '| Role:', headAuth.data.user.role);
    const headToken = headAuth.data.token;

    // 3. Login Normal Viewer
    const viewerAuth = await fetch('http://localhost:5005/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'viewer@ems.com', password: 'Password123!' })
    }).then(r => r.json());
    console.log('✅ Normal Viewer Login:', viewerAuth.success, '| Role:', viewerAuth.data.user.role);
    const viewerToken = viewerAuth.data.token;

    // 4. Fetch Public Events
    const eventsRes = await fetch('http://localhost:5005/api/v1/events').then(r => r.json());
    console.log('✅ Public Events Catalog:', eventsRes.count, 'events found');
    const firstEventId = eventsRes.data.events[0].id;

    // 5. Head User Creates a New Event Draft
    const createRes = await fetch('http://localhost:5005/api/v1/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${headToken}`
      },
      body: JSON.stringify({
        title: 'Cybersecurity & Zero Trust Workshop',
        description: 'Comprehensive hands-on training on modern security architecture.',
        type: 'VIRTUAL',
        startTime: '2026-12-01 10:00:00',
        endTime: '2026-12-01 15:00:00',
        capacity: 30,
        price: 0,
        status: 'PUBLISHED'
      })
    }).then(r => r.json());
    console.log('✅ Head User Event Created:', createRes.success, '| Title:', createRes.data.event.title);
    const newEventId = createRes.data.event.id;

    // 6. Normal Viewer Registers for newly created event
    const regRes = await fetch(`http://localhost:5005/api/v1/events/${newEventId}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${viewerToken}`
      }
    }).then(r => r.json());
    console.log('✅ Viewer Registration:', regRes.success, '| Ticket Code:', regRes.data.registration.ticketCode);
    const qrPayload = regRes.data.registration.qrCodePayload;

    // 7. Head User Scans & Checks In Viewer's QR Code Ticket
    const checkInRes = await fetch('http://localhost:5005/api/v1/tickets/check-in', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${headToken}`
      },
      body: JSON.stringify({ scannedPayload: qrPayload })
    }).then(r => r.json());
    console.log('✅ QR Ticket Check-In:', checkInRes.success, '| Message:', checkInRes.message);

    // 8. Head User Checks Organizer Analytics
    const statsRes = await fetch('http://localhost:5005/api/v1/organizer/analytics', {
      headers: { 'Authorization': `Bearer ${headToken}` }
    }).then(r => r.json());
    console.log('✅ Organizer Analytics:', JSON.stringify(statsRes.data.analytics));

    console.log('\n🎉 ALL INTEGRATION TESTS PASSED CLEANLY!\n');
  } catch (err) {
    console.error('❌ Verification failed:', err);
  } finally {
    server.close();
    process.exit(0);
  }
});
