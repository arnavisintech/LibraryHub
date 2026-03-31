const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const db = require('./db/database');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'library_dashboard_secret_key_2024';

app.use(cors({ origin: 'http://localhost:3001', credentials: true }));
app.use(express.json());

app.use('/api', (req, res, next) => {
    if (req.path === '/auth/login' || req.path === '/auth/logout') return next();

    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });

    try {
        req.user = jwt.verify(token, JWT_SECRET);
        next();
    } catch (err) {
        return res.status(403).json({ error: 'Invalid or expired token.' });
    }
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/books', require('./routes/books'));
app.use('/api/members', require('./routes/members'));
app.use('/api/issues', require('./routes/issues'));

app.get('/api/dashboard/stats', (req, res) => {
    db.prepare(`UPDATE issues SET status = 'overdue' WHERE status = 'active' AND due_date < DATE('now')`).run();

    const totalBooks = db.prepare('SELECT COUNT(*) as count FROM books').get().count;
    const booksIssued = db.prepare("SELECT COUNT(*) as count FROM issues WHERE status IN ('active', 'overdue')").get().count;
    const overdueBooks = db.prepare("SELECT COUNT(*) as count FROM issues WHERE status = 'overdue'").get().count;
    const totalMembers = db.prepare('SELECT COUNT(*) as count FROM members WHERE is_active = 1').get().count;
    const newMembersMonth = db.prepare(`SELECT COUNT(*) as count FROM members WHERE join_date >= DATE('now', 'start of month') AND is_active = 1`).get().count;

    const monthlyIssues = db.prepare(`
        SELECT strftime('%Y-%m', issue_date) as month, COUNT(*) as count
        FROM issues WHERE issue_date >= DATE('now', '-6 months')
        GROUP BY month ORDER BY month ASC
    `).all();

    const genreDistribution = db.prepare(`
        SELECT b.genre, COUNT(*) as count FROM issues i
        JOIN books b ON i.book_id = b.id WHERE b.genre IS NOT NULL
        GROUP BY b.genre ORDER BY count DESC
    `).all();

    res.json({ totalBooks, booksIssued, overdueBooks, totalMembers, newMembersMonth, monthlyIssues, genreDistribution });
});

app.listen(PORT, () => {
    console.log(`Library Dashboard API running at http://localhost:${PORT}`);
});
