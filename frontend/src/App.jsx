import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { api } from './services/api';
import { Navbar } from './components/Navbar';
import { EventCard } from './components/EventCard';
import { EventDetailModal } from './components/EventDetailModal';
import { DigitalTicketCard } from './components/DigitalTicketCard';
import { CreateEventModal } from './components/CreateEventModal';
import { AttendeeRosterModal } from './components/AttendeeRosterModal';
import { QRCheckInModal } from './components/QRCheckInModal';
import { Search, Plus, QrCode, Ticket, ShieldCheck, TrendingUp, Users, CalendarCheck, DollarSign, Sparkles } from 'lucide-react';

export function App() {
  const { user, toast, showToast, switchRole } = useAuth();
  const [activeTab, setActiveTab] = useState('events');

  // State
  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [organizerEvents, setOrganizerEvents] = useState([]);
  const [analytics, setAnalytics] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Modals
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [rosterEvent, setRosterEvent] = useState(null);
  const [showCheckInModal, setShowCheckInModal] = useState(false);

  useEffect(() => {
    fetchPublicEvents();
    fetchCategories();
  }, [search, selectedCategory]);

  useEffect(() => {
    if (user) {
      fetchMyTickets();
      if (user.role === 'HEAD_USER') {
        fetchOrganizerData();
      }
    }
  }, [user]);

  const fetchPublicEvents = async () => {
    try {
      let params = '?status=PUBLISHED';
      if (search) params += `&search=${encodeURIComponent(search)}`;
      if (selectedCategory) params += `&category=${selectedCategory}`;
      const res = await api.getEvents(params);
      setEvents(res.data.events || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.getCategories();
      setCategories(res.data.categories || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMyTickets = async () => {
    try {
      const res = await api.getMyTickets();
      setTickets(res.data.registrations || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchOrganizerData = async () => {
    try {
      const [eventsRes, analyticsRes] = await Promise.all([
        api.getOrganizerEvents(),
        api.getAnalytics()
      ]);
      setOrganizerEvents(eventsRes.data.events || []);
      setAnalytics(analyticsRes.data.analytics || null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRSVP = async (event) => {
    if (!user) {
      showToast('Please sign in or switch persona to RSVP', 'warning');
      await switchRole('VIEWER');
      return;
    }
    try {
      const res = await api.registerForEvent(event.id);
      showToast(res.message, 'success');
      fetchMyTickets();
      fetchPublicEvents();
      setActiveTab('tickets');
    } catch (err) {
      showToast(err.message, 'danger');
    }
  };

  const handleCreateEvent = async (eventData) => {
    try {
      const res = await api.createEvent(eventData);
      showToast(res.message, 'success');
      fetchOrganizerData();
      fetchPublicEvents();
    } catch (err) {
      showToast(err.message, 'danger');
    }
  };

  const handleCancelTicket = async (regId) => {
    if (!confirm('Are you sure you want to cancel your RSVP?')) return;
    try {
      const res = await api.cancelRegistration(regId);
      showToast(res.message, 'info');
      fetchMyTickets();
      fetchPublicEvents();
    } catch (err) {
      showToast(err.message, 'danger');
    }
  };

  const handleStatusChange = async (eventId, newStatus) => {
    try {
      await api.updateEventStatus(eventId, newStatus);
      showToast(`Event status changed to ${newStatus}`, 'info');
      fetchOrganizerData();
      fetchPublicEvents();
    } catch (err) {
      showToast(err.message, 'danger');
    }
  };

  return (
    <div style={{ paddingBottom: '60px' }}>
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Toast Notification */}
      {toast && (
        <div style={{ 
          position: 'fixed', 
          bottom: '24px', 
          right: '24px', 
          background: 'rgba(11, 22, 44, 0.95)', 
          border: '1px solid rgba(56, 189, 248, 0.4)', 
          padding: '14px 22px', 
          borderRadius: 'var(--radius-md)', 
          color: '#f0f9ff', 
          boxShadow: '0 10px 30px rgba(2, 6, 23, 0.7)', 
          zIndex: 2000 
        }}>
          {toast.message}
        </div>
      )}

      {/* Main Content Area */}
      <main style={{ maxWidth: '1240px', margin: '0 auto', padding: '0 24px' }}>

        {/* TAB 1: DISCOVER EVENTS */}
        {activeTab === 'events' && (
          <div>
            {/* Blue-themed Hero Banner */}
            <div className="glass-panel" style={{ 
              padding: '48px 36px', 
              marginBottom: '36px', 
              textAlign: 'center', 
              background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.25), rgba(37, 99, 235, 0.2))',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{ 
                position: 'absolute', 
                top: '-50px', 
                right: '-50px', 
                width: '200px', 
                height: '200px', 
                borderRadius: '50%', 
                background: 'radial-gradient(circle, rgba(14, 165, 233, 0.25), transparent 70%)',
                pointerEvents: 'none'
              }} />
              
              <span className="badge badge-published" style={{ marginBottom: '16px', padding: '6px 14px' }}>
                <Sparkles size={13} style={{ marginRight: '4px' }} /> Live Event Management Platform
              </span>
              <h1 style={{ fontSize: '2.6rem', color: '#f0f9ff', marginBottom: '14px', fontWeight: '800' }}>
                Discover & Manage Extraordinary Events
              </h1>
              <p style={{ color: '#94a3b8', maxWidth: '620px', margin: '0 auto 28px auto', fontSize: '1.05rem', lineHeight: '1.6' }}>
                Explore upcoming tech summits, interactive workshops, and live streams. Reserve seats instantly with digital QR tickets.
              </p>

              {/* Blue Glass Search Bar */}
              <div style={{ 
                display: 'flex', 
                gap: '12px', 
                maxWidth: '640px', 
                margin: '0 auto', 
                background: 'rgba(7, 13, 24, 0.85)', 
                padding: '8px', 
                borderRadius: 'var(--radius-md)', 
                border: '1px solid rgba(56, 189, 248, 0.25)',
                boxShadow: '0 8px 24px rgba(2, 6, 23, 0.5)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, paddingLeft: '12px' }}>
                  <Search size={20} color="#38bdf8" />
                  <input
                    type="text"
                    placeholder="Search by event title, keyword, or speaker..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={{ background: 'none', border: 'none', color: '#f0f9ff', width: '100%', outline: 'none', fontSize: '0.95rem' }}
                  />
                </div>
              </div>
            </div>

            {/* Category Chips */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '28px', flexWrap: 'wrap' }}>
              <button
                onClick={() => setSelectedCategory('')}
                className={`btn btn-sm ${selectedCategory === '' ? 'btn-primary' : 'btn-secondary'}`}
              >
                All Categories
              </button>
              {categories.map(c => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(c.slug)}
                  className={`btn btn-sm ${selectedCategory === c.slug ? 'btn-primary' : 'btn-secondary'}`}
                >
                  {c.name}
                </button>
              ))}
            </div>

            {/* Event Grid */}
            {events.length === 0 ? (
              <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                No events found matching your search. Try resetting filters!
              </div>
            ) : (
              <div className="events-grid">
                {events.map(event => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onSelect={setSelectedEvent}
                    onRSVP={handleRSVP}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: MY TICKETS WALLET */}
        {activeTab === 'tickets' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h1 style={{ fontSize: '1.8rem', color: '#f0f9ff' }}>My Ticket Wallet</h1>
                <p style={{ color: '#94a3b8' }}>Your registered event passes and digital QR check-in codes</p>
              </div>
            </div>

            {!user ? (
              <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
                <p style={{ color: '#94a3b8', marginBottom: '16px' }}>Please sign in to view your registered tickets.</p>
                <button onClick={() => switchRole('VIEWER')} className="btn btn-primary">Sign in as Normal Viewer</button>
              </div>
            ) : tickets.length === 0 ? (
              <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                <Ticket size={40} color="#38bdf8" style={{ marginBottom: '12px' }} />
                <p>You have not registered for any events yet.</p>
                <button onClick={() => setActiveTab('events')} className="btn btn-primary" style={{ marginTop: '16px' }}>Browse Event Catalog</button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
                {tickets.map(ticket => (
                  <DigitalTicketCard key={ticket.id} ticket={ticket} onCancel={handleCancelTicket} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: ORGANIZER CONSOLE */}
        {activeTab === 'organizer' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h1 style={{ fontSize: '1.8rem', color: '#f0f9ff', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <ShieldCheck size={28} color="#38bdf8" /> Head User Organizer Console
                </h1>
                <p style={{ color: '#94a3b8' }}>Manage events, track attendee rosters, and verify live QR tickets</p>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setShowCheckInModal(true)} className="btn btn-secondary">
                  <QrCode size={18} /> Live QR Scanner
                </button>
                <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
                  <Plus size={18} /> Create New Event
                </button>
              </div>
            </div>

            {/* Analytics Metric Cards */}
            {analytics && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '28px' }}>
                <div className="glass-panel" style={{ padding: '20px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                  <div style={{ color: '#94a3b8', fontSize: '0.8rem', marginBottom: '4px' }}>Active Events</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: '700', color: '#f0f9ff' }}>{analytics.activeEvents}</div>
                </div>
                <div className="glass-panel" style={{ padding: '20px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                  <div style={{ color: '#94a3b8', fontSize: '0.8rem', marginBottom: '4px' }}>Total Registrations</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: '700', color: '#38bdf8' }}>{analytics.totalRegistrations}</div>
                </div>
                <div className="glass-panel" style={{ padding: '20px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                  <div style={{ color: '#94a3b8', fontSize: '0.8rem', marginBottom: '4px' }}>Checked In Attendees</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: '700', color: '#60a5fa' }}>{analytics.checkedInAttendees}</div>
                </div>
                <div className="glass-panel" style={{ padding: '20px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                  <div style={{ color: '#94a3b8', fontSize: '0.8rem', marginBottom: '4px' }}>Attendance Rate</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: '700', color: '#34d399' }}>{analytics.attendanceRatePercent}%</div>
                </div>
              </div>
            )}

            {/* Organizer Events Table */}
            <div className="glass-panel" style={{ padding: '24px', overflowX: 'auto', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
              <h3 style={{ fontSize: '1.15rem', color: '#f0f9ff', marginBottom: '16px' }}>Your Organized Events</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(56, 189, 248, 0.15)', color: '#94a3b8' }}>
                    <th style={{ padding: '12px' }}>Event Title</th>
                    <th style={{ padding: '12px' }}>Status</th>
                    <th style={{ padding: '12px' }}>Format</th>
                    <th style={{ padding: '12px' }}>Capacity</th>
                    <th style={{ padding: '12px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {organizerEvents.map(e => (
                    <tr key={e.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '12px', color: '#f0f9ff', fontWeight: '600' }}>{e.title}</td>
                      <td style={{ padding: '12px' }}>
                        <span className={`badge badge-${e.status.toLowerCase()}`}>{e.status}</span>
                      </td>
                      <td style={{ padding: '12px', color: '#94a3b8' }}>{e.type}</td>
                      <td style={{ padding: '12px', color: '#f0f9ff' }}>
                        {e.confirmed_count || 0} / {e.capacity}
                      </td>
                      <td style={{ padding: '12px', display: 'flex', gap: '8px' }}>
                        <button onClick={() => setRosterEvent(e)} className="btn btn-secondary btn-sm">
                          <Users size={14} /> Roster & CSV
                        </button>
                        {e.status === 'DRAFT' ? (
                          <button onClick={() => handleStatusChange(e.id, 'PUBLISHED')} className="btn btn-primary btn-sm">Publish</button>
                        ) : (
                          <button onClick={() => handleStatusChange(e.id, 'CANCELLED')} className="btn btn-secondary btn-sm" style={{ color: 'var(--color-danger)' }}>Cancel</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* MODALS */}
      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onRSVP={handleRSVP}
        />
      )}

      {showCreateModal && (
        <CreateEventModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateEvent}
        />
      )}

      {rosterEvent && (
        <AttendeeRosterModal
          event={rosterEvent}
          onClose={() => setRosterEvent(null)}
        />
      )}

      {showCheckInModal && (
        <QRCheckInModal
          onClose={() => setShowCheckInModal(false)}
          onSuccess={fetchOrganizerData}
        />
      )}
    </div>
  );
}
