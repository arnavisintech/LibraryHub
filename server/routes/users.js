const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db/database');
const requireAdmin = require('../middleware/requireAdmin');

const router = express.Router();

// All routes in this file require admin role
router.use(requireAdmin);

// GET /api/users — list all users (never return password)
router.get('/', (req, res) => {
    const users = db.prepare(
        'SELECT id, username, role, created_at FROM users ORDER BY created_at ASC'
    ).all();
    res.json(users);
});

// POST /api/users — create a new user
router.post('/', (req, res) => {
    const { username, password, role } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required.' });
    }
    if (!['admin', 'staff'].includes(role)) {
        return res.status(400).json({ error: 'Role must be admin or staff.' });
    }

    try {
        const hashed = bcrypt.hashSync(password, 10);
        const result = db.prepare(
            'INSERT INTO users (username, password, role) VALUES (?, ?, ?)'
        ).run(username, hashed, role);
        res.status(201).json({ id: result.lastInsertRowid, message: 'User created successfully.' });
    } catch (err) {
        if (err.message.includes('UNIQUE constraint')) {
            return res.status(409).json({ error: 'A user with this username already exists.' });
        }
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/users/:id — update username, role, and optionally password
router.put('/:id', (req, res) => {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const { username, role, password } = req.body;

    if (role && !['admin', 'staff'].includes(role)) {
        return res.status(400).json({ error: 'Role must be admin or staff.' });
    }

    try {
        if (password) {
            const hashed = bcrypt.hashSync(password, 10);
            db.prepare(
                'UPDATE users SET username = ?, role = ?, password = ? WHERE id = ?'
            ).run(username || user.username, role || user.role, hashed, req.params.id);
        } else {
            db.prepare(
                'UPDATE users SET username = ?, role = ? WHERE id = ?'
            ).run(username || user.username, role || user.role, req.params.id);
        }
        res.json({ message: 'User updated successfully.' });
    } catch (err) {
        if (err.message.includes('UNIQUE constraint')) {
            return res.status(409).json({ error: 'A user with this username already exists.' });
        }
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/users/:id — delete a user
router.delete('/:id', (req, res) => {
    const targetId = Number(req.params.id);

    // Prevent self-deletion
    if (req.user.id === targetId) {
        return res.status(400).json({ error: 'You cannot delete your own account.' });
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(targetId);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    // Prevent deleting the last admin
    if (user.role === 'admin') {
        const adminCount = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'admin'").get();
        if (adminCount.count <= 1) {
            return res.status(400).json({ error: 'Cannot delete the last admin account.' });
        }
    }

    db.prepare('DELETE FROM users WHERE id = ?').run(targetId);
    res.json({ message: 'User deleted successfully.' });
});

module.exports = router;
