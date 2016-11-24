var express = require('express');
var router = express.Router();
var fs = require('fs');
var db_conf = './conf/database.js';
var data = null;

router.get('/', function(req, res, next) {
	data = JSON.parse(fs.readFileSync(db_conf,'utf8'));
	console.log('hostname->'+data.development.host+' ,db_name->'+data.development.db_name+' ,db_username->'+data.development.db_username+' ,db_password->'+data.development.db_password);
	res.json({ message: '/api' });
});

module.exports = router;