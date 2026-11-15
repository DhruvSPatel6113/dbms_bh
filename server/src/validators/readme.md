# Validators Directory (`server/src/validators/`)

## 1. Directory Purpose & Scope
This directory contains declarative input validation schemas built with the **Zod** library. These schemas validate, parse, coerce, and sanitize incoming HTTP request payloads and query strings prior to reaching controllers and services.

## 2. Directory Contents
- `auth.schema.js`: Validation for login, public signup, and self-service profile updates.
- `book.schema.js`: Book creation, updates, and catalog query parameter schemas.
- `member.schema.js`: Member registration, tier assignments, and renewal schemas.
- `txn.schema.js`: Issue, return, and loan extension payloads.
- `fine.schema.js`: Fine calculation parameters, payment confirmation, and waiving reasons.
- `staff.schema.js`: Staff creation and shift assignments.
- `dealer.schema.js`: Vendor contact information schemas.
- `software.schema.js`: License seat counts and expiration format schemas.
- `readme.md`: Scope and schema inventory.
- `implementation.md`: Coercion logic, regex patterns, and validation rules.
