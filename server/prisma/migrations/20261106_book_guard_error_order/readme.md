# Book Stock Guard Error Order Migration (`20261106_book_guard_error_order/`)

## Purpose
Ensure attempts to reduce book stock below the number of copies currently on loan produce the specific `TOTAL_BELOW_ON_LOAN` database error.

## Files
- `migration.sql`: Replaces the book stock guard function with correctly prioritized checks.
- `readme.md`: Migration scope and file map.
- `implementation.md`: Guard ordering and behavior.
