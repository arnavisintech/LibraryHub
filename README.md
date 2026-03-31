# LibraryHub — Library Management Dashboard

A full-stack Library Management System with a **Next.js** frontend and **Express** backend.

**Course:** Web Programming (24BCE1947) | VIT Chennai

---

## Project Structure

```
project/
├── client/          # Next.js 16 frontend (port 3001)
│   └── app/
│       ├── login/         # Login page
│       ├── dashboard/     # Dashboard with charts
│       ├── books/         # Books management
│       ├── members/       # Members management
│       ├── issues/        # Issue / Return books
│       ├── components/    # Sidebar, Navbar, Modal, ProtectedLayout
│       ├── context/       # AuthContext (JWT state)
│       └── lib/           # apiFetch helper
└── server/          # Express API (port 3000)
    ├── index.js           # Entry point + auth middleware
    ├── routes/            # auth, books, members, issues
    └── db/                # SQLite database + seeder
```

---

## Prerequisites

- Node.js 18+
- npm

---

## Setup & Running

Open **two terminal windows**.

### Terminal 1 — Backend

```bash
cd server
npm install
```

> **First time only** — seed sample data:
> ```bash
> node db/seed.js
> ```

Then start the server:
```bash
node index.js
```

API running at `http://localhost:3000`

---

### Terminal 2 — Frontend

```bash
cd client
npm install
npm run dev -- --port 3001
```

App running at `http://localhost:3001`

---

## Login Credentials

| Username | Password  | Role  |
|----------|-----------|-------|
| admin    | admin123  | admin |
| staff    | staff123  | staff |

---

## Features

| Page       | URL          | Description                                       |
|------------|--------------|---------------------------------------------------|
| Login      | `/login`     | JWT auth — token stored in localStorage           |
| Dashboard  | `/dashboard` | KPI cards, bar chart (monthly issues), donut chart (genres) |
| Books      | `/books`     | Search, add, edit, delete books                   |
| Members    | `/members`   | Search, add, edit, deactivate members             |
| Issues     | `/issues`    | Issue books, return books, filter by status       |

---

## Tech Stack

| Layer      | Technology                              |
|------------|-----------------------------------------|
| Frontend   | Next.js 16 (App Router), React 19       |
| Charts     | Recharts                                |
| Icons      | Lucide React                            |
| Backend    | Node.js + Express                       |
| Database   | SQLite (better-sqlite3)                 |
| Auth       | JWT (jsonwebtoken) + bcryptjs           |

---

## API Endpoints

| Method     | Endpoint                  | Description              |
|------------|---------------------------|--------------------------|
| POST       | /api/auth/login           | Login, returns JWT       |
| GET        | /api/dashboard/stats      | KPIs + chart data        |
| GET/POST   | /api/books                | List / Add books         |
| PUT/DELETE | /api/books/:id            | Update / Delete book     |
| GET/POST   | /api/members              | List / Add members       |
| PUT/DELETE | /api/members/:id          | Update / Deactivate      |
| GET/POST   | /api/issues               | List / Issue a book      |
| PUT        | /api/issues/:id/return    | Mark returned            |
| GET        | /api/issues/overdue       | List overdue issues      |

---

## Notes

- The backend must be running **before** opening the frontend.
- If the database is corrupted or missing, re-run `node db/seed.js` from the `server/` directory.
- JWT tokens expire after 24 hours. Log in again if redirected to `/login`.
