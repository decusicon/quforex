var express = require('express');
var router = express.Router();
var { ensureAuthenticated } = require('../config/auth');
var Trade = require('../database/schemas/trade.schemas');
var { TRADE_EXECUTION_TYPES } = require('../utils/enums');

/* GET home page. */
router.get('/stocks', ensureAuthenticated, function(req, res, next) {
  res.render('stocks', { title: 'Stocks Trading | Quantora Forex' });
});

/* GET home page. */
router.get('/forex', ensureAuthenticated, function(req, res, next) {
  res.render('forex', { title: 'Forex Trading | Quantora Forex' });
});

/* POST market order (buy/sell) */
router.post('/market', ensureAuthenticated, function(req, res, next) {
  const { volume, execType, symbol, stopLoss, takeProfit, comment, tradeType } = req.body || {};

  const executionTypeValue = (execType && TRADE_EXECUTION_TYPES.includes(execType)) ? execType : TRADE_EXECUTION_TYPES[0];

  const tradeData = {
    user: req.user && (req.user._id || req.user.id),
    volume: volume ? String(volume) : '0',
    trade_type: tradeType === 'sell' ? 'sell' : 'buy',
    symbol: symbol || '',
    stop_loss: stopLoss ? String(stopLoss) : undefined,
    take_profit: takeProfit ? String(takeProfit) : undefined,
    comment: comment || 'No comment',
    execution_type: executionTypeValue,
    time_to_exp: new Date(Date.now() + 24 * 60 * 60 * 1000),
  };

  const tradeDoc = new Trade(tradeData);
  tradeDoc
    .save()
    .then((saved) => {
      console.log('Market trade saved:', saved._id);
      if (req.session) req.session.flash = { success: 'Market order placed successfully.' };
      return res.redirect('back');
    })
    .catch((err) => {
      console.error('Error saving trade:', err);
      if (req.session) req.session.flash = { error: 'Failed to place market order.' };
      return res.redirect('back');
    });
});

module.exports = router;
