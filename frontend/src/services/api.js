const BASE_URL = '/api/v1';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('ems_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  };

  const config = {
    ...options,
    headers
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, config);

  // Handle CSV file download responses
  if (options.responseType === 'blob') {
    if (!response.ok) throw new Error('Failed to download file');
    return response.blob();
  }

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || data.error || 'API Request failed');
  }

  return data;
}

export const api = {
  // Auth
  login: (email, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (userData) => request('/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
  getMe: () => request('/auth/me'),

  // Public Events
  getEvents: (params = '') => request(`/events${params}`),
  getEventById: (id) => request(`/events/${id}`),
  getCategories: () => request('/categories'),

  // RSVP / Viewer
  registerForEvent: (eventId) => request(`/events/${eventId}/register`, { method: 'POST' }),
  getMyTickets: () => request('/viewer/registrations'),
  cancelRegistration: (id) => request(`/registrations/${id}`, { method: 'DELETE' }),

  // Head User / Organizer
  getOrganizerEvents: () => request('/organizer/events'),
  createEvent: (eventData) => request('/events', { method: 'POST', body: JSON.stringify(eventData) }),
  updateEvent: (id, eventData) => request(`/events/${id}`, { method: 'PUT', body: JSON.stringify(eventData) }),
  updateEventStatus: (id, status) => request(`/events/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  deleteEvent: (id) => request(`/events/${id}`, { method: 'DELETE' }),
  getAttendees: (eventId, params = '') => request(`/events/${eventId}/attendees${params}`),
  exportAttendeesCSV: (eventId) => request(`/events/${eventId}/export`, { responseType: 'blob' }),
  checkInTicket: (payload) => request('/tickets/check-in', { method: 'POST', body: JSON.stringify(payload) }),
  getAnalytics: () => request('/organizer/analytics')
};
