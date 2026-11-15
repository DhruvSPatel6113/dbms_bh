# Transaction Default Status Migration (`20261105_txn_default_status/`)

## Purpose
Align the database transaction status column with the Prisma model and allow new loan rows to omit a status explicitly.

## Files
- `migration.sql`: Sets the `txn.status` database default to `Issued`.
- `readme.md`: Migration scope and file map.
- `implementation.md`: Behavior and compatibility details.
