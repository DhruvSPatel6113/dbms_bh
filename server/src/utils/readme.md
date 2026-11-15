# Utilities Directory (`server/src/utils/`)

## 1. Directory Purpose & Scope
This directory contains deterministic helper modules, calculation engines, date manipulation functions, checksum validators, custom error definitions, and database error mapping translation routines.

## 2. Directory Contents
- `dates.js`: UTC date normalizer, day difference calculator, and Gregorian leap-year evaluator.
- `fineCalculator.js`: Overdue fine calculator enforcing daily rates and replacement cost caps.
- `isbn.js`: Checksum verification algorithms for ISBN-10 and ISBN-13.
- `AppError.js`: Extended Error class encapsulating HTTP status codes and error codes.
- `dbErrors.js`: Translation layer mapping PostgreSQL trigger errors (code `P0001`) and Prisma exceptions to `AppError`.
- `readme.md`: Scope and utility inventory.
- `implementation.md`: Mathematical formulations, checksum algorithms, and translation logic.

