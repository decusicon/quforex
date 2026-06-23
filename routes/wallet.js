var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('settings-wallet', { title: 'Wallets | Quantora Forex' });
});

module.exports = router;
