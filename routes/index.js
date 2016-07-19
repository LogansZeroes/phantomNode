var express = require('express');
var router = express.Router();
var phantom = require('node-phantom');

//Initial page
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Analytics QA System' });
});

module.exports = router;
