import React, { useState, useEffect } from 'react';
import { X, Download, Search, CheckCircle, Clock } from 'lucide-react';
import { api } from '../services/api';

export function AttendeeRosterModal({ event, onClose }) {
  const [attendees, setAttendees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (event?.id) {
      fetchAttendees();
    }
  }, [event, search]);

  const fetchAttendees = async () => {
    try {
      setLoading(true);
      const query = search ? `?search=${encodeURIComponent(search)}` : '';
      const res = await api.getAttendees(event.id, query);
      setAttendees(res.data.attendees || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      const blob = await api.exportAttendeesCSV(event.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendees_${event.id}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      alert('Failed to export CSV: ' + err.message);
    }
  };

  if (!event) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={e => e.stopPropagation()} style={{ maxWidth: '780px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div>
            <h2 style={{ fontSize: '1.3rem', color: '#f0f9ff' }}>Attendee Roster</h2>
            <p style={{ fontSize: '0.8rem', color: '#38bdf8' }}>{event.title}</p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={handleExportCSV} className="btn btn-primary btn-sm">
              <Download size={14} /> Download CSV
            </button>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={20} /></button>
          </div>
        </div>

        {/* Search Input */}
        <div style={{ position: 'relative', marginBottom: '16px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#38bdf8' }} />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '38px', width: '100%' }}
            placeholder="Search attendee by name, email, or ticket code..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Attendee Table */}
        <div style={{ overflowX: 'auto', maxHeight: '350px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(56, 189, 248, 0.2)', color: '#94a3b8' }}>
                <th style={{ padding: '10px' }}>Ticket Code</th>
                <th style={{ padding: '10px' }}>Attendee Name</th>
                <th style={{ padding: '10px' }}>Email</th>
                <th style={{ padding: '10px' }}>Status</th>
                <th style={{ padding: '10px' }}>Checked In</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>Loading attendees...</td></tr>
              ) : attendees.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>No registrations found.</td></tr>
              ) : (
                attendees.map(a => (
                  <tr key={a.registration_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '10px', fontFamily: 'monospace', fontWeight: '700', color: '#38bdf8' }}>{a.ticket_code}</td>
                    <td style={{ padding: '10px', color: '#f0f9ff', fontWeight: '600' }}>{a.user_name}</td>
                    <td style={{ padding: '10px', color: '#94a3b8' }}>{a.user_email}</td>
                    <td style={{ padding: '10px' }}>
                      <span className={`badge badge-${a.status.toLowerCase()}`}>{a.status}</span>
                    </td>
                    <td style={{ padding: '10px', color: '#94a3b8' }}>
                      {a.checked_in_at ? new Date(a.checked_in_at).toLocaleTimeString() : 'Not Yet'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
