# Database Engine Tests Directory (`server/tests/db/`)

## 1. Directory Purpose & Scope
This directory contains direct integration tests against the live PostgreSQL 16 database instance (`library_test`). It directly asserts against schema check constraints, foreign key restrictions, PL/pgSQL triggers (`trg_txn_before_issue`, `trg_txn_before_return`, `trg_book_guard`), stored procedures with explicit cursors (`sp_calculate_fines`, `sp_generate_defaulter_report`), and pessimistic locking behaviors.

## 2. Directory Contents
- `constraints.test.js`: Validates check constraints, composite partial unique indexes, and referential integrity.
- `triggers.test.js`: Validates stock mutations, concurrent issue serialization, membership rules, and copy guard triggers.
- `procedures.test.js`: Validates fine calculations, calendar leap-year edge cases, cost caps, idempotency, and cursor batch reports.
- `readme.md`: Scope and test mapping.
- `implementation.md`: Test matrices, procedural assertion logic, and concurrency simulation.

