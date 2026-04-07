import { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '../../lib/api';
import ProtectedLayout from '../../components/layout/ProtectedLayout';
import Modal from '../../components/ui/Modal';
import { useAuth } from '../../context/AuthContext';
import { Plus, Pencil, Trash2, UserCog, ShieldCheck, User, Eye, EyeOff } from 'lucide-react';

const EMPTY_FORM = { username: '', password: '', role: 'staff' };

export default function UsersPage() {
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const res = await apiFetch('/api/users');
    if (res?.ok) setUsers(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  function openAdd() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setError('');
    setShowPassword(false);
    setModal(true);
  }

  function openEdit(u) {
    setEditing(u);
    setForm({ username: u.username, password: '', role: u.role });
    setError('');
    setShowPassword(false);
    setModal(true);
  }

  async function handleSave() {
    if (!form.username) { setError('Username is required.'); return; }
    if (!editing && !form.password) { setError('Password is required for new users.'); return; }
    setSaving(true);
    setError('');

    const body = { username: form.username, role: form.role };
    if (form.password) body.password = form.password;

    const method = editing ? 'PUT' : 'POST';
    const path = editing ? `/api/users/${editing.id}` : '/api/users';
    try {
      const res = await apiFetch(path, { method, body: JSON.stringify(body) });
      if (!res) return; // redirected to login by apiFetch
      const data = await res.json();
      if (!res.ok) setError(data.error || 'Failed to save.');
      else { setModal(false); fetchUsers(); }
    } catch (err) {
      setError('Could not reach the server. Is it running?');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    const res = await apiFetch(`/api/users/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) alert(data.error);
    else fetchUsers();
    setDeleteConfirm(null);
  }

  const adminCount = users.filter(u => u.role === 'admin').length;
  const staffCount = users.filter(u => u.role === 'staff').length;

  return (
    <ProtectedLayout title="User Management">
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', marginBottom: 24 }}>
        <div className="kpi-card info">
          <div className="kpi-icon"><UserCog size={24} /></div>
          <div className="kpi-value">{users.length}</div>
          <div className="kpi-label">Total Users</div>
        </div>
        <div className="kpi-card success">
          <div className="kpi-icon"><ShieldCheck size={24} /></div>
          <div className="kpi-value">{adminCount}</div>
          <div className="kpi-label">Admins</div>
        </div>
        <div className="kpi-card warning">
          <div className="kpi-icon"><User size={24} /></div>
          <div className="kpi-value">{staffCount}</div>
          <div className="kpi-label">Staff</div>
        </div>
      </div>

      <div className="table-card">
        <div className="table-header">
          <h3>All Users</h3>
          <div className="table-actions">
            <button className="btn btn-primary btn-sm" onClick={openAdd}>
              <Plus size={15} /> Add User
            </button>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Role</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading…</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={4}><div className="empty-state"><UserCog size={40} /><h3>No users found</h3></div></td></tr>
              ) : users.map(u => (
                <tr key={u.id}>
                  <td>
                    <strong>{u.username}</strong>
                    {u.id === currentUser?.id && (
                      <span style={{ marginLeft: 8, fontSize: '0.75rem', color: 'var(--text-muted)' }}>(you)</span>
                    )}
                  </td>
                  <td>
                    {u.role === 'admin'
                      ? <span className="badge badge-warning">Admin</span>
                      : <span className="badge badge-secondary">Staff</span>}
                  </td>
                  <td>{u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}</td>
                  <td>
                    <div className="action-btns">
                      <button className="action-btn edit" title="Edit" onClick={() => openEdit(u)}>
                        <Pencil size={14} />
                      </button>
                      <button
                        className="action-btn delete"
                        title={u.id === currentUser?.id ? 'Cannot delete your own account' : 'Delete'}
                        onClick={() => setDeleteConfirm(u)}
                        disabled={u.id === currentUser?.id}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="table-footer">
          <span>Showing {users.length} user{users.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={modal}
        onClose={() => setModal(false)}
        title={editing ? 'Edit User' : 'Add New User'}
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : editing ? 'Save Changes' : 'Add User'}
            </button>
          </>
        }
      >
        {error && <div style={{ color: 'var(--danger)', marginBottom: 14, fontSize: '0.875rem' }}>{error}</div>}
        <div className="form-group">
          <label>Username *</label>
          <input
            value={form.username}
            onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
            placeholder="e.g. john_doe"
          />
        </div>
        <div className="form-group">
          <label>{editing ? 'New Password' : 'Password *'}</label>
          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              placeholder={editing ? 'Leave blank to keep current password' : 'Enter password'}
              style={{ paddingRight: '2.5rem', width: '100%' }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              style={{
                position: 'absolute', right: '0.6rem', top: '50%',
                transform: 'translateY(-50%)', background: 'none',
                border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
                display: 'flex', alignItems: 'center', padding: 0,
              }}
              tabIndex={-1}
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
        <div className="form-group">
          <label>Role *</label>
          <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
            <option value="staff">Staff</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete User"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setDeleteConfirm(null)}>Cancel</button>
            <button className="btn btn-danger" onClick={() => handleDelete(deleteConfirm.id)}>Delete</button>
          </>
        }
      >
        <p style={{ color: 'var(--text-secondary)' }}>
          Delete user <strong>{deleteConfirm?.username}</strong>? This action cannot be undone.
        </p>
      </Modal>
    </ProtectedLayout>
  );
}
