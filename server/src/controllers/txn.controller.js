const txnService = require('../services/txn.service');

exports.issue = async (req, res, next) => {
  try {
    const { bookId, memberId, issueDate, dueDate } = req.body;
    const txn = await txnService.issueBook(bookId, memberId, issueDate, dueDate);
    res.status(201).json({ success: true, data: txn });
  } catch (error) {
    next(error);
  }
};

exports.returnBook = async (req, res, next) => {
  try {
    const txnId = Number(req.params.id);
    const { returnDate } = req.body;
    const result = await txnService.returnBook(txnId, returnDate);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

exports.renewLoan = async (req, res, next) => {
  try {
    const txnId = Number(req.params.id);
    const { asOfDate } = req.body;
    const result = await txnService.renewLoan(txnId, asOfDate);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

exports.listOverdue = async (req, res, next) => {
  try {
    const overdue = await txnService.listOverdue(req.query.asOf);
    res.status(200).json({ success: true, data: overdue });
  } catch (error) {
    next(error);
  }
};

exports.listActive = async (req, res, next) => {
  try {
    const loans = await txnService.listActive(req.query);
    res.status(200).json({ success: true, data: loans });
  } catch (error) {
    next(error);
  }
};

exports.listByMember = async (req, res, next) => {
  try {
    const txns = await txnService.listByMember(Number(req.params.memberId));
    res.status(200).json({ success: true, data: txns });
  } catch (error) {
    next(error);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const txn = await txnService.getById(Number(req.params.id));
    res.status(200).json({ success: true, data: txn });
  } catch (error) {
    next(error);
  }
};
