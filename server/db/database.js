const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'library.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Core tables
db.prepare(`CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'staff' CHECK(role IN ('admin', 'staff')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`).run();

db.prepare(`CREATE TABLE IF NOT EXISTS books (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  isbn TEXT UNIQUE NOT NULL,
  genre TEXT,
  total_copies INTEGER DEFAULT 1,
  available_copies INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`).run();

db.prepare(`CREATE TABLE IF NOT EXISTS members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  member_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  join_date DATE DEFAULT (DATE('now')),
  is_active INTEGER DEFAULT 1
)`).run();

db.prepare(`CREATE TABLE IF NOT EXISTS issues (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  book_id INTEGER NOT NULL,
  member_id INTEGER NOT NULL,
  issue_date DATE DEFAULT (DATE('now')),
  due_date DATE NOT NULL,
  return_date DATE,
  renewal_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'returned', 'overdue')),
  FOREIGN KEY (book_id) REFERENCES books(id),
  FOREIGN KEY (member_id) REFERENCES members(id)
)`).run();

db.prepare(`CREATE TABLE IF NOT EXISTS fines (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  issue_id INTEGER NOT NULL,
  member_id INTEGER NOT NULL,
  amount REAL NOT NULL,
  paid INTEGER DEFAULT 0,
  paid_date DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (issue_id) REFERENCES issues(id),
  FOREIGN KEY (member_id) REFERENCES members(id)
)`).run();

db.prepare(`CREATE TABLE IF NOT EXISTS reservations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  book_id INTEGER NOT NULL,
  member_id INTEGER NOT NULL,
  reserved_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'fulfilled', 'cancelled')),
  fulfilled_at DATETIME,
  FOREIGN KEY (book_id) REFERENCES books(id),
  FOREIGN KEY (member_id) REFERENCES members(id)
)`).run();

db.prepare(`CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
)`).run();

db.prepare(`CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'normal' CHECK(type IN ('normal', 'important')),
  is_active INTEGER DEFAULT 1,
  created_by INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATE,
  FOREIGN KEY (created_by) REFERENCES users(id)
)`).run();

// Migrate notifications table from old 4-type system to new 2-type system
const notifSchema = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='notifications'").get();
if (notifSchema && notifSchema.sql && notifSchema.sql.includes("'info'")) {
  // Old constraint detected — recreate table with new types
  const oldRows = db.prepare('SELECT * FROM notifications').all();
  db.exec('DROP TABLE notifications');
  db.prepare(`CREATE TABLE notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'normal' CHECK(type IN ('normal', 'important')),
    is_active INTEGER DEFAULT 1,
    created_by INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATE,
    FOREIGN KEY (created_by) REFERENCES users(id)
  )`).run();
  const reinsert = db.prepare('INSERT INTO notifications (id, message, type, is_active, created_by, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?)');
  for (const r of oldRows) {
    const newType = r.type === 'danger' ? 'important' : 'normal';
    reinsert.run(r.id, r.message, newType, r.is_active, r.created_by, r.created_at, r.expires_at);
  }
}

// Migrate: add renewal_count to existing issues table if missing
const issueCols = db.pragma('table_info(issues)').map(c => c.name);
if (!issueCols.includes('renewal_count')) {
  db.prepare('ALTER TABLE issues ADD COLUMN renewal_count INTEGER DEFAULT 0').run();
}

// Seed default admin/staff users if the table is empty
const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
if (userCount.count === 0) {
  const bcrypt = require('bcryptjs');
  const insertUser = db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)');
  insertUser.run('admin', bcrypt.hashSync('admin123', 10), 'admin');
  insertUser.run('staff', bcrypt.hashSync('staff123', 10), 'staff');
}

// Seed default settings if not present
const defaultSettings = [
  ['fine_rate_per_day', '2'],
  ['default_loan_days', '14'],
  ['max_renewals', '2'],
  ['low_stock_threshold', '2'],
];
const upsertSetting = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
for (const [key, value] of defaultSettings) upsertSetting.run(key, value);

module.exports = db;
