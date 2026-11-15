# Middlewares Implementation Details

## 1. Security Architecture & Pipeline

```mermaid
flowchart LR
    Req[Incoming HTTP Request] --> Auth{auth.js}
    Auth -- Missing / Invalid JWT --> Err401[401 Unauthorized]
    Auth -- Valid JWT --> Role{roleGuard.js}
    Role -- Role Not Permitted --> Err403[403 Forbidden]
    Role -- Role Allowed --> Val{validate.js}
    Val -- Schema Mismatch --> Err400[400 Bad Request]
    Val -- Schema Valid --> Controller[Controller Execution]
```

## 2. Invariants & Implementation Standards

### 2.1 Error Handling Pipeline (`errorHandler.js`)
- Standard response format:
  ```json
  {
    "success": false,
    "error": {
      "code": "MEMBERSHIP_EXPIRED",
      "message": "Member renewal date has lapsed",
      "details": null
    }
  }
  ```
- Protects operational confidentiality by suppressing error stack traces in `production` environments while exposing granular debugging details in `development` and `test` environments.
- Normalizes system parse failures (`entity.too.large` $\to$ HTTP 413, `entity.parse.failed` $\to$ HTTP 400).

