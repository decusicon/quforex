var express = require('express');
var router = express.Router();
var { ensureAuthenticated } = require('../config/auth');

/* GET home page. */
router.get('/stocks', ensureAuthenticated, function(req, res, next) {
  res.render('stocks', { title: 'Stocks Trading | Quantora Forex' });
});

/* GET home page. */
router.get('/forex', ensureAuthenticated, function(req, res, next) {
  res.render('forex', { title: 'Forex Trading | Quantora Forex' });
});

module.exports = router;
