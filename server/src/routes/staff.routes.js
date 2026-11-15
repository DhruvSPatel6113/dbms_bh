const { Router } = require('express');
const staffController = require('../controllers/staff.controller');
const { auth } = require('../middlewares/auth');
const { roleGuard } = require('../middlewares/roleGuard');
const { validate } = require('../middlewares/validate');
const { createStaffSchema, updateStaffSchema } = require('../validators/staff.schema');
const { idParamSchema } = require('../validators/common.schema');

const router = Router();

router.use(auth);

router.get('/', roleGuard(['Admin']), staffController.list);
router.get('/:id', roleGuard(['Admin']), validate(idParamSchema, 'params'), staffController.getById);
router.post('/', roleGuard(['Admin']), validate(createStaffSchema), staffController.create);
router.put('/:id', roleGuard(['Admin']), validate(idParamSchema, 'params'), validate(updateStaffSchema), staffController.update);
router.delete('/:id', roleGuard(['Admin']), validate(idParamSchema, 'params'), staffController.delete);

module.exports = router;
