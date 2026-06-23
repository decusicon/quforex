var express = require('express');
var passport = require('passport');
var bcrypt = require('bcryptjs');
var router = express.Router();
var Account = require('../database/schemas/account.schemas');

/* GET sign in page. */
router.get('/signin', function (req, res, next) {
  res.render('auth/signin', { title: 'Sign In | Quantora Forex' });
});

/* GET sign up page. */
router.get('/signup', function (req, res, next) {
  res.render('auth/signup', { title: 'Create Account | Quantora Forex' });
});

/* POST sign up. */
router.post('/signup', async function (req, res, next) {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      confirmPassword,
      country,
      phone,
      currency,
    } = req.body;

    if (!firstName || !lastName || !email || !password || !confirmPassword || !country || !phone || !currency) {
      return res.redirect('/auth/signup');
    }

    if (password !== confirmPassword) {
      return res.redirect('/auth/signup');
    }

    const existingAccount = await Account.findOne({ email: email.toLowerCase().trim() });
    if (existingAccount) {
      return res.redirect('/auth/signup');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newAccount = new Account({
      role: 'member',
      firstname: firstName.trim(),
      lastname: lastName.trim(),
      country: country.trim(),
      phone: phone.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      currency: currency.trim(),
      balance: '0',
      member_id: `QTFX-${Date.now()}`,
    });

    await newAccount.save();

    req.login(newAccount, function (err) {
      if (err) {
        return next(err);
      }
      return res.redirect('/dashboard');
    });
  } catch (err) {
    return next(err);
  }
});

/* POST sign in. */
router.post(
  '/signin',
  passport.authenticate('local', {
    successRedirect: '/dashboard',
    failureRedirect: '/auth/signin',
  })
);

/* GET reset password page. */
router.get('/reset-password', function (req, res, next) {
  res.render('auth/reset-password', { title: 'Forgot Password | Quantora Forex' });
});

/* GET logout. */
router.get('/logout', function (req, res, next) {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    req.session.destroy(function (err) {
      if (err) {
        return next(err);
      }
      res.redirect('/auth/signin');
    });
  });
});

module.exports = router;
