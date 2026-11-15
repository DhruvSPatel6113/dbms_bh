# Test Suite Implementation Details

## 1. Multi-Tiered Testing Strategy

```mermaid
flowchart TD
    subgraph Tier 1: Unit Tests (server/tests/unit/)
        U1[dates.test.js: Leap years, UTC normalization]
        U2[fineCalculator.test.js: Rate & cost caps]
        U3[isbn.test.js: ISBN-10 & 13 checksums]
        U4[Services: Mocked Prisma tests]
    end

    subgraph Tier 2: Database Tests (server/tests/db/)
        D1[constraints.test.js: Check constraints, FK cascades]
        D2[triggers.test.js: trg_txn_before_issue, locks, avl_copies]
        D3[procedures.test.js: sp_calculate_fines, cursors]
    end

    subgraph Tier 3: Integration Tests (server/tests/integration/)
        I1[api.test.js: Full HTTP cycle via Supertest]
        I2[auth.api.test.js: JWT security and RBAC guards]
        I3[concurrency.api.test.js: Parallel issue requests]
    end

    Tier 1 --> Gate[TDD Quality Gate: scripts/tdd-gate.js]
    Tier 2 --> Gate
    Tier 3 --> Gate
```

## 2. Test Invariants & Isolation
- **Explicit Dates:** Tests never call `new Date()` without parameters or rely on the host machine's wall-clock time. Every timestamp is injected explicitly (`'2024-02-28'`, `'2024-03-01'`) to ensure deterministic results across leap years and timezones.
- **Transactional Truncation:** Database tests use `tests/helpers/testDb.js` to truncate tables between test suites, guaranteeing zero state leakage.
- **In-Band Execution:** Jest executes with `--runInBand` so database transactions do not encounter concurrent deadlocks or race conditions on the test schema.

