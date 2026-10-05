# DMS – Document Management System (loan documents)

React + Tailwind + Redux Toolkit + axios + socket.io-client  →  Express + JWT + socket.io  →  MySQL

## What works in this first version
- Login with JWT; each role has its own permissions (stored in MySQL, editable in the DB)
- Operators enter loan documents → status **Awaiting approval**
- Admins / Administrators verify: **Approve** or **Reject** (rejection needs a note; the person who entered a document cannot review it)
- Rejected documents can be corrected and resubmitted
- Only **approved** documents can be printed, on an **A4** layout; every print is logged (count + history)
- One-to-one chat with online status, unread counts and typing indicator (socket.io)
- Live notifications (bell) when documents are submitted, approved or rejected
- Fixed top bar (notifications, account details, log out) and a scrollable sidebar with the logo at the top
- Administrator can add users, change roles, and disable accounts

## Roles (seeded)
| Role          | Permissions                                                        |
|---------------|--------------------------------------------------------------------|
| Operator      | document.create, document.print (own), chat.use                    |
| Admin         | document.view_all, document.approve, document.print, chat.use      |
| Administrator | everything, including user.manage                                  |

Sample logins after seeding (password `Password@123`):
`operator@dms.local`, `admin@dms.local`, `administrator@dms.local`

## Run it
### 1. Backend
```bash
cd backend
npm install
cp .env.example .env      # set DB_PASSWORD and a long JWT_SECRET
npm run db:setup          # creates database, tables, roles, sample users
npm run dev               # http://localhost:5000
```
### 2. Frontend
```bash
cd frontend
npm install
cp .env.example .env
npm run dev               # http://localhost:5173
```

## Try the workflow
1. Log in as `operator@dms.local` → **New document** → submit.
2. In another browser (or private window) log in as `admin@dms.local` – the bell lights up instantly.
3. Open the document → **Approve**. The operator is notified live.
4. As the operator, open the document → **Print on A4**.

## Structure
```
backend/
  sql/schema.sql            tables
  src/seed.js               DB setup + roles/permissions/users
  src/middleware/auth.js    JWT check + requirePermission()
  src/routes/               auth, documents, chat, notifications, users
  src/socket.js             socket auth, rooms (user:<id>), presence
frontend/src/
  store/                    auth, documents, notifications, chat slices
  components/               AppLayout, Topbar, Sidebar, tables, badges
  pages/                    Login, Dashboard, DocumentList (+Approvals), DocumentForm,
                            DocumentDetail, DocumentPrint, Chat, Users
```

## Adding a new permission later
1. Insert it into `permissions` and link it in `role_permissions`.
2. Protect the route with `requirePermission('your.code')`.
3. Hide the menu / page on the frontend with the same code (see `Sidebar.jsx`, `Guard` in `App.jsx`).
