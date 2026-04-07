const express = require('express');
const db = require('../db/database');
const requireAdmin = require('../middleware/requireAdmin');

const router = express.Router();

// GET /api/settings — all users can read settings (needed for loan days, max renewals on frontend)
router.get('/', (req, res) => {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  const settings = rows.reduce((acc, r) => { acc[r.key] = r.value; return acc; }, {});
  res.json(settings);
});

// PUT /api/settings — admin only
router.put('/', requireAdmin, (req, res) => {
  const allowed = ['fine_rate_per_day', 'default_loan_days', 'max_renewals', 'low_stock_threshold'];
  const upsert = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');

  const updates = db.transaction(() => {
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        upsert.run(key, String(req.body[key]));
      }
    }
  });
  updates();
  res.json({ message: 'Settings updated successfully' });
});

module.exports = router;
