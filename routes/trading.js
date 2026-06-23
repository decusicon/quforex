var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/stocks', function(req, res, next) {
  res.render('stocks', { title: 'Stocks Trading | Quantora Forex' });
});

/* GET home page. */
router.get('/forex', function(req, res, next) {
  res.render('forex', { title: 'Forex Trading | Quantora Forex' });
});

module.exports = router;
