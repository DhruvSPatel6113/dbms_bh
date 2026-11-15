-- View 1: Active Overdue Loans
CREATE OR REPLACE VIEW v_overdue_loans AS
SELECT 
  t.txn_id,
  t.book_id,
  b.title AS book_title,
  b.isbn,
  b.cost AS book_cost,
  t.member_id,
  m.full_name AS member_name,
  m.email AS member_email,
  m.phone AS member_phone,
  t.issue_date,
  t.due_date,
  (CURRENT_DATE - t.due_date) AS days_overdue,
  LEAST((CURRENT_DATE - t.due_date) * 2, b.cost) AS calculated_fine
FROM txn t
JOIN book b ON b.book_id = t.book_id
JOIN member m ON m.member_id = t.member_id
WHERE t.return_date IS NULL AND t.due_date < CURRENT_DATE;


-- View 2: Member Outstanding Fines Aggregation
CREATE OR REPLACE VIEW v_member_outstanding_fines AS
SELECT 
  m.member_id,
  m.full_name,
  m.email,
  m.phone,
  m.type_of_membership,
  m.status AS member_status,
  COUNT(f.fine_id) AS unpaid_fines_count,
  COALESCE(SUM(f.fine_amount), 0) AS total_unpaid_amount
FROM member m
JOIN fine f ON f.member_id = m.member_id AND f.paid_status = 'Unpaid'
GROUP BY m.member_id, m.full_name, m.email, m.phone, m.type_of_membership, m.status;


-- View 3: Software License Status & Expiry Alerts
CREATE OR REPLACE VIEW v_license_status AS
SELECT 
  s.software_id,
  s.software_name,
  s.version,
  s.license_type,
  s.total_license,
  s.expiry_date,
  d.dealer_id,
  d.company_name AS dealer_name,
  d.email AS dealer_email,
  (s.expiry_date - CURRENT_DATE) AS days_until_expiry,
  CASE 
    WHEN s.expiry_date < CURRENT_DATE THEN 'Expired'
    WHEN s.expiry_date <= (CURRENT_DATE + 30) THEN 'ExpiringSoon'
    ELSE 'Active'
  END AS license_status
FROM software s
JOIN dealer d ON d.dealer_id = s.dealer_id;


-- Performance Indexes
CREATE INDEX IF NOT EXISTS "idx_book_category" ON "book"("category");
CREATE INDEX IF NOT EXISTS "idx_txn_member_status" ON "txn"("member_id", "status");
CREATE INDEX IF NOT EXISTS "idx_txn_book_id" ON "txn"("book_id");
CREATE INDEX IF NOT EXISTS "idx_fine_member_paid" ON "fine"("member_id", "paid_status");

-- Partial Index: Rapid lookup for unreturned overdue transactions
CREATE INDEX IF NOT EXISTS "idx_txn_overdue_partial" 
ON "txn"("due_date") 
WHERE return_date IS NULL;

