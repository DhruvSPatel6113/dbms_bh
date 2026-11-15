-- Trigger 1: Validate and decrement on issue (BEFORE INSERT ON txn)
CREATE OR REPLACE FUNCTION fn_txn_before_issue() RETURNS trigger AS $$
DECLARE
  v_avl INT;
  v_m member%ROWTYPE;
  v_active INT;
  v_limit INT;
  v_days INT;
  v_unpaid NUMERIC;
BEGIN
  -- Lock the book row to prevent concurrent race condition issues
  SELECT avl_copies INTO v_avl FROM book WHERE book_id = NEW.book_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'BOOK_NOT_FOUND' USING ERRCODE='P0001';
  END IF;

  IF v_avl <= 0 THEN
    RAISE EXCEPTION 'NO_COPIES_AVAILABLE' USING ERRCODE='P0001';
  END IF;

  -- Verify member validity
  SELECT * INTO v_m FROM member WHERE member_id = NEW.member_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'MEMBER_NOT_FOUND' USING ERRCODE='P0001';
  END IF;

  IF v_m.status <> 'Active' THEN
    RAISE EXCEPTION 'MEMBER_NOT_ACTIVE' USING ERRCODE='P0001';
  END IF;

  IF v_m.renew_date < NEW.issue_date THEN
    RAISE EXCEPTION 'MEMBERSHIP_EXPIRED' USING ERRCODE='P0001';
  END IF;

  -- Determine borrowing limits and duration based on membership tier
  v_limit := CASE v_m.type_of_membership
               WHEN 'Student' THEN 3
               WHEN 'Regular' THEN 5
               ELSE 10
             END;

  v_days  := CASE v_m.type_of_membership
               WHEN 'Premium' THEN 21
               ELSE 14
             END;

  SELECT COUNT(*) INTO v_active FROM txn WHERE member_id = NEW.member_id AND return_date IS NULL;
  IF v_active >= v_limit THEN
    RAISE EXCEPTION 'LOAN_LIMIT_REACHED' USING ERRCODE='P0001';
  END IF;

  -- Check outstanding unpaid fines threshold
  SELECT COALESCE(SUM(fine_amount), 0) INTO v_unpaid FROM fine WHERE member_id = NEW.member_id AND paid_status = 'Unpaid';
  IF v_unpaid > 100 THEN
    RAISE EXCEPTION 'UNPAID_FINES_EXCEED_LIMIT' USING ERRCODE='P0001';
  END IF;

  -- Default due_date calculation if omitted
  IF NEW.due_date IS NULL THEN
    NEW.due_date := NEW.issue_date + v_days;
  END IF;

  NEW.status := 'Issued';

  -- Atomically decrement available copy count
  UPDATE book SET avl_copies = avl_copies - 1 WHERE book_id = NEW.book_id;

  RETURN NEW;
END $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_txn_before_issue
BEFORE INSERT ON txn
FOR EACH ROW
EXECUTE FUNCTION fn_txn_before_issue();


-- Trigger 2A: Validate return and update status (BEFORE UPDATE OF return_date ON txn)
CREATE OR REPLACE FUNCTION fn_txn_before_return() RETURNS trigger AS $$
BEGIN
  IF OLD.return_date IS NOT NULL AND NEW.return_date IS DISTINCT FROM OLD.return_date THEN
    RAISE EXCEPTION 'ALREADY_RETURNED' USING ERRCODE='P0001';
  END IF;

  IF OLD.return_date IS NULL AND NEW.return_date IS NOT NULL THEN
    IF NEW.return_date < NEW.issue_date THEN
      RAISE EXCEPTION 'RETURN_BEFORE_ISSUE' USING ERRCODE='P0001';
    END IF;
    NEW.status := 'Returned';
  END IF;

  RETURN NEW;
END $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_txn_before_return
BEFORE UPDATE OF return_date ON txn
FOR EACH ROW
EXECUTE FUNCTION fn_txn_before_return();


-- Trigger 2B: Increment available copy count (AFTER UPDATE OF return_date ON txn)
CREATE OR REPLACE FUNCTION fn_txn_after_return() RETURNS trigger AS $$
BEGIN
  IF OLD.return_date IS NULL AND NEW.return_date IS NOT NULL THEN
    IF NEW.return_date < NEW.issue_date THEN
      RAISE EXCEPTION 'RETURN_BEFORE_ISSUE' USING ERRCODE='P0001';
    END IF;
    UPDATE book SET avl_copies = LEAST(avl_copies + 1, total_copies) WHERE book_id = NEW.book_id;
  END IF;
  RETURN NEW;
END $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_txn_after_return
AFTER UPDATE OF return_date ON txn
FOR EACH ROW
EXECUTE FUNCTION fn_txn_after_return();


-- Trigger 3: Guard copy counts on book stock update (BEFORE UPDATE OF total_copies ON book)
CREATE OR REPLACE FUNCTION fn_book_guard() RETURNS trigger AS $$
BEGIN
  IF (NEW.total_copies - NEW.avl_copies) < 0 THEN
    RAISE EXCEPTION 'INVALID_COPY_COUNT' USING ERRCODE='P0001';
  END IF;

  IF NEW.total_copies < (OLD.total_copies - OLD.avl_copies) THEN
    RAISE EXCEPTION 'TOTAL_BELOW_ON_LOAN' USING ERRCODE='P0001';
  END IF;

  RETURN NEW;
END $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_book_guard
BEFORE UPDATE OF total_copies ON book
FOR EACH ROW
EXECUTE FUNCTION fn_book_guard();

