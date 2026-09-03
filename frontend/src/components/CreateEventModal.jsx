import React, { useState } from 'react';
import { X, Plus, Calendar, MapPin, DollarSign, Image, Users } from 'lucide-react';

export function CreateEventModal({ onClose, onCreate }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    bannerUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87',
    type: 'HYBRID',
    location: '',
    startTime: '',
    endTime: '',
    capacity: 100,
    price: 0,
    status: 'PUBLISHED'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.startTime || !formData.endTime) {
      alert('Please fill out event title and dates.');
      return;
    }
    onCreate(formData);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={e => e.stopPropagation()} style={{ maxWidth: '620px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <h2 style={{ fontSize: '1.35rem', color: '#f0f9ff', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={22} color="#38bdf8" /> Create New Event
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Event Title</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. AI & Fullstack Web Developer Summit"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-textarea"
              rows={3}
              placeholder="Describe event agenda, speakers, and goals..."
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Event Format</label>
              <select className="form-select" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                <option value="HYBRID">HYBRID (In-Person & Online)</option>
                <option value="VIRTUAL">VIRTUAL (Online Stream)</option>
                <option value="IN_PERSON">IN_PERSON (Venue Only)</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Initial Status</label>
              <select className="form-select" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                <option value="PUBLISHED">PUBLISHED (Visible to All)</option>
                <option value="DRAFT">DRAFT (Hidden)</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Venue / Online Link</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Convention Center SF / Zoom Meeting Link"
              value={formData.location}
              onChange={e => setFormData({ ...formData, location: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Start Time</label>
              <input
                type="datetime-local"
                className="form-input"
                value={formData.startTime}
                onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">End Time</label>
              <input
                type="datetime-local"
                className="form-input"
                value={formData.endTime}
                onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Max Seating Capacity</label>
              <input
                type="number"
                className="form-input"
                min={1}
                value={formData.capacity}
                onChange={e => setFormData({ ...formData, capacity: Number(e.target.value) })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Price ($ USD)</label>
              <input
                type="number"
                step="0.01"
                min={0}
                className="form-input"
                value={formData.price}
                onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Banner Image URL</label>
            <input
              type="url"
              className="form-input"
              value={formData.bannerUrl}
              onChange={e => setFormData({ ...formData, bannerUrl: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '22px', borderTop: '1px solid rgba(56, 189, 248, 0.15)', paddingTop: '16px' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
            <button type="submit" className="btn btn-primary">Publish Event</button>
          </div>
        </form>
      </div>
    </div>
  );
}
