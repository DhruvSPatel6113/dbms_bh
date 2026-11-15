# Server Backend Implementation Architecture

## 1. Request Lifecycle & Layered Clean Architecture

The server adopts a strict four-layer separation of concerns:

```
[ HTTP Request ]
       |
       v
+--------------------------------------------------------------+
| 1. Middleware Layer                                          |
|    - helmet (Security headers)                               |
|    - cors (Cross-origin access control)                      |
|    - express.json({ limit: '1mb' }) (Payload sanitization)   |
|    - auth (JWT extraction and verification)                  |
|    - roleGuard (Librarian / Admin RBAC enforcement)          |
|    - validate(schema) (Zod schema validation & strip)        |
+------------------------------+-------------------------------+
                               |
                               v
+--------------------------------------------------------------+
| 2. Controller Layer (src/controllers/)                       |
|    - Unpacks validated req.params, req.query, req.body       |
|    - Strictly no business algorithms or direct calculations  |
|    - Delegates to Service Layer and formats HTTP status      |
+------------------------------+-------------------------------+
                               |
                               v
+--------------------------------------------------------------+
| 3. Service Layer (src/services/)                             |
|    - Orchestrates business workflows and domain operations   |
|    - Encapsulates external API calls (e.g. Google Books)     |
|    - Intercepts database custom error codes (P0001)          |
|    - Re-throws normalized domain AppErrors                   |
+------------------------------+-------------------------------+
                               |
                               v
+--------------------------------------------------------------+
| 4. Data Layer (src/config/db.js & Prisma Client)             |
|    - Executes typed ORM queries (prisma.book.findMany, etc.) |
|    - Dispatches raw SQL for triggers, cursors & procedures   |
|    - Commits or rolls back PostgreSQL transactions           |
+--------------------------------------------------------------+
```

## 2. Core Operational Patterns

### 2.1 Database Error Interception Protocol
When a database trigger rejects an operation via `RAISE EXCEPTION '<TOKEN>' USING ERRCODE='P0001'`, Prisma catches it as a `PrismaClientKnownRequestError` with code `P2010` (raw query failure) or wrapped message. The utility `server/src/utils/dbErrors.js` unpacks this error:
```javascript
if (error.message.includes('NO_COPIES_AVAILABLE')) {
  throw new AppError('No copies available for issue', 409, 'NO_COPIES_AVAILABLE');
}
if (error.message.includes('MEMBERSHIP_EXPIRED')) {
  throw new AppError('Member renewal date has lapsed', 422, 'MEMBERSHIP_EXPIRED');
}
```

### 2.2 Strict TDD Gate Quality Loop
Before merging or deploying, the server relies on `server/scripts/tdd-gate.js`. The gate ensures:
1. Every test suite runs `--runInBand` against an isolated PostgreSQL instance (`library_test`).
2. Only failed tests are re-run on retry.
3. Tests that fail initially and pass upon retry are flagged as `FLAKY`.
4. The gate process exits with code `1` if any test fails, if flaky count exceeds `GATE_MAX_FLAKY`, or if total tests are below `GATE_MIN_TESTS` (150).

