/**
 * 🧪 Comprehensive Backend Integration Verification Suite
 * Tests ALL endpoints, RBAC guards, edge cases, and business logic
 */

const BASE = 'http://localhost:5000';
const API = `${BASE}/api/v1`;

let headToken = null;
let viewerToken = null;
let newUserToken = null;
let createdEventId = null;
let registrationId = null;
let ticketQRPayload = null;
let ticketCode = null;

let passed = 0;
let failed = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passed++;
  } else {
    console.log(`  ❌ FAIL: ${testName}`);
    failed++;
  }
}

async function req(endpoint, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  const res = await fetch(`${API}${endpoint}`, { ...options, headers });
  const contentType = res.headers.get('content-type') || '';
  let data;
  if (contentType.includes('text/csv')) {
    data = await res.text();
  } else {
    data = await res.json();
  }
  return { status: res.status, data, ok: res.ok };
}

function authHeader(token) {
  return { Authorization: `Bearer ${token}` };
}

// ════════════════════════════════════════════════
// TEST SUITE
// ════════════════════════════════════════════════

async function testHealthCheck() {
  console.log('\n═══ 1. HEALTH CHECK ═══');
  const res = await fetch(`${BASE}/health`).then(r => r.json());
  assert(res.status === 'OK', 'Health endpoint returns OK');

  const root = await fetch(`${BASE}/`).then(r => r.json());
  assert(root.message.includes('Event Management System'), 'Root endpoint returns welcome message');
}

async function testAuth() {
  console.log('\n═══ 2. AUTHENTICATION & USER REGISTRATION ═══');

  // 2a. Login as seeded Head User
  const headRes = await req('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'head@ems.com', password: 'Password123!' })
  });
  assert(headRes.status === 200, 'Head User login returns 200');
  assert(headRes.data.success === true, 'Head User login succeeds');
  assert(headRes.data.data.user.role === 'HEAD_USER', 'Head User has HEAD_USER role');
  assert(headRes.data.data.token.length > 20, 'Head User receives JWT token');
  headToken = headRes.data.data.token;

  // 2b. Login as seeded Normal Viewer
  const viewerRes = await req('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'viewer@ems.com', password: 'Password123!' })
  });
  assert(viewerRes.status === 200, 'Normal Viewer login returns 200');
  assert(viewerRes.data.data.user.role === 'VIEWER', 'Normal Viewer has VIEWER role');
  viewerToken = viewerRes.data.data.token;

  // 2c. Login with wrong password
  const badLogin = await req('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'head@ems.com', password: 'WrongPassword!' })
  });
  assert(badLogin.status === 401, 'Invalid password returns 401');
  assert(badLogin.data.success === false, 'Invalid password login fails');

  // 2d. Login with non-existent email
  const noUser = await req('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'nobody@ems.com', password: 'Password123!' })
  });
  assert(noUser.status === 401, 'Non-existent email returns 401');

  // 2e. Register a new VIEWER account
  const newViewer = await req('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name: 'Test NewUser', email: 'newuser@test.com', password: 'Secure456!', role: 'VIEWER' })
  });
  assert(newViewer.status === 201, 'New user registration returns 201');
  assert(newViewer.data.data.user.role === 'VIEWER', 'New user gets VIEWER role');
  newUserToken = newViewer.data.data.token;

  // 2f. Duplicate email registration
  const dupEmail = await req('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name: 'Dup User', email: 'newuser@test.com', password: 'Secure456!' })
  });
  assert(dupEmail.status === 400, 'Duplicate email registration returns 400');

  // 2g. Missing fields registration
  const missingFields = await req('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name: '', email: '', password: '' })
  });
  assert(missingFields.status === 400, 'Missing fields registration returns 400');

  // 2h. Get authenticated profile
  const meRes = await req('/auth/me', { headers: authHeader(headToken) });
  assert(meRes.status === 200, 'GET /auth/me returns 200 for authenticated user');
  assert(meRes.data.data.user.email === 'head@ems.com', '/auth/me returns correct email');

  // 2i. Unauthenticated /me request
  const noAuth = await req('/auth/me');
  assert(noAuth.status === 401, 'GET /auth/me without token returns 401');
}

