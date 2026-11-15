const { Router } = require('express');
const dealerController = require('../controllers/dealer.controller');
const { auth } = require('../middlewares/auth');
const { roleGuard } = require('../middlewares/roleGuard');
const { validate } = require('../middlewares/validate');
const { createDealerSchema, updateDealerSchema } = require('../validators/dealer.schema');
const { idParamSchema } = require('../validators/common.schema');

const router = Router();

router.use(auth);

router.get('/', dealerController.list);
router.get('/:id', validate(idParamSchema, 'params'), dealerController.getById);
router.post('/', roleGuard(['Admin']), validate(createDealerSchema), dealerController.create);
router.put('/:id', roleGuard(['Admin']), validate(idParamSchema, 'params'), validate(updateDealerSchema), dealerController.update);
router.delete('/:id', roleGuard(['Admin']), validate(idParamSchema, 'params'), dealerController.delete);

module.exports = router;
