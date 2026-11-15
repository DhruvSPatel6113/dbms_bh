# Views and Indexes Migration Directory (`20261104_views_indexes/`)

## 1. Directory Purpose & Scope
This migration adds specialized analytical database views (`v_overdue_loans`, `v_member_outstanding_fines`, `v_license_status`) and targeted composite and partial performance indexes to accelerate query execution in high-throughput circulation loops.

## 2. Directory Contents
- `migration.sql`: SQL DDL defining the views and indexes.
- `readme.md`: Scope and index/view inventory.
- `implementation.md`: Query execution plan enhancements, index selectivity, and view logic.

