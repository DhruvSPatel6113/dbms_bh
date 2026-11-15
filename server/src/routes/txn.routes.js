const { Router } = require('express');
const txnController = require('../controllers/txn.controller');
const { auth } = require('../middlewares/auth');
const { roleGuard } = require('../middlewares/roleGuard');
const { validate } = require('../middlewares/validate');
const { issueBookSchema, returnBookSchema, renewTxnSchema, activeLoanQuerySchema, overdueQuerySchema } = require('../validators/txn.schema');
const { idParamSchema, memberIdParamSchema } = require('../validators/common.schema');

const router = Router();

router.use(auth);

router.get('/overdue', validate(overdueQuerySchema, 'query'), txnController.listOverdue);
router.get('/active', validate(activeLoanQuerySchema, 'query'), txnController.listActive);
router.get('/member/:memberId', validate(memberIdParamSchema, 'params'), txnController.listByMember);
router.get('/:id', validate(idParamSchema, 'params'), txnController.getById);
router.post('/issue', roleGuard(['Admin', 'Librarian']), validate(issueBookSchema), txnController.issue);
router.post('/:id/return', roleGuard(['Admin', 'Librarian']), validate(idParamSchema, 'params'), validate(returnBookSchema), txnController.returnBook);
router.post('/:id/renew', roleGuard(['Admin', 'Librarian']), validate(idParamSchema, 'params'), validate(renewTxnSchema), txnController.renewLoan);

module.exports = router;
