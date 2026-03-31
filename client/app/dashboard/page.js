'use client';
import { useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';
import ProtectedLayout from '../components/ProtectedLayout';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { BookOpen, BookMarked, AlertTriangle, Users, UserPlus } from 'lucide-react';
import styles from './page.module.css';

const GENRE_COLORS = ['#3b82f6','#10b981','#f59e0b','#ef4444','#06b6d4','#8b5cf6','#ec4899','#14b8a6'];

function formatMonth(ym) {
  if (!ym) return '';
  const [y, m] = ym.split('-');
  return new Date(y, m - 1).toLocaleString('default', { month: 'short', year: '2-digit' });
}

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/api/dashboard/stats')
      .then(r => r.json())
      .then(data => { setStats(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const kpis = stats ? [
    { label: 'Total Books',      value: stats.totalBooks,      icon: BookOpen,      color: 'info' },
    { label: 'Books Issued',     value: stats.booksIssued,     icon: BookMarked,    color: 'success' },
    { label: 'Overdue Books',    value: stats.overdueBooks,    icon: AlertTriangle, color: 'danger' },
    { label: 'Active Members',   value: stats.totalMembers,    icon: Users,         color: 'warning' },
    { label: 'New This Month',   value: stats.newMembersMonth, icon: UserPlus,      color: 'info' },
  ] : [];

  const monthlyData = stats?.monthlyIssues?.map(r => ({
    month: formatMonth(r.month),
    Issues: r.count,
  })) || [];

  const genreData = stats?.genreDistribution?.slice(0, 8).map(r => ({
    name: r.genre,
    value: r.count,
  })) || [];

  return (
    <ProtectedLayout title="Dashboard">
      {loading ? (
        <div className={styles.loadingGrid}>
          {[...Array(5)].map((_, i) => <div key={i} className={styles.skeleton} />)}
        </div>
      ) : (
        <>
          <div className="kpi-grid">
            {kpis.map(({ label, value, icon: Icon, color }) => (
              <div key={label} className={`kpi-card ${color}`}>
                <div className="kpi-icon"><Icon size={26} /></div>
                <div className="kpi-value">{value}</div>
                <div className="kpi-label">{label}</div>
              </div>
            ))}
          </div>

          <div className={styles.chartsGrid}>
            <div className={styles.chartCard}>
              <h3 className={styles.chartTitle}>Monthly Book Issues</h3>
              {monthlyData.length === 0 ? (
                <p className={styles.noData}>No data available</p>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={monthlyData} margin={{ top: 4, right: 16, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', fontSize: 13 }}
                      cursor={{ fill: 'rgba(59,130,246,0.06)' }}
                    />
                    <Bar dataKey="Issues" fill="#3b82f6" radius={[4,4,0,0]} maxBarSize={48} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className={styles.chartCard}>
              <h3 className={styles.chartTitle}>Books by Genre</h3>
              {genreData.length === 0 ? (
                <p className={styles.noData}>No data available</p>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={genreData}
                      cx="50%"
                      cy="45%"
                      innerRadius={60}
                      outerRadius={95}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {genreData.map((_, i) => (
                        <Cell key={i} fill={GENRE_COLORS[i % GENRE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }}
                      formatter={(v, n) => [v, n]}
                    />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </>
      )}
    </ProtectedLayout>
  );
}
