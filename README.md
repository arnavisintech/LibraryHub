# LibraryHub — Library Management Dashboard

A full-stack Library Management System with a **React 19 + Vite** frontend and **Express** backend.

**Course:** Web Programming (24BCE1947) | VIT Chennai

---

## Project Structure

```
project/
├── client/                # React 19 + Vite frontend (port 3001)
│   └── src/
│       ├── pages/
│       │   ├── auth/            # Login page
│       │   ├── dashboard/       # Dashboard with charts & KPIs
│       │   ├── books/           # Books CRUD
│       │   ├── members/         # Members CRUD + detail view
│       │   ├── issues/          # Issue / Return / Renew books
│       │   ├── fines/           # Fines tracking & payment
│       │   ├── notifications/   # Announcements (admin)
│       │   ├── users/           # User management (admin)
│       │   └── settings/        # System settings (admin)
│       ├── components/
│       │   ├── layout/          # Sidebar, Navbar, ProtectedLayout
│       │   └── ui/              # Modal, AnnouncementBanner
│       ├── context/             # AuthContext, ThemeContext
│       ├── lib/                 # apiFetch helper
│       └── styles/              # Global CSS
└── server/                # Express API (port 3000)
    ├── index.js                 # Entry point, CORS, route mounting
    ├── middleware/               # JWT authentication
    ├── config/                  # Constants (port, JWT secret)
    ├── routes/                  # All API route handlers
    └── db/                      # SQLite database + seeder
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

Admin users have access to Announcements, User Management, and Settings pages.

---

## Features

| Page           | URL               | Description                                                |
|----------------|-------------------|------------------------------------------------------------|
| Login          | `/login`          | JWT auth — token stored in localStorage                    |
| Dashboard      | `/dashboard`      | KPI cards, area chart, bar chart, pie chart, low stock alerts |
| Books          | `/books`          | Search, add, edit, delete books with genre & copy tracking |
| Members        | `/members`        | Search, add, edit, deactivate members                      |
| Member Detail  | `/members/:id`    | Full member profile with borrowing history                 |
| Issue / Return | `/issues`         | Issue books, return books, renew, filter by status         |
| Fines          | `/fines`          | Auto-calculated overdue fines, mark as paid, filter        |
| Announcements  | `/notifications`  | Create & manage library announcements (admin)              |
| Users          | `/users`          | Manage staff & admin accounts (admin)                      |
| Settings       | `/settings`       | Fine rate, loan days, max renewals, low stock threshold (admin) |

---

## Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Frontend   | React 19, Vite 6, React Router 7   |
| Animations | Framer Motion                       |
| Charts     | Recharts                            |
| Icons      | Lucide React                        |
| Backend    | Node.js + Express                   |
| Database   | SQLite (better-sqlite3)             |
| Auth       | JWT (jsonwebtoken) + bcryptjs       |

---

## API Endpoints

| Method | Endpoint                    | Description                    |
|--------|-----------------------------|--------------------------------|
| POST   | `/api/auth/login`           | Login, returns JWT             |
| GET    | `/api/dashboard/stats`      | KPIs + chart data              |
| GET    | `/api/books`                | List books (search, filter)    |
| POST   | `/api/books`                | Add a book                     |
| PUT    | `/api/books/:id`            | Update a book                  |
| DELETE | `/api/books/:id`            | Delete a book                  |
| GET    | `/api/members`              | List members                   |
| POST   | `/api/members`              | Add a member                   |
| GET    | `/api/members/:id`          | Member detail + history        |
| PUT    | `/api/members/:id`          | Update a member                |
| DELETE | `/api/members/:id`          | Deactivate a member            |
| GET    | `/api/issues`               | List issues (filter by status) |
| POST   | `/api/issues`               | Issue a book                   |
| PUT    | `/api/issues/:id/return`    | Return a book                  |
| PUT    | `/api/issues/:id/renew`     | Renew an issue                 |
| GET    | `/api/issues/overdue`       | List overdue issues            |
| GET    | `/api/fines`                | List fines (filter paid/unpaid)|
| PUT    | `/api/fines/:id/pay`        | Mark fine as paid              |
| GET    | `/api/notifications`        | List announcements             |
| POST   | `/api/notifications`        | Create announcement (admin)    |
| PUT    | `/api/notifications/:id`    | Update announcement (admin)    |
| DELETE | `/api/notifications/:id`    | Delete announcement (admin)    |
| GET    | `/api/users`                | List users (admin)             |
| POST   | `/api/users`                | Create user (admin)            |
| PUT    | `/api/users/:id`            | Update user (admin)            |
| DELETE | `/api/users/:id`            | Delete user (admin)            |
| GET    | `/api/settings`             | Get system settings            |
| PUT    | `/api/settings`             | Update settings (admin)        |

---

## Notes

- The backend must be running **before** opening the frontend.
- If the database is corrupted or missing, re-run `node db/seed.js` from the `server/` directory.
- JWT tokens expire after 24 hours. Log in again if redirected to `/login`.
- Light/dark theme toggle is available in the sidebar.

## SCREENS
<img width="1919" height="970" alt="Screenshot 2026-04-07 214819" src="https://github.com/user-attachments/assets/9fa3a1c9-82a9-4d57-ac63-419b48570f03" />
<img width="1919" height="970" alt="Screenshot 2026-04-07 214840" src="https://github.com/user-attachments/assets/e9d7fe1f-8b53-4376-a5e9-4a8208a724cc" />
<img width="1919" height="969" alt="Screenshot 2026-04-07 214847" src="https://github.com/user-attachments/assets/8aeac74d-53b4-4d0e-9d38-e1e05980ceea" />
<img width="1919" height="965" alt="Screenshot 2026-04-07 215013" src="https://github.com/user-attachments/assets/bb0ada75-2a7e-4e41-bfe5-8e1629659ce6" />
<img width="1919" height="969" alt="Screenshot 2026-04-07 215024" src="https://github.com/user-attachments/assets/028d6c1b-93e0-4428-b0de-45c663c155d5" />

<img width="1919" height="969" alt="Screenshot 2<img width="1919" height="971" alt="Screenshot 2026-04-07 215029" src="https://github.com/user-attachments/assets/47cebb0e-91dd-4612-afa5-84169ea48994" />
<img width="1919" height="971" alt="Screenshot 2026-04-07 215029" src="https://github.com/user-attachments/assets/872cfc43-15dc-4309-b76c-649d9ad9c3e3" />
<img width="1919" height="968" alt="Screenshot 2026-04-07 215034" src="https://github.com/user-attachments/assets/78ef4344-8fb4-4cb8-9b52-a392c6a7d679" />
