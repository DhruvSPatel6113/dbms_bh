# Triggers Migration Directory (`20261102_triggers/`)

## 1. Directory Purpose & Scope
This migration implements all database-level procedural triggers. It enforces active concurrency locks (`FOR UPDATE`), validates business limits on issue transactions, atomically decrements/increments available copies, and prevents inventory drift or illegal manual stock reductions.

## 2. Directory Contents
- `migration.sql`: PL/pgSQL functions (`fn_txn_before_issue`, `fn_txn_before_return`, `fn_txn_after_return`, `fn_book_guard`) and trigger bindings.
- `readme.md`: Scope and trigger definitions.
- `implementation.md`: Step-by-step algorithms, concurrency control, and exception codes.

