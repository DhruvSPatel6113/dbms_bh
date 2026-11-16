# Library Management System: Complete Execution Guide & Blueprint

A robust, enterprise-grade Library Management System designed with **PostgreSQL 16**, **Node.js 20**, **Express**, **Prisma ORM**, **React (Vite)**, **Jest**, and **Supertest**. 

The system enforces relational integrity, concurrency locks (`SELECT ... FOR UPDATE`), transaction-level triggers, stored procedures with flat-memory cursors, and business rules inside the database engine as the primary line of defense, backed by a strict Test-Driven Development (TDD) gate.

---

## 1. System Overview & Architecture

```
                    +------------------------------------+
                    |        React 18 SPA (Vite)         |
                    | TanStack Query, React Router, Axios|
                    +-----------------+------------------+
                                      | HTTPS / JSON (JWT Bearer)
                                      v
                    +------------------------------------+
                    |       Reverse Proxy / Gateway      |
                    |     Rate Limiter, CORS, Helmet     |
                    +-----------------+------------------+
                                      |
                                      v
                    +------------------------------------+
                    |        Express 4 Application       |
                    | Middlewares: auth, roleGuard, zod  |
                    | Controllers -> Services            |
                    | Prisma Client (Typed & Raw SQL)    |
                    +-----------------+------------------+
                                      |
                                      v
+-------------------------------------------------------------------------+
|                              PostgreSQL 16                              |
|-------------------------------------------------------------------------|
| Tables: book, member, txn, fine, staff, dealer, software                |
| Constraints: chk_copies, chk_cost, chk_member_status, uq_active_loan    |
| Triggers:                                                               |
|   - trg_txn_before_issue (Lock, validate status, limit, decr avl_copies)|
|   - trg_txn_before_return & trg_txn_after_return (Validate & incr avl)  |
|   - trg_book_guard (Prevent total < loaned copies)                      |
| Procedures:                                                             |
|   - sp_calculate_fines(p_as_of, p_rate) (Cursor upsert into fine)       |
|   - sp_generate_defaulter_report(p_as_of) (Cursor into report table)    |
|   - sp_pay_fine(p_fine_id, p_paid_date)                                 |
|   - sp_expiry_report(p_days)                                            |
| Views: v_overdue_loans, v_member_outstanding_fines, v_license_status    |
+-------------------------------------------------------------------------+
```

---

## 2. Prerequisites & Environment Setup

### 2.1 Software Requirements
- **Node.js**: `v20.x LTS` or higher
- **npm**: `v10.x` or higher
- **PostgreSQL**: `16.x` (Native or via Docker)
- **Docker & Docker Compose** (Optional, recommended for database containerization)
- **Git**

### 2.2 Environment Configuration Files

#### Root / Server Configuration: `server/.env`
Create `server/.env` based on `server/.env.example`:
```env
PORT=4000
NODE_ENV=development

# Application Database (PostgreSQL 16)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/library_dev?schema=public"

# Isolated Test Database for Jest / Supertest
TEST_DATABASE_URL="postgresql://postgres:postgres@localhost:5432/library_test?schema=public"

# Security
JWT_SECRET="super-secure-jwt-secret-key-32-chars-minimum"
JWT_EXPIRES_IN="8h"

# External APIs
GOOGLE_BOOKS_API_KEY=""

# TDD Gate Tuning
GATE_MAX_ATTEMPTS=3
GATE_MIN_TESTS=150
GATE_MAX_FLAKY=0
```

#### Client Configuration: `client/.env`
Create `client/.env`:
```env
VITE_API_BASE_URL="/api"
```

---

## 3. Step-by-Step Compilation, Setup, and Execution

### Step 1: Clone and Inspect Workspace
```bash
git clone <repository_url>
cd dbmd_bh
```

### Step 2: Provision Database Engine (Docker Compose)
If running PostgreSQL via Docker:
```bash
# Start PostgreSQL 16 container with persistent volume
docker compose up -d db

# Verify the container is running and healthy
docker ps --filter "name=postgres"
```
Or create local databases if running native PostgreSQL:
```bash
psql -U postgres -c "CREATE DATABASE library_dev;"
psql -U postgres -c "CREATE DATABASE library_test;"
```

### Step 3: Install Server & Client Dependencies
```bash
# Install backend packages
cd server
npm install

# Install frontend packages
cd ../client
npm install
cd ..
```

### Step 4: Run Database Migrations & Seeding (Development DB)
```bash
cd server

# Deploy all initial schemas, triggers, procedures, views, and indexes
npx prisma migrate deploy

# Seed initial baseline dataset (50 books, 20 members, 5 staff, 3 dealers, 6 software, sample transactions)
npx prisma db seed
```

### Step 5: Initialize and Reset the Test Database
```bash
# Drops library_test, recreates tables, applies triggers, stored procedures, and test seeds
npm run test:db:reset
```

### Step 6: Execute the Strict TDD Quality Gate
The project relies on a non-negotiable TDD quality gate ensuring 100% green test passes, zero flakiness, and meeting the required test count threshold.
```bash
npm run test:gate
```

### Step 7: Launch the Application Services
Run both backend API and frontend client in development mode:

