# CI Workflows Implementation Details

## 1. Pipeline Execution Flow & Logic (`ci.yml`)

The `ci.yml` pipeline runs in an ephemeral GitHub Actions Ubuntu virtual environment. Its execution lifecycle is composed of five distinct phases:

1. **Service Provisioning:**
   - Spins up an official `postgres:16` Docker container.
   - Sets environment variables: `POSTGRES_PASSWORD=postgres`, `POSTGRES_DB=library_test`.
   - Binds host port `5432` to container port `5432`.
   - Evaluates PostgreSQL readiness through the health probe command:
     ```bash
     pg_isready -h localhost -p 5432
     ```
   - Retries up to 10 times with 5-second intervals.

2. **Source Code & Toolchain Setup:**
   - Checks out the repository using `actions/checkout@v4`.
   - Initializes Node.js `20.x` LTS runtime via `actions/setup-node@v4`.
   - Caches `npm` modules based on hash of `server/package-lock.json`.

3. **Dependency Installation:**
   - Executes `npm ci` inside the `server/` folder to install verified locked packages without altering `package-lock.json`.

4. **Database Migration Deployment:**
   - Executes `npx prisma migrate deploy`.
   - This sequentially applies all historical SQL migration files:
     - `20261101_init/migration.sql` (Tables & check constraints)
     - `20261102_triggers/migration.sql` (Trigger functions & attachments)
     - `20261103_procedures/migration.sql` (Stored procedures & cursors)
     - `20261104_views_indexes/migration.sql` (Views & partial indexes)

5. **TDD Quality Gate Validation:**
   - Runs `npm run test:gate`, which executes `server/scripts/tdd-gate.js`.
   - Fails the build if:
     - Any test fails across the retry threshold.
     - A test passes on retry but is recorded as flaky (when `GATE_MAX_FLAKY=0`).
     - Total test assertions fall below `GATE_MIN_TESTS` (minimum 150).
     - Any test is skipped or marked as pending.

