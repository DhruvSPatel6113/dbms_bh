const { Router } = require('express');
const bookController = require('../controllers/book.controller');
const { auth } = require('../middlewares/auth');
const { roleGuard } = require('../middlewares/roleGuard');
const { validate } = require('../middlewares/validate');
const { createBookSchema, updateBookSchema, queryBookSchema } = require('../validators/book.schema');
const { idParamSchema } = require('../validators/common.schema');

const router = Router();

router.use(auth);

router.get('/', validate(queryBookSchema, 'query'), bookController.list);
router.get('/lookup/:isbn', bookController.lookupISBN);
router.get('/:id', validate(idParamSchema, 'params'), bookController.getById);
router.post('/', roleGuard(['Admin', 'Librarian']), validate(createBookSchema), bookController.create);
router.put('/:id', roleGuard(['Admin', 'Librarian']), validate(idParamSchema, 'params'), validate(updateBookSchema), bookController.update);
router.delete('/:id', roleGuard(['Admin']), validate(idParamSchema, 'params'), bookController.delete);

module.exports = router;
