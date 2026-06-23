var express = require('express');
var router = express.Router();
var { ensureAuthenticated } = require('../config/auth');

/* GET home page. */
router.get('/', ensureAuthenticated, function(req, res, next) {
  res.render('index', { title: 'Admin | Quantora Forex' });
});

module.exports = router;
