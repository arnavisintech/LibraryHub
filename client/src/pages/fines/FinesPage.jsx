import { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '../../lib/api';
import ProtectedLayout from '../../components/layout/ProtectedLayout';
import Modal from '../../components/ui/Modal';
import { DollarSign, CheckCircle, Clock } from 'lucide-react';

export default function FinesPage() {
  const [fines, setFines] = useState([]);
  const [filter, setFilter] = useState('unpaid');
  const [loading, setLoading] = useState(true);
  const [payConfirm, setPayConfirm] = useState(null);

  const fetchFines = useCallback(async () => {
    setLoading(true);
    try {
      const paid = filter === 'all' ? '' : filter === 'paid' ? 'true' : 'false';
      const query = paid !== '' ? `?paid=${paid}` : '';
      const res = await apiFetch(`/api/fines${query}`);
      if (res?.ok) setFines(await res.json());
    } catch (err) {
      console.error('Failed to fetch fines:', err);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchFines(); }, [fetchFines]);

  async function handlePay(id) {
    const res = await apiFetch(`/api/fines/${id}/pay`, { method: 'PUT' });
    const data = await res.json();
    if (!res.ok) alert(data.error);
    else fetchFines();
    setPayConfirm(null);
  }

  const totalOutstanding = fines.filter(f => !f.paid).reduce((s, f) => s + f.amount, 0);
  const totalCollected   = fines.filter(f => f.paid).reduce((s, f) => s + f.amount, 0);

  return (
    <ProtectedLayout title="Fines">
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', marginBottom: 24 }}>
        <div className="kpi-card danger">
          <div className="kpi-icon"><DollarSign size={24} /></div>
          <div className="kpi-value">₹{totalOutstanding.toFixed(2)}</div>
          <div className="kpi-label">Outstanding</div>
        </div>
        <div className="kpi-card success">
          <div className="kpi-icon"><CheckCircle size={24} /></div>
          <div className="kpi-value">₹{totalCollected.toFixed(2)}</div>
          <div className="kpi-label">Collected</div>
        </div>
        <div className="kpi-card warning">
          <div className="kpi-icon"><Clock size={24} /></div>
          <div className="kpi-value">{fines.filter(f => !f.paid).length}</div>
          <div className="kpi-label">Pending Fines</div>
        </div>
      </div>

      <div className="table-card">
        <div className="table-header">
          <h3>Fine Records</h3>
          <div className="table-actions">
            <select style={{ padding: '8px 12px', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem', background: 'var(--bg-input)', color: 'var(--text-primary)', outline: 'none' }}
              value={filter} onChange={e => setFilter(e.target.value)}>
              <option value="unpaid">Unpaid</option>
              <option value="paid">Paid</option>
              <option value="all">All</option>
            </select>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr><th>Member</th><th>Book</th><th>Days Overdue</th><th>Amount</th><th>Due Date</th><th>Return Date</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading…</td></tr>
              ) : fines.length === 0 ? (
                <tr><td colSpan={8}><div className="empty-state"><DollarSign size={36} /><h3>No fines found</h3></div></td></tr>
              ) : fines.map(f => (
                <tr key={f.id}>
                  <td><strong>{f.member_name}</strong> <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({f.member_code})</span></td>
                  <td>{f.book_title}</td>
                  <td style={{ textAlign: 'center', color: f.paid ? 'var(--text-muted)' : 'var(--danger)', fontWeight: 600 }}>{f.days_overdue ?? '—'}</td>
                  <td style={{ fontWeight: 700, color: f.paid ? 'var(--success)' : 'var(--danger)' }}>₹{Number(f.amount).toFixed(2)}</td>
                  <td>{f.due_date}</td>
                  <td>{f.return_date ?? '—'}</td>
                  <td>
                    {f.paid
                      ? <span className="badge badge-success">Paid {f.paid_date}</span>
                      : <span className="badge badge-danger">Unpaid</span>}
                  </td>
                  <td>
                    {!f.paid && (
                      <button className="btn btn-success btn-sm" onClick={() => setPayConfirm(f)}>Mark Paid</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="table-footer"><span>Showing {fines.length} fine{fines.length !== 1 ? 's' : ''}</span></div>
      </div>

      <Modal isOpen={!!payConfirm} onClose={() => setPayConfirm(null)} title="Mark Fine as Paid"
        footer={<><button className="btn btn-outline" onClick={() => setPayConfirm(null)}>Cancel</button><button className="btn btn-success" onClick={() => handlePay(payConfirm.id)}>Confirm Payment</button></>}>
        <p style={{ color: 'var(--text-secondary)' }}>
          Mark fine of <strong>₹{Number(payConfirm?.amount).toFixed(2)}</strong> for <strong>{payConfirm?.member_name}</strong> as paid?
        </p>
      </Modal>
    </ProtectedLayout>
  );
}
