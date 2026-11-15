# Services Directory (`server/src/services/`)

## 1. Directory Purpose & Scope
This directory contains the core domain services for the Library Management System. These modules implement business rules, orchestrate multi-step database transactions, execute raw stored procedure calls, interface with external catalog APIs, and normalize database triggers and constraints into friendly domain exceptions.

## 2. Directory Contents
- `auth.service.js`: Staff registration, password verification, profile updates, and JWT generation.
- `book.service.js`: Catalog management, ISBN integrity checks, and copy protection.
- `member.service.js`: Member registration, tier quotas, and leap-year renewals.
- `txn.service.js`: Issue, return, single-renewal extension, and overdue query services.
- `fine.service.js`: Fine assessment through stored procedures, payments, and waiving.
- `staff.service.js`: Staff records and shift filtering.
- `dealer.service.js`: Software dealer relations and cascading integrity protection.
- `software.service.js`: License lifecycle tracking and expiration threshold checks.
- `report.service.js`: Cursor-based batch reporting, circulation summaries, and book popularity.
- `googleBooks.service.js`: Google Books API with in-memory caching and Open Library fallback.
- `readme.md`: Scope and service inventory.
- `implementation.md`: Detailed business algorithms, transactions, and error handling.
