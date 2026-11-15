# Book Stock Guard Error Order Implementation

The trigger now checks whether the proposed total is below the existing on-loan count before checking for an invalid available-copy count. This preserves both invariants while reporting the more specific `TOTAL_BELOW_ON_LOAN` error when both conditions are violated.
