# API Integration Tests Directory (`server/tests/integration/`)

## 1. Directory Purpose & Scope
This directory contains end-to-end HTTP integration tests driven by **Supertest**. These suites simulate real client HTTP requests across all layers: Express security middleware, JWT authentication, Zod input validation, controller mediation, transactional business services, and database trigger execution.

## 2. Directory Contents
- `api.test.js`: Full-stack workflow tests verifying circulation lifecycles, concurrency locks, fine payments, authorization checks, SQL injection resistance, and payload limits.
- `auth.test.js`: Staff registration, password hashing/change, self-profile access, and role-assignment protection.
- `readme.md`: Scope and inventory.
- `implementation.md`: Integration test topologies, assertion patterns, and concurrency race assertions.
