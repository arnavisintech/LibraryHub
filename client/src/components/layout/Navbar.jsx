import { useEffect, useState, useRef } from 'react';
import { Menu, Bell, X, AlertCircle, Info } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../lib/api';
import './Navbar.css';

const DISMISSED_KEY = 'libhub_dismissed_notifications';

function getDismissed() {
  try {
    return new Set(JSON.parse(localStorage.getItem(DISMISSED_KEY) || '[]'));
  } catch { return new Set(); }
}

function saveDismissed(set) {
  localStorage.setItem(DISMISSED_KEY, JSON.stringify([...set]));
}

export default function Navbar({ title, onMenuClick }) {
  const { user } = useAuth();

  const initial = user?.username?.[0]?.toUpperCase() || 'U';

  const [notifications, setNotifications] = useState([]);
  const [dismissed, setDismissed] = useState(getDismissed);
  const [panelOpen, setPanelOpen] = useState(false);
  const panelRef = useRef(null);
  const bellRef = useRef(null);

  // Fetch active notifications
  useEffect(() => {
    apiFetch('/api/notifications/active')
      .then(r => r?.json())
      .then(data => { if (Array.isArray(data)) setNotifications(data); })
      .catch(() => {});
  }, []);

  // Close panel on outside click
  useEffect(() => {
    function handleClick(e) {
      if (
        panelOpen &&
        panelRef.current && !panelRef.current.contains(e.target) &&
        bellRef.current && !bellRef.current.contains(e.target)
      ) {
        setPanelOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [panelOpen]);

  const visible = notifications.filter(n => !dismissed.has(n.id));
  const importantCount = visible.filter(n => n.type === 'important' || n.type === 'danger').length;

  function handleDismiss(id) {
    const next = new Set([...dismissed, id]);
    setDismissed(next);
    saveDismissed(next);
  }

  function handleDismissAll() {
    const next = new Set([...dismissed, ...visible.map(n => n.id)]);
    setDismissed(next);
    saveDismissed(next);
    setPanelOpen(false);
  }

  const isImportant = (type) => type === 'important' || type === 'danger';

  return (
    <header className="navbar-header">
      <div className="navbar-left">
        <button className="navbar-hamburger" onClick={onMenuClick} aria-label="Toggle menu">
          <Menu size={22} />
        </button>
        <span className="navbar-welcome">Welcome 👋</span>
        <h1 className="navbar-title">{user?.username || 'User'}</h1>
      </div>
      <div className="navbar-right">
        {/* Notification Bell */}
        <div className="notif-wrapper">
          <button
            ref={bellRef}
            className={`navbar-bell${panelOpen ? ' active' : ''}`}
            onClick={() => setPanelOpen(o => !o)}
            aria-label="Notifications"
          >
            <Bell size={18} />
            {visible.length > 0 && (
              <span className={`notif-badge${importantCount > 0 ? ' important' : ''}`}>
                {visible.length}
              </span>
            )}
          </button>

          {panelOpen && (
            <div ref={panelRef} className="notif-panel">
              <div className="notif-panel-header">
                <span className="notif-panel-title">Notifications</span>
                {visible.length > 0 && (
                  <button className="notif-clear-all" onClick={handleDismissAll}>
                    Clear all
                  </button>
                )}
              </div>

              <div className="notif-panel-body">
                {visible.length === 0 ? (
                  <div className="notif-empty">
                    <Bell size={30} strokeWidth={1.5} />
                    <p>No notifications</p>
                  </div>
                ) : (
                  visible.map(n => (
                    <div
                      key={n.id}
                      className={`notif-item${isImportant(n.type) ? ' important' : ''}`}
                    >
                      <div className="notif-item-icon">
                        {isImportant(n.type)
                          ? <AlertCircle size={15} />
                          : <Info size={15} />
                        }
                      </div>
                      <div className="notif-item-content">
                        {isImportant(n.type) && (
                          <span className="notif-item-tag">Important</span>
                        )}
                        <p className="notif-item-message">{n.message}</p>
                      </div>
                      <button
                        className="notif-item-dismiss"
                        onClick={(e) => { e.stopPropagation(); handleDismiss(n.id); }}
                        aria-label="Dismiss"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="navbar-profile">
          <div className="navbar-avatar">{initial}</div>
          <div className="navbar-info">
            <div className="navbar-name">{user?.username}</div>
            <div className="navbar-role">{user?.role}</div>
          </div>
        </div>
      </div>
    </header>
  );
}
