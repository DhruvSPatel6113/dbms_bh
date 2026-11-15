# Prisma Database Modeling Directory (`server/prisma/`)

## 1. Directory Purpose & Scope
This directory defines the relational database architecture, schema mappings, database migrations, and deterministic seed datasets using the Prisma ORM toolchain in conjunction with native PostgreSQL 16 extensions.

## 2. Directory Contents
- `schema.prisma`: The declarative schema mapping the exact 7 tables (`Book`, `Member`, `Txn`, `Fine`, `Staff`, `Dealer`, `Software`) to PostgreSQL tables and snake_case column names.
- `seed.js`: Node.js seed script providing 50 books, 20 members, 5 staff, 3 dealers, 6 software packages, and transactional baselines.
- `migrations/`: Sequential migration folders holding raw SQL DDL, check constraints, PL/pgSQL triggers, cursor-based stored procedures, views, and partial indexes.
- `readme.md`: Scope and structural overview.
- `implementation.md`: ORM mapping rules, types, referential constraints, and seeding algorithms.

