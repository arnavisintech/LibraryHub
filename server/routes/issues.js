const express = require('express');
const db = require('../db/database');

const router = express.Router();

function getSettings() {
  return db.prepare('SELECT key, value FROM settings').all()
    .reduce((acc, r) => { acc[r.key] = r.value; return acc; }, {});
}

router.get('/', (req, res) => {
  const { status, search } = req.query;
  db.prepare(`UPDATE issues SET status = 'overdue' WHERE status = 'active' AND due_date < DATE('now')`).run();

  let query = `
    SELECT i.*, b.title as book_title, b.author as book_author,
           m.name as member_name, m.member_id as member_code
    FROM issues i
    JOIN books b ON i.book_id = b.id
    JOIN members m ON i.member_id = m.id
    WHERE 1=1
  `;
  const params = [];
  if (status) { query += ' AND i.status = ?'; params.push(status); }
  if (search) { query += ' AND (b.title LIKE ? OR m.name LIKE ?)'; const s = `%${search}%`; params.push(s, s); }
  query += ' ORDER BY i.issue_date DESC';
  res.json(db.prepare(query).all(...params));
});

router.get('/overdue', (req, res) => {
  db.prepare(`UPDATE issues SET status = 'overdue' WHERE status = 'active' AND due_date < DATE('now')`).run();
  res.json(db.prepare(`
    SELECT i.*, b.title as book_title, b.author as book_author,
           m.name as member_name, m.member_id as member_code, m.email as member_email,
           CAST(julianday('now') - julianday(i.due_date) AS INTEGER) as days_overdue
    FROM issues i
    JOIN books b ON i.book_id = b.id
    JOIN members m ON i.member_id = m.id
    WHERE i.status = 'overdue'
    ORDER BY days_overdue DESC
  `).all());
});

router.post('/', (req, res) => {
  const { book_id, member_id, due_days } = req.body;
  if (!book_id || !member_id) return res.status(400).json({ error: 'Book and member are required.' });

  const book = db.prepare('SELECT * FROM books WHERE id = ?').get(book_id);
  if (!book) return res.status(404).json({ error: 'Book not found.' });
  if (book.available_copies <= 0) return res.status(400).json({ error: 'No copies available for this book.' });

  const member = db.prepare('SELECT * FROM members WHERE id = ? AND is_active = 1').get(member_id);
  if (!member) return res.status(404).json({ error: 'Active member not found.' });

  const settings = getSettings();
  const days = due_days || Number(settings.default_loan_days) || 14;
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + days);
  const dueDateStr = dueDate.toISOString().split('T')[0];
  const today = new Date().toISOString().split('T')[0];

  const result = db.transaction(() => {
    const r = db.prepare(
      'INSERT INTO issues (book_id, member_id, issue_date, due_date, status, renewal_count) VALUES (?, ?, ?, ?, ?, 0)'
    ).run(book_id, member_id, today, dueDateStr, 'active');
    db.prepare('UPDATE books SET available_copies = available_copies - 1 WHERE id = ?').run(book_id);
    return r;
  })();

  res.status(201).json({ id: result.lastInsertRowid, message: 'Book issued successfully', due_date: dueDateStr });
});

// Return a book — auto-calculate fine if overdue
router.put('/:id/return', (req, res) => {
  const issue = db.prepare('SELECT * FROM issues WHERE id = ?').get(req.params.id);
  if (!issue) return res.status(404).json({ error: 'Issue record not found.' });
  if (issue.status === 'returned') return res.status(400).json({ error: 'This book has already been returned.' });

  const today = new Date().toISOString().split('T')[0];
  const settings = getSettings();
  const fineRate = Number(settings.fine_rate_per_day) || 2;

  db.transaction(() => {
    db.prepare("UPDATE issues SET status = 'returned', return_date = ? WHERE id = ?").run(today, req.params.id);
    db.prepare('UPDATE books SET available_copies = available_copies + 1 WHERE id = ?').run(issue.book_id);

    // Calculate fine if overdue — use return date for final amount
    const daysOverdue = Math.max(0, Math.floor((new Date(today) - new Date(issue.due_date)) / 86400000));
    if (daysOverdue > 0) {
      const amount = daysOverdue * fineRate;
      const existing = db.prepare('SELECT id, paid FROM fines WHERE issue_id = ?').get(issue.id);
      if (existing) {
        // Update amount to reflect actual return date, unless already paid
        if (!existing.paid) {
          db.prepare('UPDATE fines SET amount = ? WHERE id = ?').run(amount, existing.id);
        }
      } else {
        db.prepare('INSERT INTO fines (issue_id, member_id, amount) VALUES (?, ?, ?)').run(issue.id, issue.member_id, amount);
      }
    }

  })();

  res.json({ message: 'Book returned successfully' });
});

// Renew an issue
router.put('/:id/renew', (req, res) => {
  const issue = db.prepare('SELECT * FROM issues WHERE id = ?').get(req.params.id);
  if (!issue) return res.status(404).json({ error: 'Issue record not found.' });
  if (issue.status === 'returned') return res.status(400).json({ error: 'Cannot renew a returned book.' });

  const settings = getSettings();
  const maxRenewals = Number(settings.max_renewals) || 2;
  const loanDays = Number(settings.default_loan_days) || 14;

  if ((issue.renewal_count || 0) >= maxRenewals) {
    return res.status(400).json({ error: `Maximum renewals (${maxRenewals}) reached.` });
  }

  const newDue = new Date(issue.due_date);
  newDue.setDate(newDue.getDate() + loanDays);
  const newDueStr = newDue.toISOString().split('T')[0];

  db.prepare("UPDATE issues SET due_date = ?, status = 'active', renewal_count = renewal_count + 1 WHERE id = ?")
    .run(newDueStr, req.params.id);

  res.json({ message: 'Issue renewed successfully', new_due_date: newDueStr });
});

module.exports = router;
