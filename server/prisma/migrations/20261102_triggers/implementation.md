# Triggers Implementation Details

## 1. Procedural Algorithms & Flow

### 1.1 Trigger 1: `trg_txn_before_issue` (`fn_txn_before_issue`)
```mermaid
flowchart TD
    Start([INSERT ON txn]) --> Lock[SELECT avl_copies FROM book WHERE book_id = NEW.book_id FOR UPDATE]
    Lock --> CheckBook{Book Exists?}
    CheckBook -- No --> ErrBook[RAISE EXCEPTION 'BOOK_NOT_FOUND']
    CheckBook -- Yes --> CheckStock{avl_copies > 0?}
    CheckStock -- No --> ErrStock[RAISE EXCEPTION 'NO_COPIES_AVAILABLE']
    CheckStock -- Yes --> LoadMember[SELECT * FROM member WHERE member_id = NEW.member_id]
    LoadMember --> CheckMember{Member Exists?}
    CheckMember -- No --> ErrMem[RAISE EXCEPTION 'MEMBER_NOT_FOUND']
    CheckMember -- Yes --> CheckActive{status == 'Active'?}
    CheckActive -- No --> ErrActive[RAISE EXCEPTION 'MEMBER_NOT_ACTIVE']
    CheckActive -- Yes --> CheckExpiry{renew_date >= NEW.issue_date?}
    CheckExpiry -- No --> ErrExp[RAISE EXCEPTION 'MEMBERSHIP_EXPIRED']
    CheckExpiry -- Yes --> CalcLimit[v_limit = Student:3, Regular:5, Premium:10]
    CalcLimit --> CheckLoans{Active Loans < v_limit?}
    CheckLoans -- No --> ErrLimit[RAISE EXCEPTION 'LOAN_LIMIT_REACHED']
    CheckLoans -- Yes --> CheckFines{Unpaid Fines <= 100?}
    CheckFines -- No --> ErrFines[RAISE EXCEPTION 'UNPAID_FINES_EXCEED_LIMIT']
    CheckFines -- Yes --> SetDueDate[Set due_date if null, status = 'Issued']
    SetDueDate --> DecrStock[UPDATE book SET avl_copies = avl_copies - 1]
    DecrStock --> Finish([Allow INSERT])
```

### 1.2 Trigger 2A & 2B: Return Validation & Stock Replenishment
- **`fn_txn_before_return` (BEFORE UPDATE OF return_date):**
  1. Checks if `OLD.return_date IS NOT NULL` and changed $\implies$ raises `'ALREADY_RETURNED'`.
  2. If `NEW.return_date < NEW.issue_date` $\implies$ raises `'RETURN_BEFORE_ISSUE'`.
  3. Mutates `NEW.status := 'Returned'`.
- **`fn_txn_after_return` (AFTER UPDATE OF return_date):**
  1. Executes `UPDATE book SET avl_copies = LEAST(avl_copies + 1, total_copies) WHERE book_id = NEW.book_id;`.
  2. Guarantees that `avl_copies` never exceeds `total_copies` under any operational anomaly.

### 1.3 Trigger 3: `trg_book_guard` (`fn_book_guard`)
- **Inventory Invariant:** The library cannot reduce `total_copies` below the count currently on loan:
  $$\text{Copies on Loan} = OLD.total\_copies - OLD.avl\_copies$$
- If $NEW.total\_copies < (\text{Copies on Loan})$, aborts with `'TOTAL_BELOW_ON_LOAN'`.
- Prevents database admins or API clients from creating negative physical availability.