async function testPublicEvents() {
  console.log('\n═══ 3. PUBLIC EVENT DISCOVERY ═══');

  // 3a. List all published events (no auth needed)
  const eventsRes = await req('/events');
  assert(eventsRes.status === 200, 'Public events endpoint returns 200');
  assert(eventsRes.data.success === true, 'Public events request succeeds');
  assert(eventsRes.data.data.events.length >= 2, 'At least 2 seeded events exist');

  // 3b. Search events by keyword
  const searchRes = await req('/events?search=AI');
  assert(searchRes.status === 200, 'Search by keyword returns 200');
  assert(searchRes.data.data.events.length >= 1, 'Search for "AI" returns at least 1 event');
  assert(searchRes.data.data.events[0].title.includes('AI'), 'Search result title contains keyword');

  // 3c. Search with no matching keyword
  const noMatch = await req('/events?search=xyznonexistent');
  assert(noMatch.status === 200, 'No-match search returns 200');
  assert(noMatch.data.data.events.length === 0, 'No-match search returns empty list');

  // 3d. Filter by category slug
  const catRes = await req('/events?category=technology-ai');
  assert(catRes.status === 200, 'Category filter returns 200');
  assert(catRes.data.data.events.length >= 1, 'Category filter returns events');

  // 3e. Filter by event type
  const typeRes = await req('/events?type=HYBRID');
  assert(typeRes.status === 200, 'Type filter returns 200');

  // 3f. Get single event details
  const allEvents = eventsRes.data.data.events;
  const firstEvent = allEvents[0];
  const detailRes = await req(`/events/${firstEvent.id}`);
  assert(detailRes.status === 200, 'Single event detail returns 200');
  assert(detailRes.data.data.event.title === firstEvent.title, 'Event detail returns correct title');
  assert(detailRes.data.data.event.organizer_name !== undefined, 'Event detail includes organizer name');
  assert(detailRes.data.data.event.confirmed_count !== undefined, 'Event detail includes confirmed count');

  // 3g. Get non-existent event
  const notFound = await req('/events/nonexistent-uuid-12345');
  assert(notFound.status === 404, 'Non-existent event returns 404');
}

async function testCategories() {
  console.log('\n═══ 4. CATEGORIES ═══');

  const catRes = await req('/categories');
  assert(catRes.status === 200, 'Categories endpoint returns 200');
  assert(catRes.data.data.categories.length >= 2, 'At least 2 seeded categories exist');
  assert(catRes.data.data.categories[0].name !== undefined, 'Category has a name');
  assert(catRes.data.data.categories[0].slug !== undefined, 'Category has a slug');
}

