# Membership Revenue and Domain Guards

This forward-only migration adds `membership_payment`, retaining the amount and date actually collected for a registration or renewal. It also tightens the loan, fine, and staff status constraints to match supported application values.

The report counts membership receipts recorded after this migration and fine records marked `Paid` with a payment date in the selected month. It does not infer a membership price or backfill historical receipts.
