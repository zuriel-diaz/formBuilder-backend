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

router.post('/getData', function(req,res){

	var connection = null, table_name = req.body.table_name, id = req.body.id, config_data = null, sql = "", data = {};
	
	// set db connection params
	config_data = JSON.parse(fs.readFileSync(db_conf,'utf8'));
	connection = mysql.createConnection({host:config_data.development.host,user:config_data.development.db_username,password:config_data.development.db_password,database:config_data.development.db_name});
	connection.connect();

	sql = "SELECT * FROM "+table_name+" WHERE id = "+id;

	connection.query(sql, function(err, row){
		// check if we have some trouble
		if(err){console.log(err); throw err; }
		
		// basically if all this ok we will receive an object as query response
		if(typeof row === "object" &&  (row.length == 1 && typeof row[0] == "object") ){
			for(var key in row[0]){
				if(row[0].hasOwnProperty(key)){ data[key] = row[0][key]; }
			}
			res.json({'errors':false, 'fields':data});
		}else{ res.json({'errors':true, 'fields':data}); }
	});

	connection.end();
});

router.post('/datahub', function(req,res){

	var connection = null;
	var table_name = req.body.table_name, data = req.body, config_data;
	if(data.table_name){delete data.table_name;}
	
	// set db connection params
	config_data = JSON.parse(fs.readFileSync(db_conf,'utf8'));
	connection = mysql.createConnection({host:config_data.development.host,user:config_data.development.db_username,password:config_data.development.db_password,database:config_data.development.db_name});
	connection.connect();
	
	// save data into table
	connection.query('INSERT INTO '+table_name+' SET ?',data,function(err,result){
		if(err){
			console.log(err);
			res.json({'errors': true, 'description': 'Houston we have problems'});	
		} else{ 
			res.json({'identifier':result.insertId, 'errors': false});	 
		}
	});

	connection.end();
});

module.exports = router;