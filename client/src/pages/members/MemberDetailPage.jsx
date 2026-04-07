import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiFetch } from '../../lib/api';
import ProtectedLayout from '../../components/layout/ProtectedLayout';
import { ArrowLeft, User, Mail, Phone, Calendar, BookOpen } from 'lucide-react';

export default function MemberDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch(`/api/members/${id}`)
      .then(r => r?.json())
      .then(data => { setMember(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  function statusBadge(status) {
    if (status === 'active')   return <span className="badge badge-info">Active</span>;
    if (status === 'overdue')  return <span className="badge badge-danger">Overdue</span>;
    if (status === 'returned') return <span className="badge badge-success">Returned</span>;
    return <span className="badge badge-secondary">{status}</span>;
  }

  return (
    <ProtectedLayout title="Member Detail">
      <button className="btn btn-outline btn-sm" style={{ marginBottom: 20 }} onClick={() => navigate('/members')}>
        <ArrowLeft size={15} /> Back to Members
      </button>

      {loading ? (
        <p style={{ color: 'var(--text-muted)' }}>Loading…</p>
      ) : !member ? (
        <p style={{ color: 'var(--danger)' }}>Member not found.</p>
      ) : (
        <>
          {/* Member info card */}
          <div className="table-card" style={{ padding: '24px 28px', marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.5rem', fontWeight: 700, flexShrink: 0 }}>
                {member.name[0].toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 4 }}>{member.name}</h2>
                <span style={{ fontFamily: 'monospace', fontSize: '0.8125rem', color: 'var(--text-muted)', background: 'var(--bg-body)', padding: '2px 8px', borderRadius: 4 }}>{member.member_id}</span>
              </div>
              {member.is_active
                ? <span className="badge badge-success">Active</span>
                : <span className="badge badge-secondary">Inactive</span>}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginTop: 20 }}>
              {member.email && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  <Mail size={15} /> {member.email}
                </div>
              )}
              {member.phone && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  <Phone size={15} /> {member.phone}
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                <Calendar size={15} /> Joined {member.join_date}
              </div>
            </div>
          </div>

          {/* Borrowing history */}
          <div className="table-card">
            <div className="table-header">
              <h3>Borrowing History</h3>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{member.borrowing_history?.length ?? 0} records</span>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr><th>Book</th><th>Author</th><th>Issue Date</th><th>Due Date</th><th>Return Date</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {!member.borrowing_history?.length ? (
                    <tr><td colSpan={6}><div className="empty-state"><BookOpen size={36} /><h3>No borrowing history</h3></div></td></tr>
                  ) : member.borrowing_history.map(issue => (
                    <tr key={issue.id}>
                      <td><strong>{issue.book_title}</strong></td>
                      <td>{issue.book_author}</td>
                      <td>{issue.issue_date}</td>
                      <td style={{ color: issue.status === 'overdue' ? 'var(--danger)' : 'inherit', fontWeight: issue.status === 'overdue' ? 600 : 400 }}>{issue.due_date}</td>
                      <td>{issue.return_date || '—'}</td>
                      <td>{statusBadge(issue.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </ProtectedLayout>
  );
}
