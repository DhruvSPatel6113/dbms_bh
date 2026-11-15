# Configuration Implementation Details

## 1. Environment Parsing & Validation Logic (`env.js`)
- Employs **Zod** to validate environment variables at process bootstrap.
- Fails fast and logs structured formatting errors if any required parameter (such as `DATABASE_URL` or `JWT_SECRET`) is missing or malformed, preventing silent runtime failures in deep application branches.

## 2. Dynamic Connection Management (`db.js`)
- Evaluates `NODE_ENV`:
  - When `NODE_ENV === 'test'`, sets datasource URL to `TEST_DATABASE_URL` (connecting to `library_test`).
  - In development and production modes, binds to `DATABASE_URL` (connecting to `library_dev`).
- Exports a unified `PrismaClient` singleton instance, preventing connection pool exhaustion from duplicate instantiations across Express controllers or Jest test workers.

