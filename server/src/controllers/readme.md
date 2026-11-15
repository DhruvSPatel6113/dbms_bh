# Controllers Directory (`server/src/controllers/`)

## 1. Directory Purpose & Scope
This directory contains Express HTTP controllers. Adhering strictly to the Thin Controller architectural pattern, these modules handle HTTP extraction, query unpacking, HTTP status selection, and delegation to domain services without housing business calculations or direct SQL queries.

## 2. Directory Contents
- `auth.controller.js`: Sign-in, registration, and profile request mediation.
- `book.controller.js`: Book CRUD operations, queries, and ISBN lookups.
- `member.controller.js`: Member registration, updates, and membership renewals.
- `txn.controller.js`: Book issue, return, loan extension, and overdue transaction listings.
- `fine.controller.js`: Fine assessments, payments, and waiving endpoints.
- `staff.controller.js`: Staff operations and shift querying.
- `dealer.controller.js`: Vendor profile management.
- `software.controller.js`: License allocation and expiring package alerts.
- `report.controller.js`: Batch defaulter, expiry, circulation, and popularity reporting.
- `readme.md`: Scope and controller directory map.
- `implementation.md`: Controller request/response contracts and error routing mechanisms.
