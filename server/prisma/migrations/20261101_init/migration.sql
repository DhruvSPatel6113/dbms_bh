-- CreateTable book
CREATE TABLE "book" (
    "book_id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "isbn" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "total_copies" INTEGER NOT NULL,
    "avl_copies" INTEGER NOT NULL,
    "publication" TEXT NOT NULL,
    "date_of_publish" DATE NOT NULL,
    "cost" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "book_pkey" PRIMARY KEY ("book_id")
);

-- CreateTable member
CREATE TABLE "member" (
    "member_id" SERIAL NOT NULL,
    "full_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "join_date" DATE NOT NULL,
    "renew_date" DATE NOT NULL,
    "type_of_membership" TEXT NOT NULL,
    "status" TEXT NOT NULL,

    CONSTRAINT "member_pkey" PRIMARY KEY ("member_id")
);

-- CreateTable txn
CREATE TABLE "txn" (
    "txn_id" SERIAL NOT NULL,
    "book_id" INTEGER NOT NULL,
    "member_id" INTEGER NOT NULL,
    "issue_date" DATE NOT NULL,
    "due_date" DATE NOT NULL,
    "return_date" DATE,
    "status" TEXT NOT NULL,

    CONSTRAINT "txn_pkey" PRIMARY KEY ("txn_id")
);

-- CreateTable fine
CREATE TABLE "fine" (
    "fine_id" SERIAL NOT NULL,
    "txn_id" INTEGER NOT NULL,
    "member_id" INTEGER NOT NULL,
    "fine_amount" DECIMAL(10,2) NOT NULL,
    "paid_status" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "paid_date" DATE,

    CONSTRAINT "fine_pkey" PRIMARY KEY ("fine_id")
);

-- CreateTable staff
CREATE TABLE "staff" (
    "staff_id" SERIAL NOT NULL,
    "staff_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone_no" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "shift" TEXT NOT NULL,
    "date_of_joining" DATE NOT NULL,
    "qualification" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "password" TEXT,

    CONSTRAINT "staff_pkey" PRIMARY KEY ("staff_id")
);

-- CreateTable dealer
CREATE TABLE "dealer" (
    "dealer_id" SERIAL NOT NULL,
    "company_name" TEXT NOT NULL,
    "contact_person" TEXT NOT NULL,
    "contact_num" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "address" TEXT NOT NULL,

    CONSTRAINT "dealer_pkey" PRIMARY KEY ("dealer_id")
);

-- CreateTable software
CREATE TABLE "software" (
    "software_id" SERIAL NOT NULL,
    "software_name" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "license_type" TEXT NOT NULL,
    "total_license" INTEGER NOT NULL,
    "dealer_id" INTEGER NOT NULL,
    "expiry_date" DATE NOT NULL,

    CONSTRAINT "software_pkey" PRIMARY KEY ("software_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "book_isbn_key" ON "book"("isbn");
CREATE UNIQUE INDEX "member_email_key" ON "member"("email");
CREATE UNIQUE INDEX "fine_txn_id_key" ON "fine"("txn_id");
CREATE UNIQUE INDEX "staff_email_key" ON "staff"("email");

-- AddForeignKey
ALTER TABLE "txn" ADD CONSTRAINT "txn_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "book"("book_id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "txn" ADD CONSTRAINT "txn_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "member"("member_id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "fine" ADD CONSTRAINT "fine_txn_id_fkey" FOREIGN KEY ("txn_id") REFERENCES "txn"("txn_id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "fine" ADD CONSTRAINT "fine_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "member"("member_id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "software" ADD CONSTRAINT "software_dealer_id_fkey" FOREIGN KEY ("dealer_id") REFERENCES "dealer"("dealer_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Business Constraints
ALTER TABLE "book" ADD CONSTRAINT "chk_copies" CHECK (total_copies >= 0 AND avl_copies >= 0 AND avl_copies <= total_copies);
ALTER TABLE "book" ADD CONSTRAINT "chk_cost" CHECK (cost >= 0);
ALTER TABLE "member" ADD CONSTRAINT "chk_member_type" CHECK (type_of_membership IN ('Student', 'Regular', 'Premium'));
ALTER TABLE "member" ADD CONSTRAINT "chk_member_status" CHECK (status IN ('Active', 'Suspended', 'Expired'));
ALTER TABLE "member" ADD CONSTRAINT "chk_renew" CHECK (renew_date >= join_date);
ALTER TABLE "txn" ADD CONSTRAINT "chk_due" CHECK (due_date >= issue_date);
ALTER TABLE "txn" ADD CONSTRAINT "chk_status" CHECK (status IN ('Issued', 'Returned', 'Overdue'));
ALTER TABLE "fine" ADD CONSTRAINT "chk_fine" CHECK (fine_amount >= 0);
ALTER TABLE "software" ADD CONSTRAINT "chk_license" CHECK (total_license > 0);

-- Partial Unique Index: Prevent duplicate active loans of the same book by the same member
CREATE UNIQUE INDEX "uq_active_loan" ON "txn"("book_id", "member_id") WHERE return_date IS NULL;

