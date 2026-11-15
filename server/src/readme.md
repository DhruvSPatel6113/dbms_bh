# Server Source Code Directory (`server/src/`)

## 1. Directory Purpose & Scope
This directory is the root of the backend runtime source code. It organizes the Express application bootstrap, server listening lifecycle, configuration modules, routing endpoints, controllers, business services, middlewares, request validators, and computational utility routines.

## 2. Directory Contents
```
server/src/
|-- app.js                  # Express application instantiation, security middlewares, routing, and error handling
|-- server.js               # Database connection bootstrap and TCP port listener
|-- readme.md               # Source code scope and directory layout
|-- implementation.md       # Architectural patterns, separation of concerns, and error lifecycle
|-- config/                 # Environment variables and Prisma database client
|-- routes/                 # REST routing hierarchy
|-- controllers/            # HTTP request/response handlers
|-- services/               # Transactional business rules and external integrations
|-- middlewares/            # Authentication, RBAC, input validation, and global error handling
|-- validators/             # Zod validation schemas
`-- utils/                  # Date utilities, fine calculators, ISBN validators, AppError, DB error mappers
```

