const { Router } = require('express');
const fineController = require('../controllers/fine.controller');
const { auth } = require('../middlewares/auth');
const { roleGuard } = require('../middlewares/roleGuard');
const { validate } = require('../middlewares/validate');
const { calculateFineSchema, payFineSchema, waiveFineSchema, fineQuerySchema } = require('../validators/fine.schema');
const { idParamSchema, memberIdParamSchema } = require('../validators/common.schema');

const router = Router();

router.use(auth);

router.get('/member/:memberId/outstanding', validate(memberIdParamSchema, 'params'), fineController.getOutstanding);
router.get('/', validate(fineQuerySchema, 'query'), fineController.list);
router.get('/:id', validate(idParamSchema, 'params'), fineController.getById);
router.post('/calculate', roleGuard(['Admin', 'Librarian']), validate(calculateFineSchema), fineController.calculate);
router.post('/:id/pay', roleGuard(['Admin', 'Librarian']), validate(idParamSchema, 'params'), validate(payFineSchema), fineController.pay);
router.post('/:id/waive', roleGuard(['Admin']), validate(idParamSchema, 'params'), validate(waiveFineSchema), fineController.waive);

module.exports = router;
