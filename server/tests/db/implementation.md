# Database Tests Implementation Details

## 1. Test Architecture & Assertions

### 1.1 Trigger Validation Suite (`triggers.test.js`)
Asserts that the database layer strictly enforces business rules independently of application code:
- **Available Copies Decrement:** Asserts that successful inserts into `txn` atomically decrement `book.avl_copies` by 1.
- **Stock Depletion Rejection:** Asserts that issuing with $avl\_copies = 0$ raises `NO_COPIES_AVAILABLE` and rolls back the transaction.
- **Membership Expiry Guard:** Asserts that an issue request with $renew\_date < issue\_date$ raises `MEMBERSHIP_EXPIRED`.
- **Borrowing Limit Enforcement:** Asserts Student members are capped at 3 active loans (`LOAN_LIMIT_REACHED`).

### 1.2 Cursor Stored Procedure Suite (`procedures.test.js`)
- Evaluates `sp_calculate_fines` across leap days (`2024-02-28` to `2024-03-01`) and non-leap years (`2023-02-28` to `2023-03-01`).
- Asserts idempotency: running `sp_calculate_fines` twice on the exact same date yields identical fine amounts and avoids row duplication.
- Asserts that Paid and Waived fines are excluded from fine amount recalculations.

