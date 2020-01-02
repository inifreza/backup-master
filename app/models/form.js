let table = 'T_Form';
const exec = require('../../helpers/mssql_adapter') 
var stringInject = require('stringinject')
const utility = require('../../helpers/utility')
let moment = require('moment')
const at_form = require('../models/AT_Form')
const _ = require('lodash')

module.exports = {
    getIndividualResult: function(req, callback){
        return exec.knex('T_Question')
            .select('*')
            .where({form_id: req.id})
            .orderBy('sort', 'asc')
            .then(datas => {
                Promise.all(datas.map(data => {
                    return exec.knex('AT_Form as atform')
                        .select('atformanswer.answer', 'answer.title')
                        .leftJoin('AT_FormAnswer as atformanswer', 'atformanswer.form_code', '=', 'atform.form_code')
                        .leftJoin('T_Answer as answer', 'answer.id', '=', 'atformanswer.answer')
                        .where({'atform.answered' : 1, 'atformanswer.question_id': data.id, 'atform.form_id': req.id, 'atform.user_id': req.user_id})
                        .then(row => {
                            data.answer = row;
                            return data;
                        });
                })).then(response => {
                    callback(null, response)
                });
            }).catch(function(error){
                callback(error, null)
            });
    },

    getAnalyzeResult: function(req, callback){
        return exec.knex(table + ' as form')
            .max('form.id as id')
            .max('form.title as title')
            .max('form.publish as publish')
            .max('form.create_date as create_date')
            .count('atform.form_code as total_participant')
            .leftJoin('AT_Form as atform', 'atform.form_id', '=', 'form.id')
            .where({'atform.answered' : 1, id: req.id})
            .groupBy('form.id')
            .then(datas => {
                var result = datas[0]
                exec.knex('T_Question')
                    .select('id', 'title', 'type', 'sort', 'required', 'placeholder', 'publish', 'create_date')
                    .where({form_id: result.id})
                    .orderBy('sort', 'asc')
                    .then(datas1 => {
                        Promise.all(datas1.map(data => {
                            if(data.type == 'text'){
                                return exec.knex('AT_FormAnswer as atformanswer')
                                    .select('atformanswer.id', 'atformanswer.answer', 'atformanswer.create_date', 
                                        'user.id as user_id', 'user.name as user_name', 'user.email as user_email', 
                                        'user.phone as user_phone')
                                    .leftJoin('AT_Form as atform', 'atform.form_code', '=', 'atformanswer.form_code')
                                    .leftJoin('T_User as user', 'user.id', '=', 'atform.user_id')
                                    .where({'atform.answered' : 1, 'atformanswer.question_id': data.id})
                                    .orderBy('atformanswer.create_date', 'desc')
                                    .then(row => {
                                        data.response = row;
                                        return data;
                                    });
                            }else{
                                return exec.knex('T_Answer as answer')
                                    .select('answer.id', 'answer.title', 'answer.sort', 'answer.correct', 'answer.publish', 'answer.create_date', 
                                        exec.knex.raw(`(SELECT COUNT(atformanswer.id) FROM AT_FormAnswer atformanswer WHERE atformanswer.answer = answer.id) AS total_response`))
                                    .where({'answer.question_id': data.id})
                                    .orderBy('answer.sort', 'asc')
                                    .then(row => {
                                        data.answer = row;
                                        return data;
                                    });
                            }
                        })).then(response => {
                            result.question = response
                            callback(null, result)
                        });
                    }).catch(function(error){
                        callback(error, null)
                    });
            }).catch(function(error){ 
                callback(error, null)
            });
    },

    getPreview: function(req, callback){
        return exec.knex('T_Question')
            .select('id', 'title', 'type', 'key_answer', 'sort', 'required', 'placeholder', 'publish', 'create_date')
            .where({form_id: req.id})
            .orderBy('sort', 'asc')
            .then(datas => {
                Promise.all(datas.map(data => {
                    return exec.knex('T_Answer')
                        .select('id', 'title', 'sort', 'correct', 'publish', 'create_date')
                        .where({question_id: data.id})
                        .orderBy('sort', 'asc')
                        .then(row => {
                            data.answer = row;
                            return data;
                        });
                }))
                .then(response => {
                    callback(null, response)
                });
            }).catch(function(error){
                callback(error, null)
            });
    },

    getLatest: function(req, callback){
        return exec.knex(table)
            .select('id', 'title', 'create_date')
            .orderBy('create_date', 'desc')
            .limit(10)
            .then(datas => {
                callback(null, datas)
            }).catch(function(error){
                callback(error, null)
            })
    },

    autocomplete: function(req, callback){
        return exec.knex(table)
            .select('id', 'title', 'create_date')
            .where('title', 'like', '%'+req.keyword+'%')
            .then(datas => {
                callback(null, datas)
            }).catch(function(error){ 
                callback(error, null)
            });
    },

    replicate: function(req, callback){
        var now = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss')
        return exec.knex(table)
            .select('id', 'title', 'description', exec.knex.raw(`'0' as publish`), 
                exec.knex.raw(`'`+now+`' as create_date`))
            .where(req)
            .then(datas => {
                var result = {
                    id: utility.generateHash(32),
                    replicate_id: datas[0].id,
                    title: datas[0].title + ' Copy',
                    description: datas[0].description,
                    publish: datas[0].publish,
                    create_date: datas[0].create_date
                }
                exec.knex('T_Question')
                    .select(exec.knex.raw(`'' as new_id`), 'id', exec.knex.raw(`'`+result.id+`' as form_id`), 
                        'title', 'type', 'key_answer', 'sort', 'required', 'placeholder', 'publish', 
                        exec.knex.raw(`'`+now+`' as create_date`))
                    .where({form_id: result.replicate_id})
                    .orderBy('sort', 'asc')
                    .then(datas1 => {
                        Promise.all(datas1.map(data => {
                            data.new_id = utility.generateHash(32)
                            return exec.knex('T_Answer')
                                .select(exec.knex.raw(`'`+data.new_id+`' as question_id`), 'title', 'sort', 
                                    'correct', 'publish', exec.knex.raw(`'`+now+`' as create_date`))
                                .where({question_id: data.id})
                                .orderBy('sort', 'asc')
                                .then(row => {
                                    data.answer = row;
                                    return data;
                                });
                        })).then(response => {
                            result.question = response
                            callback(null, result)
                        });
                    }).catch(function(error){ 
                        callback(error, null)
                    });
            }).catch(function(error){ 
                callback(error, null)
            });
    },

    unpublishAll: function(callback){
        return exec.knex(table).update({publish: 0})
            .then(res => {
                callback(null, res)
            }).catch(function(error) { 
                callback(error, null)
            });
    },

    deleteData : function(req, callback){
        return exec.findByIdAndDelete(req.id, table, callback);
    },
    
    getById  : function(req, callback){
        return exec.findById(req.id, '*', table , callback);
    },

    getCountData  : function(req, callback){
        // return exec.getCountData(null, table, callback);
        return exec
        .knex('T_Form as form')
        .max('form.id as id')
        .max('form.title as title')
        .max('form.description as description')
        .max('form.publish as publish')
        .max('form.modify_date as modify_date')
        .max('form.create_date as create_date')
        .modify((qb)=>{
            if(utility.issetVal(req.keyword))
                qb.andWhere('form.title', 'LIKE', `%${req.keyword}%`)
        })
        .groupBy('form.id')
        .then(datas => {
          return Promise.all(datas.map(data => {
                let participantCount = new Promise((resolve , reject)=>{
                    at_form.countGetParticipant({id : data.id}, (errCount, resCount) =>{
                        if(!errCount){
                            data.participant = resCount
                            resolve(data)
                        } 
                    })
                })
                return participantCount
                .then(resData => {
                    return resData
                })
                
            }))
        })
        .then(datas => {
            callback(null, datas.length)
        })
        .catch(error => {
            console.log({error : error});
            callback(error, null)
        })
    },

    getAll  : function(req, callback){
        // return exec.getAll(null, '*', req.start, req.limit, 'create_date DESC ',  table, callback);
        console.log({'req getAll' : req});
        return exec
        .knex('T_Form as form')
        .max('form.id as id')
        .max('form.title as title')
        .max('form.description as description')
        .max('form.publish as publish')
        .max('form.modify_date as modify_date')
        .max('form.create_date as create_date')
        .modify((qb)=>{
            if(utility.issetVal(req.keyword))
                qb.andWhere('form.title', 'LIKE', `%${req.keyword}%`)
        })
        .groupBy('form.id')
        .limit(req.limit)
        .offset(req.start)
        .then(datas => {
          return Promise.all(datas.map(data => {
                let participantCount = new Promise((resolve , reject)=>{
                    at_form.countGetParticipant({id : data.id}, (errCount, resCount) =>{
                        if(!errCount){
                            data.participant = resCount
                            resolve(data)
                        } 
                    })
                })
                return participantCount
                .then(resData => {
                    return resData
                })
                
            }))
        })
        .then(datas => {
            switch (req.sort) {
                case '1':
                    datas = _.orderBy(datas, ["participant"], ["asc"])
                    break;
                case '2':
                    datas = _.orderBy(datas, [function (item) { return item.participant}] , ["desc"])
                    break;
                default:
                    break;
            }
            callback(null, datas)
        })
        .catch(error => {
            console.log({error : error});
            callback(error, null)
        })
    },

    addData: function(req, callback){
        return exec.save(req, table, callback);
    },

    updateData: function(req, callback){
        return exec.findByIdAndUpdate(req.id, req, table, callback);
    },

    getOne : function(req, callback){
        return exec.findOne(req, '*', null,  table, callback);
    }
}