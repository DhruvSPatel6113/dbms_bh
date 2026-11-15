# Configuration Directory (`server/src/config/`)

## 1. Directory Purpose & Scope
This directory handles application environment variable ingestion, strict runtime schema parsing via Zod, and singleton database client instantiation (`PrismaClient`).

## 2. Directory Contents
- `env.js`: Environment parser and validator enforcing typed parameters.
- `db.js`: Database client singleton that toggles between development and isolated test databases.
- `readme.md`: Scope and file mapping.
- `implementation.md`: Environment validation logic, dynamic connection routing, and connection pooling.