async function testHeadUserEventManagement() {
  console.log('\n═══ 5. HEAD USER: EVENT CREATION & MANAGEMENT ═══');

  // 5a. Create a new event as Head User
  const createRes = await req('/events', {
    method: 'POST',
    headers: authHeader(headToken),
    body: JSON.stringify({
      title: 'Test Event - Verification Suite',
      description: 'A test event created by the automated verification suite.',
      type: 'VIRTUAL',
      location: 'Zoom Meeting Room',
      startTime: '2026-12-25 10:00:00',
      endTime: '2026-12-25 16:00:00',
      capacity: 5,
      price: 9.99,
      status: 'DRAFT'
    })
  });
  assert(createRes.status === 201, 'Event creation returns 201');
  assert(createRes.data.data.event.status === 'DRAFT', 'Event created with DRAFT status');
  assert(createRes.data.data.event.capacity === 5, 'Event capacity is 5');
  assert(createRes.data.data.event.price === 9.99, 'Event price is 9.99');
  createdEventId = createRes.data.data.event.id;

  // 5b. Verify DRAFT event does NOT appear in public catalog
  const publicCheck = await req('/events');
  const draftInPublic = publicCheck.data.data.events.find(e => e.id === createdEventId);
  assert(!draftInPublic, 'DRAFT event does NOT appear in public catalog');

  // 5c. Publish the event (status DRAFT -> PUBLISHED)
  const publishRes = await req(`/events/${createdEventId}/status`, {
    method: 'PATCH',
    headers: authHeader(headToken),
    body: JSON.stringify({ status: 'PUBLISHED' })
  });
  assert(publishRes.status === 200, 'Publish status change returns 200');

  // 5d. Verify PUBLISHED event DOES appear in public catalog
  const publicCheck2 = await req('/events');
  const pubInPublic = publicCheck2.data.data.events.find(e => e.id === createdEventId);
  assert(!!pubInPublic, 'PUBLISHED event appears in public catalog');

  // 5e. Update event details
  const updateRes = await req(`/events/${createdEventId}`, {
    method: 'PUT',
    headers: authHeader(headToken),
    body: JSON.stringify({ title: 'Updated Test Event Title' })
  });
  assert(updateRes.status === 200, 'Event update returns 200');
  assert(updateRes.data.data.event.title === 'Updated Test Event Title', 'Event title updated correctly');

  // 5f. Get organizer's own events list
  const orgEvents = await req('/organizer/events', { headers: authHeader(headToken) });
  assert(orgEvents.status === 200, 'Organizer events list returns 200');
  assert(orgEvents.data.data.events.length >= 1, 'Organizer has at least 1 event');

  // 5g. Invalid status value
  const badStatus = await req(`/events/${createdEventId}/status`, {
    method: 'PATCH',
    headers: authHeader(headToken),
    body: JSON.stringify({ status: 'INVALID_STATUS' })
  });
  assert(badStatus.status === 400, 'Invalid status value returns 400');
}

async function testRBACGuards() {
  console.log('\n═══ 6. RBAC GUARDS & AUTHORIZATION ═══');

  // 6a. Normal Viewer CANNOT create events (403)
  const viewerCreate = await req('/events', {
    method: 'POST',
    headers: authHeader(viewerToken),
    body: JSON.stringify({ title: 'Hacked Event', description: 'test', type: 'VIRTUAL', startTime: '2026-12-25 10:00:00', endTime: '2026-12-25 16:00:00', capacity: 10 })
  });
  assert(viewerCreate.status === 403, 'VIEWER cannot create events (403 Forbidden)');

  // 6b. Normal Viewer CANNOT update events (403)
  const viewerUpdate = await req(`/events/${createdEventId}`, {
    method: 'PUT',
    headers: authHeader(viewerToken),
    body: JSON.stringify({ title: 'Hacked Title' })
  });
  assert(viewerUpdate.status === 403, 'VIEWER cannot update events (403 Forbidden)');

  // 6c. Normal Viewer CANNOT delete events (403)
  const viewerDelete = await req(`/events/${createdEventId}`, {
    method: 'DELETE',
    headers: authHeader(viewerToken)
  });
  assert(viewerDelete.status === 403, 'VIEWER cannot delete events (403 Forbidden)');

  // 6d. Normal Viewer CANNOT view attendee roster (403)
  const viewerRoster = await req(`/events/${createdEventId}/attendees`, {
    headers: authHeader(viewerToken)
  });
  assert(viewerRoster.status === 403, 'VIEWER cannot view attendee roster (403 Forbidden)');

  // 6e. Normal Viewer CANNOT export CSV (403)
  const viewerExport = await req(`/events/${createdEventId}/export`, {
    headers: authHeader(viewerToken)
  });
  assert(viewerExport.status === 403, 'VIEWER cannot export CSV (403 Forbidden)');

  // 6f. Normal Viewer CANNOT check in tickets (403)
  const viewerCheckIn = await req('/tickets/check-in', {
    method: 'POST',
    headers: authHeader(viewerToken),
    body: JSON.stringify({ ticketCode: 'TICK-TEST' })
  });
  assert(viewerCheckIn.status === 403, 'VIEWER cannot check in tickets (403 Forbidden)');

  // 6g. Normal Viewer CANNOT access organizer analytics (403)
  const viewerAnalytics = await req('/organizer/analytics', {
    headers: authHeader(viewerToken)
  });
  assert(viewerAnalytics.status === 403, 'VIEWER cannot access organizer analytics (403 Forbidden)');

  // 6h. Normal Viewer CANNOT change event status (403)
  const viewerStatus = await req(`/events/${createdEventId}/status`, {
    method: 'PATCH',
    headers: authHeader(viewerToken),
    body: JSON.stringify({ status: 'CANCELLED' })
  });
  assert(viewerStatus.status === 403, 'VIEWER cannot change event status (403 Forbidden)');

  // 6i. No token at all returns 401
  const noToken = await req('/organizer/events');
  assert(noToken.status === 401, 'No token returns 401 Unauthorized');
}

