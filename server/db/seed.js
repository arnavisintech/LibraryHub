const db = require('./database');
const bcrypt = require('bcryptjs');

// Clear existing data
db.exec('DELETE FROM issues');
db.exec('DELETE FROM books');
db.exec('DELETE FROM members');
db.exec('DELETE FROM users');

// Reset auto-increment
db.exec("DELETE FROM sqlite_sequence WHERE name IN ('users','books','members','issues')");

const hashedPassword = bcrypt.hashSync('admin123', 10);
const staffPassword = bcrypt.hashSync('staff123', 10);

const insertUser = db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)');
insertUser.run('admin', hashedPassword, 'admin');
insertUser.run('staff', staffPassword, 'staff');

const insertBook = db.prepare('INSERT INTO books (title, author, isbn, genre, total_copies, available_copies) VALUES (?, ?, ?, ?, ?, ?)');
const books = [
    ['The Great Gatsby', 'F. Scott Fitzgerald', '978-0743273565', 'Fiction', 5, 3],
    ['To Kill a Mockingbird', 'Harper Lee', '978-0061120084', 'Fiction', 4, 2],
    ['1984', 'George Orwell', '978-0451524935', 'Dystopian', 6, 4],
    ['Pride and Prejudice', 'Jane Austen', '978-0141439518', 'Romance', 3, 1],
    ['The Catcher in the Rye', 'J.D. Salinger', '978-0316769488', 'Fiction', 4, 3],
    ['Brave New World', 'Aldous Huxley', '978-0060850524', 'Dystopian', 3, 2],
    ['The Hobbit', 'J.R.R. Tolkien', '978-0547928227', 'Fantasy', 5, 3],
    ['Harry Potter and the Sorcerer\'s Stone', 'J.K. Rowling', '978-0590353427', 'Fantasy', 8, 5],
    ['The Lord of the Rings', 'J.R.R. Tolkien', '978-0618640157', 'Fantasy', 4, 2],
    ['Animal Farm', 'George Orwell', '978-0451526342', 'Satire', 5, 4],
    ['The Alchemist', 'Paulo Coelho', '978-0062315007', 'Philosophy', 3, 2],
    ['Sapiens', 'Yuval Noah Harari', '978-0062316097', 'Non-Fiction', 4, 3],
    ['Educated', 'Tara Westover', '978-0399590504', 'Memoir', 3, 2],
    ['Atomic Habits', 'James Clear', '978-0735211292', 'Self-Help', 6, 4],
    ['Dune', 'Frank Herbert', '978-0441172719', 'Science Fiction', 4, 3],
    ['The Art of War', 'Sun Tzu', '978-1599869773', 'Philosophy', 2, 1],
    ['Crime and Punishment', 'Fyodor Dostoevsky', '978-0486415871', 'Classic', 3, 2],
    ['The Odyssey', 'Homer', '978-0140268867', 'Classic', 3, 3],
    ['Thinking, Fast and Slow', 'Daniel Kahneman', '978-0374533557', 'Psychology', 4, 3],
    ['Steve Jobs', 'Walter Isaacson', '978-1451648539', 'Biography', 3, 2],
];

const insertBooks = db.transaction(() => {
    for (const b of books) insertBook.run(...b);
});
insertBooks();

const insertMember = db.prepare('INSERT INTO members (member_id, name, email, phone, join_date, is_active) VALUES (?, ?, ?, ?, ?, ?)');
const members = [
    ['LIB-001', 'Aarav Sharma', 'aarav@email.com', '9876543210', '2024-01-15', 1],
    ['LIB-002', 'Priya Patel', 'priya@email.com', '9876543211', '2024-02-01', 1],
    ['LIB-003', 'Rohan Gupta', 'rohan@email.com', '9876543212', '2024-02-10', 1],
    ['LIB-004', 'Sneha Reddy', 'sneha@email.com', '9876543213', '2024-03-05', 1],
    ['LIB-005', 'Vikram Singh', 'vikram@email.com', '9876543214', '2024-03-20', 1],
    ['LIB-006', 'Ananya Iyer', 'ananya@email.com', '9876543215', '2024-04-01', 1],
    ['LIB-007', 'Karthik Nair', 'karthik@email.com', '9876543216', '2024-05-12', 1],
    ['LIB-008', 'Meera Joshi', 'meera@email.com', '9876543217', '2024-06-18', 0],
    ['LIB-009', 'Arjun Kumar', 'arjun@email.com', '9876543218', '2025-01-10', 1],
    ['LIB-010', 'Divya Menon', 'divya@email.com', '9876543219', '2025-02-05', 1],
];

const insertMembers = db.transaction(() => {
    for (const m of members) insertMember.run(...m);
});
insertMembers();

const insertIssue = db.prepare('INSERT INTO issues (book_id, member_id, issue_date, due_date, return_date, status) VALUES (?, ?, ?, ?, ?, ?)');

function daysFromNow(days) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
}

const today = new Date().toISOString().split('T')[0];

const issues = [
    [1, 1, daysFromNow(-5), daysFromNow(9), null, 'active'],
    [3, 2, daysFromNow(-3), daysFromNow(11), null, 'active'],
    [7, 5, daysFromNow(-7), daysFromNow(7), null, 'active'],
    [8, 6, daysFromNow(-1), daysFromNow(13), null, 'active'],
    [15, 9, daysFromNow(-2), daysFromNow(12), null, 'active'],
    [4, 3, daysFromNow(-12), daysFromNow(2), null, 'active'],
    [11, 7, daysFromNow(-13), daysFromNow(1), null, 'active'],
    [2, 4, daysFromNow(-20), daysFromNow(-6), null, 'overdue'],
    [9, 1, daysFromNow(-25), daysFromNow(-11), null, 'overdue'],
    [14, 10, daysFromNow(-18), daysFromNow(-4), null, 'overdue'],
    [5, 2, '2024-11-01', '2024-11-15', '2024-11-14', 'returned'],
    [6, 3, '2024-11-10', '2024-11-24', '2024-11-22', 'returned'],
    [10, 4, '2024-12-01', '2024-12-15', '2024-12-13', 'returned'],
    [12, 6, '2025-01-05', '2025-01-19', '2025-01-18', 'returned'],
    [13, 7, '2025-01-10', '2025-01-24', '2025-01-20', 'returned'],
];

const insertIssues = db.transaction(() => {
    for (const i of issues) insertIssue.run(...i);
});
insertIssues();

console.log('✅ Database seeded successfully!');
console.log('   Users: admin/admin123, staff/staff123');
console.log(`   Books: ${books.length}`);
console.log(`   Members: ${members.length}`);
console.log(`   Issues: ${issues.length}`);

db.close();
