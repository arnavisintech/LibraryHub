import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import './ProtectedLayout.css';

export default function ProtectedLayout({ children, title }) {
  const { token, loading } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && !token) navigate('/login');
  }, [token, loading, navigate]);

  if (loading || !token) return null;

  return (
    <div className="pl-layout">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      {sidebarOpen && (
        <div className="pl-overlay" onClick={() => setSidebarOpen(false)} />
      )}
      <main className="pl-main">
        <Navbar title={title} onMenuClick={() => setSidebarOpen(o => !o)} />
        <div className="pl-content">{children}</div>
      </main>
    </div>
  );
}
