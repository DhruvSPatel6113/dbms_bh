# Server Source Implementation Details

## 1. Application Architecture & Startup Sequence

```mermaid
sequenceDiagram
    autonumber
    participant Main as server.js
    participant Env as config/env.js
    participant DB as config/db.js (Prisma)
    participant App as app.js (Express)
    participant Kernel as Node.js HTTP Server

    Main->>Env: Load and validate environment variables via Zod
    Main->>DB: prisma.$connect()
    DB-->>Main: Connection established to PostgreSQL 16
    Main->>App: Mount security middlewares (helmet, cors, json parser)
    Main->>App: Mount API routes (/api/*)
    Main->>App: Mount Global errorHandler
    Main->>Kernel: app.listen(PORT)
    Kernel-->>Main: Listening on port 4000
```

## 2. Decoupled Architecture (`app.js` vs `server.js`)
- `app.js` exports the raw Express application without calling `app.listen()`. This allows `supertest` in integration tests to bind directly to the Express application object in memory, spinning up ephemeral virtual listeners without occupying network ports or experiencing port collision issues.
- `server.js` acts solely as the runtime bootstrapper, establishing database connections and initiating the TCP listener for production and development environments.

