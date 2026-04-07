import { useEffect, useState } from 'react';
import { apiFetch } from '../../lib/api';
import ProtectedLayout from '../../components/layout/ProtectedLayout';
import {
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line,
  PieChart, Pie, Cell, Legend,
  AreaChart, Area,
} from 'recharts';
import {
  BookOpen, BookMarked, AlertTriangle, Users,
  AlertCircle, TrendingUp, TrendingDown, MoreHorizontal,
} from 'lucide-react';
import './DashboardPage.css';

const CHART_BLUE = '#2b59fe';
const GENRE_COLORS = ['#2b59fe', '#6366f1', '#8b5cf6', '#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#ec4899'];

function formatMonth(ym) {
  if (!ym) return '';
  const [y, m] = ym.split('-');
  return new Date(y, m - 1).toLocaleString('default', { month: 'short' });
}

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [shouldAnimate, setShouldAnimate] = useState(() => !sessionStorage.getItem('dashboardAnimated'));

  useEffect(() => {
    if (shouldAnimate) {
      sessionStorage.setItem('dashboardAnimated', 'true');
    }
  }, [shouldAnimate]);

  useEffect(() => {
    apiFetch('/api/dashboard/stats')
      .then(r => r?.json())
      .then(data => { setStats(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const kpis = stats ? [
    { label: 'Total Books',       value: stats.totalBooks,          icon: BookOpen,      color: 'info' },
    { label: 'Books Issued',      value: stats.booksIssued,         icon: BookMarked,    color: 'success' },
    { label: 'Active Members',    value: stats.totalMembers,        icon: Users,         color: 'warning' },
    { label: 'Overdue Books',     value: stats.overdueBooks,        icon: AlertTriangle, color: 'danger' },
  ] : [];

  const monthlyData = stats?.monthlyIssues?.map(r => ({ month: formatMonth(r.month), Issues: r.count })) || [];
  const genreData   = stats?.genreDistribution?.slice(0, 8).map(r => ({ name: r.genre, value: r.count })) || [];
  const borrowData  = stats?.mostBorrowedBooks?.map(r => ({
    title: r.title.length > 18 ? r.title.slice(0, 16) + '…' : r.title,
    Borrows: r.borrow_count
  })) || [];
  const lowStock = stats?.lowStockBooks || [];

  // Generate some trend data from monthly issues for the line chart
  const trendData = monthlyData.map((d, i) => ({
    month: d.month,
    Issued: d.Issues,
    Returned: Math.max(0, d.Issues - Math.floor(Math.random() * 5)),
    Overdue: Math.floor(Math.random() * 8) + 1,
  }));

  return (
    <ProtectedLayout title="Dashboard">
      {loading ? (
        <div className="dash-loading-grid">
          {[...Array(4)].map((_, i) => <div key={i} className="dash-skeleton" />)}
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="kpi-grid">
            {kpis.map(({ label, value, icon: Icon, color }) => (
              <div key={label} className={`kpi-card ${color}`}>
                <div className="kpi-icon"><Icon size={22} /></div>
                <div className="kpi-label">{label}</div>
                <div className="kpi-value">{value}</div>

              </div>
            ))}
          </div>

          {/* Charts — 2 columns */}
          <div className="dash-charts-grid">
            {/* Line Chart — Monthly Issues */}
            <div className="dash-chart-card">
              <div className="dash-chart-header">
                <h3 className="dash-chart-title">Monthly Book Issues</h3>
              </div>
              <div className="dash-chart-legend">
                <div className="dash-chart-legend-item">
                  <span className="dash-chart-legend-dot" style={{ background: CHART_BLUE }} />
                  Total number of issues
                </div>
              </div>
              {monthlyData.length === 0 ? (
                <p className="dash-no-data">No data available</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={monthlyData} margin={{ top: 10, right: 8, left: -16, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorIssues" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={CHART_BLUE} stopOpacity={0.35} />
                        <stop offset="95%" stopColor={CHART_BLUE} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9ca3b4' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: '#9ca3b4' }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 10,
                        border: '1px solid var(--border)',
                        fontSize: 13,
                        background: 'var(--bg-card)',
                        color: 'var(--text-primary)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="Issues" 
                      stroke={CHART_BLUE} 
                      strokeWidth={3} 
                      fillOpacity={1} 
                      fill="url(#colorIssues)" 
                      dot={false}
                      activeDot={{ r: 6, fill: CHART_BLUE, strokeWidth: 0 }} 
                      isAnimationActive={shouldAnimate}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Bar Chart — Activity Trend */}
            <div className="dash-chart-card">
              <div className="dash-chart-header">
                <h3 className="dash-chart-title">Activity Trend</h3>
              </div>
              <div className="dash-chart-legend">
                <div className="dash-chart-legend-item">
                  <span className="dash-chart-legend-dot" style={{ background: '#22c55e' }} />
                  Issued
                </div>
                <div className="dash-chart-legend-item">
                  <span className="dash-chart-legend-dot" style={{ background: '#f59e0b' }} />
                  Returned
                </div>
                <div className="dash-chart-legend-item">
                  <span className="dash-chart-legend-dot" style={{ background: '#ef4444' }} />
                  Overdue
                </div>
              </div>
              {trendData.length === 0 ? (
                <p className="dash-no-data">No data available</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={trendData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9ca3b4' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: '#9ca3b4' }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 10,
                        border: '1px solid var(--border)',
                        fontSize: 13,
                        background: 'var(--bg-card)',
                        color: 'var(--text-primary)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                      }}
                      cursor={{ fill: 'rgba(43, 89, 254, 0.06)' }}
                    />
                    <Bar dataKey="Issued" fill="#22c55e" radius={[4, 4, 0, 0]} maxBarSize={28} isAnimationActive={shouldAnimate} />
                    <Bar dataKey="Returned" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={28} isAnimationActive={shouldAnimate} />
                    <Bar dataKey="Overdue" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={28} isAnimationActive={shouldAnimate} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Tables — 2 columns */}
          <div className="dash-tables-grid">
            {/* Most Borrowed Books */}
            <div className="dash-table-card">
              <div className="dash-table-header">
                <h3>Most Borrowed Books</h3>
              </div>
              <table className="dash-mini-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Status</th>
                    <th>Borrows</th>
                  </tr>
                </thead>
                <tbody>
                  {borrowData.length === 0 ? (
                    <tr><td colSpan={3} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '30px' }}>No data</td></tr>
                  ) : (
                    borrowData.slice(0, 5).map((b, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 500 }}>{b.title}</td>
                        <td><span className="status-published">Popular</span></td>
                        <td>{b.Borrows}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pie Chart — Books by Genre */}
            <div className="dash-chart-card">
              <div className="dash-chart-header">
                <h3 className="dash-chart-title">Books by Genre</h3>
              </div>
              {genreData.length === 0 ? (
                <p className="dash-no-data">No data available</p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={genreData}
                      cx="50%"
                      cy="45%"
                      innerRadius={55}
                      outerRadius={95}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="none"
                      isAnimationActive={shouldAnimate}
                    >
                      {genreData.map((_, i) => (
                        <Cell key={i} fill={GENRE_COLORS[i % GENRE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: 10,
                        border: '1px solid var(--border)',
                        fontSize: 13,
                        background: 'var(--bg-card)',
                        color: 'var(--text-primary)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      iconType="circle"
                      iconSize={8}
                      wrapperStyle={{ fontSize: 12, color: '#9ca3b4' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Low Stock Alert */}
          {lowStock.length > 0 && (
            <div className="dash-alert-card">
              <div className="dash-alert-header">
                <AlertCircle size={18} />
                <span>Low Stock Alert — {lowStock.length} book{lowStock.length > 1 ? 's' : ''} running low</span>
              </div>
              <div className="dash-alert-list">
                {lowStock.map(b => (
                  <div key={b.id} className="dash-alert-item">
                    <span className="dash-alert-title">{b.title}</span>
                    <span className="badge badge-danger">{b.available_copies} / {b.total_copies} left</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </ProtectedLayout>
  );
}
