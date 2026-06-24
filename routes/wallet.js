var express = require('express');
var router = express.Router();
var { ensureAuthenticated } = require('../config/auth');
var Deposit = require('../database/schemas/deposit.schemas');
var Withdrawal = require('../database/schemas/withdrawal.schemas');
var Account = require('../database/schemas/account.schemas');
var { WithdrawalAddressTypes, WithdrawalAddressDetailsTypes } = require('../utils/constants');

// ===== DEPOSIT ROUTES =====

/* GET wallet page. */
router.get('/', ensureAuthenticated, async function (req, res, next) {
  try {
    const query = req.user.role === 'admin' ? {} : { user: req.user._id };
    let depositQuery = Deposit.find(query).sort({ created_at: -1 });

    if (req.user.role === 'admin') {
      depositQuery = depositQuery.populate('user', 'firstname lastname email');
    }

    const depositEntries = await depositQuery.lean();
    const showWalletCard = req.query.showWalletCard === '1' && req.session.showWalletCard;

    // fetch withdrawals matching same visibility rules (admin sees all)
    let withdrawalQuery = Withdrawal.find(query).sort({ created_at: -1 });
    if (req.user.role === 'admin') {
      withdrawalQuery = withdrawalQuery.populate('user', 'firstname lastname email');
    }
    const withdrawalEntries = await withdrawalQuery.lean();

    if (req.query.showWalletCard === '1' && !req.session.showWalletCard) {
      return res.redirect('/wallet');
    }

    const withdrawError = req.session.withdrawError || null;
    req.session.withdrawError = null;
    req.session.showWalletCard = false;

    res.render('settings-wallet', {
      title: 'Wallet | Quantora Forex',
      depositEntries,
      withdrawalEntries,
      showWalletCard,
      withdrawalMethods: Object.values(WithdrawalAddressTypes),
      withdrawError,
    });
  } catch (err) {
    next(err);
  }
});

