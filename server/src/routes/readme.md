# API Routes Directory (`server/src/routes/`)

## 1. Directory Purpose & Scope
This directory defines the HTTP routing surface of the Express application. It binds URI endpoints to specific middleware stacks (JWT authentication, Role-Based Access Control guards, and Zod request body/query validation) and delegates execution to thin HTTP controllers.

## 2. Directory Contents
- `index.js`: Primary router aggregating all sub-routes under the `/api` namespace.
- `auth.routes.js`: Staff sign-in, librarian registration, and authenticated profile routes.
- `book.routes.js`: Book inventory management, search, and Google Books lookup (`/api/books`).
- `member.routes.js`: Member registrations, status updates, and renewals (`/api/members`).
- `txn.routes.js`: Circulation operations: issue, return, renew, overdue queries (`/api/txns`).
- `fine.routes.js`: Fine assessments, payments, and waiving (`/api/fines`).
- `staff.routes.js`: Staff roster and credential management (`/api/staff`).
- `dealer.routes.js`: Software dealer and vendor management (`/api/dealers`).
- `software.routes.js`: Software licenses and expiration alerting (`/api/software`).
- `report.routes.js`: Reporting and cursor-driven analytics (`/api/reports`).
- `readme.md`: Scope and route map.
- `implementation.md`: Route endpoint tables, HTTP methods, and middleware ordering.
