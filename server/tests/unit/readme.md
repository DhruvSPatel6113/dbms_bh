# Unit Tests Directory (`server/tests/unit/`)

## 1. Directory Purpose & Scope
This directory contains deterministic unit tests targeting algorithmic edge cases, date manipulation, leap-year calculations across century boundaries, fine calculation formulas and caps, ISBN-10/13 checksum verifications, and isolated service business rules.

## 2. Directory Contents
- `utils.dates.test.js`: Gregorian calendar leap-year edge cases, UTC midnight normalization, day delta tests.
- `utils.fineCalculator.test.js`: Fine rate applications, replacement cost caps, fractional values, and invalid input guards.
- `utils.isbn.test.js`: Validations for ISBN-10 (with 'X'), ISBN-13, hyphenated strings, and checksum failures.
- `book.service.test.js`: Book creation validations, duplicate ISBN guards, and copy count protections.
- `googleBooks.service.test.js`: Mocked API requests, cache verification, and timeout fallbacks.
- `software.service.test.js`: License lifecycle categorizations and dealer cascades.
- `readme.md`: Scope and inventory.
- `implementation.md`: Test cases, expected results, and coverage boundaries.

