var express = require('express');
var passport = require('passport');
var bcrypt = require('bcryptjs');
var crypto = require('crypto');
var router = express.Router();
var Account = require('../database/schemas/account.schemas');

/* GET sign in page. */
router.get('/signin', function (req, res, next) {
  res.render('auth/signin', {
    title: 'Sign In | Quantora Forex',
    error: req.query.error || null,
  });
});

/* GET sign up page. */
router.get('/signup', function (req, res, next) {
  res.render('auth/signup', {
    title: 'Create Account | Quantora Forex',
    error: req.query.error || null,
  });
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
      return res.render('auth/signup', {
        title: 'Create Account | Quantora Forex',
        error: 'All fields are required.',
      });
    }

    if (password !== confirmPassword) {
      return res.render('auth/signup', {
        title: 'Create Account | Quantora Forex',
        error: 'Passwords do not match.',
      });
    }

    const existingAccount = await Account.findOne({ email: email.toLowerCase().trim() });
    if (existingAccount) {
      return res.render('auth/signup', {
        title: 'Create Account | Quantora Forex',
        error: 'Email already registered.',
      });
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
    return res.render('auth/signup', {
      title: 'Create Account | Quantora Forex',
      error: err.message || 'An error occurred during signup.',
    });
  }
});

/* POST sign in. */
router.post('/signin', function (req, res, next) {
  passport.authenticate('local', function (err, user, info) {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.render('auth/signin', {
        title: 'Sign In | Quantora Forex',
        error: 'Invalid email or password.',
      });
    }
    req.login(user, function (err) {
      if (err) {
        return next(err);
      }
      return res.redirect('/dashboard');
    });
  })(req, res, next);
});

/* GET reset password page. */
router.get('/reset-password', function (req, res, next) {
  res.render('auth/reset-password', {
    title: 'Forgot Password | Quantora Forex',
    message: req.query.message || null,
  });
});

/* POST reset password request. */
router.post('/reset-password', async function (req, res, next) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.render('auth/reset-password', {
        title: 'Forgot Password | Quantora Forex',
        message: 'Please enter your email address.',
      });
    }

    const user = await Account.findOne({ email: email.toLowerCase().trim() });
    if (user) {
      const token = crypto.randomBytes(20).toString('hex');
      user.reset_password_token = token;
      user.reset_password_expires = Date.now() + 3600000; // 1 hour
      await user.save();

      const resetUrl = `${req.protocol}://${req.get('host')}/auth/reset-password/${token}`;
      console.log(`Password reset link for ${user.email}: ${resetUrl}`);
    }

    return res.render('auth/reset-password', {
      title: 'Forgot Password | Quantora Forex',
      message: 'If that email exists, a reset link has been sent. Please follow the instructions in your email.',
    });
  } catch (err) {
    return next(err);
  }
});

router.get('/reset-password/:token', async function (req, res, next) {
  try {
    const user = await Account.findOne({
      reset_password_token: req.params.token,
      reset_password_expires: { $gt: Date.now() },
    }).lean();

    if (!user) {
      return res.render('auth/reset-password', {
        title: 'Forgot Password | Quantora Forex',
        message: 'Password reset token is invalid or has expired.',
      });
    }

    res.render('auth/reset-password-token', {
      title: 'Reset Your Password | Quantora Forex',
      token: req.params.token,
    });
  } catch (err) {
    return next(err);
  }
});

router.post('/reset-password/:token', async function (req, res, next) {
  try {
    const { password, confirmPassword } = req.body;
    if (!password || !confirmPassword || password !== confirmPassword) {
      return res.render('auth/reset-password-token', {
        title: 'Reset Your Password | Quantora Forex',
        token: req.params.token,
        message: 'Passwords must match and cannot be blank.',
      });
    }

    const user = await Account.findOne({
      reset_password_token: req.params.token,
      reset_password_expires: { $gt: Date.now() },
    });

    if (!user) {
      return res.render('auth/reset-password', {
        title: 'Forgot Password | Quantora Forex',
        message: 'Password reset token is invalid or has expired.',
      });
    }

    user.password = await bcrypt.hash(password, 10);
    user.reset_password_token = undefined;
    user.reset_password_expires = undefined;
    await user.save();

    res.redirect('/auth/signin');
  } catch (err) {
    return next(err);
  }
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
