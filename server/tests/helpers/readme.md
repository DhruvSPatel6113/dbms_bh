# Test Helpers Directory (`server/tests/helpers/`)

## 1. Directory Purpose & Scope
This directory provides reusable testing harnesses, database truncation hooks, global setup routines, deterministic record factories, and synthetic JWT token generators used across unit, database, and integration tests.

## 2. Directory Contents
- `globalSetup.js`: Resets and migrates `library_test` before Jest starts running suites.
- `testDb.js`: Truncation utility and database connection teardown.
- `factories.js`: Programmatic factories for generating valid books, members, staff, and dealers.
- `tokens.js`: Generates valid JWT bearer tokens for 'Admin' and 'Librarian' roles.
- `readme.md`: Scope and helper inventory.
- `implementation.md`: Factory generation algorithms, teardown patterns, and token signing mechanics.

