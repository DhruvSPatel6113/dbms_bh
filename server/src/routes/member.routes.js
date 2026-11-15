const { Router } = require('express');
const memberController = require('../controllers/member.controller');
const { auth } = require('../middlewares/auth');
const { roleGuard } = require('../middlewares/roleGuard');
const { validate } = require('../middlewares/validate');
const { createMemberSchema, updateMemberSchema, renewMemberSchema, queryMemberSchema } = require('../validators/member.schema');
const { idParamSchema } = require('../validators/common.schema');

const router = Router();

router.use(auth);

router.get('/', validate(queryMemberSchema, 'query'), memberController.list);
router.get('/:id', validate(idParamSchema, 'params'), memberController.getById);
router.post('/', roleGuard(['Admin', 'Librarian']), validate(createMemberSchema), memberController.create);
router.put('/:id', roleGuard(['Admin', 'Librarian']), validate(idParamSchema, 'params'), validate(updateMemberSchema), memberController.update);
router.post('/:id/renew', roleGuard(['Admin', 'Librarian']), validate(idParamSchema, 'params'), validate(renewMemberSchema), memberController.renew);
router.delete('/:id', roleGuard(['Admin']), validate(idParamSchema, 'params'), memberController.delete);

module.exports = router;
