# Initial Migration Directory (`20261101_init/`)

## 1. Directory Purpose & Scope
This migration establishes the baseline relational schema for the Library Management System. It provisions all 7 primary tables (`book`, `member`, `txn`, `fine`, `staff`, `dealer`, `software`), primary keys, unique constraints, foreign keys, and domain check constraints.

## 2. Directory Contents
- `migration.sql`: DDL statements defining tables, relations, and check constraints.
- `readme.md`: Scope and table inventory.
- `implementation.md`: Column-by-column constraints, integrity checks, and index definitions.

