var express = require('express');
var router = express.Router();
var system = require('system');
var path = require('path');
var childProcess = require('child_process');
var phantomjs = require('phantomjs');
var binPath = phantomjs.path;
var fs = require('fs');
var urls;

/* GET home page. */
router.get('/', function(req, res, next) {

  //get the file based off the date from upload.js
  var filePath = 'uploads/' + (new Date()).toString().match(/.+(2016)/)[0].replace(/\s/g, '').toLowerCase() + '.txt';
  //write path for results
  var writePath = 'results/results_from_' + (new Date()).toString().match(/.+(2016)/)[0].replace(/\s/g, '').toLowerCase() + '.txt';

  //read file to get the URLs to check
  fs.readFile(filePath, "utf-8", function (err, data) {
    urls = data.split('\n');
    console.log('URLS', urls);

    var childArgs = [];
    var results = [];

    for (var i = 0; i < urls.length; i++){
      childArgs = [
        path.join(__dirname, 'phantomStart.js'),
        urls[i]
      ]

      var data = childProcess.execFileSync(binPath, childArgs).toString().split('\n');
      console.log('the data', data)
      data.forEach(function(d){
        results.push(d);
      })

      if(i === urls.length-1) {
        fs.writeFileSync(writePath, results.join('\r\n'), 'utf-8', function (err, data) {
          if (err) console.error('There was an error writing the results file:', err);
          
          // res.render('phantomPage', { title: 'Results Available', results: results});
        })
          res.render('phantomPage', { title: 'Results Available', results: results});
      }
    }
  });

});

module.exports = router;
