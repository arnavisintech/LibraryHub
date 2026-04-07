import { useEffect, useState } from 'react';
import { apiFetch } from '../../lib/api';
import { X, Info, AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';
import './AnnouncementBanner.css';

const TYPE_META = {
  info:    { icon: Info,          className: 'banner-info' },
  warning: { icon: AlertTriangle, className: 'banner-warning' },
  success: { icon: CheckCircle,   className: 'banner-success' },
  danger:  { icon: AlertCircle,   className: 'banner-danger' },
};

export default function AnnouncementBanner() {
  const [notifications, setNotifications] = useState([]);
  const [dismissed, setDismissed] = useState(new Set());

  useEffect(() => {
    apiFetch('/api/notifications/active')
      .then(r => r?.json())
      .then(data => { if (Array.isArray(data)) setNotifications(data); })
      .catch(() => {});
  }, []);

  const visible = notifications.filter(n => !dismissed.has(n.id));
  if (!visible.length) return null;

  return (
    <div className="announcement-banners">
      {visible.map(n => {
        const { icon: Icon, className } = TYPE_META[n.type] || TYPE_META.info;
        return (
          <div key={n.id} className={`announcement-banner ${className}`}>
            <Icon size={16} className="banner-icon" />
            <span className="banner-message">{n.message}</span>
            <button className="banner-dismiss" onClick={() => setDismissed(prev => new Set([...prev, n.id]))} aria-label="Dismiss">
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
