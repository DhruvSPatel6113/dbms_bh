# Automated Test Suite Directory (`server/tests/`)

## 1. Directory Purpose & Scope
This directory contains the automated test suites guarding the Library Management System. Following strict Test-Driven Development (TDD) conventions, tests validate pure algorithmic calculations, database constraints and PL/pgSQL triggers against a live PostgreSQL 16 test database (`library_test`), and full HTTP API integration flows via Supertest.

## 2. Directory Contents
```
server/tests/
|-- readme.md               # Scope and test structure
|-- implementation.md       # TDD test strategy, isolation, and assertion policies
|-- helpers/                # Test database reset utilities, entity factories, auth tokens
|-- unit/                   # Pure unit tests (dates, fineCalculator, isbn, services)
|-- db/                     # Direct database tests (constraints, triggers, procedures)
`-- integration/            # Supertest HTTP integration test flows
```

## 3. Execution Commands
```bash
# Run entire test suite sequentially
npm test

# Run tests in watch mode
npm run test:watch

# Execute strict TDD quality gate (zero flakiness, >=150 tests)
npm run test:gate
```

