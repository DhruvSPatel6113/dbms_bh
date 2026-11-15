# Server Scripts Directory (`server/scripts/`)

## 1. Directory Purpose & Scope
This directory contains CLI utilities, build-time automation, quality assurance runners, test database provisioning scripts, and automated batch cron workers for the Library Management System.

## 2. Directory Contents
- `tdd-gate.js`: Strict TDD quality gate runner enforcing 100% test pass rates, minimum assertion counts, and zero tolerated flakiness.
- `reset-test-db.js`: Database provisioning script that drops, creates, and migrates `library_test`.
- `run-nightly-fines.js`: Scheduled worker invoking `sp_calculate_fines` and refreshing defaulter tables.
- `readme.md`: Scope and script inventory.
- `implementation.md`: Execution mechanics, child process handling, retry algorithms, and procedural dispatching.

