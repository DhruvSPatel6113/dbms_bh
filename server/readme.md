# Server Backend Directory (`server/`)

## 1. Directory Purpose & Scope
The `server/` directory encapsulates the complete backend application tier for the Library Management System. It houses the Express HTTP server, the Prisma database modeling layer and custom SQL migrations, business logic services, database triggers/procedures, automated integration/unit tests, and operational maintenance scripts.

## 2. Directory Contents & Structure
```
server/
|-- package.json            # Node.js dependencies and script orchestrations
|-- jest.config.js          # Jest runner settings, global setup, and coverage thresholds
|-- .env.example            # Backend environment variable template
|-- readme.md               # Backend scope and directory map
|-- implementation.md       # Backend architecture, request lifecycles, and design patterns
|-- prisma/                 # Prisma schema, seeds, and SQL migration files
|-- scripts/                # TDD gate runner, test database resetter, nightly fine worker
|-- src/                    # Application source code (Express, routes, services, middleware)
`-- tests/                  # Test suites (unit, db triggers/procedures, API integration)
```

## 3. Sub-directory Responsibilities
- `prisma/`: Declarative relational modeling, baseline seeding, and transactional SQL migration scripts.
- `scripts/`: Operational tools including deterministic test DB resetters, gate validation runners, and scheduled tasks.
- `src/`: Layered Node.js/Express application following Clean Architecture principles (routes $\to$ controllers $\to$ services $\to$ database).
- `tests/`: Multi-tiered testing suite covering algorithmic units, database engine constraints/triggers, and end-to-end HTTP API contracts.

## Membership Receipt Reporting
- Registration and renewal accept an optional amount actually collected; only positive amounts are recorded in `membership_payment`.
- The Admin-only monthly financial report combines recorded membership receipts with fines marked Paid. Unpaid fines and inferred membership prices are excluded.
- Existing registrations are not backfilled; reported membership receipts begin when actual amounts are recorded after migration `20261107_membership_revenue_and_domain_guards`.
