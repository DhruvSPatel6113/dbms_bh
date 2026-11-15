const { Router } = require('express');
const authRoutes = require('./auth.routes');
const bookRoutes = require('./book.routes');
const memberRoutes = require('./member.routes');
const txnRoutes = require('./txn.routes');
const fineRoutes = require('./fine.routes');
const staffRoutes = require('./staff.routes');
const dealerRoutes = require('./dealer.routes');
const softwareRoutes = require('./software.routes');
const reportRoutes = require('./report.routes');

const router = Router();

router.use('/auth', authRoutes);
router.use('/books', bookRoutes);
router.use('/members', memberRoutes);
router.use('/txns', txnRoutes);
router.use('/fines', fineRoutes);
router.use('/staff', staffRoutes);
router.use('/dealers', dealerRoutes);
router.use('/software', softwareRoutes);
router.use('/reports', reportRoutes);

module.exports = router;

