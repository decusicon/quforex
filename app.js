var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session');
var passport = require('passport');

require('dotenv').config()

var indexRouter = require('./routes/index');
var adminRouter = require('./routes/admin');
var authRouter = require('./routes/auth');
var dashboardRouter = require('./routes/dashboard');
var profileRouter = require('./routes/profile');
var settingsRouter = require('./routes/settings');
var tradingRouter = require('./routes/trading');
var walletRouter = require('./routes/wallet');
var constants = require('./utils/constants');

var app = express();

require('./dbconnect')
require('./config/passport')(passport)

// view engine setup
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');
app.set('views', path.join(__dirname, 'views'));
app.locals.Symbols = constants.Symbols;


app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'quantora-forex-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 },
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use(function (req, res, next) {
  res.locals.global_wallet_btc_address = process.env.GLOBAL_WALLET_BTC_ADDRESS;
  res.locals.currentUser = req.user;
  res.locals.currentPath = req.originalUrl;
  // expose any session flash messages to templates, then clear
  res.locals.flash = req.session && req.session.flash ? req.session.flash : {};
  if (req.session && req.session.flash) delete req.session.flash;
  next();
});
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/admin', adminRouter);
app.use('/auth', authRouter);
app.use('/dashboard', dashboardRouter);
app.use('/profile', profileRouter);
app.use('/settings', settingsRouter);
app.use('/trading', tradingRouter);
app.use('/wallet', walletRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error', { title: '404 | Quantora Forex' });
});

module.exports = app;
