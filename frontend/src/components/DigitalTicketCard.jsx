import React from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Ticket, Calendar, MapPin, CheckCircle, Clock, Trash2 } from 'lucide-react';

export function DigitalTicketCard({ ticket, onCancel }) {
  const isCheckedIn = ticket.status === 'CHECKED_IN';
  const startDateFormatted = new Date(ticket.start_time).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="glass-panel" style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      borderRadius: '16px', 
      overflow: 'hidden', 
      border: '1px solid rgba(56, 189, 248, 0.3)',
      background: 'rgba(11, 22, 44, 0.8)'
    }}>
      {/* Top Pass Header */}
      <div style={{ 
        background: isCheckedIn ? 'linear-gradient(135deg, #059669, #0d9488)' : 'linear-gradient(135deg, #0284c7, #2563eb)', 
        padding: '16px 22px', 
        color: '#f0f9ff', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        boxShadow: '0 4px 14px rgba(2, 6, 23, 0.4)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Ticket size={22} />
          <span style={{ fontWeight: '700', fontSize: '0.95rem', letterSpacing: '0.06em' }}>DIGITAL EVENT PASS</span>
        </div>
        <span className={`badge ${isCheckedIn ? 'badge-checked_in' : 'badge-confirmed'}`} style={{ background: 'rgba(7, 13, 24, 0.4)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}>
          {isCheckedIn ? '✓ CHECKED IN' : ticket.status}
        </span>
      </div>

      {/* Ticket Body */}
      <div style={{ padding: '22px', display: 'flex', gap: '22px', flexWrap: 'wrap', alignItems: 'center' }}>
        {/* QR Code Canvas */}
        <div style={{ background: '#fff', padding: '10px', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }}>
          <QRCodeCanvas value={ticket.qr_code_payload} size={130} level="M" />
          <span style={{ fontSize: '0.65rem', color: '#0f172a', fontWeight: '800', marginTop: '6px', fontFamily: 'monospace' }}>
            {ticket.ticket_code}
          </span>
        </div>

        {/* Info Content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <h3 style={{ fontSize: '1.25rem', color: '#f0f9ff', lineHeight: '1.3' }}>{ticket.event_title}</h3>

          <div style={{ fontSize: '0.85rem', color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calendar size={14} color="#38bdf8" /> {startDateFormatted}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MapPin size={14} color="#60a5fa" /> {ticket.location || 'Virtual Online'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', marginTop: '4px', color: '#64748b' }}>
              <Clock size={12} /> Registered: {new Date(ticket.registered_at).toLocaleDateString()}
            </div>
          </div>

          {/* Cancel Action */}
          {!isCheckedIn && (
            <div style={{ marginTop: '10px' }}>
              <button onClick={() => onCancel(ticket.id)} className="btn btn-secondary btn-sm" style={{ color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
                <Trash2 size={14} /> Cancel RSVP
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
