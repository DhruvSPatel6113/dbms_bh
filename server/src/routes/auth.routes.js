const { Router } = require('express');
const authController = require('../controllers/auth.controller');
const { auth } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');
const { loginSchema, signupSchema, updateProfileSchema } = require('../validators/auth.schema');

const router = Router();

router.post('/login', validate(loginSchema), authController.login);
router.post('/signup', validate(signupSchema), authController.signup);
router.get('/profile', auth, authController.profile);
router.patch('/profile', auth, validate(updateProfileSchema), authController.updateProfile);

module.exports = router;
