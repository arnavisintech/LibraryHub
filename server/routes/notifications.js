const express = require('express');
const db = require('../db/database');
const requireAdmin = require('../middleware/requireAdmin');

const router = express.Router();

// GET active notifications — all authenticated users
router.get('/active', (req, res) => {
  res.json(db.prepare(`
    SELECT * FROM notifications
    WHERE is_active = 1 AND (expires_at IS NULL OR expires_at >= DATE('now'))
    ORDER BY created_at DESC
  `).all());
});

// GET all notifications — admin only
router.get('/', requireAdmin, (req, res) => {
  res.json(db.prepare(`
    SELECT n.*, u.username as created_by_name FROM notifications n
    JOIN users u ON n.created_by = u.id
    ORDER BY n.created_at DESC
  `).all());
});

// POST create notification — admin only
router.post('/', requireAdmin, (req, res) => {
  const { message, type, expires_at } = req.body;
  if (!message) return res.status(400).json({ error: 'Message is required.' });
  const validType = (type === 'important') ? 'important' : 'normal';

  const result = db.prepare(
    'INSERT INTO notifications (message, type, is_active, created_by, expires_at) VALUES (?, ?, 1, ?, ?)'
  ).run(message, validType, req.user.id, expires_at || null);

  res.status(201).json({ id: result.lastInsertRowid, message: 'Notification created.' });
});

// PUT toggle active — admin only
router.put('/:id/toggle', requireAdmin, (req, res) => {
  const n = db.prepare('SELECT * FROM notifications WHERE id = ?').get(req.params.id);
  if (!n) return res.status(404).json({ error: 'Notification not found.' });
  db.prepare('UPDATE notifications SET is_active = ? WHERE id = ?').run(n.is_active ? 0 : 1, req.params.id);
  res.json({ message: 'Notification updated.' });
});

// DELETE — admin only
router.delete('/:id', requireAdmin, (req, res) => {
  const n = db.prepare('SELECT * FROM notifications WHERE id = ?').get(req.params.id);
  if (!n) return res.status(404).json({ error: 'Notification not found.' });
  db.prepare('DELETE FROM notifications WHERE id = ?').run(req.params.id);
  res.json({ message: 'Notification deleted.' });
});

module.exports = router;
