var express = require('express');
var router = express.Router();
var fs = require('fs');
var multer = require('multer');
var upload = multer({dest: './uploads/'});

router.get('/', function(req, res, next) {
  res.render('upload', { title: 'Upload Fail' });
});

router.post('/', upload.single('urls'), function(req, res, next) {
	//path for the uploaded file
 	var tmp_path = req.file.path;
 	//save to uploads folder with new name based on date
	var target_path = 'uploads/' + (new Date()).toString().match(/.+(2016)/)[0].replace(/\s/g, '').toLowerCase() + '.txt';
	var src = fs.createReadStream(tmp_path);
	var dest = fs.createWriteStream(target_path);
	src.pipe(dest);
	//delete temporary file
	fs.unlink(tmp_path);

	src.on('end', function() { 
		fs.readFile(target_path, "utf-8", function (err, data) {
			var urls = data.split('\n');
  			res.render('upload', { title: 'All Systems Ready', urls: urls});
		});
	});
	src.on('error', function(err) { res.render('error'); });

});

module.exports = router;
