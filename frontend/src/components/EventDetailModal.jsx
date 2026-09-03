import React, { useState, useEffect } from 'react';
import { X, Calendar, MapPin, Users, ShieldCheck, Ticket, Share2, Clock } from 'lucide-react';

export function EventDetailModal({ event, onClose, onRSVP }) {
  if (!event) return null;

  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const target = new Date(event.start_time).getTime();
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const difference = target - now;
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [event]);

  const startDateFormatted = new Date(event.start_time).toLocaleString();
  const endDateFormatted = new Date(event.end_time).toLocaleString();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={e => e.stopPropagation()} style={{ maxWidth: '680px' }}>
        {/* Banner header */}
        <div style={{ position: 'relative', height: '220px', margin: '-24px -24px 20px -24px', borderRadius: '18px 18px 0 0', overflow: 'hidden' }}>
          <img src={event.banner_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87'} alt={event.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <button onClick={onClose} style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(7, 13, 24, 0.75)', border: '1px solid rgba(56, 189, 248, 0.3)', color: '#f0f9ff', width: '34px', height: '34px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={18} />
          </button>
        </div>

        {/* Title & Badge */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
          <span className="badge badge-published">{event.status}</span>
          <span className="badge" style={{ background: 'rgba(15, 30, 56, 0.8)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)' }}>{event.type}</span>
          <span className="badge" style={{ background: 'rgba(37, 99, 235, 0.15)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.3)' }}>{event.category_name || 'Event'}</span>
        </div>

        <h2 style={{ fontSize: '1.6rem', color: '#f0f9ff', marginBottom: '14px', lineHeight: '1.3' }}>{event.title}</h2>

        {/* Live Countdown Timer */}
        <div style={{ background: 'rgba(7, 13, 24, 0.85)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(56, 189, 248, 0.25)', marginBottom: '18px', display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
          <div><div style={{ fontSize: '1.3rem', fontWeight: '800', color: '#38bdf8' }}>{timeLeft.days}</div><div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: '600' }}>DAYS</div></div>
          <div><div style={{ fontSize: '1.3rem', fontWeight: '800', color: '#38bdf8' }}>{timeLeft.hours}</div><div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: '600' }}>HOURS</div></div>
          <div><div style={{ fontSize: '1.3rem', fontWeight: '800', color: '#38bdf8' }}>{timeLeft.minutes}</div><div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: '600' }}>MINS</div></div>
          <div><div style={{ fontSize: '1.3rem', fontWeight: '800', color: '#38bdf8' }}>{timeLeft.seconds}</div><div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: '600' }}>SECS</div></div>
        </div>

        {/* Meta Info */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '18px', fontSize: '0.85rem' }}>
          <div style={{ background: 'rgba(15, 30, 56, 0.5)', border: '1px solid rgba(56, 189, 248, 0.15)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}><Calendar size={14} color="#38bdf8" /> Date & Time</div>
            <div style={{ color: '#f0f9ff', fontWeight: '600', marginTop: '4px' }}>{startDateFormatted}</div>
          </div>
          <div style={{ background: 'rgba(15, 30, 56, 0.5)', border: '1px solid rgba(56, 189, 248, 0.15)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}><MapPin size={14} color="#60a5fa" /> Location</div>
            <div style={{ color: '#f0f9ff', fontWeight: '600', marginTop: '4px' }}>{event.location || 'Virtual Online'}</div>
          </div>
        </div>

        {/* Description */}
        <h4 style={{ color: '#f0f9ff', marginBottom: '8px' }}>About This Event</h4>
        <p style={{ fontSize: '0.9rem', color: '#94a3b8', lineHeight: '1.6', marginBottom: '22px' }}>
          {event.description}
        </p>

        {/* Footer Actions */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: '1px solid rgba(56, 189, 248, 0.15)', paddingTop: '16px' }}>
          <button onClick={onClose} className="btn btn-secondary">Close</button>
          <button onClick={() => { onRSVP(event); onClose(); }} className="btn btn-primary">
            <Ticket size={16} /> Confirm RSVP Ticket
          </button>
        </div>
      </div>
    </div>
  );
}
