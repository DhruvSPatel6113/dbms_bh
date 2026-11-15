# Prisma Implementation Details & Schema Specifications

## 1. Relational Mapping Mechanics

The Prisma schema defines 7 exact models. Prisma's `@map` and `@@map` attributes ensure TypeScript/JavaScript camelCase models interface seamlessly with PostgreSQL's idiomatic `snake_case` tables and columns:

1. **Book Model (`@@map("book")`):**
   - `bookId`: `Int @id @default(autoincrement()) @map("book_id")`
   - `totalCopies`, `avlCopies`: `Int @map("total_copies")`, `@map("avl_copies")`
   - `dateOfPublish`: `DateTime @db.Date @map("date_of_publish")`
   - `cost`: `Decimal @db.Decimal(10, 2)`

2. **Member Model (`@@map("member")`):**
   - `membershipType`: `String @map("type_of_membership")` (Values: `'Student'`, `'Regular'`, `'Premium'`)
   - `status`: `String` (Values: `'Active'`, `'Suspended'`, `'Expired'`)
   - `joinDate`, `renewDate`: `DateTime @db.Date`

3. **Transaction Model (`@@map("txn")`):**
   - `issueDate`, `dueDate`, `returnDate`: `DateTime @db.Date` (with `returnDate` nullable)
   - `status`: `String` (Values: `'Issued'`, `'Returned'`, `'Overdue'`)
   - Foreign Keys: `bookId -> Book.bookId`, `memberId -> Member.memberId`

4. **Fine Model (`@@map("fine")`):**
   - `txnId`: `Int @unique @map("txn_id")` (1-to-1 relationship with `Txn`)
   - `fineAmount`: `Decimal @db.Decimal(10, 2) @map("fine_amount")`
   - `paidStatus`: `String @map("paid_status")` (Values: `'Unpaid'`, `'Paid'`, `'Waived'`)

5. **Staff Model (`@@map("staff")`):**
   - Tracks `shift` (`'Morning'`, `'Evening'`, `'Night'`), `qualification`, and `designation`.

6. **Dealer Model (`@@map("dealer")`):**
   - Suppliers of vendor licenses with full contact and address records.

7. **Software Model (`@@map("software")`):**
   - Tracks license allocations (`totalLicense`), license type, and expiry dates with dealer foreign key references.

## 2. Seeding Algorithm (`seed.js`)

The seeding process enforces referential order:
1. Truncates all tables with `CASCADE` and resets autoincrement identity counters:
   ```sql
   TRUNCATE TABLE fine, txn, software, dealer, staff, member, book RESTART IDENTITY CASCADE;
   ```
2. Seeds 5 Staff records across Morning, Evening, and Night shifts with 'Admin' and 'Librarian' designations.
3. Seeds 3 Dealers providing campus and corporate software.
4. Seeds 6 Software licenses, intentionally introducing expired, expiring-soon, and active packages.
5. Seeds 20 Members spanning all 3 membership tiers, including an Expired member (ID 19) and a Suspended member (ID 20).
6. Seeds 50 Books covering varying computer science and academic categories.
7. Executes real transaction insertions, allowing database triggers to validate member status and decrement `avl_copies` in real-time.