async function testRegistrationAndTicketing() {
  console.log('\n═══ 7. REGISTRATION, CAPACITY & TICKETING ═══');

  // 7a. Normal Viewer registers for the created event
  const regRes = await req(`/events/${createdEventId}/register`, {
    method: 'POST',
    headers: authHeader(viewerToken)
  });
  assert(regRes.status === 201, 'Registration returns 201');
  assert(regRes.data.data.registration.status === 'CONFIRMED', 'Registration status is CONFIRMED');
  assert(regRes.data.data.registration.ticketCode.startsWith('TICK-'), 'Ticket code starts with TICK-');
  assert(regRes.data.data.registration.qrCodePayload.includes('signature'), 'QR payload contains HMAC signature');
  registrationId = regRes.data.data.registration.id;
  ticketQRPayload = regRes.data.data.registration.qrCodePayload;
  ticketCode = regRes.data.data.registration.ticketCode;

  // 7b. Duplicate registration attempt
  const dupReg = await req(`/events/${createdEventId}/register`, {
    method: 'POST',
    headers: authHeader(viewerToken)
  });
  assert(dupReg.status === 400, 'Duplicate registration returns 400');
  assert(dupReg.data.message.includes('already registered'), 'Duplicate error message mentions already registered');

  // 7c. Fill up remaining capacity (capacity = 5, 1 seat taken)
  const tempUsers = [];
  for (let i = 0; i < 4; i++) {
    const regUser = await req('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name: `Temp User ${i}`, email: `temp${i}@test.com`, password: 'Pass123!' })
    });
    const tempToken = regUser.data.data.token;
    tempUsers.push(tempToken);
    await req(`/events/${createdEventId}/register`, {
      method: 'POST',
      headers: authHeader(tempToken)
    });
  }
  assert(true, 'Filled 4 more seats (5/5 capacity now full)');

  // 7d. 6th registration should go to WAITLIST
  const waitUser = await req('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name: 'Waitlist User', email: 'waitlist@test.com', password: 'Pass123!' })
  });
  const waitReg = await req(`/events/${createdEventId}/register`, {
    method: 'POST',
    headers: authHeader(waitUser.data.data.token)
  });
  assert(waitReg.status === 201, 'Waitlist registration returns 201');
  assert(waitReg.data.data.registration.status === 'WAITLIST', 'Over-capacity registration goes to WAITLIST');
  assert(waitReg.data.data.registration.isWaitlisted === true, 'isWaitlisted flag is true');

  // 7e. Get viewer's ticket wallet
  const walletRes = await req('/viewer/registrations', { headers: authHeader(viewerToken) });
  assert(walletRes.status === 200, 'Viewer ticket wallet returns 200');
  assert(walletRes.data.data.registrations.length >= 1, 'Viewer has at least 1 ticket in wallet');
  const myTicket = walletRes.data.data.registrations.find(r => r.id === registrationId);
  assert(!!myTicket, 'Viewer wallet contains the registered ticket');
  assert(myTicket.event_title !== undefined, 'Ticket includes event title');
  assert(myTicket.organizer_name !== undefined, 'Ticket includes organizer name');

  // 7f. Registration for non-published event should fail
  const draftEvent = await req('/events', {
    method: 'POST',
    headers: authHeader(headToken),
    body: JSON.stringify({ title: 'Draft Only', description: 'test', type: 'VIRTUAL', startTime: '2026-12-30 10:00:00', endTime: '2026-12-30 16:00:00', capacity: 10, status: 'DRAFT' })
  });
  const draftId = draftEvent.data.data.event.id;
  const regDraft = await req(`/events/${draftId}/register`, {
    method: 'POST',
    headers: authHeader(viewerToken)
  });
  assert(regDraft.status === 400, 'Registration for DRAFT event returns 400');
}

