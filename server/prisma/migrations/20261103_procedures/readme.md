# Procedures Migration Directory (`20261103_procedures/`)

## 1. Directory Purpose & Scope
This migration establishes the procedural computation engine and cursor-driven batch reporting infrastructure in PostgreSQL 16. It creates `sp_calculate_fines`, `sp_generate_defaulter_report`, `sp_expiry_report`, `sp_pay_fine`, and corresponding persistent batch reporting tables.

## 2. Directory Contents
- `migration.sql`: PL/pgSQL procedures, cursor definitions, and report tables.
- `readme.md`: Scope and inventory of procedures and reporting tables.
- `implementation.md`: Mathematical algorithms, leap-year calculations, cursor memory optimization, and idempotency guarantees.

