const BASE = 'http://localhost:3000';

export async function apiFetch(path, options = {}) {
  const token = localStorage.getItem('library_token');

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  if (res.status === 401 || res.status === 403) {
    localStorage.removeItem('library_token');
    localStorage.removeItem('library_user');
    window.location.href = '/login';
    return;
  }

  return res;
}
