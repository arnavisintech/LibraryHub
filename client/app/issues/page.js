'use client';
import { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '../lib/api';
import ProtectedLayout from '../components/ProtectedLayout';
import Modal from '../components/Modal';
import { Search, Plus, RotateCcw, ClipboardList, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

const EMPTY_ISSUE_FORM = { book_id: '', member_id: '', due_days: 14 };

export default function IssuesPage() {
  const [issues, setIssues] = useState([]);
  const [books, setBooks] = useState([]);
  const [members, setMembers] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [issueModal, setIssueModal] = useState(false);
  const [form, setForm] = useState(EMPTY_ISSUE_FORM);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [returnConfirm, setReturnConfirm] = useState(null);

  const fetchIssues = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.set('status', statusFilter);
    if (search) params.set('search', search);
    const query = params.toString() ? `?${params}` : '';
    const res = await apiFetch(`/api/issues${query}`);
    if (res?.ok) setIssues(await res.json());
    setLoading(false);
  }, [search, statusFilter]);

  useEffect(() => { fetchIssues(); }, [fetchIssues]);

  async function openIssueModal() {
    setForm(EMPTY_ISSUE_FORM);
    setError('');
    const [bRes, mRes] = await Promise.all([
      apiFetch('/api/books'),
      apiFetch('/api/members?active=true'),
    ]);
    if (bRes?.ok) setBooks(await bRes.json());
    if (mRes?.ok) setMembers(await mRes.json());
    setIssueModal(true);
  }

  async function handleIssue() {
    if (!form.book_id || !form.member_id) { setError('Book and member are required.'); return; }
    setSaving(true); setError('');
    const res = await apiFetch('/api/issues', {
      method: 'POST',
      body: JSON.stringify({ book_id: Number(form.book_id), member_id: Number(form.member_id), due_days: Number(form.due_days) }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error || 'Failed to issue book.'); }
    else { setIssueModal(false); fetchIssues(); }
    setSaving(false);
  }

  async function handleReturn(id) {
    const res = await apiFetch(`/api/issues/${id}/return`, { method: 'PUT' });
    const data = await res.json();
    if (!res.ok) { alert(data.error); }
    else { fetchIssues(); }
    setReturnConfirm(null);
  }

  function statusBadge(status) {
    if (status === 'active')   return <span className="badge badge-info">Active</span>;
    if (status === 'overdue')  return <span className="badge badge-danger">Overdue</span>;
    if (status === 'returned') return <span className="badge badge-success">Returned</span>;
    return <span className="badge badge-secondary">{status}</span>;
  }

  const counts = {
    total:    issues.length,
    active:   issues.filter(i => i.status === 'active').length,
    overdue:  issues.filter(i => i.status === 'overdue').length,
    returned: issues.filter(i => i.status === 'returned').length,
  };

  return (
    <ProtectedLayout title="Issue / Return">
      <div className="kpi-grid" style={{ marginBottom: 24 }}>
        <div className="kpi-card info">
          <div className="kpi-icon"><ClipboardList size={24} /></div>
          <div className="kpi-value">{counts.total}</div>
          <div className="kpi-label">Total Issues</div>
        </div>
        <div className="kpi-card warning">
          <div className="kpi-icon"><Clock size={24} /></div>
          <div className="kpi-value">{counts.active}</div>
          <div className="kpi-label">Active</div>
        </div>
        <div className="kpi-card danger">
          <div className="kpi-icon"><AlertTriangle size={24} /></div>
          <div className="kpi-value">{counts.overdue}</div>
          <div className="kpi-label">Overdue</div>
        </div>
        <div className="kpi-card success">
          <div className="kpi-icon"><CheckCircle size={24} /></div>
          <div className="kpi-value">{counts.returned}</div>
          <div className="kpi-label">Returned</div>
        </div>
      </div>

      <div className="table-card">
        <div className="table-header">
          <h3>All Issue Records</h3>
          <div className="table-actions">
            <select
              style={{ padding: '8px 12px', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem', background: 'var(--bg-input)', color: 'var(--text-primary)', outline: 'none' }}
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="overdue">Overdue</option>
              <option value="returned">Returned</option>
            </select>
            <div className="table-search">
              <Search size={15} className="search-icon" />
              <input
                placeholder="Search issues…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <button className="btn btn-primary btn-sm" onClick={openIssueModal}>
              <Plus size={15} /> Issue Book
            </button>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Book</th>
                <th>Member</th>
                <th>Issue Date</th>
                <th>Due Date</th>
                <th>Return Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading…</td></tr>
              ) : issues.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="empty-state">
                      <ClipboardList size={40} />
                      <h3>No issues found</h3>
                    </div>
                  </td>
                </tr>
              ) : issues.map(issue => (
                <tr key={issue.id}>
                  <td><strong>{issue.book_title}</strong></td>
                  <td>{issue.member_name} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({issue.member_code})</span></td>
                  <td>{issue.issue_date}</td>
                  <td style={{ color: issue.status === 'overdue' ? 'var(--danger)' : 'inherit', fontWeight: issue.status === 'overdue' ? 600 : 400 }}>
                    {issue.due_date}
                  </td>
                  <td>{issue.return_date || '—'}</td>
                  <td>{statusBadge(issue.status)}</td>
                  <td>
                    {(issue.status === 'active' || issue.status === 'overdue') && (
                      <button
                        className="action-btn return-btn"
                        title="Mark as returned"
                        onClick={() => setReturnConfirm(issue)}
                      >
                        <RotateCcw size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="table-footer">
          <span>Showing {issues.length} record{issues.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Issue Book Modal */}
      <Modal
        isOpen={issueModal}
        onClose={() => setIssueModal(false)}
        title="Issue a Book"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setIssueModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleIssue} disabled={saving}>
              {saving ? 'Issuing…' : 'Issue Book'}
            </button>
          </>
        }
      >
        {error && <div style={{ color: 'var(--danger)', marginBottom: 14, fontSize: '0.875rem' }}>{error}</div>}
        <div className="form-group">
          <label>Book *</label>
          <select value={form.book_id} onChange={e => setForm(f => ({ ...f, book_id: e.target.value }))}>
            <option value="">Select a book</option>
            {books.filter(b => b.available_copies > 0).map(b => (
              <option key={b.id} value={b.id}>
                {b.title} — {b.author} ({b.available_copies} available)
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Member *</label>
          <select value={form.member_id} onChange={e => setForm(f => ({ ...f, member_id: e.target.value }))}>
            <option value="">Select a member</option>
            {members.filter(m => m.is_active).map(m => (
              <option key={m.id} value={m.id}>{m.name} ({m.member_id})</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Due in (days)</label>
          <input
            type="number"
            min="1"
            max="60"
            value={form.due_days}
            onChange={e => setForm(f => ({ ...f, due_days: e.target.value }))}
          />
        </div>
      </Modal>

      {/* Return confirm */}
      <Modal
        isOpen={!!returnConfirm}
        onClose={() => setReturnConfirm(null)}
        title="Confirm Return"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setReturnConfirm(null)}>Cancel</button>
            <button className="btn btn-success" onClick={() => handleReturn(returnConfirm.id)}>Confirm Return</button>
          </>
        }
      >
        <p style={{ color: 'var(--text-secondary)' }}>
          Mark <strong>{returnConfirm?.book_title}</strong> as returned by <strong>{returnConfirm?.member_name}</strong>?
        </p>
      </Modal>
    </ProtectedLayout>
  );
}
