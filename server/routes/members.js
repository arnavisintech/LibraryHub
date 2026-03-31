const express = require('express');
const db = require('../db/database');

const router = express.Router();

router.get('/', (req, res) => {
    const { search, active } = req.query;
    let query = 'SELECT * FROM members WHERE 1=1';
    const params = [];

    if (search) {
        query += ' AND (name LIKE ? OR email LIKE ? OR member_id LIKE ?)';
        const s = `%${search}%`;
        params.push(s, s, s);
    }

    if (active !== undefined) {
        query += ' AND is_active = ?';
        params.push(active === 'true' ? 1 : 0);
    }

    query += ' ORDER BY name ASC';
    res.json(db.prepare(query).all(...params));
});

router.get('/:id', (req, res) => {
    const member = db.prepare('SELECT * FROM members WHERE id = ?').get(req.params.id);
    if (!member) return res.status(404).json({ error: 'Member not found' });

    const borrowingHistory = db.prepare(`
        SELECT i.*, b.title as book_title, b.author as book_author
        FROM issues i JOIN books b ON i.book_id = b.id
        WHERE i.member_id = ? ORDER BY i.issue_date DESC
    `).all(req.params.id);

    res.json({ ...member, borrowing_history: borrowingHistory });
});

router.post('/', (req, res) => {
    const { member_id, name, email, phone } = req.body;

    if (!member_id || !name) {
        return res.status(400).json({ error: 'Member ID and name are required.' });
    }

    try {
        const result = db.prepare(
            'INSERT INTO members (member_id, name, email, phone) VALUES (?, ?, ?, ?)'
        ).run(member_id, name, email || null, phone || null);

        res.status(201).json({ id: result.lastInsertRowid, message: 'Member added successfully' });
    } catch (err) {
        if (err.message.includes('UNIQUE constraint')) {
            return res.status(409).json({ error: 'A member with this ID already exists.' });
        }
        res.status(500).json({ error: err.message });
    }
});

router.put('/:id', (req, res) => {
    const member = db.prepare('SELECT * FROM members WHERE id = ?').get(req.params.id);
    if (!member) return res.status(404).json({ error: 'Member not found' });

    const { name, email, phone, is_active } = req.body;

    db.prepare(
        'UPDATE members SET name = ?, email = ?, phone = ?, is_active = ? WHERE id = ?'
    ).run(
        name || member.name,
        email !== undefined ? email : member.email,
        phone !== undefined ? phone : member.phone,
        is_active !== undefined ? (is_active ? 1 : 0) : member.is_active,
        req.params.id
    );

    res.json({ message: 'Member updated successfully' });
});

router.delete('/:id', (req, res) => {
    const member = db.prepare('SELECT * FROM members WHERE id = ?').get(req.params.id);
    if (!member) return res.status(404).json({ error: 'Member not found' });

    const activeIssues = db.prepare("SELECT COUNT(*) as count FROM issues WHERE member_id = ? AND status != 'returned'").get(req.params.id);
    if (activeIssues.count > 0) {
        return res.status(400).json({ error: 'Cannot deactivate a member with active issues.' });
    }

    db.prepare('UPDATE members SET is_active = 0 WHERE id = ?').run(req.params.id);
    res.json({ message: 'Member deactivated successfully' });
});

module.exports = router;
