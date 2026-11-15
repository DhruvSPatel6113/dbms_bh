-- Stored Procedure: sp_calculate_fines
CREATE OR REPLACE PROCEDURE sp_calculate_fines(
  p_as_of DATE,
  p_rate NUMERIC DEFAULT 2
) AS $$
DECLARE
  r RECORD;
  v_days INT;
  v_amt NUMERIC;
  cur CURSOR FOR
    SELECT 
      t.txn_id, 
      t.member_id, 
      t.due_date, 
      COALESCE(t.return_date, p_as_of) AS end_date, 
      b.cost
    FROM txn t
    JOIN book b ON b.book_id = t.book_id
    WHERE COALESCE(t.return_date, p_as_of) > t.due_date;
BEGIN
  OPEN cur;
  LOOP
    FETCH cur INTO r;
    EXIT WHEN NOT FOUND;

    -- Native date subtraction yields integer days (accurate across month ends and leap years)
    v_days := r.end_date - r.due_date;
    v_amt  := LEAST(v_days * p_rate, r.cost);

    -- Upsert fine: never overwrite Paid or Waived fines
    INSERT INTO fine (txn_id, member_id, fine_amount, paid_status, reason)
    VALUES (r.txn_id, r.member_id, v_amt, 'Unpaid', 'Overdue by ' || v_days || ' day(s)')
    ON CONFLICT (txn_id) DO UPDATE
      SET fine_amount = EXCLUDED.fine_amount,
          reason      = EXCLUDED.reason
      WHERE fine.paid_status = 'Unpaid';

    -- Mark active transaction status as Overdue
    UPDATE txn 
    SET status = 'Overdue' 
    WHERE txn_id = r.txn_id AND return_date IS NULL;
  END LOOP;
  CLOSE cur;
END $$ LANGUAGE plpgsql;


-- Defaulter Report Table
CREATE TABLE IF NOT EXISTS report_defaulters (
  report_date DATE NOT NULL,
  member_id INT NOT NULL,
  full_name TEXT NOT NULL,
  overdue_books INT NOT NULL,
  total_fine NUMERIC(10, 2) NOT NULL,
  PRIMARY KEY (report_date, member_id)
);

-- Stored Procedure: sp_generate_defaulter_report
CREATE OR REPLACE PROCEDURE sp_generate_defaulter_report(p_as_of DATE) AS $$
DECLARE
  r RECORD;
  cur CURSOR FOR
    SELECT 
      m.member_id, 
      m.full_name, 
      COUNT(*) AS overdue_books, 
      COALESCE(SUM(f.fine_amount), 0) AS total_fine
    FROM txn t
    JOIN member m ON m.member_id = t.member_id
    LEFT JOIN fine f ON f.txn_id = t.txn_id
    WHERE t.return_date IS NULL AND t.due_date < p_as_of
    GROUP BY m.member_id, m.full_name;
BEGIN
  DELETE FROM report_defaulters WHERE report_date = p_as_of;
  OPEN cur;
  LOOP
    FETCH cur INTO r;
    EXIT WHEN NOT FOUND;
    INSERT INTO report_defaulters (report_date, member_id, full_name, overdue_books, total_fine)
    VALUES (p_as_of, r.member_id, r.full_name, r.overdue_books, r.total_fine);
  END LOOP;
  CLOSE cur;
END $$ LANGUAGE plpgsql;


-- Expiry Report Table
CREATE TABLE IF NOT EXISTS report_expiries (
  report_date DATE NOT NULL,
  item_type TEXT NOT NULL,
  item_id INT NOT NULL,
  item_name TEXT NOT NULL,
  expiry_date DATE NOT NULL,
  days_remaining INT NOT NULL,
  PRIMARY KEY (report_date, item_type, item_id)
);

-- Stored Procedure: sp_expiry_report
CREATE OR REPLACE PROCEDURE sp_expiry_report(
  p_days INT, 
  p_as_of DATE DEFAULT CURRENT_DATE
) AS $$
DECLARE
  r RECORD;
  cur_software CURSOR FOR
    SELECT 
      software_id, 
      software_name, 
      expiry_date, 
      (expiry_date - p_as_of) AS days_remaining
    FROM software
    WHERE expiry_date <= (p_as_of + p_days);

  cur_member CURSOR FOR
    SELECT 
      member_id, 
      full_name, 
      renew_date, 
      (renew_date - p_as_of) AS days_remaining
    FROM member
    WHERE renew_date <= (p_as_of + p_days);
BEGIN
  DELETE FROM report_expiries WHERE report_date = p_as_of;

  -- Process Software expiries
  OPEN cur_software;
  LOOP
    FETCH cur_software INTO r;
    EXIT WHEN NOT FOUND;
    INSERT INTO report_expiries (report_date, item_type, item_id, item_name, expiry_date, days_remaining)
    VALUES (p_as_of, 'Software', r.software_id, r.software_name, r.expiry_date, r.days_remaining);
  END LOOP;
  CLOSE cur_software;

  -- Process Member renewals
  OPEN cur_member;
  LOOP
    FETCH cur_member INTO r;
    EXIT WHEN NOT FOUND;
    INSERT INTO report_expiries (report_date, item_type, item_id, item_name, expiry_date, days_remaining)
    VALUES (p_as_of, 'Member', r.member_id, r.full_name, r.renew_date, r.days_remaining);
  END LOOP;
  CLOSE cur_member;
END $$ LANGUAGE plpgsql;


-- Stored Procedure: sp_pay_fine
CREATE OR REPLACE PROCEDURE sp_pay_fine(
  p_fine_id INT, 
  p_paid_date DATE
) AS $$
BEGIN
  UPDATE fine
  SET paid_status = 'Paid',
      paid_date   = p_paid_date
  WHERE fine_id = p_fine_id AND paid_status = 'Unpaid';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'FINE_NOT_PAYABLE' USING ERRCODE='P0001';
  END IF;
END $$ LANGUAGE plpgsql;

