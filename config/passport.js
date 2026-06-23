const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const Account = require('../database/schemas/account.schemas');

module.exports = function (passport) {
  passport.use(
    new LocalStrategy({ usernameField: 'email', passwordField: 'password' }, async (email, password, done) => {
      try {
        const user = await Account.findOne({ email: email.toLowerCase().trim() });
        if (!user) {
          return done(null, false);
        }

        const passwordMatches = await bcrypt.compare(password, user.password);
        if (!passwordMatches) {
          return done(null, false);
        }

        return done(null, user);
      } catch (err) {
        return done(err);
      }
    })
  );

  passport.serializeUser(function (user, done) {
    done(null, user.id);
  });

  passport.deserializeUser(async function (id, done) {
    try {
      const user = await Account.findById(id).lean();
      done(null, user);
    } catch (err) {
      done(err);
    }
  });
};
