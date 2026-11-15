# Test Helpers Implementation Details

## 1. Helper Logic & Invariants

### 1.1 Programmatic ISBN-13 Generation (`factories.js`)
To prevent unique key conflicts (`book_isbn_key`) when creating dozens of test books, `factories.js` dynamically computes standard Modulo-10 checksums:
```javascript
let sum = 0;
for (let i = 0; i < 12; i++) {
  const digit = Number(base[i]);
  sum += (i % 2 === 0) ? digit : digit * 3;
}
const check = (10 - (sum % 10)) % 10;
```
Guarantees every synthetic book passes the service-level `isValidISBN` validation check.

### 1.2 Table Truncation (`testDb.js`)
Executes raw SQL with `RESTART IDENTITY CASCADE`:
```sql
TRUNCATE TABLE fine, txn, software, dealer, staff, member, book RESTART IDENTITY CASCADE;
```
Leaves tables completely empty with IDs restarting at 1 for the next test suite.

