var express = require('express');
var router = express.Router();
var fs = require('fs');
var mysql = require('mysql');
var db_conf = './conf/database.js';
var data = null;

router.get('/', function(req, res, next) {
	res.json({ message: 'API v0.5' });
});

router.get('/:table_name', function(req, res, next) {
	var connection = null, table_name = req.params.table_name, sql = "";
	data = JSON.parse(fs.readFileSync(db_conf,'utf8'));

	connection = mysql.createConnection({host:data.development.host,user:data.development.db_username,password:data.development.db_password,database:data.development.db_name});
	connection.connect();

	sql = "describe "+table_name;

	connection.query(sql,function(err,rows,fields){
		if(!err){
			var data = [];
			for(var x = 0; x < rows.length; x++){
				// move to next value Only if current_field is primary key
				if(rows[x].Key !== 'PRI'){
					data.push( {'field_name':rows[x].Field,'field_type':rows[x].Type} );
				} 
			}
			// print data
			res.json({ "errors": false, "data": data });
		}else{ res.json({ "errors": true, "description": "Something is wrong!" }); }
	});

	connection.end();
});

module.exports = router;