/* POST deposit entry. */
router.post('/deposit', ensureAuthenticated, async function (req, res, next) {
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
router.post('/confirm-deposit/:depositId', ensureAuthenticated, async function (req, res, next) {
  try {
    if (req.user.role !== 'admin') {
      const msg = 'Admin access required';
      req.session.withdrawError = msg;
      return res.redirect('/wallet');
    }

    const deposit = await Deposit.findById(req.params.depositId);
    if (!deposit) {
      const msg = 'Deposit not found';
      req.session.withdrawError = msg;
      return res.redirect('/wallet');
    }

    if (deposit.confirmation_status === 'completed') {
      return res.redirect('/wallet');
    }

    const user = await Account.findById(deposit.user);
    if (!user) {
      const msg = 'User account not found';
      req.session.withdrawError = msg;
      return res.redirect('/wallet');
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
router.get('/delete-deposit/:depositId', ensureAuthenticated, async function (req, res, next) {
  try {
    const query = req.user.role === 'admin'
      ? { _id: req.params.depositId }
      : { _id: req.params.depositId, user: req.user._id };

    const deleted = await Deposit.findOneAndDelete(query);
    if (!deleted) {
      const msg = 'Deposit not found or access denied';
      req.session.withdrawError = msg;
      return res.redirect('/wallet');
    }

    res.redirect('/wallet');
  } catch (err) {
    next(err);
  }
});

// ===== WITHDRAWAL ROUTES =====


/* POST prepare withdraw request. */
router.post('/withdraw/prepare', ensureAuthenticated, async function (req, res, next) {
  try {
    const { amount, method } = req.body;
    if (!amount || !method) {
      const msg = 'Withdrawal amount and method are required.';
      req.session.withdrawError = msg;
      return res.redirect('/wallet');
    }

    const normalizedMethod = method.toString().trim();
    if (!Object.values(WithdrawalAddressTypes).includes(normalizedMethod)) {
      const msg = 'Invalid withdrawal method.';
      req.session.withdrawError = msg;
      return res.redirect('/wallet');
    }

    const parsedAmount = parseFloat(amount);
    const currentBalance = parseFloat(req.user.balance) || 0;

    if (isNaN(parsedAmount) || parsedAmount < 10) {
      const msg = 'Withdrawal amount must be at least 10.';
      req.session.withdrawError = msg;
      return res.redirect('/wallet');
    }

    if (parsedAmount > currentBalance) {
      const msg = 'Withdrawal amount cannot exceed your available balance.';
      req.session.withdrawError = msg;
      return res.redirect('/wallet');
    }

    req.session.pendingWithdrawal = {
      amount: parsedAmount.toString(),
      method: normalizedMethod,
    };

    res.json({ redirect: '/wallet/withdraw' });
  } catch (err) {
    next(err);
  }
});

/* GET withdraw address collection page. */
router.get('/withdraw', ensureAuthenticated, async function (req, res, next) {
  try {
    const pendingWithdrawal = req.session.pendingWithdrawal;
    if (!pendingWithdrawal || !pendingWithdrawal.amount || !pendingWithdrawal.method) {
      return res.redirect('/wallet');
    }

    res.render('wallet-withdraw', {
      title: 'Withdraw Funds | Quantora Forex',
      amount: pendingWithdrawal.amount,
      method: pendingWithdrawal.method,
      withdrawalMethods: Object.values(WithdrawalAddressTypes),
      withdrawalDetailsTypes: WithdrawalAddressDetailsTypes,
      error: null,
    });
  } catch (err) {
    next(err);
  }
});

/* POST finalize withdrawal request. */
router.post('/withdraw', ensureAuthenticated, async function (req, res, next) {
  try {
    const pendingWithdrawal = req.session.pendingWithdrawal;
    if (!pendingWithdrawal || !pendingWithdrawal.amount) {
      return res.redirect('/wallet');
    }

    const method = req.body.method ? req.body.method.toString().trim() : pendingWithdrawal.method;
    const amount = pendingWithdrawal.amount;

    if (!Object.values(WithdrawalAddressTypes).includes(method)) {
      return res.render('wallet-withdraw', {
        title: 'Withdraw Funds | Quantora Forex',
        amount,
        method: pendingWithdrawal.method,
        withdrawalMethods: Object.values(WithdrawalAddressTypes),
        withdrawalDetailsTypes: WithdrawalAddressDetailsTypes,
        error: 'Invalid withdrawal method selected.',
      });
    }

    const requiredFields = {
      [WithdrawalAddressTypes.BITCOIN]: ['bitcoin_address'],
      [WithdrawalAddressTypes.PERFECTMONEY]: ['account_number', 'account_name'],
      [WithdrawalAddressTypes.WIRETRANSFER]: ['account_no', 'account_name', 'bank_name', 'swift_code', 'routing_number', 'bank_address'],
    };

    const addressFields = requiredFields[method];
    const addressDetails = {};
    let missingField = null;

    addressFields.forEach(function (field) {
      const value = (req.body[field] || '').toString().trim();
      if (!value && !missingField) {
        missingField = field;
      }
      addressDetails[field] = value;
    });

    if (missingField) {
      return res.render('wallet-withdraw', {
        title: 'Withdraw Funds | Quantora Forex',
        amount,
        method,
        withdrawalMethods: Object.values(WithdrawalAddressTypes),
        withdrawalDetailsTypes: WithdrawalAddressDetailsTypes,
        error: 'Please fill in the required withdrawal address details.',
      });
    }

    await Withdrawal.create({
      user: req.user._id,
      amount: amount.toString(),
      method,
      address_details: addressDetails,
    });

    req.session.pendingWithdrawal = null;
    res.redirect('/wallet');
  } catch (err) {
    next(err);
  }
});

/* POST approve withdrawal. */
router.post('/approve-withdrawal/:withdrawalId', ensureAuthenticated, async function (req, res, next) {
  try {
    if (req.user.role !== 'admin') {
      const msg = 'Admin access required';
      req.session.withdrawError = msg;
      return res.redirect('/wallet');
    }

    const withdrawal = await Withdrawal.findById(req.params.withdrawalId);
    if (!withdrawal) {
      const msg = 'Withdrawal not found';
      req.session.withdrawError = msg;
      return res.redirect('/wallet');
    }

    if (withdrawal.confirmation_status === 'completed') {
      return res.redirect('/wallet');
    }

    const user = await Account.findById(withdrawal.user);
    if (!user) {
      const msg = 'User account not found';
      req.session.withdrawError = msg;
      return res.redirect('/wallet');
    }

    const currentBalance = parseFloat(user.balance) || 0;
    const withdrawalAmount = parseFloat(withdrawal.amount) || 0;
    if (withdrawalAmount > currentBalance) {
      const msg = 'Insufficient balance to approve withdrawal.';
      req.session.withdrawError = msg;
      return res.redirect('/wallet');
    }

    const newBalance = currentBalance - withdrawalAmount;

    await Account.updateOne(
      { _id: withdrawal.user },
      { balance: newBalance.toString() }
    );

    await Withdrawal.updateOne(
      { _id: req.params.withdrawalId },
      { confirmation_status: 'completed' }
    );

    res.redirect('/wallet');
  } catch (err) {
    next(err);
  }
});

/* GET withdrawal detail page. */
router.get('/withdrawal/:withdrawalId', ensureAuthenticated, async function (req, res, next) {
  try {
    const withdrawal = await Withdrawal.findById(req.params.withdrawalId).lean();
    if (!withdrawal) {
      return res.status(404).send('Withdrawal not found');
    }

    // access control: admin sees all, members see only their own
    if (req.user.role !== 'admin' && withdrawal.user.toString() !== req.user._id.toString()) {
      return res.status(403).send('Access denied');
    }

    const canCancel = (req.user.role === 'admin' || withdrawal.user.toString() === req.user._id.toString()) && withdrawal.confirmation_status !== 'completed';

    res.render('wallet-withdrawal-detail', {
      title: 'Withdrawal Details | Quantora Forex',
      entry: withdrawal,
      canCancel,
    });
  } catch (err) {
    next(err);
  }
});

/* GET delete/cancel withdrawal. */
router.get('/delete-withdrawal/:withdrawalId', ensureAuthenticated, async function (req, res, next) {
  try {
    const id = req.params.withdrawalId;
    let query;
    if (req.user.role === 'admin') {
      query = { _id: id };
    } else {
      query = { _id: id, user: req.user._id, confirmation_status: { $ne: 'completed' } };
    }

    const deleted = await Withdrawal.findOneAndDelete(query);
    if (!deleted) {
      const msg = 'Withdrawal not found or access denied';
      req.session.withdrawError = msg;
      return res.redirect('/wallet');
    }

    res.redirect('/wallet');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
