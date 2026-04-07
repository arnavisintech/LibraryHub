const express = require('express');
const db = require('../db/database');

const router = express.Router();

function getSettings() {
  return db.prepare('SELECT key, value FROM settings').all()
    .reduce((acc, r) => { acc[r.key] = r.value; return acc; }, {});
}

router.get('/', (req, res) => {
  const { paid, member_id } = req.query;
  const settings = getSettings();
  const fineRate = Number(settings.fine_rate_per_day) || 2;

  // First, auto-generate/update fines for currently overdue issues
  db.prepare(`UPDATE issues SET status = 'overdue' WHERE status = 'active' AND due_date < DATE('now')`).run();

  const overdueIssues = db.prepare(`
    SELECT id, member_id, due_date FROM issues
    WHERE status = 'overdue' AND return_date IS NULL
  `).all();

  // Use UTC date string to avoid timezone-induced off-by-one errors
  const todayUTC = new Date().toISOString().split('T')[0];

  for (const issue of overdueIssues) {
    const daysOverdue = Math.max(0, Math.floor((new Date(todayUTC) - new Date(issue.due_date)) / 86400000));
    const amount = daysOverdue * fineRate;
    const existing = db.prepare('SELECT id, paid FROM fines WHERE issue_id = ?').get(issue.id);
    if (existing) {
      // Update amount only if not already paid
      if (!existing.paid) {
        db.prepare('UPDATE fines SET amount = ? WHERE id = ?').run(amount, existing.id);
      }
    } else {
      db.prepare('INSERT INTO fines (issue_id, member_id, amount, paid) VALUES (?, ?, ?, 0)')
        .run(issue.id, issue.member_id, amount);
    }
  }

  // Now query fines
  let query = `
    SELECT f.*, m.name as member_name, m.member_id as member_code,
           b.title as book_title, i.due_date, i.return_date,
           CAST(julianday(COALESCE(i.return_date, DATE('now'))) - julianday(i.due_date) AS INTEGER) as days_overdue
    FROM fines f
    JOIN members m ON f.member_id = m.id
    JOIN issues i ON f.issue_id = i.id
    JOIN books b ON i.book_id = b.id
    WHERE 1=1
  `;
  const params = [];

  if (paid !== undefined) { query += ' AND f.paid = ?'; params.push(paid === 'true' ? 1 : 0); }
  if (member_id) { query += ' AND f.member_id = ?'; params.push(member_id); }

  query += ' ORDER BY f.created_at DESC';
  res.json(db.prepare(query).all(...params));
});

// Mark fine as paid
router.put('/:id/pay', (req, res) => {
  const fine = db.prepare('SELECT * FROM fines WHERE id = ?').get(req.params.id);
  if (!fine) return res.status(404).json({ error: 'Fine not found.' });
  if (fine.paid) return res.status(400).json({ error: 'Fine already paid.' });

  const today = new Date().toISOString().split('T')[0];
  db.prepare('UPDATE fines SET paid = 1, paid_date = ? WHERE id = ?').run(today, req.params.id);
  res.json({ message: 'Fine marked as paid.' });
});

module.exports = router;
