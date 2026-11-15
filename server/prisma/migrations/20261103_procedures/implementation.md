# Procedures Implementation Details

## 1. Algorithmic Formulations & Procedural Invariants

### 1.1 Fine Calculation Algorithm (`sp_calculate_fines`)
The procedure calculates fines for both active overdue transactions and transactions returned after the due date.

```mermaid
flowchart TD
    A[Open cur over txn JOIN book] --> B[FETCH row INTO r]
    B --> C{Record Found?}
    C -- No --> EndProc[CLOSE cur & End]
    C -- Yes --> CalcDays[v_days = r.end_date - r.due_date]
    CalcDays --> CalcAmt[v_amt = MIN(v_days * p_rate, r.cost)]
    CalcAmt --> UpsertFine["INSERT INTO fine ... ON CONFLICT (txn_id)<br/>DO UPDATE SET fine_amount, reason<br/>WHERE fine.paid_status = 'Unpaid'"]
    UpsertFine --> MarkOverdue["UPDATE txn SET status='Overdue'<br/>WHERE txn_id = r.txn_id AND return_date IS NULL"]
    MarkOverdue --> B
```

- **Date Arithmetic:** Native PostgreSQL integer subtraction (`DATE - DATE`) handles leap-year transitions (e.g. `2024-03-01 - 2024-02-28 = 2`) and century leap-year exceptions (`2100` is non-leap).
- **Cost Cap Formulation:**
  $$\text{Fine Amount} = \min\left(\text{days\_overdue} \times \text{rate}, \text{book.cost}\right)$$
- **Idempotency Guarantee:** If the procedure is executed multiple times on the same date, existing unpaid fine records are updated with the identical amount, and Paid or Waived fines remain completely untouched.

### 1.2 Cursor-Driven Flat Memory Guarantee
Both `sp_generate_defaulter_report` and `sp_expiry_report` utilize explicit database cursors:
```sql
DECLARE
  cur CURSOR FOR SELECT ...;
BEGIN
  OPEN cur;
  LOOP
    FETCH cur INTO r;
    EXIT WHEN NOT FOUND;
    ...
  END LOOP;
  CLOSE cur;
END;
```
- By streaming rows through cursors and writing directly to `report_defaulters` and `report_expiries`, PostgreSQL does not construct a monolithic in-memory result buffer, ensuring flat $O(1)$ memory consumption even on massive datasets.