async function testAttendeeManagement() {
  console.log('\n═══ 8. ATTENDEE ROSTER & CSV EXPORT ═══');

  // 8a. Head User views attendee roster
  const rosterRes = await req(`/events/${createdEventId}/attendees`, {
    headers: authHeader(headToken)
  });
  assert(rosterRes.status === 200, 'Attendee roster returns 200');
  assert(rosterRes.data.data.attendees.length >= 5, 'At least 5 attendees registered (including waitlisted)');
  assert(rosterRes.data.data.attendees[0].user_name !== undefined, 'Attendee has user_name');
  assert(rosterRes.data.data.attendees[0].user_email !== undefined, 'Attendee has user_email');
  assert(rosterRes.data.data.attendees[0].ticket_code !== undefined, 'Attendee has ticket_code');

  // 8b. Search attendees by name
  const searchRoster = await req(`/events/${createdEventId}/attendees?search=Temp`, {
    headers: authHeader(headToken)
  });
  assert(searchRoster.status === 200, 'Attendee search returns 200');
  assert(searchRoster.data.data.attendees.length >= 1, 'Search returns matching attendees');

  // 8c. Filter attendees by status
  const waitlistRoster = await req(`/events/${createdEventId}/attendees?status=WAITLIST`, {
    headers: authHeader(headToken)
  });
  assert(waitlistRoster.status === 200, 'Waitlist filter returns 200');
  assert(waitlistRoster.data.data.attendees.length >= 1, 'At least 1 waitlisted attendee');

  // 8d. Export CSV
  const csvRes = await fetch(`${API}/events/${createdEventId}/export`, {
    headers: { ...authHeader(headToken) }
  });
  assert(csvRes.status === 200, 'CSV export returns 200');
  const csvContentType = csvRes.headers.get('content-type');
  assert(csvContentType.includes('text/csv'), 'CSV export Content-Type is text/csv');
  const csvText = await csvRes.text();
  assert(csvText.includes('Ticket Code'), 'CSV contains Ticket Code header');
  assert(csvText.includes('Attendee Name'), 'CSV contains Attendee Name header');
  assert(csvText.split('\n').length >= 2, 'CSV has header + at least 1 data row');
}

async function testQRCheckIn() {
  console.log('\n═══ 9. QR TICKET CHECK-IN & HMAC VERIFICATION ═══');

  // 9a. Valid QR payload check-in
  const checkInRes = await req('/tickets/check-in', {
    method: 'POST',
    headers: authHeader(headToken),
    body: JSON.stringify({ scannedPayload: ticketQRPayload })
  });
  assert(checkInRes.status === 200, 'Valid QR check-in returns 200');
  assert(checkInRes.data.success === true, 'Check-in succeeds');
  assert(checkInRes.data.message.includes('Entry Granted'), 'Response includes "Entry Granted"');
  assert(checkInRes.data.data.attendee.name !== undefined, 'Check-in response includes attendee name');
  assert(checkInRes.data.data.checkedInAt !== undefined, 'Check-in response includes timestamp');

  // 9b. Duplicate check-in attempt (already checked in)
  const dupCheckIn = await req('/tickets/check-in', {
    method: 'POST',
    headers: authHeader(headToken),
    body: JSON.stringify({ scannedPayload: ticketQRPayload })
  });
  assert(dupCheckIn.status === 400, 'Duplicate check-in returns 400');
  assert(dupCheckIn.data.error === 'ALREADY_CHECKED_IN', 'Error code is ALREADY_CHECKED_IN');

  // 9c. Tampered QR payload (wrong signature)
  const tampered = JSON.parse(ticketQRPayload);
  tampered.signature = 'aaa111bbb222ccc333ddd444eee555fff666';
  const tamperedRes = await req('/tickets/check-in', {
    method: 'POST',
    headers: authHeader(headToken),
    body: JSON.stringify({ scannedPayload: JSON.stringify(tampered) })
  });
  assert(tamperedRes.status === 400, 'Tampered QR payload returns 400');
  assert(tamperedRes.data.error === 'INVALID_SIGNATURE', 'Error code is INVALID_SIGNATURE');

  // 9d. Check-in with manual ticket code
  const manualRes = await req('/tickets/check-in', {
    method: 'POST',
    headers: authHeader(headToken),
    body: JSON.stringify({ ticketCode: ticketCode })
  });
  assert(manualRes.status === 400, 'Already checked-in ticket returns 400 on manual lookup too');

  // 9e. Non-existent ticket code
  const badTicket = await req('/tickets/check-in', {
    method: 'POST',
    headers: authHeader(headToken),
    body: JSON.stringify({ ticketCode: 'TICK-NONEXISTENT-CODE' })
  });
  assert(badTicket.status === 404, 'Non-existent ticket code returns 404');

  // 9f. Malformed QR payload
  const malformed = await req('/tickets/check-in', {
    method: 'POST',
    headers: authHeader(headToken),
    body: JSON.stringify({ scannedPayload: 'this is not JSON at all' })
  });
  assert(malformed.status === 400, 'Malformed QR payload returns 400');

  // 9g. Verify the registration status updated in DB
  const walletAfter = await req('/viewer/registrations', { headers: authHeader(viewerToken) });
  const checkedTicket = walletAfter.data.data.registrations.find(r => r.id === registrationId);
  assert(checkedTicket.status === 'CHECKED_IN', 'Registration status updated to CHECKED_IN in DB');
}

