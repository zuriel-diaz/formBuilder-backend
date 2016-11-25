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

					// get field length
					var parenthesis_start =  rows[x].Type.indexOf('('), parenthesis_end = rows[x].Type.indexOf(')'), field_length = 0;
					field_length = (rows[x].Type.substring( (parenthesis_start+1),parenthesis_end )).replace(/\s/g,'');

					// removing whitespaces
					data.push({
						'field_name':(rows[x].Field).replace(/\s/g,''),
						'field_type':(rows[x].Type.substring(0,parenthesis_start)).replace(/\s/g,''),
						'field_length':parseInt(field_length)
					});
				} 
			}
			// print data
			res.json({ "errors": false, "data": data });
		}else{ res.json({ "errors": true, "description": "Something is wrong!" }); }
	});

	connection.end();
});

module.exports = router;