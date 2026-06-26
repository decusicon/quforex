var express = require('express');
var router = express.Router();

var Enquiry = require('../database/schemas/enquiry.schema');

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Welcome to Quantora Forex Trading' });
});

/* GET about page. */
router.get('/about', function (req, res, next) {
  res.render('about', { title: 'About Us | Welcome to Quantora Forex Trading' });
});

/* GET service page. */
router.get('/service', function (req, res, next) {
  res.render('service', { title: 'What We Do | Welcome to Quantora Forex Trading' });
});

/* GET risk-management page. */
router.get('/risk-management', function (req, res, next) {
  res.render('risk-management', { title: 'Risk Managements | Welcome to Quantora Forex Trading' });
});

/* GET faq page. */
router.get('/faq', function (req, res, next) {
  res.render('faq', { title: 'FAQ | Welcome to Quantora Forex Trading' });
});

/* GET terms page. */
router.get('/terms-and-conditions', function (req, res, next) {
  res.render('terms-and-conditions', { title: 'Terms & Conditions | Welcome to Quantora Forex Trading' });
});

/* GET privacy-policy page. */
router.get('/privacy-policy', function (req, res, next) {
  res.render('privacy-policy', { title: 'Privacy Policy | Welcome to Quantora Forex Trading' });
});

/* GET contact page. */
router.get('/contact', function (req, res, next) {
  res.render('contact', { title: 'Contact Us | Welcome to Quantora Forex Trading' });
});

/* POST contact page. */
router.post('/contact', async function (req, res, next) {
  try {
    const {
      firstName,
      lastName,
      email,
      country,
      message,
    } = req.body;

    

    if (!firstName || !lastName || !email || !country || !message) {
        return res.render('contact', {
          title: 'Contact Us | Welcome to Quantora Forex Trading',
          error: 'All fields are required.',
        });
    }

    const newEnquiry = new Enquiry({
      firstname: firstName.trim(),
      lastname: lastName.trim(),
      email: email.toLowerCase().trim(),
      country: country.trim(),
      message: message.trim(),
    });

    await newEnquiry.save();
    return res.redirect('/');

  } catch (err) {
    return res.render('contact', {
      title: 'Contact Us | Welcome to Quantora Forex Trading',
      error: err.message || 'An error occurred while trying to message us.',
    });
  }
});

module.exports = router;
