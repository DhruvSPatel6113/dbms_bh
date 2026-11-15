# API Integration Tests Implementation Details

## 1. Concurrency Simulation Flow (`api.test.js`)

Test case 8 dispatches 20 simultaneous HTTP POST requests against a book record with only 3 available copies:
```javascript
const promises = members.map(m =>
  request(app)
    .post('/api/txns/issue')
    .set('Authorization', `Bearer ${librarianToken}`)
    .send({ bookId: book.bookId, memberId: m.memberId, issueDate: '2024-05-01' })
);
const responses = await Promise.all(promises);
```

```mermaid
sequenceDiagram
    autonumber
    participant Client as 20 Parallel Supertest Workers
    participant API as Express API (/api/txns/issue)
    participant DB as PostgreSQL 16 (Row Lock)

    Client->>API: 20 simultaneous POST requests
    API->>DB: 20 INSERTs invoke fn_txn_before_issue()
    Note over DB: SELECT ... FOR UPDATE serializes workers
    DB-->>API: 3 requests obtain locks with avl_copies > 0 (201 Created)
    DB-->>API: 17 requests observe avl_copies == 0 (409 Conflict)
    API-->>Client: Exactly 3 HTTP 201s and 17 HTTP 409s returned
```

- **Stock Verification:** Asserts that after all 20 promises resolve, `book.avl_copies` equals exactly 0, proving zero inventory leaks or negative stock counts under high-concurrency loads.

