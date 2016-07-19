var express = require('express');
var router = express.Router();
var system = require('system');
var path = require('path');
var childProcess = require('child_process');
var phantomjs = require('phantomjs');
var binPath = phantomjs.path;
var fs = require('fs');
var urls;

// var theUrl ='http://stage-knowledge.servicenow.com';

/* GET home page. */
router.get('/', function(req, res, next) {

  //get the file based off the date from upload.js
  var filePath = 'uploads/' + (new Date()).toString().match(/.+(2016)/)[0].replace(/\s/g, '').toLowerCase() + '.txt';

  //read file to get the URLs to check
  fs.readFile(filePath, "utf-8", function (err, data) {
    urls = data.split('\n');
    console.log('URLS', urls);

    var childArgs = [];
    var results = [];

    for (var i = 0; i < urls.length; i++){
      childArgs = [
        path.join(__dirname, 'phantomStart.js'),
        //first url is chosen
        //EDIT TO RUN PHANTOM ONCE PER URL
        urls[i]
      ]

      // childProcess.execFile(binPath, childArgs, function(err, stdout, stderr) {
      //   if(err) console.log('error', err);
      //   else console.log('stdout', stdout)
      //   results.push(stdout);    
      // })

      var data = childProcess.execFileSync(binPath, childArgs).toString().split('\n');
      console.log('the data', data)
      data.forEach(function(d){
        results.push(d);
      })
      // results.push(data[0]);    
      // results.push(data[1]);    
      console.log('LOTS OF RESULTS?', results)

      if(i === urls.length-1) {
        console.log('AT THE END', i)
        console.log('final res', results.toString())
        res.render('phantomPage', { title: 'Results Available', results: results});
      }
    }
    
  //   var childArgs = [
  //     path.join(__dirname, 'phantomStart.js'),
  //     //first url is chosen
  //     //EDIT TO RUN PHANTOM ONCE PER URL
  //     urls[0]
  //   ]
     
  //   childProcess.execFile(binPath, childArgs, function(err, stdout, stderr) {
  //     if(err) console.log('error', err);
  //     else console.log('stdout', stdout)    
  //     res.render('phantomPage', { title: 'Results Available', url: urls[0], results: stdout});
  //   })

    // res.render('phantomPage', { title: 'Results Available', urls: urls, results: results});
  });

});

module.exports = router;
