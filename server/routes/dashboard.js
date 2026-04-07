const express = require('express');
const db = require('../db/database');

const router = express.Router();

router.get('/stats', (req, res) => {
  db.prepare(`UPDATE issues SET status = 'overdue' WHERE status = 'active' AND due_date < DATE('now')`).run();

  const settings = db.prepare('SELECT key, value FROM settings').all()
    .reduce((acc, r) => { acc[r.key] = r.value; return acc; }, {});
  const lowStockThreshold = Number(settings.low_stock_threshold ?? 2);
  const fineRate = Number(settings.fine_rate_per_day) || 2;

  // Dynamically calculate/update fines for currently overdue issues
  const overdueIssues = db.prepare(`
    SELECT id, member_id, due_date FROM issues
    WHERE status = 'overdue' AND return_date IS NULL
  `).all();
  const todayUTC = new Date().toISOString().split('T')[0];
  for (const issue of overdueIssues) {
    const daysOverdue = Math.max(0, Math.floor((new Date(todayUTC) - new Date(issue.due_date)) / 86400000));
    const amount = daysOverdue * fineRate;
    const existing = db.prepare('SELECT id, paid FROM fines WHERE issue_id = ?').get(issue.id);
    if (existing) {
      if (!existing.paid) {
        db.prepare('UPDATE fines SET amount = ? WHERE id = ?').run(amount, existing.id);
      }
    } else {
      db.prepare('INSERT INTO fines (issue_id, member_id, amount, paid) VALUES (?, ?, ?, 0)')
        .run(issue.id, issue.member_id, amount);
    }
  }

  const totalBooks     = db.prepare('SELECT COUNT(*) as c FROM books').get().c;
  const booksIssued    = db.prepare("SELECT COUNT(*) as c FROM issues WHERE status IN ('active','overdue')").get().c;
  const overdueBooks   = db.prepare("SELECT COUNT(*) as c FROM issues WHERE status = 'overdue'").get().c;
  const totalMembers   = db.prepare('SELECT COUNT(*) as c FROM members WHERE is_active = 1').get().c;
  const newMembersMonth = db.prepare(`SELECT COUNT(*) as c FROM members WHERE join_date >= DATE('now','start of month') AND is_active = 1`).get().c;
  const pendingFines   = db.prepare('SELECT COALESCE(SUM(amount),0) as total FROM fines WHERE paid = 0').get().total;

  const monthlyIssues = db.prepare(`
    SELECT strftime('%Y-%m', issue_date) as month, COUNT(*) as count
    FROM issues WHERE issue_date >= DATE('now','-6 months')
    GROUP BY month ORDER BY month ASC
  `).all();

  const genreDistribution = db.prepare(`
    SELECT b.genre, COUNT(*) as count FROM issues i
    JOIN books b ON i.book_id = b.id WHERE b.genre IS NOT NULL
    GROUP BY b.genre ORDER BY count DESC
  `).all();

  const mostBorrowedBooks = db.prepare(`
    SELECT b.id, b.title, b.author, COUNT(*) as borrow_count
    FROM issues i JOIN books b ON i.book_id = b.id
    GROUP BY i.book_id ORDER BY borrow_count DESC LIMIT 8
  `).all();

  const lowStockBooks = db.prepare(`
    SELECT id, title, author, available_copies, total_copies
    FROM books WHERE available_copies <= ? ORDER BY available_copies ASC LIMIT 10
  `).all(lowStockThreshold);

  res.json({
    totalBooks, booksIssued, overdueBooks, totalMembers, newMembersMonth,
    pendingFines,
    monthlyIssues, genreDistribution, mostBorrowedBooks, lowStockBooks,
  });
});

module.exports = router;
