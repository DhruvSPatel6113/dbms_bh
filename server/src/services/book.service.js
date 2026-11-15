const prisma = require('../config/db');
const { isValidISBN } = require('../utils/isbn');
const { AppError } = require('../utils/AppError');
const { mapDbError } = require('../utils/dbErrors');

exports.search = async ({ q, category, author, isbn, page = 1, limit = 20 }) => {
  const take = Math.max(1, Number(limit));
  const skip = Math.max(0, (Number(page) - 1) * take);

  const where = {};
  if (q) {
    where.OR = [
      { title: { contains: q, mode: 'insensitive' } },
      { author: { contains: q, mode: 'insensitive' } },
      { isbn: { contains: q } }
    ];
  }
  if (category) {
    where.category = { equals: category, mode: 'insensitive' };
  }
  if (author) {
    where.author = { contains: author, mode: 'insensitive' };
  }
  if (isbn) {
    where.isbn = { contains: isbn };
  }

  const [items, total] = await Promise.all([
    prisma.book.findMany({
      where,
      skip,
      take,
      orderBy: { bookId: 'desc' }
    }),
    prisma.book.count({ where })
  ]);

  return {
    items,
    pagination: {
      total,
      page: Number(page),
      limit: take,
      totalPages: Math.ceil(total / take)
    }
  };
};

exports.getById = async (bookId) => {
  const book = await prisma.book.findUnique({
    where: { bookId }
  });
  if (!book) {
    throw new AppError('Book not found', 404, 'BOOK_NOT_FOUND');
  }
  return book;
};

exports.create = async (data) => {
  if (!isValidISBN(data.isbn)) {
    throw new AppError('Invalid ISBN checksum or format', 422, 'INVALID_ISBN');
  }

  const pubDate = new Date(data.dateOfPublish);
  if (pubDate > new Date()) {
    throw new AppError('Publication date cannot be in the future', 422, 'FUTURE_PUBLICATION_DATE');
  }

  const existing = await prisma.book.findUnique({
    where: { isbn: data.isbn.replace(/[-\s]/g, '') }
  });
  if (existing) {
    throw new AppError('A book with this ISBN already exists', 409, 'DUPLICATE_ISBN');
  }

  try {
    const total = Number(data.totalCopies);
    return await prisma.book.create({
      data: {
        title: data.title,
        author: data.author,
        isbn: data.isbn.replace(/[-\s]/g, ''),
        category: data.category,
        totalCopies: total,
        avlCopies: total, // invariant: on creation avl == total
        publication: data.publication,
        dateOfPublish: pubDate,
        cost: data.cost
      }
    });
  } catch (error) {
    throw mapDbError(error);
  }
};

exports.update = async (bookId, data) => {
  try {
    return await prisma.$transaction(async (tx) => {
      const [existing] = await tx.$queryRaw`SELECT * FROM book WHERE book_id = ${bookId} FOR UPDATE`;
      if (!existing) {
        throw new AppError('Book not found', 404, 'BOOK_NOT_FOUND');
      }
      const updateData = { ...data };
      if (data.dateOfPublish) {
        const pubDate = new Date(data.dateOfPublish);
        if (pubDate > new Date()) {
          throw new AppError('Publication date cannot be in the future', 422, 'FUTURE_PUBLICATION_DATE');
        }
        updateData.dateOfPublish = pubDate;
      }
      if (data.totalCopies !== undefined) {
        const onLoan = existing.total_copies - existing.avl_copies;
        if (Number(data.totalCopies) < onLoan) {
          throw new AppError(`Cannot reduce total copies below active loans (${onLoan})`, 409, 'TOTAL_BELOW_ON_LOAN');
        }
        updateData.avlCopies = Number(data.totalCopies) - onLoan;
      }
      return tx.book.update({ where: { bookId }, data: updateData });
    });
  } catch (error) {
    throw mapDbError(error);
  }
};

exports.delete = async (bookId) => {
  const activeTxn = await prisma.txn.findFirst({
    where: { bookId }
  });
  if (activeTxn) {
    throw new AppError('Cannot delete book with existing loan history', 409, 'BOOK_HAS_TRANSACTIONS');
  }

  try {
    return await prisma.book.delete({
      where: { bookId }
    });
  } catch (error) {
    throw mapDbError(error);
  }
};
