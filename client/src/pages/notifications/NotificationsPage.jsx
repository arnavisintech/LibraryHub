import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../../lib/api';
import ProtectedLayout from '../../components/layout/ProtectedLayout';
import Modal from '../../components/ui/Modal';
import { useAuth } from '../../context/AuthContext';
import { Bell, Plus, Trash2, ToggleLeft, ToggleRight, AlertCircle, Info } from 'lucide-react';

const TYPE_OPTIONS = [
  { value: 'normal',    label: 'Normal' },
  { value: 'important', label: 'Important' },
];

export default function NotificationsPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ message: '', type: 'normal', expires_at: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    if (authLoading) return;
    if (user?.role !== 'admin') navigate('/dashboard');
  }, [user, authLoading, navigate]);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    const res = await apiFetch('/api/notifications');
    if (res?.ok) setNotifications(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  async function handleCreate() {
    if (!form.message.trim()) { setError('Message is required.'); return; }
    setSaving(true); setError('');
    const res = await apiFetch('/api/notifications', { method: 'POST', body: JSON.stringify(form) });
    const data = await res.json();
    if (!res.ok) setError(data.error || 'Failed to create.');
    else { setModal(false); fetchNotifications(); }
    setSaving(false);
  }

  async function handleToggle(id) {
    await apiFetch(`/api/notifications/${id}/toggle`, { method: 'PUT' });
    fetchNotifications();
  }

  async function handleDelete(id) {
    await apiFetch(`/api/notifications/${id}`, { method: 'DELETE' });
    fetchNotifications();
    setDeleteConfirm(null);
  }

  const isImportant = (type) => type === 'important' || type === 'danger';

  const typeBadge = type => {
    if (isImportant(type)) {
      return (
        <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <AlertCircle size={11} /> Important
        </span>
      );
    }
    return (
      <span className="badge badge-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        <Info size={11} /> Normal
      </span>
    );
  };

  return (
    <ProtectedLayout title="Announcements">
      <div className="table-card">
        <div className="table-header">
          <h3>Announcement Banners</h3>
          <button className="btn btn-primary btn-sm" onClick={() => { setForm({ message: '', type: 'normal', expires_at: '' }); setError(''); setModal(true); }}>
            <Plus size={15} /> New Announcement
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr><th>Message</th><th>Type</th><th>Active</th><th>Expires</th><th>Created By</th><th>Created</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading…</td></tr>
              ) : notifications.length === 0 ? (
                <tr><td colSpan={7}><div className="empty-state"><Bell size={36} /><h3>No announcements yet</h3></div></td></tr>
              ) : notifications.map(n => (
                <tr key={n.id}>
                  <td style={{ maxWidth: 300 }}>{n.message}</td>
                  <td>{typeBadge(n.type)}</td>
                  <td>
                    <button className="action-btn" title={n.is_active ? 'Deactivate' : 'Activate'} onClick={() => handleToggle(n.id)}
                      style={{ color: n.is_active ? 'var(--success)' : 'var(--text-muted)' }}>
                      {n.is_active ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                    </button>
                  </td>
                  <td>{n.expires_at || '—'}</td>
                  <td>{n.created_by_name}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>{n.created_at?.split('T')[0]}</td>
                  <td>
                    <button className="action-btn delete" title="Delete" onClick={() => setDeleteConfirm(n)}><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="table-footer"><span>Showing {notifications.length} announcement{notifications.length !== 1 ? 's' : ''}</span></div>
      </div>

      <Modal isOpen={modal} onClose={() => setModal(false)} title="New Announcement"
        footer={<><button className="btn btn-outline" onClick={() => setModal(false)}>Cancel</button><button className="btn btn-primary" onClick={handleCreate} disabled={saving}>{saving ? 'Creating…' : 'Create'}</button></>}>
        {error && <div style={{ color: 'var(--danger)', marginBottom: 14, fontSize: '0.875rem' }}>{error}</div>}
        <div className="form-group">
          <label>Message *</label>
          <input value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} placeholder="Announcement text…" />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Type</label>
            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
              {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Expires on (optional)</label>
            <input type="date" value={form.expires_at} onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))} />
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Delete Announcement"
        footer={<><button className="btn btn-outline" onClick={() => setDeleteConfirm(null)}>Cancel</button><button className="btn btn-danger" onClick={() => handleDelete(deleteConfirm.id)}>Delete</button></>}>
        <p style={{ color: 'var(--text-secondary)' }}>Delete this announcement? This cannot be undone.</p>
        <p style={{ marginTop: 8, fontStyle: 'italic', color: 'var(--text-muted)', fontSize: '0.875rem' }}>"{deleteConfirm?.message}"</p>
      </Modal>
    </ProtectedLayout>
  );
}
