# Controllers Implementation Details

## 1. Controller Responsibilities & Standards
All controllers implement standard asynchronous signatures:
```javascript
exports.action = async (req, res, next) => {
  try {
    // 1. Extract inputs from req.params, req.query, or req.body
    // 2. Delegate execution to Domain Service
    const result = await domainService.performOperation(...);
    // 3. Return structured JSON with HTTP 200/201
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    // 4. Delegate to central errorHandler middleware
    next(error);
  }
};
```

## 2. Invariants & Isolation
- **Zero Business Logic:** Calculations (fine formulas, date additions, stock checks) are strictly banned from controller files.
- **Consistent Response Envelope:** Successful responses return `{ success: true, data: ... }` or `{ success: true, message: ... }`.
- **Stateless Operation:** Controllers retain no memory or state across HTTP requests, allowing horizontal scaling behind load balancers.

