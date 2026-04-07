import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../../lib/api';
import ProtectedLayout from '../../components/layout/ProtectedLayout';
import { useAuth } from '../../context/AuthContext';
import { Save, Settings } from 'lucide-react';

export default function SettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ fine_rate_per_day: '', default_loan_days: '', max_renewals: '', low_stock_threshold: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (user?.role !== 'admin') { navigate('/dashboard'); return; }
    apiFetch('/api/settings')
      .then(r => r?.json())
      .then(data => { if (data) setForm({ fine_rate_per_day: data.fine_rate_per_day || '2', default_loan_days: data.default_loan_days || '14', max_renewals: data.max_renewals || '2', low_stock_threshold: data.low_stock_threshold || '2' }); setLoading(false); });
  }, [user, authLoading, navigate]);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true); setSuccess(''); setError('');
    const res = await apiFetch('/api/settings', { method: 'PUT', body: JSON.stringify(form) });
    const data = await res.json();
    if (!res.ok) setError(data.error || 'Failed to save.');
    else setSuccess('Settings saved successfully.');
    setSaving(false);
  }

  return (
    <ProtectedLayout title="Settings">
      <div style={{ maxWidth: 560 }}>
        <div className="table-card" style={{ padding: '28px 32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <Settings size={22} color="var(--text-muted)" />
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Library Configuration</h2>
          </div>

          {loading ? <p style={{ color: 'var(--text-muted)' }}>Loading…</p> : (
            <form onSubmit={handleSave}>
              {success && <div style={{ background: 'var(--success-bg)', color: 'var(--success)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', marginBottom: 16, fontSize: '0.875rem', borderLeft: '3px solid var(--success)' }}>{success}</div>}
              {error && <div style={{ background: 'var(--danger-bg)', color: 'var(--danger)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', marginBottom: 16, fontSize: '0.875rem', borderLeft: '3px solid var(--danger)' }}>{error}</div>}

              <div className="form-group">
                <label>Fine Rate per Day (₹)</label>
                <input type="number" min="0" step="0.5" value={form.fine_rate_per_day} onChange={e => setForm(f => ({ ...f, fine_rate_per_day: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Default Loan Period (days)</label>
                <input type="number" min="1" max="90" value={form.default_loan_days} onChange={e => setForm(f => ({ ...f, default_loan_days: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Maximum Renewals per Issue</label>
                <input type="number" min="0" max="10" value={form.max_renewals} onChange={e => setForm(f => ({ ...f, max_renewals: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Low Stock Threshold (copies)</label>
                <input type="number" min="0" max="10" value={form.low_stock_threshold} onChange={e => setForm(f => ({ ...f, low_stock_threshold: e.target.value }))} />
              </div>

              <button type="submit" className="btn btn-primary" disabled={saving}>
                <Save size={15} /> {saving ? 'Saving…' : 'Save Settings'}
              </button>
            </form>
          )}
        </div>
      </div>
    </ProtectedLayout>
  );
}
