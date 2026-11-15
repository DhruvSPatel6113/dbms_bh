# GitHub Infrastructure Implementation Details

## 1. Automation Architecture & Flow

The repository utilizes GitHub Actions to execute an automated Continuous Integration (CI) loop on every `push` and `pull_request` targeting primary branches (`main`, `master`, `develop`).

```mermaid
flowchart TD
    A[Code Push / PR Event] --> B[Spin up Ubuntu 22.04 Runner]
    B --> C[Provision PostgreSQL 16 Service Container]
    C --> D[Health Check: pg_isready]
    D --> E[Checkout Repository]
    E --> F[Setup Node.js 20 LTS Environment]
    F --> G[Install Server Dependencies: npm ci]
    G --> H[Apply Raw SQL & Prisma Migrations: prisma migrate deploy]
    H --> I[Execute TDD Gate: npm run test:gate]
    I -->|All 150+ Tests Pass & 0 Flaky| J[Build Status: Success (Green)]
    I -->|Any Failure or Flaky Detected| K[Build Status: Failed (Red)]
```

## 2. Infrastructure Specifications
- **Operating System:** Ubuntu 22.04 LTS runner (`ubuntu-latest`)
- **Service Container:** Docker image `postgres:16`
  - Ports: `5432:5432`
  - Environment: `POSTGRES_PASSWORD=postgres`, `POSTGRES_DB=library_test`
  - Health check: `pg_isready -h localhost -p 5432` with 5-second interval and 10 retries
- **Runtime Environment:** Node.js version 20 with package-lock adherence (`npm ci`)
- **Environment Injections:**
  - `DATABASE_URL`: Pointer to the test PostgreSQL instance
  - `TEST_DATABASE_URL`: Explicit connection string for test execution
  - `GATE_MIN_TESTS`: Enforces at least 150 automated assertions
  - `GATE_MAX_FLAKY`: Strictly 0 tolerated flaky tests

