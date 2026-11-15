# Views and Indexes Implementation Details

## 1. Views Architecture & Schemas

### 1.1 `v_overdue_loans`
Exposes currently unreturned loans past their due date, dynamically calculating `days_overdue` and projected fines:
$$\text{calculated\_fine} = \min\left((\text{CURRENT\_DATE} - due\_date) \times 2, b.cost\right)$$
Pre-joins with `book` and `member` for immediate display on librarian circulation consoles without application-side joins.

### 1.2 `v_member_outstanding_fines`
Aggregates unpaid fines by member, giving total sums and counts. Used by the circulation counter before issuing new materials.

### 1.3 `v_license_status`
Computes active status categories (`'Active'`, `'ExpiringSoon'`, `'Expired'`) using date delta arithmetic:
$$\text{days\_until\_expiry} = expiry\_date - \text{CURRENT\_DATE}$$

## 2. Index Optimization & Plan Impact

1. **`idx_txn_overdue_partial` (`txn(due_date) WHERE return_date IS NULL`):**
   - **Type:** Partial B-Tree Index.
   - **Optimization:** Only indexes active, unreturned loans. In a library with $1,000,000$ historical returns and only $5,000$ active loans, the index size is reduced by $>99\%$, allowing index-only scans during nightly fine processing and overdue alerts.
2. **`idx_txn_member_status` (`txn(member_id, status)`):**
   - Speeds up checking a member's active borrowing counts during trigger execution.
3. **`idx_fine_member_paid` (`fine(member_id, paid_status)`):**
   - Eliminates table scans when aggregating unpaid fines in `trg_txn_before_issue`.
4. **`idx_book_category` (`book(category)`):**
   - Supports catalog search and filtering.

