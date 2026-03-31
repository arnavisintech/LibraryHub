const express = require('express');
const db = require('../db/database');

const router = express.Router();

router.get('/', (req, res) => {
    const { search, genre } = req.query;
    let query = 'SELECT * FROM books WHERE 1=1';
    const params = [];

    if (search) {
        query += ' AND (title LIKE ? OR author LIKE ? OR isbn LIKE ?)';
        const s = `%${search}%`;
        params.push(s, s, s);
    }

    if (genre) {
        query += ' AND genre = ?';
        params.push(genre);
    }

    query += ' ORDER BY title ASC';
    res.json(db.prepare(query).all(...params));
});

router.get('/:id', (req, res) => {
    const book = db.prepare('SELECT * FROM books WHERE id = ?').get(req.params.id);
    if (!book) return res.status(404).json({ error: 'Book not found' });
    res.json(book);
});

router.post('/', (req, res) => {
    const { title, author, isbn, genre, total_copies } = req.body;

    if (!title || !author || !isbn) {
        return res.status(400).json({ error: 'Title, author, and ISBN are required.' });
    }

    try {
        const copies = total_copies || 1;
        const result = db.prepare(
            'INSERT INTO books (title, author, isbn, genre, total_copies, available_copies) VALUES (?, ?, ?, ?, ?, ?)'
        ).run(title, author, isbn, genre || null, copies, copies);

        res.status(201).json({ id: result.lastInsertRowid, message: 'Book added successfully' });
    } catch (err) {
        if (err.message.includes('UNIQUE constraint')) {
            return res.status(409).json({ error: 'A book with this ISBN already exists.' });
        }
        res.status(500).json({ error: err.message });
    }
});

router.put('/:id', (req, res) => {
    const { title, author, isbn, genre, total_copies } = req.body;
    const book = db.prepare('SELECT * FROM books WHERE id = ?').get(req.params.id);

    if (!book) return res.status(404).json({ error: 'Book not found' });

    const diff = (total_copies || book.total_copies) - book.total_copies;
    const newAvailable = Math.max(0, book.available_copies + diff);

    try {
        db.prepare(
            'UPDATE books SET title = ?, author = ?, isbn = ?, genre = ?, total_copies = ?, available_copies = ? WHERE id = ?'
        ).run(
            title || book.title,
            author || book.author,
            isbn || book.isbn,
            genre !== undefined ? genre : book.genre,
            total_copies || book.total_copies,
            newAvailable,
            req.params.id
        );

        res.json({ message: 'Book updated successfully' });
    } catch (err) {
        if (err.message.includes('UNIQUE constraint')) {
            return res.status(409).json({ error: 'A book with this ISBN already exists.' });
        }
        res.status(500).json({ error: err.message });
    }
});

router.delete('/:id', (req, res) => {
    const book = db.prepare('SELECT * FROM books WHERE id = ?').get(req.params.id);
    if (!book) return res.status(404).json({ error: 'Book not found' });

    const activeIssues = db.prepare("SELECT COUNT(*) as count FROM issues WHERE book_id = ? AND status != 'returned'").get(req.params.id);
    if (activeIssues.count > 0) {
        return res.status(400).json({ error: 'Cannot delete a book that is currently issued.' });
    }

    db.prepare('DELETE FROM books WHERE id = ?').run(req.params.id);
    res.json({ message: 'Book deleted successfully' });
});

module.exports = router;
