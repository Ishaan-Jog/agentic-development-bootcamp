import React from 'react';
import { Calendar, MapPin, Users, Tag, Clock } from 'lucide-react';

export function EventCard({ event, onSelect, onRSVP }) {
  const confirmed = event.confirmed_count || 0;
  const capacity = event.capacity || 100;
  const percentFull = Math.min(100, Math.round((confirmed / capacity) * 100));

  const startDateFormatted = new Date(event.start_time).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="glass-panel glass-panel-hover" style={{ 
      overflow: 'hidden', 
      display: 'flex', 
      flexDirection: 'column',
      border: '1px solid rgba(56, 189, 248, 0.2)',
      background: 'rgba(11, 22, 44, 0.75)'
    }}>
      {/* Banner */}
      <div style={{ height: '160px', width: '100%', position: 'relative', overflow: 'hidden', background: '#070d18' }}>
        <img
          src={event.banner_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87'}
          alt={event.title}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <div style={{ position: 'absolute', top: '12px', left: '12px', display: 'flex', gap: '6px' }}>
          <span className="badge badge-published">{event.status}</span>
          <span className="badge" style={{ background: 'rgba(7, 13, 24, 0.75)', color: '#f0f9ff', backdropFilter: 'blur(4px)', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
            {event.type}
          </span>
        </div>
        <div style={{ position: 'absolute', bottom: '12px', right: '12px', background: 'rgba(7, 13, 24, 0.85)', border: '1px solid rgba(56, 189, 248, 0.25)', padding: '4px 10px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', fontWeight: '700', color: event.price > 0 ? '#38bdf8' : '#34d399' }}>
          {event.price > 0 ? `$${Number(event.price).toFixed(2)}` : 'FREE'}
        </div>
      </div>

      {/* Card Content */}
      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1, gap: '12px' }}>
        <div style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Tag size={12} /> {event.category_name || 'General Event'}
        </div>

        <h3 style={{ fontSize: '1.2rem', color: '#f0f9ff', lineHeight: '1.3' }}>{event.title}</h3>
        <p style={{ fontSize: '0.85rem', color: '#94a3b8', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.5' }}>
          {event.description}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8rem', color: '#94a3b8' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock size={14} color="#38bdf8" /> {startDateFormatted}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <MapPin size={14} color="#60a5fa" /> {event.location || 'Online Event'}
          </div>
        </div>

        {/* Capacity Bar */}
        <div style={{ marginTop: 'auto', paddingTop: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '6px' }}>
            <span><Users size={12} style={{ display: 'inline', marginRight: '4px' }} /> Availability</span>
            <span style={{ fontWeight: '600', color: percentFull >= 100 ? 'var(--color-danger)' : '#f0f9ff' }}>
              {confirmed} / {capacity} seats ({percentFull}%)
            </span>
          </div>
          <div className="progress-bar-bg">
            <div className="progress-bar-fill" style={{ width: `${percentFull}%`, background: percentFull >= 100 ? 'var(--color-danger)' : undefined }} />
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
          <button onClick={() => onSelect(event)} className="btn btn-secondary btn-sm" style={{ flex: 1 }}>
            View Details
          </button>
          <button onClick={() => onRSVP(event)} className="btn btn-primary btn-sm" style={{ flex: 1 }}>
            {percentFull >= 100 ? 'Join Waitlist' : 'RSVP Now'}
          </button>
        </div>
      </div>
    </div>
  );
}
