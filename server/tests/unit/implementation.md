# Unit Tests Implementation Details

## 1. Test Assertions & Boundary Coverage

### 1.1 Date & Leap-Year Matrix (`utils.dates.test.js`)
| Case | Input Interval | Calendar Context | Expected `daysBetween` |
| :--- | :--- | :--- | :--- |
| 1 | 2024-05-10 to 2024-05-10 | Identical Day | 0 |
| 2 | 2024-02-28 to 2024-03-01 | Leap Year (2024 has Feb 29) | 2 |
| 3 | 2023-02-28 to 2023-03-01 | Standard Year (No Feb 29) | 1 |
| 4 | 2100-02-28 to 2100-03-01 | Century Exception (Non-leap) | 1 |
| 5 | 2000-02-28 to 2000-03-01 | Quad-century Leap (2000 has Feb 29) | 2 |
| 6 | 2026-12-31 to 2027-01-01 | Year boundary crossing | 1 |
| 7 | 2026-06-10 to 2026-06-05 | Inverted chronological order | -5 |

### 1.2 Fine Calculator Invariants (`utils.fineCalculator.test.js`)
- Proves fine calculation strictly respects the ceiling:
  $$\text{fineAmount} \le \text{book.cost}$$
- Verified with fractional cost `$99.99` and overdue days exceeding the replacement cost.