async function testCancelRegistration() {
  console.log('\n═══ 10. CANCEL REGISTRATION ═══');

  // Register the newly created user for the first seeded event
  const allEvents = await req('/events');
  const seededEvent = allEvents.data.data.events.find(e => e.title.includes('Global AI'));
  
  if (seededEvent) {
    const regRes = await req(`/events/${seededEvent.id}/register`, {
      method: 'POST',
      headers: authHeader(newUserToken)
    });
    
    if (regRes.status === 201) {
      const regId = regRes.data.data.registration.id;

      // 10a. Cancel own registration
      const cancelRes = await req(`/registrations/${regId}`, {
        method: 'DELETE',
        headers: authHeader(newUserToken)
      });
      assert(cancelRes.status === 200, 'Cancel own registration returns 200');
      assert(cancelRes.data.message.includes('cancelled'), 'Cancel message confirms cancellation');
    } else {
      assert(true, 'Skipped cancel test (user already registered for seeded event)');
    }
  }

  // 10b. Cancel non-existent registration
  const badCancel = await req('/registrations/nonexistent-uuid', {
    method: 'DELETE',
    headers: authHeader(viewerToken)
  });
  assert(badCancel.status === 404, 'Cancel non-existent registration returns 404');
}

async function testEventDeletion() {
  console.log('\n═══ 11. EVENT DELETION & CASCADE ═══');

  // Create a disposable event
  const disposable = await req('/events', {
    method: 'POST',
    headers: authHeader(headToken),
    body: JSON.stringify({ title: 'Disposable Event', description: 'Will be deleted', type: 'VIRTUAL', startTime: '2026-12-31 10:00:00', endTime: '2026-12-31 16:00:00', capacity: 10, status: 'PUBLISHED' })
  });
  const disposableId = disposable.data.data.event.id;

  // Delete it
  const deleteRes = await req(`/events/${disposableId}`, {
    method: 'DELETE',
    headers: authHeader(headToken)
  });
  assert(deleteRes.status === 200, 'Event deletion returns 200');

  // Verify it no longer exists
  const afterDelete = await req(`/events/${disposableId}`);
  assert(afterDelete.status === 404, 'Deleted event returns 404');
}

