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

					/*
					*  There are some fields that do not has 'length' property, 
					*  so basically we need to validate it, and get 'type' property 
					*  and set a default 'length' property value.
					*/

					var parenthesis_start =  rows[x].Type.indexOf('('), parenthesis_end = rows[x].Type.indexOf(')'), field_length = 0;
					
					// case: the 'length' property is null or not exists.
					if( parenthesis_start == -1 && parenthesis_end == -1 ){
						data.push({
							'field_name':(rows[x].Field).replace(/\s/g,''),
							'field_type':rows[x].Type,
							'field_length':200
						});
					}
					// case: the 'length' property exist and basically we need to get 'type' & 'length' property.
					else{
						field_length = (rows[x].Type.substring( (parenthesis_start+1),parenthesis_end )).replace(/\s/g,'');

						// removing whitespaces
						data.push({
							'field_name':(rows[x].Field).replace(/\s/g,''),
							'field_type':(rows[x].Type.substring(0,parenthesis_start)).replace(/\s/g,''),
							'field_length':parseInt(field_length)
						});
					}
				} 
			}
			// print data
			res.json({ "errors": false, "data": data });
		}else{ res.json({ "errors": true, "description": "Something is wrong!" }); }
	});

	connection.end();
});

router.post('/getData', function(req,res){

	var connection = null, table_name = req.body.table_name, config_data = null, sql = "", data = [];
	var id = (req.body.id) ? req.body.id : null;
	// set db connection params
	config_data = JSON.parse(fs.readFileSync(db_conf,'utf8'));
	connection = mysql.createConnection({host:config_data.development.host,user:config_data.development.db_username,password:config_data.development.db_password,database:config_data.development.db_name});
	connection.connect();

	sql = "SELECT * FROM "+table_name;
	
	// Check if current request has identifier, if this is true we need to get this field and update SQL sentence. 
	if( req.body.id !== undefined && req.body.id !== null ){ sql +=" WHERE id = "+req.body.id; }

	connection.query(sql, function(err, result){
		// check if we have some trouble
		if(err){console.log(err); throw err; }
		
		// basically if all this is ok we will receive an object as query response
		if(typeof result === "object" && result.length == 1){
			var temp = {};
			for(var key in result[0]){ if(result[0].hasOwnProperty(key)){ temp[key] = result[0][key]; } }
			data.push(temp);
			res.json({'errors':false, 'fields':data});
		}else if(typeof result === "object" && result.length > 1){
			for (var position = 0; position < result.length; position++){
				var temp = {};
				for(var key in result[position]){
					if(result[position].hasOwnProperty(key)){ temp[key] = result[position][key]; }
				}
				data.push(temp);	
			}
			res.json({'errors':false, 'fields':data});
		}else{ res.json({'errors':true, 'description': 'we do not have data. length:'+result.length ,'fields':data}); }
	});

	connection.end();
});

router.post('/datahub', function(req,res){

	var connection = null;
	var table_name = req.body.table_name, action_type = req.body.action_type, user_id = req.body.user_identifier, data = req.body, config_data = null;
	if(data.table_name){delete data.table_name; delete data.action_type; delete data.user_identifier;}
	
	console.log(req.body);

	if(action_type){

		// set db connection params
		config_data = JSON.parse(fs.readFileSync(db_conf,'utf8'));
		connection = mysql.createConnection({host:config_data.development.host,user:config_data.development.db_username,password:config_data.development.db_password,database:config_data.development.db_name});
		connection.connect();

		switch(action_type){
			case 'insert':
				// save data into table (data is an object with fields to be modified).
				connection.query('INSERT INTO '+table_name+' SET ?',data,function(err,result){
					if(err){
						console.log(err);
						res.json({'errors': true, 'description': 'Houston we have problems'});	
					} else{ 
						res.json({'identifier':result.insertId, 'errors': false});	 
					}
				});
			break;
			case 'update':
				// update data into table (data is an object with fields to be modified).
				connection.query('UPDATE '+table_name+' SET ? WHERE id = '+user_id,data,function(err,result){
					if(err){
						console.log(err);
						res.json({'errors': true, 'description': 'Houston we have problems'});	
					} else{ 
						res.json({'identifier':result.affectedRows, 'errors': false});	 
					}
				});
			break;
		}

		connection.end();

	}
});

module.exports = router;