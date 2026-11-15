# Database Migrations Implementation Details

## 1. Migration Execution Mechanics

Prisma applies migrations chronologically using the `_prisma_migrations` internal audit table.

```mermaid
flowchart LR
    M1["20261101_init<br/>(Tables, FKs, Check Constraints)"] --> M2["20261102_triggers<br/>(FOR UPDATE Locks, Triggers)"]
    M2 --> M3["20261103_procedures<br/>(sp_calculate_fines, Cursors)"]
    M3 --> M4["20261104_views_indexes<br/>(Partial Indexes, Views)"]
    M4 --> M5["20261105_txn_default_status<br/>(Default Issued status)"]
    M5 --> M6["20261106_book_guard_error_order<br/>(Specific stock guard errors)"]
```

## 2. Execution Commands
- **Deploy to Target DB:**
  ```bash
  npx prisma migrate deploy
  ```
- **Local Dev Sync:**
  ```bash
  npx prisma migrate dev
  ```
- **Integrity Validation:**
  Every migration runs inside an implicit PostgreSQL DDL transaction (`BEGIN; ... COMMIT;`), ensuring atomicity. If any constraint or trigger syntax fails, the entire migration aborts and rolls back without dirty schema artifacts.