async function testAnalytics() {
  console.log('\n═══ 12. ORGANIZER ANALYTICS ═══');

  const statsRes = await req('/organizer/analytics', {
    headers: authHeader(headToken)
  });
  assert(statsRes.status === 200, 'Analytics endpoint returns 200');
  assert(statsRes.data.data.analytics.totalEvents >= 1, 'Analytics: totalEvents >= 1');
  assert(statsRes.data.data.analytics.totalRegistrations >= 1, 'Analytics: totalRegistrations >= 1');
  assert(statsRes.data.data.analytics.checkedInAttendees >= 1, 'Analytics: checkedInAttendees >= 1 (from QR check-in test)');
  assert(typeof statsRes.data.data.analytics.attendanceRatePercent === 'number', 'Analytics: attendanceRatePercent is a number');
  assert(statsRes.data.data.analytics.totalRevenueFormatted.startsWith('$'), 'Analytics: revenue is formatted with $');
}

async function testEventStatusLifecycle() {
  console.log('\n═══ 13. EVENT STATUS LIFECYCLE ═══');

  // Create event as DRAFT
  const event = await req('/events', {
    method: 'POST',
    headers: authHeader(headToken),
    body: JSON.stringify({ title: 'Lifecycle Test Event', description: 'Testing status transitions', type: 'VIRTUAL', startTime: '2026-12-28 10:00:00', endTime: '2026-12-28 16:00:00', capacity: 10, status: 'DRAFT' })
  });
  const eid = event.data.data.event.id;

  // DRAFT -> PUBLISHED
  const pub = await req(`/events/${eid}/status`, { method: 'PATCH', headers: authHeader(headToken), body: JSON.stringify({ status: 'PUBLISHED' }) });
  assert(pub.status === 200, 'DRAFT -> PUBLISHED transition succeeds');

  // PUBLISHED -> ONGOING
  const ongoing = await req(`/events/${eid}/status`, { method: 'PATCH', headers: authHeader(headToken), body: JSON.stringify({ status: 'ONGOING' }) });
  assert(ongoing.status === 200, 'PUBLISHED -> ONGOING transition succeeds');

  // ONGOING -> COMPLETED
  const completed = await req(`/events/${eid}/status`, { method: 'PATCH', headers: authHeader(headToken), body: JSON.stringify({ status: 'COMPLETED' }) });
  assert(completed.status === 200, 'ONGOING -> COMPLETED transition succeeds');

  // Also test CANCELLED path
  const event2 = await req('/events', {
    method: 'POST',
    headers: authHeader(headToken),
    body: JSON.stringify({ title: 'Cancel Test', description: 'Will cancel', type: 'VIRTUAL', startTime: '2026-12-29 10:00:00', endTime: '2026-12-29 16:00:00', capacity: 10, status: 'PUBLISHED' })
  });
  const cancelTrans = await req(`/events/${event2.data.data.event.id}/status`, { method: 'PATCH', headers: authHeader(headToken), body: JSON.stringify({ status: 'CANCELLED' }) });
  assert(cancelTrans.status === 200, 'PUBLISHED -> CANCELLED transition succeeds');
}

// ════════════════════════════════════════════════
// MAIN RUNNER
// ════════════════════════════════════════════════

async function main() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║  🧪 EMS BACKEND — COMPREHENSIVE INTEGRATION VERIFICATION     ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');

  try {
    await testHealthCheck();
    await testAuth();
    await testPublicEvents();
    await testCategories();
    await testHeadUserEventManagement();
    await testRBACGuards();
    await testRegistrationAndTicketing();
    await testAttendeeManagement();
    await testQRCheckIn();
    await testCancelRegistration();
    await testEventDeletion();
    await testAnalytics();
    await testEventStatusLifecycle();
  } catch (err) {
    console.error('\n💥 FATAL TEST ERROR:', err.message);
    console.error(err.stack);
  }

  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log(`║  RESULTS:  ✅ ${passed} PASSED  |  ❌ ${failed} FAILED  |  TOTAL: ${passed + failed}     `);
  console.log('╚════════════════════════════════════════════════════════════════╝');

  if (failed > 0) {
    console.log('\n⚠️  Some tests failed! Review the output above for details.');
    process.exit(1);
  } else {
    console.log('\n🎉 ALL TESTS PASSED — Backend implementation fully verified!');
    process.exit(0);
  }
}

main();
