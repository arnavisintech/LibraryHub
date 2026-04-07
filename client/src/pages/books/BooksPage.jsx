import { useEffect, useState, useCallback, useRef } from 'react';
import { apiFetch } from '../../lib/api';
import ProtectedLayout from '../../components/layout/ProtectedLayout';
import Modal from '../../components/ui/Modal';
import { useAuth } from '../../context/AuthContext';
import { Search, Plus, Pencil, Trash2, BookOpen, Upload } from 'lucide-react';

const GENRES = ['Fiction','Non-Fiction','Computer Science','Dystopian','Fantasy','Romance','Philosophy','Self-Help','Science Fiction','Satire','Memoir','Psychology','Biography','Classic','History','Science'];
const EMPTY_FORM = { title: '', author: '', isbn: '', genre: '', total_copies: 1 };

export default function BooksPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [books, setBooks] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // CSV import state
  const [csvModal, setCsvModal] = useState(false);
  const [csvRows, setCsvRows] = useState([]);
  const [csvErrors, setCsvErrors] = useState([]);
  const [csvImporting, setCsvImporting] = useState(false);
  const fileRef = useRef(null);

  const fetchBooks = useCallback(async () => {
    setLoading(true);
    const params = search ? `?search=${encodeURIComponent(search)}` : '';
    const res = await apiFetch(`/api/books${params}`);
    if (res?.ok) setBooks(await res.json());
    setLoading(false);
  }, [search]);

  useEffect(() => { fetchBooks(); }, [fetchBooks]);

  function openAdd() { setEditing(null); setForm(EMPTY_FORM); setError(''); setModal(true); }
  function openEdit(book) {
    setEditing(book);
    setForm({ title: book.title, author: book.author, isbn: book.isbn, genre: book.genre || '', total_copies: book.total_copies });
    setError(''); setModal(true);
  }

  async function handleSave() {
    if (!form.title || !form.author || !form.isbn) { setError('Title, author and ISBN are required.'); return; }
    setSaving(true); setError('');
    const method = editing ? 'PUT' : 'POST';
    const path = editing ? `/api/books/${editing.id}` : '/api/books';
    const res = await apiFetch(path, { method, body: JSON.stringify(form) });
    const data = await res.json();
    if (!res.ok) setError(data.error || 'Failed to save.');
    else { setModal(false); fetchBooks(); }
    setSaving(false);
  }

  async function handleDelete(id) {
    const res = await apiFetch(`/api/books/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) alert(data.error);
    else fetchBooks();
    setDeleteConfirm(null);
  }

  // --- CSV Import ---
  function parseCSV(text) {
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g, '_'));
    return lines.slice(1).map((line, i) => {
      const vals = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      const row = {};
      headers.forEach((h, j) => { row[h] = vals[j] || ''; });
      row._line = i + 2;
      return row;
    });
  }

  function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const rows = parseCSV(ev.target.result);
      const errors = [];
      rows.forEach(r => {
        if (!r.title) errors.push(`Line ${r._line}: missing title`);
        if (!r.author) errors.push(`Line ${r._line}: missing author`);
        if (!r.isbn) errors.push(`Line ${r._line}: missing isbn`);
      });
      setCsvRows(rows);
      setCsvErrors(errors);
      setCsvModal(true);
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  async function handleCsvImport() {
    if (csvErrors.length > 0) return;
    setCsvImporting(true);
    const results = [];
    for (const row of csvRows) {
      const res = await apiFetch('/api/books', {
        method: 'POST',
        body: JSON.stringify({
          title: row.title, author: row.author, isbn: row.isbn,
          genre: row.genre || null,
          total_copies: Number(row.total_copies) || 1,
        }),
      });
      const data = await res.json();
      results.push({ row, ok: res.ok, msg: data.error || data.message });
    }
    setCsvImporting(false);
    setCsvModal(false);
    fetchBooks();
    const failed = results.filter(r => !r.ok);
    if (failed.length) alert(`${failed.length} row(s) failed:\n${failed.map(f => `${f.row.title}: ${f.msg}`).join('\n')}`);
  }

  function stockBadge(book) {
    if (book.available_copies === 0) return <span className="badge badge-danger">Out of Stock</span>;
    if (book.available_copies <= 2)  return <span className="badge badge-warning">Low Stock</span>;
    return <span className="badge badge-success">In Stock</span>;
  }

  return (
    <ProtectedLayout title="Books">
      <div className="table-card">
        <div className="table-header">
          <h3>All Books</h3>
          <div className="table-actions">
            <div className="table-search">
              <Search size={15} className="search-icon" />
              <input placeholder="Search books…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            {isAdmin && (
              <>
                <input ref={fileRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={handleFileChange} />
                <button className="btn btn-outline btn-sm" onClick={() => fileRef.current.click()}>
                  <Upload size={15} /> Import CSV
                </button>
              </>
            )}
            <button className="btn btn-primary btn-sm" onClick={openAdd}>
              <Plus size={15} /> Add Book
            </button>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Title</th><th>Author</th><th>ISBN</th><th>Genre</th>
                <th>Total</th><th>Available</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading…</td></tr>
              ) : books.length === 0 ? (
                <tr><td colSpan={8}><div className="empty-state"><BookOpen size={40} /><h3>No books found</h3></div></td></tr>
              ) : books.map(book => (
                <tr key={book.id}>
                  <td><strong>{book.title}</strong></td>
                  <td>{book.author}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}>{book.isbn}</td>
                  <td>{book.genre ? <span className="badge badge-info">{book.genre}</span> : '—'}</td>
                  <td>{book.total_copies}</td>
                  <td><strong>{book.available_copies}</strong></td>
                  <td>{stockBadge(book)}</td>
                  <td>
                    <div className="action-btns">
                      <button className="action-btn edit" title="Edit" onClick={() => openEdit(book)}><Pencil size={14} /></button>
                      {isAdmin && (
                        <button className="action-btn delete" title="Delete" onClick={() => setDeleteConfirm(book)}><Trash2 size={14} /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="table-footer">
          <span>Showing {books.length} book{books.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Add / Edit Modal */}
      <Modal isOpen={modal} onClose={() => setModal(false)} title={editing ? 'Edit Book' : 'Add New Book'}
        footer={<><button className="btn btn-outline" onClick={() => setModal(false)}>Cancel</button><button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save Book'}</button></>}>
        {error && <div style={{ color: 'var(--danger)', marginBottom: 14, fontSize: '0.875rem' }}>{error}</div>}
        <div className="form-group"><label>Book Title *</label><input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Enter book title" /></div>
        <div className="form-row">
          <div className="form-group"><label>Author *</label><input value={form.author} onChange={e => setForm(f => ({ ...f, author: e.target.value }))} placeholder="Author name" /></div>
          <div className="form-group"><label>ISBN *</label><input value={form.isbn} onChange={e => setForm(f => ({ ...f, isbn: e.target.value }))} placeholder="978-XXXXXXXXXX" /></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label>Genre</label><select value={form.genre} onChange={e => setForm(f => ({ ...f, genre: e.target.value }))}><option value="">Select genre</option>{GENRES.map(g => <option key={g} value={g}>{g}</option>)}</select></div>
          <div className="form-group"><label>Total Copies</label><input type="number" min="1" value={form.total_copies} onChange={e => setForm(f => ({ ...f, total_copies: Number(e.target.value) }))} /></div>
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Delete Book"
        footer={<><button className="btn btn-outline" onClick={() => setDeleteConfirm(null)}>Cancel</button><button className="btn btn-danger" onClick={() => handleDelete(deleteConfirm.id)}>Delete</button></>}>
        <p style={{ color: 'var(--text-secondary)' }}>Are you sure you want to delete <strong>{deleteConfirm?.title}</strong>? This cannot be undone.</p>
      </Modal>

      {/* CSV Import Preview */}
      <Modal isOpen={csvModal} onClose={() => setCsvModal(false)} title={`Import Books — ${csvRows.length} row(s) found`}
        footer={<><button className="btn btn-outline" onClick={() => setCsvModal(false)}>Cancel</button><button className="btn btn-primary" onClick={handleCsvImport} disabled={csvImporting || csvErrors.length > 0}>{csvImporting ? 'Importing…' : `Import ${csvRows.length} Books`}</button></>}>
        {csvErrors.length > 0 && (
          <div style={{ background: 'var(--danger-bg)', border: '1px solid #fca5a5', borderRadius: 'var(--radius-sm)', padding: '10px 14px', marginBottom: 14 }}>
            <strong style={{ color: 'var(--danger)', fontSize: '0.875rem' }}>Fix errors before importing:</strong>
            <ul style={{ margin: '6px 0 0 16px', fontSize: '0.8125rem', color: 'var(--danger)' }}>
              {csvErrors.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          </div>
        )}
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: 12 }}>
          Expected columns: <code>title, author, isbn, genre, total_copies</code>
        </p>
        <div style={{ overflowX: 'auto', maxHeight: 280, overflowY: 'auto' }}>
          <table className="data-table">
            <thead><tr><th>Title</th><th>Author</th><th>ISBN</th><th>Genre</th><th>Copies</th></tr></thead>
            <tbody>
              {csvRows.slice(0, 20).map((r, i) => (
                <tr key={i}><td>{r.title}</td><td>{r.author}</td><td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{r.isbn}</td><td>{r.genre || '—'}</td><td>{r.total_copies || 1}</td></tr>
              ))}
            </tbody>
          </table>
          {csvRows.length > 20 && <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8125rem', marginTop: 8 }}>…and {csvRows.length - 20} more rows</p>}
        </div>
      </Modal>
    </ProtectedLayout>
  );
}
