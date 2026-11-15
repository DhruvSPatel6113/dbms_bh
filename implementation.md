# Root Architectural Implementation Blueprint

## 1. System Design Philosophy

The architecture of this Library Management System adheres to the **Database as Primary Defense** paradigm. Rather than relying solely on transient application-level checks that can be circumvented during network race conditions, concurrency anomalies, or external script execution, business invariants are locked in PostgreSQL 16:

1. **Strict Data Invariants:** Check constraints prevent negative inventory, illegal status transitions, and illogical date relationships ($renew\_date < join\_date$).
2. **Deterministic Trigger Hooks:** Concurrency locks (`SELECT ... FOR UPDATE`) are held in `BEFORE INSERT ON txn` so two simultaneous issue requests for the final copy serialize safely.
3. **Procedural Heavy Lifting:** Daily fine calculations and reporting leverage PL/pgSQL cursors (`sp_calculate_fines`, `sp_generate_defaulter_report`), keeping application Node.js memory constant ($O(1)$) regardless of whether the library tracks $1,000$ or $1,000,000$ transactions.
4. **Thin Controller / Rich Service / Robust ORM Pattern:** Express controllers do zero business calculation; services orchestrate transactions and map database error codes (such as `P0001` with error message tokens) into deterministic HTTP response contracts.

---

## 2. Relational Schema & Entity Relationships

```mermaid
erDiagram
    BOOK ||--o{ TXN : "borrowed in"
    MEMBER ||--o{ TXN : "executes"
    MEMBER ||--o{ FINE : "incurs"
    TXN ||--o| FINE : "generates"
    DEALER ||--o{ SOFTWARE : "supplies"
    STAFF {
        int staff_id PK
        string staff_name
        string email UK
        string shift
        string designation
    }
    BOOK {
        int book_id PK
        string isbn UK
        string title
        int total_copies
        int avl_copies
        decimal cost
    }
    MEMBER {
        int member_id PK
        string email UK
        string type_of_membership
        string status
        date renew_date
    }
    TXN {
        int txn_id PK
        int book_id FK
        int member_id FK
        date issue_date
        date due_date
        date return_date
        string status
    }
    FINE {
        int fine_id PK
        int txn_id FK,UK
        int member_id FK
        decimal fine_amount
        string paid_status
    }
    DEALER {
        int dealer_id PK
        string company_name
        string email
    }
    SOFTWARE {
        int software_id PK
        string software_name
        int total_license
        date expiry_date
        int dealer_id FK
    }
```

---

## 3. Concurrency & Race Condition Control

When issuing a book with $avl\_copies = 1$ to two concurrent users:
```mermaid
sequenceDiagram
    autonumber
    actor Librarian1
    actor Librarian2
    participant DB as PostgreSQL 16 (Engine)
    participant BookRow as Book Row (id=42)

    Librarian1->>DB: BEGIN INSERT INTO txn (book_id=42, member_id=101)
    Librarian2->>DB: BEGIN INSERT INTO txn (book_id=42, member_id=102)
    Note over DB: Trigger fn_txn_before_issue fires
    DB->>BookRow: SELECT avl_copies FROM book WHERE book_id=42 FOR UPDATE
    Note over BookRow: Lock acquired by Transaction 1
    DB-->>Librarian1: Lock granted. avl_copies = 1. Passes validations.
    DB->>BookRow: UPDATE book SET avl_copies = 0
    DB->>Librarian1: COMMIT INSERT (Status 201 Created)
    Note over BookRow: Lock released to Transaction 2
    DB-->>Librarian2: Lock granted. avl_copies = 0.
    Note over DB: IF v_avl <= 0 THEN RAISE EXCEPTION 'NO_COPIES_AVAILABLE'
    DB->>Librarian2: ROLLBACK (P0001: NO_COPIES_AVAILABLE)
```

---

## 4. Database Exception Mapping Protocol

Custom errors raised by PL/pgSQL using error code `P0001` are intercepted by the backend exception translation layer (`server/src/utils/dbErrors.js`) and converted to standard HTTP statuses:

| Database Exception Code / Token | HTTP Status | Client Response Message |
| :--- | :--- | :--- |
| `BOOK_NOT_FOUND` | 404 Not Found | "The requested book ID does not exist." |
| `MEMBER_NOT_FOUND` | 404 Not Found | "The requested member ID was not found." |
| `NO_COPIES_AVAILABLE` | 409 Conflict | "No available copies of this book remain on the shelf." |
| `MEMBER_NOT_ACTIVE` | 422 Unprocessable | "Member account is not active (Suspended or Inactive)." |
| `MEMBERSHIP_EXPIRED` | 422 Unprocessable | "Membership expired prior to the requested issue date." |
| `LOAN_LIMIT_REACHED` | 422 Unprocessable | "Member has reached active borrowing quota for their tier." |
| `UNPAID_FINES_EXCEED_LIMIT` | 422 Unprocessable | "Member has outstanding unpaid fines exceeding Rs. 100." |
| `ALREADY_RETURNED` | 409 Conflict | "Transaction has already been returned previously." |
| `RETURN_BEFORE_ISSUE` | 422 Unprocessable | "Return date cannot be earlier than issue date." |
| `TOTAL_BELOW_ON_LOAN` | 409 Conflict | "Cannot decrease total copies below currently issued copies." |
| `FINE_NOT_PAYABLE` | 409 Conflict | "Fine is already paid or waived, or does not exist." |

---

## 5. Directory Map of Implementations

- **Infrastructure & Pipeline:** `/.github/workflows/` (Ubuntu CI runner with PostgreSQL 16 service container)
- **Database Migrations & Triggers:** `/server/prisma/migrations/` (DDL, Check constraints, Triggers, Functions, Procedures)
- **Execution Scripts:** `/server/scripts/` (Automated TDD gate runner, test database resetter, nightly fine recalculation)
- **Application Core:** `/server/src/` (Zod schemas, Express routing, thin controllers, transactional business services, date utilities)
- **Automated Test Matrix:** `/server/tests/` (Algorithmic unit tests, direct DB trigger integration tests, HTTP Supertest suites)
- **Client Frontend:** `/client/src/` (TanStack React Query hooks, Axios HTTP interceptors, reusable UI components, administration screens)

