var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/signin', function (req, res, next) {
  res.render('auth/signin', { title: 'Sign In | Quantora Forex' });
});

/* GET home page. */
router.get('/signup', function (req, res, next) {
  res.render('auth/signup', { title: 'Create Account | Quantora Forex' });
});

/* GET home page. */
router.get('/reset-password', function (req, res, next) {
  res.render('auth/reset-password', { title: 'Reset Password | Quantora Forex' });
});

/* GET home page. */
router.get('/logout', function (req, res, next) {
  res.redirect('/auth/signin');
});

module.exports = router;
