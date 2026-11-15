# Client Pages Directory (`client/src/pages/`)

## 1. Directory Purpose & Scope
This directory houses the feature-level view screens composing the Single Page Application. Each page binds to TanStack React Query hooks, provides interactive management tables, models modal workflows, and surfaces real-time feedback for circulation and administrative duties.

## 2. Directory Contents
- `LoginPage.jsx`: Responsive staff sign-in and librarian self-registration with JWT session creation.
- `ProfilePage.jsx`: Staff profile view and self-service profile/password editing.
- `BooksPage.jsx`: Book inventory catalog with live Google Books API auto-fill lookup.
- `MembersPage.jsx`: Member roster with membership tiers, status badges, and 1-year renewal actions.
- `IssueReturnPage.jsx`: Circulation desk with atomic book issue and return workflows and overdue alerts.
- `FinesPage.jsx`: Fine assessments, `sp_calculate_fines` trigger, payment logs, and administrative waivers.
- `StaffPage.jsx`: Staff directory with shift filters (Morning, Evening, Night) and credential management.
- `DealersPage.jsx`: Vendor profile dashboard tracking software packages supplied.
- `SoftwarePage.jsx`: Software license catalog with seat allocations and 30-day expiration alerts.
- `ReportsPage.jsx`: Analytics dashboard displaying cursor-driven defaulter lists, license expirations, and circulation velocity.
- `readme.md`: Scope and pages inventory.
- `implementation.md`: Page lifecycles, mutation side effects, and query cache management.
