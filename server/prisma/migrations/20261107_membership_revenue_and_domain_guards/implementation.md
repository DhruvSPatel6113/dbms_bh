# Implementation Notes

- `membership_payment` references its member with `ON DELETE RESTRICT` so a member with financial history cannot be hard-deleted.
- Registration and renewal write the member change and optional positive payment in one Prisma transaction.
- The new loan status check includes `Renewed`, which the one-renewal workflow already writes.
- Staff shift/designation, fine status, and return-date checks provide database-level guards in addition to API validation.
- The financial report uses half-open UTC calendar-month date ranges and includes only receipts actually recorded or fines actually paid.
