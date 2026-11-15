# Database Migrations Directory (`server/prisma/migrations/`)

## 1. Directory Purpose & Scope
This directory contains chronological, immutable SQL migration scripts managed by Prisma Migrate. The migrations define table creation, relational constraints, concurrency-safe triggers, stored procedures with cursors, views, and performance indexes.

## 2. Directory Contents
```
migrations/
|-- readme.md                               # Scope and migration sequence
|-- implementation.md                       # Migration execution lifecycle and rollback strategy
|-- 20261101_init/                          # Base DDL and table check constraints
|   |-- migration.sql
|   |-- readme.md
|   `-- implementation.md
|-- 20261102_triggers/                      # PL/pgSQL triggers for copy counts & validation
|   |-- migration.sql
|   |-- readme.md
|   `-- implementation.md
|-- 20261103_procedures/                    # Stored procedures & report tables with cursors
|   |-- migration.sql
|   |-- readme.md
|   `-- implementation.md
|-- 20261104_views_indexes/                 # Optimized views and partial indexes
    |-- migration.sql
    |-- readme.md
    `-- implementation.md
|-- 20261105_txn_default_status/            # Default initial transaction status
    |-- migration.sql
    |-- readme.md
    `-- implementation.md
|-- 20261106_book_guard_error_order/        # Prioritize the on-loan stock guard
    |-- migration.sql
    |-- readme.md
    `-- implementation.md
`-- 20261107_membership_revenue_and_domain_guards/
    `-- migration.sql                    # Recorded membership receipts and enum/date guards
```

Membership revenue reporting includes only explicitly recorded registration/renewal amounts from this migration onward. No tier prices or historical receipts are inferred.