**Terminal 1 (Backend API on http://localhost:4000):**
```bash
cd server
npm run dev
```

**Terminal 2 (Frontend React SPA on http://localhost:5173):**
```bash
cd client
npm run dev
```

Visit `http://localhost:5173` in your browser. Use default seeded admin credentials:
- **Email:** `alice.admin@library.internal`
- **Password:** `AdminPass123!`

---

## 4. Database Schema: 7 Exact Core Tables

| Table Name | Primary Key | Key Attributes | Mapped Entities & Constraints |
| :--- | :--- | :--- | :--- |
| `book` | `book_id` | `title`, `author`, `isbn`, `category`, `total_copies`, `avl_copies`, `publication`, `date_of_publish`, `cost` | `chk_copies`: $0 \le avl\_copies \le total\_copies$, `chk_cost`: $cost \ge 0$, Unique `isbn` |
| `member` | `member_id` | `full_name`, `email`, `phone`, `join_date`, `renew_date`, `type_of_membership`, `status` | `type_of_membership` IN ('Student', 'Regular', 'Premium'), `status` IN ('Active', 'Suspended', 'Expired'), $renew\_date \ge join\_date$ |
| `txn` | `txn_id` | `book_id`, `member_id`, `issue_date`, `due_date`, `return_date`, `status` | Foreign keys to `book` & `member`. `status` IN ('Issued', 'Returned', 'Overdue'). Partial unique index on active loans. |
| `fine` | `fine_id` | `txn_id`, `member_id`, `fine_amount`, `paid_status`, `reason`, `paid_date` | `txn_id` UNIQUE, `paid_status` IN ('Unpaid', 'Paid', 'Waived'). $fine\_amount \ge 0$ |
| `staff` | `staff_id` | `staff_name`, `email`, `phone_no`, `address`, `shift`, `date_of_joining`, `qualification`, `designation` | `shift` IN ('Morning', 'Evening', 'Night'). Unique email. |
| `dealer` | `dealer_id` | `company_name`, `contact_person`, `contact_num`, `email`, `address` | Supplies software packages. Soft cascade guard on delete. |
| `software` | `software_id` | `software_name`, `version`, `license_type`, `total_license`, `dealer_id`, `expiry_date` | $total\_license > 0$. Foreign key to `dealer`. Expiry tracking. |

---

## 5. Directory Structure & Documentation Map

Every folder in this repository maintains a dedicated `readme.md` (purpose, scope, and file mapping) and `implementation.md` (algorithms, DB queries, code structure):

```
.
|-- README.md                               <-- Main Execution Guide & System Manual
|-- implementation.md                       <-- Root System Architectural Blueprint
|-- docker-compose.yml                      <-- Containerized Postgres 16 environment
|-- .env.example                            <-- Template environment variables
|-- .gitignore                              <-- Local storage & privacy protection
|-- .github/
|   |-- implementation.md                  <-- CI pipeline and automation specification
|   |-- docs/
|   |   `-- readme.md                       <-- GitHub infrastructure directory overview
|   `-- workflows/
|       |-- ci.yml                          <-- GitHub Actions automated CI workflow
|       |-- readme.md & implementation.md
|-- server/
|   |-- readme.md & implementation.md
|   |-- prisma/
|   |   |-- schema.prisma                   <-- Prisma relational modeling
|   |   |-- seed.js                         <-- Deterministic baseline seed data
|   |   |-- readme.md & implementation.md
|   |   `-- migrations/
|   |       |-- readme.md & implementation.md
|   |       |-- 20261101_init/              <-- Initial DDL & check constraints
|   |       |-- 20261102_triggers/          <-- Issue, Return & Copy guard triggers
|   |       |-- 20261103_procedures/        <-- Stored procedures with cursors
|   |       `-- 20261104_views_indexes/     <-- Optimizing views and partial indexes
|   |-- scripts/
|   |   |-- tdd-gate.js                     <-- Strict quality gate runner
|   |   |-- reset-test-db.js                <-- Test DB recreator & migrator
|   |   |-- run-nightly-fines.js            <-- Cron fine calculation runner
|   |   |-- readme.md & implementation.md
|   |-- src/
|   |   |-- app.js & server.js
|   |   |-- readme.md & implementation.md
|   |   |-- config/                         <-- Environment & database connections
|   |   |-- routes/                         <-- REST API routes
|   |   |-- controllers/                    <-- Thin HTTP controllers
|   |   |-- services/                       <-- Core business logic & raw queries
|   |   |-- middlewares/                    <-- Auth, roleGuard, zod validator, errors
|   |   |-- validators/                     <-- Zod schemas for all models
|   |   `-- utils/                          <-- Deterministic dates, fines, ISBN
|   `-- tests/
|       |-- unit/                           <-- Pure algorithmic & unit tests
|       |-- db/                             <-- Triggers, procedures, constraint tests
|       |-- integration/                    <-- Supertest API integration tests
|       `-- helpers/                        <-- Factories, test tokens, DB helpers
`-- client/
    |-- readme.md & implementation.md
    `-- src/
        |-- api/                            <-- Axios HTTP client & API endpoints
        |-- components/                     <-- Reusable UI components & layouts
        |-- pages/                          <-- Feature screens (Books, Txns, etc.)
        `-- hooks/                          <-- React custom hooks & query wrappers
```

---

## 6. Daily Maintenance & Automated Jobs

### Nightly Fine Calculation
Run via scheduler, cron job, or manual trigger:
```bash
cd server
node scripts/run-nightly-fines.js
```
Calculates accumulated fines for all unreturned and overdue transactions using `CALL sp_calculate_fines(CURRENT_DATE, 2)`.
