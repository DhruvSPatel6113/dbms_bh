const bookService = require('../services/book.service');
const googleBooksService = require('../services/googleBooks.service');

exports.list = async (req, res, next) => {
  try {
    const books = await bookService.search(req.query);
    res.status(200).json({ success: true, data: books });
  } catch (error) {
    next(error);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const book = await bookService.getById(Number(req.params.id));
    res.status(200).json({ success: true, data: book });
  } catch (error) {
    next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    const book = await bookService.create(req.body);
    res.status(201).json({ success: true, data: book });
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const book = await bookService.update(Number(req.params.id), req.body);
    res.status(200).json({ success: true, data: book });
  } catch (error) {
    next(error);
  }
};

exports.delete = async (req, res, next) => {
  try {
    await bookService.delete(Number(req.params.id));
    res.status(200).json({ success: true, message: 'Book deleted successfully' });
  } catch (error) {
    next(error);
  }
};

exports.lookupISBN = async (req, res, next) => {
  try {
    const metadata = await googleBooksService.lookup(req.params.isbn);
    res.status(200).json({ success: true, data: metadata });
  } catch (error) {
    next(error);
  }
};

