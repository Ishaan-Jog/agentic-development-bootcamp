import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Calendar, Ticket, ShieldCheck, UserCheck, LogOut } from 'lucide-react';

export function Navbar({ activeTab, setActiveTab }) {
  const { user, switchRole, logout } = useAuth();

  return (
    <nav className="glass-panel" style={{ 
      margin: '16px 24px', 
      padding: '14px 28px', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between', 
      flexWrap: 'wrap', 
      gap: '16px',
      border: '1px solid rgba(56, 189, 248, 0.2)',
      background: 'rgba(11, 22, 44, 0.75)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ 
          width: '42px', 
          height: '42px', 
          borderRadius: '12px', 
          background: 'linear-gradient(135deg, #0284c7, #2563eb)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          fontSize: '1.4rem',
          boxShadow: '0 4px 14px rgba(14, 165, 233, 0.4)'
        }}>
          🎪
        </div>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#f0f9ff', margin: 0 }}>Event Management System</h2>
          <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Enterprise Event Lifecycle Platform</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '8px', background: 'rgba(7, 13, 24, 0.6)', padding: '5px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(56, 189, 248, 0.15)' }}>
        <button
          onClick={() => setActiveTab('events')}
          className={`btn btn-sm ${activeTab === 'events' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <Calendar size={16} /> Discover Events
        </button>
        <button
          onClick={() => setActiveTab('tickets')}
          className={`btn btn-sm ${activeTab === 'tickets' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <Ticket size={16} /> My Tickets
        </button>
        {user?.role === 'HEAD_USER' && (
          <button
            onClick={() => setActiveTab('organizer')}
            className={`btn btn-sm ${activeTab === 'organizer' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ 
              background: activeTab === 'organizer' ? 'linear-gradient(135deg, #0284c7, #3b82f6)' : undefined,
              boxShadow: activeTab === 'organizer' ? '0 4px 16px rgba(14, 165, 233, 0.5)' : undefined
            }}
          >
            <ShieldCheck size={16} /> Organizer Console
          </button>
        )}
      </div>

      {/* Persona Switcher & Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '6px', background: 'rgba(15, 30, 56, 0.6)', padding: '4px 8px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', marginRight: '4px' }}>Demo Role:</span>
          <button
            onClick={() => switchRole('HEAD_USER')}
            className={`btn btn-sm ${user?.role === 'HEAD_USER' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '4px 10px', fontSize: '0.75rem' }}
          >
            👑 Head User
          </button>
          <button
            onClick={() => switchRole('VIEWER')}
            className={`btn btn-sm ${user?.role === 'VIEWER' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '4px 10px', fontSize: '0.75rem' }}
          >
            👤 Viewer
          </button>
        </div>

        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#f0f9ff' }}>{user.name}</div>
              <div style={{ fontSize: '0.7rem', color: user.role === 'HEAD_USER' ? '#38bdf8' : '#60a5fa', fontWeight: '700' }}>
                {user.role === 'HEAD_USER' ? '👑 Head User (Organizer)' : '👤 Normal Viewer'}
              </div>
            </div>
            <button onClick={logout} className="btn btn-secondary btn-sm" title="Log Out" style={{ padding: '7px' }}>
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <button onClick={() => switchRole('VIEWER')} className="btn btn-primary btn-sm">
            <UserCheck size={16} /> Sign In
          </button>
        )}
      </div>
    </nav>
  );
}
