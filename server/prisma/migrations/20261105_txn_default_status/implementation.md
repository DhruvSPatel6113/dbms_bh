# Transaction Default Status Migration Implementation

The migration sets a PostgreSQL default of `Issued` on `txn.status`, matching the Prisma model default. The issue trigger also assigns this status after validating the member and book, preserving database-enforced behavior for all inserts.

The migration changes no existing rows and is safe to deploy to databases that already contain transactions.
