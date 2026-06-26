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
var Trade = require('../database/schemas/trade.schemas');
var Enquiry = require('../database/schemas/enquiry.schema');

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

router.get('/trades', async function (req, res, next) {
  try {
    const tradeEntries = await Trade.find().populate('user').sort({ created_at: -1 });
    res.render('admin-trades', { title: 'Trades | Quantora Forex', tradeEntries });
  } catch (err) {
    next(err);
  }
});

router.get('/trades/:tradeId', async function (req, res, next) {
  try {
    const trade = await Trade.findById(req.params.tradeId).populate('user');
    if (!trade) return res.redirect('/admin/trades');
    res.render('admin-trade', { title: 'Trade | Quantora Forex', trade });
  } catch (err) {
    next(err);
  }
});

router.post('/trades/:tradeId/update', async function (req, res, next) {
  try {
    const trade = await Trade.findById(req.params.tradeId);
    if (!trade) return res.redirect('/admin/trades');
    if (trade.traded_status === 'completed') return res.redirect('/admin/trades/' + req.params.tradeId);

    const stopLossRaw = typeof req.body.stopLoss !== 'undefined' ? req.body.stopLoss.trim() : undefined;
    const takeProfitRaw = typeof req.body.takeProfit !== 'undefined' ? req.body.takeProfit.trim() : undefined;
    const invalidFields = [];

    if (typeof stopLossRaw !== 'undefined' && stopLossRaw !== '' && !Number.isFinite(Number(stopLossRaw))) {
      invalidFields.push('Stop Loss');
    }
    if (typeof takeProfitRaw !== 'undefined' && takeProfitRaw !== '' && !Number.isFinite(Number(takeProfitRaw))) {
      invalidFields.push('Take Profit');
    }

    if (invalidFields.length) {
      if (req.session) {
        req.session.flash = {
          error: invalidFields.join(' and ') + ' must be valid numbers.',
        };
      }
      return res.redirect('/admin/trades/' + req.params.tradeId);
    }

    const updates = {};
    let balanceDelta = 0;
    const account = await Account.findById(trade.user);
    const currentBalance = account ? parseFloat(account.balance) : NaN;

    if (typeof stopLossRaw !== 'undefined' && stopLossRaw !== trade.stop_loss) {
      const oldValue = parseFloat(trade.stop_loss);
      const newValue = parseFloat(stopLossRaw);
      if (Number.isFinite(oldValue) && Number.isFinite(newValue)) {
        balanceDelta += newValue - oldValue;
      }
      updates.stop_loss = stopLossRaw;
    }

    if (typeof takeProfitRaw !== 'undefined' && takeProfitRaw !== trade.take_profit) {
      const oldValue = parseFloat(trade.take_profit);
      const newValue = parseFloat(takeProfitRaw);
      if (Number.isFinite(oldValue) && Number.isFinite(newValue)) {
        balanceDelta += newValue - oldValue;
      }
      updates.take_profit = takeProfitRaw;
    }

    if (typeof req.body.execution_type !== 'undefined') updates.execution_type = req.body.execution_type;
    if (typeof req.body.traded_status !== 'undefined') updates.traded_status = req.body.traded_status;

    if (Object.keys(updates).length) {
      await Trade.updateOne({ _id: req.params.tradeId }, updates);
    }

    if (!Number.isNaN(currentBalance) && balanceDelta !== 0 && account) {
      const newBalance = currentBalance + balanceDelta;
      await Account.updateOne({ _id: account._id }, { balance: String(newBalance.toFixed(8)) });
    }

    if (req.session) {
      req.session.flash = {
        success: 'Trade updated successfully.' + (balanceDelta !== 0 ? ' Account balance adjusted.' : ''),
      };
    }

    res.redirect('/admin/trades/' + req.params.tradeId);
  } catch (err) {
    next(err);
  }
});

router.post('/trades/:tradeId/execute', async function (req, res, next) {
  try {
    await Trade.updateOne({ _id: req.params.tradeId }, { traded_status: 'completed' });
    res.redirect('/admin/trades');
  } catch (err) {
    next(err);
  }
});

router.post('/trades/:tradeId/close', async function (req, res, next) {
  try {
    await Trade.updateOne({ _id: req.params.tradeId }, { traded_status: 'closed' });
    res.redirect('/admin/trades');
  } catch (err) {
    next(err);
  }
});

router.post('/trades/:tradeId/cancel', async function (req, res, next) {
  try {
    await Trade.updateOne({ _id: req.params.tradeId }, { traded_status: 'canceled' });
    res.redirect('/admin/trades');
  } catch (err) {
    next(err);
  }
});

router.post('/trades/:tradeId/delete', async function (req, res, next) {
  try {
    await Trade.deleteOne({ _id: req.params.tradeId });
    res.redirect('/admin/trades');
  } catch (err) {
    next(err);
  }
});

router.get('/enquiries', async function (req, res, next) {
  try {
    const enquiries = await Enquiry.find().sort({ created_at: -1 });
    res.render('admin-enquiries', { title: 'Enquiries | Quantora Forex', enquiries });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
