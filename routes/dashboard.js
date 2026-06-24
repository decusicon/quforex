var express = require('express');
var router = express.Router();
var { ensureAuthenticated } = require('../config/auth');
var Trade = require('../database/schemas/trade.schemas');

/* GET home page. */
router.get('/', ensureAuthenticated, function(req, res, next) {
  const userId = req.user && (req.user._id || req.user.id);

  if (!userId) return res.render('dashboard', { title: 'Dashboard | Quantora Forex', openTrades: [], closedTrades: [], historyTrades: [] });

  const openQuery = Trade.find({ user: userId, traded_status: 'open' }).sort({ created_at: -1 }).lean();
  const closedQuery = Trade.find({ user: userId, traded_status: 'closed' }).sort({ created_at: -1 }).lean();
  const historyQuery = Trade.find({ user: userId }).sort({ created_at: -1 }).lean();

  Promise.all([openQuery, closedQuery, historyQuery])
    .then(([openTrades, closedTrades, historyTrades]) => {
      res.render('dashboard', { title: 'Dashboard | Quantora Forex', openTrades, closedTrades, historyTrades });
    })
    .catch((err) => {
      console.error('Error loading trades for dashboard:', err);
      res.render('dashboard', { title: 'Dashboard | Quantora Forex', openTrades: [], closedTrades: [], historyTrades: [] });
    });
});

module.exports = router;
