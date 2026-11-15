# Utilities Implementation Details

## 1. Algorithmic Formulations

### 1.1 Gregorian Leap-Year Algorithm (`dates.js`)
```javascript
function isLeapYear(year) {
  const y = Number(year);
  return (y % 4 === 0 && y % 100 !== 0) || (y % 400 === 0);
}
```
- **Rules Verified:**
  - Standard leap years divisible by 4 (e.g. 2024, 2028).
  - Century years divisible by 100 are non-leap (e.g. 1900, 2100).
  - Quad-century years divisible by 400 are leap years (e.g. 2000, 2400).

### 1.2 Date Delta Arithmetic (`dates.js`)
All date operations are normalized to UTC midnight ($00:00:00.000\text{Z}$):
$$\text{daysBetween}(A, B) = \text{round}\left(\frac{\text{UTC}(B) - \text{UTC}(A)}{86,400,000}\right)$$
Eliminates local Daylight Saving Time (DST) shifts and cross-timezone skew.

### 1.3 Fine Computation Algorithm (`fineCalculator.js`)
$$\text{fine} = \min\left(\max(0, \text{daysBetween}(due, return)) \times \text{ratePerDay}, \text{bookCost}\right)$$
- If the book is returned early or on the due date ($\le 0$ days), returns `0`.
- Caps max liability strictly at `bookCost`.

### 1.4 ISBN Checksum Engine (`isbn.js`)
- **ISBN-10 Checksum:**
  $$\sum_{i=1}^{10} d_i \times (11 - i) \equiv 0 \pmod{11} \quad (\text{where } 'X' = 10)$$
- **ISBN-13 Checksum:**
  $$\sum_{i=1}^{13} d_i \times w_i \equiv 0 \pmod{10} \quad (\text{where } w_i = 1 \text{ for odd, } 3 \text{ for even})$$

