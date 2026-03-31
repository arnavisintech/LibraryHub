'use client';
import { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '../lib/api';
import ProtectedLayout from '../components/ProtectedLayout';
import Modal from '../components/Modal';
import { Search, Plus, Pencil, UserX, Users } from 'lucide-react';

const EMPTY_FORM = { member_id: '', name: '', email: '', phone: '' };

export default function MembersPage() {
  const [members, setMembers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deactivateConfirm, setDeactivateConfirm] = useState(null);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    const params = search ? `?search=${encodeURIComponent(search)}` : '';
    const res = await apiFetch(`/api/members${params}`);
    if (res?.ok) setMembers(await res.json());
    setLoading(false);
  }, [search]);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  function openAdd() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setError('');
    setModal(true);
  }

  function openEdit(member) {
    setEditing(member);
    setForm({ member_id: member.member_id, name: member.name, email: member.email || '', phone: member.phone || '' });
    setError('');
    setModal(true);
  }

  async function handleSave() {
    if (!form.member_id || !form.name) { setError('Member ID and name are required.'); return; }
    setSaving(true); setError('');
    const method = editing ? 'PUT' : 'POST';
    const path = editing ? `/api/members/${editing.id}` : '/api/members';
    const res = await apiFetch(path, { method, body: JSON.stringify(form) });
    const data = await res.json();
    if (!res.ok) { setError(data.error || 'Failed to save.'); }
    else { setModal(false); fetchMembers(); }
    setSaving(false);
  }

  async function handleDeactivate(id) {
    const res = await apiFetch(`/api/members/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) { alert(data.error); }
    else { fetchMembers(); }
    setDeactivateConfirm(null);
  }

  const active = members.filter(m => m.is_active).length;
  const inactive = members.length - active;

  return (
    <ProtectedLayout title="Members">
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', marginBottom: 24 }}>
        <div className="kpi-card info">
          <div className="kpi-icon"><Users size={24} /></div>
          <div className="kpi-value">{members.length}</div>
          <div className="kpi-label">Total Members</div>
        </div>
        <div className="kpi-card success">
          <div className="kpi-icon"><Users size={24} /></div>
          <div className="kpi-value">{active}</div>
          <div className="kpi-label">Active</div>
        </div>
        <div className="kpi-card danger">
          <div className="kpi-icon"><UserX size={24} /></div>
          <div className="kpi-value">{inactive}</div>
          <div className="kpi-label">Inactive</div>
        </div>
      </div>

      <div className="table-card">
        <div className="table-header">
          <h3>All Members</h3>
          <div className="table-actions">
            <div className="table-search">
              <Search size={15} className="search-icon" />
              <input
                placeholder="Search members…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <button className="btn btn-primary btn-sm" onClick={openAdd}>
              <Plus size={15} /> Add Member
            </button>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Member ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Joined</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading…</td></tr>
              ) : members.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="empty-state">
                      <Users size={40} />
                      <h3>No members found</h3>
                    </div>
                  </td>
                </tr>
              ) : members.map(m => (
                <tr key={m.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}>{m.member_id}</td>
                  <td><strong>{m.name}</strong></td>
                  <td>{m.email || '—'}</td>
                  <td>{m.phone || '—'}</td>
                  <td>{m.join_date || '—'}</td>
                  <td>
                    {m.is_active
                      ? <span className="badge badge-success">Active</span>
                      : <span className="badge badge-secondary">Inactive</span>}
                  </td>
                  <td>
                    <div className="action-btns">
                      <button className="action-btn edit" title="Edit" onClick={() => openEdit(m)}>
                        <Pencil size={14} />
                      </button>
                      {m.is_active && (
                        <button className="action-btn delete" title="Deactivate" onClick={() => setDeactivateConfirm(m)}>
                          <UserX size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="table-footer">
          <span>Showing {members.length} member{members.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={modal}
        onClose={() => setModal(false)}
        title={editing ? 'Edit Member' : 'Add New Member'}
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save Member'}
            </button>
          </>
        }
      >
        {error && <div style={{ color: 'var(--danger)', marginBottom: 14, fontSize: '0.875rem' }}>{error}</div>}
        <div className="form-row">
          <div className="form-group">
            <label>Member ID *</label>
            <input
              value={form.member_id}
              onChange={e => setForm(f => ({ ...f, member_id: e.target.value }))}
              placeholder="LIB-001"
              disabled={!!editing}
            />
          </div>
          <div className="form-group">
            <label>Full Name *</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Full name" />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@example.com" />
          </div>
          <div className="form-group">
            <label>Phone</label>
            <input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="Phone number" />
          </div>
        </div>
      </Modal>

      {/* Deactivate confirm */}
      <Modal
        isOpen={!!deactivateConfirm}
        onClose={() => setDeactivateConfirm(null)}
        title="Deactivate Member"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setDeactivateConfirm(null)}>Cancel</button>
            <button className="btn btn-danger" onClick={() => handleDeactivate(deactivateConfirm.id)}>Deactivate</button>
          </>
        }
      >
        <p style={{ color: 'var(--text-secondary)' }}>
          Deactivate <strong>{deactivateConfirm?.name}</strong>? They will no longer be able to borrow books.
        </p>
      </Modal>
    </ProtectedLayout>
  );
}
