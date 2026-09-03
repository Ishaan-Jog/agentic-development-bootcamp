import React, { useState } from 'react';
import { X, QrCode, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';

export function QRCheckInModal({ onClose, onSuccess }) {
  const [payloadInput, setPayloadInput] = useState('');
  const [ticketCodeInput, setTicketCodeInput] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleCheckIn = async (e) => {
    e.preventDefault();
    setResult(null);
    setError(null);
    setLoading(true);

    try {
      const res = await api.checkInTicket({
        scannedPayload: payloadInput.trim() || undefined,
        ticketCode: ticketCodeInput.trim() || undefined
      });
      setResult(res.data);
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={e => e.stopPropagation()} style={{ maxWidth: '560px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <h2 style={{ fontSize: '1.3rem', color: '#f0f9ff', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <QrCode size={22} color="#38bdf8" /> Live QR Scanner & Ticket Check-In
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={20} /></button>
        </div>

        <form onSubmit={handleCheckIn}>
          <div className="form-group">
            <label className="form-label">Scanned QR Payload Token (JSON Payload)</label>
            <textarea
              className="form-textarea"
              rows={3}
              placeholder='Paste JSON payload e.g. {"ticketCode":"TICK-...","signature":"..."}'
              value={payloadInput}
              onChange={e => setPayloadInput(e.target.value)}
            />
          </div>

          <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem', margin: '8px 0' }}>— OR —</div>

          <div className="form-group">
            <label className="form-label">Ticket Code (Manual Lookup)</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. TICK-SAM-VIEWER-001"
              value={ticketCodeInput}
              onChange={e => setTicketCodeInput(e.target.value)}
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '14px' }} disabled={loading}>
            {loading ? 'Verifying Ticket HMAC...' : 'Verify Ticket & Check In'}
          </button>
        </form>

        {/* Success Result Box */}
        {result && (
          <div style={{ marginTop: '20px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.4)', borderRadius: 'var(--radius-md)', padding: '16px', color: '#34d399' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700', fontSize: '1.05rem' }}>
              <CheckCircle2 size={20} /> ENTRY GRANTED!
            </div>
            <div style={{ fontSize: '0.85rem', marginTop: '8px', color: '#f0f9ff' }}>
              <div><strong>Attendee:</strong> {result.attendee?.name} ({result.attendee?.email})</div>
              <div><strong>Event:</strong> {result.eventTitle}</div>
              <div><strong>Checked In At:</strong> {new Date(result.checkedInAt).toLocaleTimeString()}</div>
            </div>
          </div>
        )}

        {/* Error Result Box */}
        {error && (
          <div style={{ marginTop: '20px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: 'var(--radius-md)', padding: '16px', color: '#f87171' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700', fontSize: '1rem' }}>
              <AlertTriangle size={20} /> CHECK-IN DENIED
            </div>
            <div style={{ fontSize: '0.85rem', marginTop: '6px', color: '#fca5a5' }}>
              {error}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
