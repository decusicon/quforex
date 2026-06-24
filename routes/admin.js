var express = require('express');
var router = express.Router();
var { ensureAuthenticated } = require('../config/auth');

function ensureAdmin(req, res, next) {
  if (req.user && req.user.role === 'admin') return next();
  return res.status(403).render('error', { title: '403 | Quantora Forex', message: 'Forbidden', error: { status: 403, stack: '' } });
}
var Account = require('../database/schemas/account.schemas');
var Deposit = require('../database/schemas/deposit.schemas');
var Withdrawal = require('../database/schemas/withdrawal.schemas');

/* GET home page. */
// Apply authentication and admin checks to all admin routes
router.use(ensureAuthenticated);
router.use(ensureAdmin);

router.get('/', function(req, res, next) {
  res.render('index', { title: 'Admin | Quantora Forex' });
});

router.get('/members', async function (req, res, next) {
  try {
    const members = await Account.find().sort({ created_at: -1 });
    res.render('admin-members', { title: 'Members | Quantora Forex', members });
  } catch (err) {
    next(err);
  }
});

router.post('/members/:memberId/status', async function (req, res, next) {
  try {
    const status = (req.body.status || '').toString().trim().toLowerCase();
    if (!['verified', 'unverified'].includes(status)) {
      return res.redirect('/admin/members');
    }

    await Account.updateOne({ _id: req.params.memberId }, { verified_status: status });
    res.redirect('/admin/members');
  } catch (err) {
    next(err);
  }
});

router.get('/deposits', async function (req, res, next) {
  try {
    const depositEntries = await Deposit.find().populate('user').sort({ created_at: -1 });
    res.render('admin-deposits', { title: 'Deposits | Quantora Forex', depositEntries });
  } catch (err) {
    next(err);
  }
});

router.get('/withdrawals', ensureAuthenticated, async function (req, res, next) {
  try {
    const withdrawalEntries = await Withdrawal.find().populate('user').sort({ created_at: -1 });
    res.render('admin-withdrawals', { title: 'Withdrawals | Quantora Forex', withdrawalEntries });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
