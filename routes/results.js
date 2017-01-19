var express = require('express');
var router = express.Router();
var fs = require('fs');
var multer = require('multer');
var upload = multer({dest: './uploads/'});

router.get('/', function(req, res){
  var file = './results/results_from_' + (new Date()).toString().match(/.+(2016)/)[0].replace(/\s/g, '').toLowerCase() + '.txt';;
  res.download(file); // Set disposition and send it.
});

module.exports = router;
