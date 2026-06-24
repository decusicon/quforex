var express = require('express');
var router = express.Router();
var { ensureAuthenticated } = require('../config/auth');
var Deposit = require('../database/schemas/deposit.schemas');
var Account = require('../database/schemas/account.schemas');

/* GET wallet page. */
router.get('/', ensureAuthenticated, async function(req, res, next) {
  try {
    const query = req.user.role === 'admin' ? {} : { user: req.user._id };
    let depositQuery = Deposit.find(query).sort({ created_at: -1 });

    if (req.user.role === 'admin') {
      depositQuery = depositQuery.populate('user', 'firstname lastname email');
    }

    const depositEntries = await depositQuery.lean();
    const showWalletCard = req.query.showWalletCard === '1' && req.session.showWalletCard;

    if (req.query.showWalletCard === '1' && !req.session.showWalletCard) {
      return res.redirect('/wallet');
    }

    req.session.showWalletCard = false;

    res.render('settings-wallet', {
      title: 'Wallet | Quantora Forex',
      depositEntries,
      showWalletCard,
    });
  } catch (err) {
    next(err);
  }
});

/* POST deposit entry. */
router.post('/deposit', ensureAuthenticated, async function(req, res, next) {
  try {
    const { amount, method } = req.body;
    if (!amount || !method) {
      req.session.showWalletCard = false;
      return res.redirect('/wallet');
    }
    
    await Deposit.create({
      user: req.user._id,
      amount: amount.toString().trim(),
      method: method.toString().trim(),
    });

    req.session.showWalletCard = true;
    res.redirect('/wallet?showWalletCard=1');
  } catch (err) {
    next(err);
  }
});

/* POST confirm deposit. */
router.post('/confirm-deposit/:depositId', ensureAuthenticated, async function(req, res, next) {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const deposit = await Deposit.findById(req.params.depositId);
    if (!deposit) {
      return res.status(404).json({ error: 'Deposit not found' });
    }

    if (deposit.confirmation_status === 'completed') {
      return res.redirect('/wallet');
    }

    const user = await Account.findById(deposit.user);
    if (!user) {
      return res.status(404).json({ error: 'User account not found' });
    }

    const currentBalance = parseFloat(user.balance) || 0;
    const depositAmount = parseFloat(deposit.amount) || 0;
    const newBalance = currentBalance + depositAmount;

    await Account.updateOne(
      { _id: deposit.user },
      { balance: newBalance.toString() }
    );

    await Deposit.updateOne(
      { _id: req.params.depositId },
      { confirmation_status: 'completed' }
    );

    res.redirect('/wallet');
  } catch (err) {
    next(err);
  }
});

/* GET delete deposit. */
router.get('/delete-deposit/:depositId', ensureAuthenticated, async function(req, res, next) {
  try {
    const query = req.user.role === 'admin'
      ? { _id: req.params.depositId }
      : { _id: req.params.depositId, user: req.user._id };

    const deleted = await Deposit.findOneAndDelete(query);
    if (!deleted) {
      return res.status(404).json({ error: 'Deposit not found or access denied' });
    }

    res.redirect('/wallet');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
