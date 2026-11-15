# Initial Migration Implementation Details

## 1. Relational Integrity & Schema Invariants

This migration enforces relational invariants at the PostgreSQL storage engine level:

### 1.1 Table Check Constraints
- `book.chk_copies`: $0 \le avl\_copies \le total\_copies$. Ensures available copies cannot be negative and cannot exceed the total stock owned by the library.
- `book.chk_cost`: $cost \ge 0$. Prevents invalid zero-dollar negative book costs.
- `member.chk_member_type`: Restricts membership types strictly to `'Student'`, `'Regular'`, or `'Premium'`.
- `member.chk_member_status`: Restricts status values to `'Active'`, `'Suspended'`, or `'Expired'`.
- `member.chk_renew`: $renew\_date \ge join\_date$. Prevents chronological renewal anomalies.
- `txn.chk_due`: $due\_date \ge issue\_date$. Mandates that loan expiration cannot precede the loan start date.
- `txn.chk_status`: Restricts transaction state strictly to `'Issued'`, `'Returned'`, or `'Overdue'`.
- `fine.chk_fine`: $fine\_amount \ge 0$.
- `software.chk_license`: $total\_license > 0$. Requires at least 1 valid seat for any software package.

### 1.2 Partial Unique Index: `uq_active_loan`
```sql
CREATE UNIQUE INDEX "uq_active_loan" ON "txn"("book_id", "member_id") WHERE return_date IS NULL;
```
- **Business Rule:** A member cannot borrow two copies of the exact same title simultaneously.
- **Index Structure:** A B-Tree partial unique index indexed on `(book_id, member_id)` filtered by `WHERE return_date IS NULL`. Once a book is returned (`return_date IS NOT NULL`), the partial index ignores the historical transaction, allowing the member to borrow the book again in the future.

