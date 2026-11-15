const { Router } = require('express');
const softwareController = require('../controllers/software.controller');
const { auth } = require('../middlewares/auth');
const { roleGuard } = require('../middlewares/roleGuard');
const { validate } = require('../middlewares/validate');
const { createSoftwareSchema, updateSoftwareSchema, softwareQuerySchema, expiringSoftwareQuerySchema } = require('../validators/software.schema');
const { idParamSchema } = require('../validators/common.schema');

const router = Router();

router.use(auth);

router.get('/', validate(softwareQuerySchema, 'query'), softwareController.list);
router.get('/expiring', validate(expiringSoftwareQuerySchema, 'query'), softwareController.getExpiring);
router.get('/:id', validate(idParamSchema, 'params'), softwareController.getById);
router.post('/', roleGuard(['Admin']), validate(createSoftwareSchema), softwareController.create);
router.put('/:id', roleGuard(['Admin']), validate(idParamSchema, 'params'), validate(updateSoftwareSchema), softwareController.update);
router.delete('/:id', roleGuard(['Admin']), validate(idParamSchema, 'params'), softwareController.delete);

module.exports = router;
