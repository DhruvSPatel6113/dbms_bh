const { AppError } = require('./AppError');

/**
 * Maps database exceptions and custom trigger codes into structured AppErrors.
 */
function mapDbError(error) {
  if (error instanceof AppError) {
    return error;
  }

  const msg = error.message || '';

  // Trigger: BEFORE INSERT ON txn
  if (msg.includes('BOOK_NOT_FOUND')) {
    return new AppError('The requested book ID does not exist', 404, 'BOOK_NOT_FOUND');
  }
  if (msg.includes('NO_COPIES_AVAILABLE')) {
    return new AppError('No copies available for issue', 409, 'NO_COPIES_AVAILABLE');
  }
  if (msg.includes('MEMBER_NOT_FOUND')) {
    return new AppError('The requested member ID was not found', 404, 'MEMBER_NOT_FOUND');
  }
  if (msg.includes('MEMBER_NOT_ACTIVE')) {
    return new AppError('Member account is suspended or inactive', 422, 'MEMBER_NOT_ACTIVE');
  }
  if (msg.includes('MEMBERSHIP_EXPIRED')) {
    return new AppError('Membership expired prior to requested issue date', 422, 'MEMBERSHIP_EXPIRED');
  }
  if (msg.includes('LOAN_LIMIT_REACHED')) {
    return new AppError('Member has reached the maximum active borrowing quota', 422, 'LOAN_LIMIT_REACHED');
  }
  if (msg.includes('UNPAID_FINES_EXCEED_LIMIT')) {
    return new AppError('Member has unpaid fines exceeding Rs. 100', 422, 'UNPAID_FINES_EXCEED_LIMIT');
  }

  // Trigger: BEFORE/AFTER UPDATE OF return_date ON txn
  if (msg.includes('ALREADY_RETURNED')) {
    return new AppError('This book has already been marked as returned', 409, 'ALREADY_RETURNED');
  }
  if (msg.includes('RETURN_BEFORE_ISSUE')) {
    return new AppError('Return date cannot be earlier than issue date', 422, 'RETURN_BEFORE_ISSUE');
  }

  // Trigger: BEFORE UPDATE OF total_copies ON book
  if (msg.includes('TOTAL_BELOW_ON_LOAN')) {
    return new AppError('Cannot decrease total copies below currently issued copies', 409, 'TOTAL_BELOW_ON_LOAN');
  }
  if (msg.includes('INVALID_COPY_COUNT')) {
    return new AppError('Invalid copy count configuration', 422, 'INVALID_COPY_COUNT');
  }

  // Procedure: sp_pay_fine
  if (msg.includes('FINE_NOT_PAYABLE')) {
    return new AppError('Fine is not payable (already paid, waived, or invalid ID)', 409, 'FINE_NOT_PAYABLE');
  }

  // Prisma Unique Constraint Violations (P2002)
  if (error.code === 'P2002') {
    const target = error.meta?.target || [];
    if (target.includes('isbn') || msg.includes('book_isbn_key')) {
      return new AppError('A book with this ISBN already exists', 409, 'DUPLICATE_ISBN');
    }
    if (target.includes('email') || msg.includes('member_email_key')) {
      return new AppError('A member with this email already exists', 409, 'DUPLICATE_EMAIL');
    }
    if (msg.includes('uq_active_loan')) {
      return new AppError('Member currently holds an active loan of this book', 409, 'DUPLICATE_ACTIVE_LOAN');
    }
    return new AppError('Unique constraint violation', 409, 'DUPLICATE_RECORD');
  }

  // Prisma Foreign Key Violations (P2003)
  if (error.code === 'P2003') {
    return new AppError('Foreign key reference violation', 409, 'FOREIGN_KEY_VIOLATION');
  }

  // Fallback internal error
  console.error('[dbErrors] Unhandled Database Error:', error);
  return new AppError('An unexpected database error occurred', 500, 'DATABASE_ERROR');
}

module.exports = {
  mapDbError
};

