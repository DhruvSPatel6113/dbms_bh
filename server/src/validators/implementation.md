# Validators Implementation Details

## 1. Schema Invariants & Design Principles

### 1.1 Coercion & Stripping Logic
- Uses `z.coerce.number()` to automatically cast URL query string parameters and route params (e.g. `page=1`, `limit=20`, `totalCopies="5"`) into validated JavaScript numeric types.
- Strips undocumented or unexpected fields from the payload using `zod.safeParse()`, preventing mass-assignment security vulnerabilities.

### 1.2 Format Restrictions
- **Strict Date Strings:** Regex pattern `^\d{4}-\d{2}-\d{2}$` enforces standardized ISO date notations (`YYYY-MM-DD`), preventing timezone parsing discrepancies across client locales.
- **Enumerations:** Enforces database check constraint parity:
  - `member.membershipType`: `['Student', 'Regular', 'Premium']`
  - `member.status`: `['Active', 'Suspended', 'Expired']`
  - `staff.shift`: `['Morning', 'Evening', 'Night']`

