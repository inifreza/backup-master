let table = 'AT_Form';
const exec = require('../../helpers/mssql_adapter') 
var stringInject = require('stringinject')
const utility = require('../../helpers/utility')
let moment = require('moment')

module.exports = {
	getCurrentIndividual: function(req, callback){
		var param = {
			'atform.form_id': req.id
		}
		if(req.user_id != ''){
			param['atform.user_id'] = req.user_id
		}
		return exec.knex(table + ' as atform')
            .select('user.id', 'user.name', 'user.email', 'user.company', 'user.position',
            	exec.knex.raw(`CASE WHEN [user].gender = 'M' THEN 'Male' WHEN [user].gender = 'F'
                	THEN 'Female' ELSE 'Other' END as gender`), 'atform.create_date')
           	.leftJoin('T_User as user', 'user.id', '=', 'atform.user_id')
            .where({'atform.answered' : 1})
            .where(param)
            .orderBy('atform.create_date', 'desc')
            .then(datas => {
                var result = datas[0]
                //promise previous user
                const prevUser = new Promise((resolve, reject) => {
                    exec.knex(table + ' as atform')
                        .select('user.id as id', 'user.name as name')
                        .leftJoin('T_User as user', 'user.id', '=', 'atform.user_id')
                        .where('atform.form_id', req.id)
                        .where({'atform.answered' : 1})
                        .andWhere('atform.create_date', '>', result.create_date)
                        .orderBy('atform.create_date', 'desc')
                        .limit(1)
                        .then(row => {
                            resolve(row[0])
                        })
                })
                //promise next user
                const nextUser = new Promise((resolve, reject) => {
                    exec.knex(table + ' as atform')
                        .select('user.id as id', 'user.name as name')
                        .leftJoin('T_User as user', 'user.id', '=', 'atform.user_id')
                        .where('atform.form_id', req.id)
                        .where({'atform.answered' : 1})
                        .andWhere('atform.create_date', '<', result.create_date)
                        .orderBy('atform.create_date', 'desc')
                        .limit(1)
                        .then(row => {
                            resolve(row[0])
                        })
                })
                //run promise all
                Promise.all([prevUser, nextUser]).then(resolve => {
                    result.prev_user = utility.issetVal(resolve[0]) ? resolve[0] : {}
                    result.next_user = utility.issetVal(resolve[1]) ? resolve[1] : {}
                    callback(null, result)
                }).catch(reject => {
                    callback(reject, null)
                })
            }).catch(function(error){ 
                callback(error, null)
            });
    },

	getIndividual: function(req, callback){
		return exec.knex(table + ' as atform')
			.max('user.id as id') 
			.max('user.name as name') 
			.max('atform.create_date as create_date')
			.leftJoin('T_User as user', 'user.id', '=', 'atform.user_id')
			.where({'atform.answered' : 1, form_id: req.id})
			.groupBy('user.id')
			.orderBy('create_date', 'desc')
			.then(datas => {
				callback(null, datas)
			}).catch(function(error){
				callback(error, null)
			})
	},

	deleteData: function(req, callback){
        return exec.knex(table).where('form_code', req.code).del()
            .then(datas => {
                callback(null, datas)
            }).catch(function(error){ 
                callback(error, null)
            });
    },

	countGetParticipant: function(req, callback){
        return exec.knex(table + ' as atform')
        .max('atform.form_code as form_code') 
        .max('user.id as user_id') 
        .max('user.name as user_name') 
        .max('user.email as user_email')
        .max('user.phone as user_phone')
        .max('atform.create_date as create_date')
        .leftJoin('T_User as user', 'user.id', '=', 'atform.user_id')
        .where({'atform.answered' : 1, form_id: req.id})
        .groupBy('user.id')
        .orderBy('create_date', 'desc')
        .then(datas => {
            callback(null, datas.length)
        }).catch(function(error){
            callback(error, null)
        })
    },

	getParticipant: function(req, callback){
		return exec.knex(table + ' as atform')
			.max('atform.form_code as form_code') 
			.max('user.id as user_id') 
			.max('user.name as user_name') 
			.max('user.email as user_email')
			.max('user.phone as user_phone')
			.max('atform.create_date as create_date')
			.leftJoin('T_User as user', 'user.id', '=', 'atform.user_id')
			.where({'atform.answered' : 1, form_id: req.id})
			.groupBy('user.id')
			.orderBy('create_date', 'desc')
			.limit(req.limit)
            .offset(req.start)
			.then(datas => {
				callback(null, datas)
			}).catch(function(error){
				callback(error, null)
			})
	},

	checkExist: function(req, callback){
		return exec.knex(table)
			.select('form_code','user_id', 'answered')
			.where({form_id: req.form_id, form_code: req.form_code})
			.then(datas => {
				callback(null, datas[0])
			}).catch(function(error){
				callback(error, null)
			})
	},

    addData: function(req, callback){
        return exec.save(req, table, callback);
    },

    updateData: function(req, callback){
        return exec.finOneAndUpdate({'form_code': req.form_code, 'form_id' : req.form_id}, req, table, callback);
    } 
}