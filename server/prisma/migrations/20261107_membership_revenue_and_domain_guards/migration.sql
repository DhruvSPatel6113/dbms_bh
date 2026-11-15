CREATE TABLE "membership_payment" (
  "payment_id" SERIAL NOT NULL,
  "member_id" INTEGER NOT NULL,
  "amount" DECIMAL(10,2) NOT NULL,
  "payment_type" TEXT NOT NULL,
  "paid_at" DATE NOT NULL DEFAULT CURRENT_DATE,
  CONSTRAINT "membership_payment_pkey" PRIMARY KEY ("payment_id"),
  CONSTRAINT "chk_membership_payment_amount" CHECK ("amount" > 0),
  CONSTRAINT "chk_membership_payment_type" CHECK ("payment_type" IN ('Registration', 'Renewal')),
  CONSTRAINT "membership_payment_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "member"("member_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "idx_membership_payment_paid_at" ON "membership_payment"("paid_at");

ALTER TABLE "txn" DROP CONSTRAINT "chk_status";
ALTER TABLE "txn" ADD CONSTRAINT "chk_status" CHECK ("status" IN ('Issued', 'Renewed', 'Returned', 'Overdue'));
ALTER TABLE "txn" ADD CONSTRAINT "chk_return_date" CHECK ("return_date" IS NULL OR "return_date" >= "issue_date");
ALTER TABLE "fine" ADD CONSTRAINT "chk_paid_status" CHECK ("paid_status" IN ('Unpaid', 'Paid', 'Waived'));
ALTER TABLE "staff" ADD CONSTRAINT "chk_staff_shift" CHECK ("shift" IN ('Morning', 'Evening', 'Night'));
ALTER TABLE "staff" ADD CONSTRAINT "chk_staff_designation" CHECK ("designation" IN ('Admin', 'Librarian'));
