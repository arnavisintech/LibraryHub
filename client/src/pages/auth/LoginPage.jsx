import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../lib/api';
import { Library, AlertCircle } from 'lucide-react';
import './LoginPage.css';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (token) navigate('/dashboard');
  }, [token, navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Login failed.');
      } else {
        login(data.token, data.user);
        navigate('/dashboard');
      }
    } catch {
      setError('Cannot connect to server. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <div className="login-logo-icon">
            <Library size={28} color="#fff" />
          </div>
          <h1 className="login-logo-title">LibraryHub</h1>
          <p className="login-logo-sub">Library Management Dashboard</p>
        </div>

        {error && (
          <div className="login-error">
            <AlertCircle size={14} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              autoComplete="username"
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In →'}
          </button>
        </form>

        <p className="login-hint">
          Demo: <strong>admin</strong> / <strong>admin123</strong> &nbsp;|&nbsp; <strong>staff</strong> / <strong>staff123</strong>
        </p>
      </div>
    </div>
  );
}
