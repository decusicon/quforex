var express = require('express');
var router = express.Router();
var bcrypt = require('bcryptjs');
var { ensureAuthenticated } = require('../config/auth');
var Account = require('../database/schemas/account.schemas');

function renderProfile(req, res, opts = {}) {
  return res.render('settings-profile', {
    title: 'Profile | Quantora Forex',
    error: opts.error || null,
    success: opts.success || null,
    currentUser: req.user,
  });
}

/* GET profile page. */
router.get('/', ensureAuthenticated, function(req, res, next) {
  renderProfile(req, res);
});

/* POST profile update. */
router.post('/', ensureAuthenticated, async function (req, res, next) {
  try {
    const section = req.body.section || 'general';
    if (section === 'security') {
      const currentPass = (req.body.currentPass || '').trim();
      const newPass = (req.body.newPass || '').trim();

      if (!currentPass && !newPass) {
        return renderProfile(req, res, { error: 'Enter both current and new passwords to update.' });
      }

      if (!currentPass || !newPass) {
        return renderProfile(req, res, { error: 'Both current and new password are required to update password.' });
      }

      const isMatch = await bcrypt.compare(currentPass, req.user.password);
      if (!isMatch) {
        return renderProfile(req, res, { error: 'Current password is incorrect.' });
      }

      const hashedPassword = await bcrypt.hash(newPass, 10);
      await Account.updateOne({ _id: req.user._id }, { password: hashedPassword });
      req.user.password = hashedPassword;

      return renderProfile(req, res, { success: 'Password updated successfully.' });
    }

    const firstname = (req.body.firstname || '').trim();
    const lastname = (req.body.lastname || '').trim();
    const email = (req.body.email || '').trim().toLowerCase();
    const currency = (req.body.currency || '').trim();
    const language = (req.body.language || '').trim() || 'English';

    if (!firstname || !lastname || !email || !currency) {
      return renderProfile(req, res, { error: 'Please fill in all required fields.' });
    }

    const existing = await Account.findOne({ email: email, _id: { $ne: req.user._id } });
    if (existing) {
      return renderProfile(req, res, { error: 'Email is already in use by another account.' });
    }

    const updates = {
      firstname,
      lastname,
      email,
      currency,
      language,
    };

    await Account.updateOne({ _id: req.user._id }, updates);
    Object.assign(req.user, updates);

    return renderProfile(req, res, { success: 'Profile updated successfully.' });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
