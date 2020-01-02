
let table = 'T_Hashtag';
const exec = require('../../helpers/mssql_adapter') 
var stringInject = require('stringinject')
const utility = require('../../helpers/utility')

module.exports = {
    deleteData : function(req, callback){
        return exec.findByIdAndDelete(req.id, table, callback);
    },
    
    getByWord  : function(req, callback){
        return exec.findOne({'word' : req.word}, 'id', null, table, callback);
    },

    getById  : function(req, callback){
        return exec.findById(req.id, '*', table , callback);
    },

    getCountData  : function(req, callback){
        // return exec.getCountData(null, table, callback);
        return exec.knex('T_Hashtag as hashtag')
            .max('hashtag.create_date as create_date')
            .max('hashtag.id as id')
            .max('hashtag.word as word')
            .max('hashtag.publish as publish')
            .count('postHashtag.hashtag_id as total_post' )
            .count('eventHashtag.hashtag_id as total_event' )
            .leftJoin('AT_PostHashtag as postHashtag', 'hashtag.id', '=', 'postHashtag.hashtag_id')
            .leftJoin('AT_EventHashtag as eventHashtag', 'hashtag.id', '=', 'eventHashtag.hashtag_id')
            .modify(qb =>{
                if(utility.issetVal(req.keyword))
                    qb.andWhere('hashtag.word', 'LIKE', `%${req.keyword}%`)

                if(utility.issetVal(req.create_date)){
                    let date = req.create_date.split('-').map(x=>{
                        return x.trim()
                    })
                    // console.log({date});
                    qb.whereBetween('hashtag.create_date', date)
                }

                switch (req.sort) {
                    case '1':
                        qb.orderBy('total_post', 'asc')
                        break;
                    case '2':
                        qb.orderBy('total_post', 'desc')
                        break;
                    case '3':
                        qb.orderBy('total_event', 'asc')
                        break;
                    case '4':
                        qb.orderBy('total_event', 'desc')
                        break;
                    case '5':
                        qb.orderBy('create_date', 'asc')
                        break;
                    case '6':
                        qb.orderBy('create_date', 'desc')
                        break;
                    default:
                        qb.orderBy('create_date', 'desc')
                        break;
                }
            })
            .groupBy('hashtag.word')
            .then(datas=>{
                callback(null, datas.length)
            }).catch(function(error) { 
                callback(error, null)
            });
    },

    getAll  : function(req, callback){
        let column = ['hashtag.*'];
        return exec.knex('T_Hashtag as hashtag')
            .max('hashtag.create_date as create_date')
            .max('hashtag.id as id')
            .max('hashtag.word as word')
            .max('hashtag.publish as publish')
            .count('postHashtag.hashtag_id as total_post' )
            .count('eventHashtag.hashtag_id as total_event' )
            .leftJoin('AT_PostHashtag as postHashtag', 'hashtag.id', '=', 'postHashtag.hashtag_id')
            .leftJoin('AT_EventHashtag as eventHashtag', 'hashtag.id', '=', 'eventHashtag.hashtag_id')
            .modify(qb =>{
                if(utility.issetVal(req.keyword))
                    qb.andWhere('hashtag.word', 'LIKE', `%${req.keyword}%`)

                if(utility.issetVal(req.create_date)){
                    let date = req.create_date.split('-').map(x=>{
                        return x.trim()
                    })
                    // console.log({date});
                    qb.whereBetween('hashtag.create_date', date)
                }

                switch (req.sort) {
                    case '1':
                        qb.orderBy('total_post', 'asc')
                        break;
                    case '2':
                        qb.orderBy('total_post', 'desc')
                        break;
                    case '3':
                        qb.orderBy('total_event', 'asc')
                        break;
                    case '4':
                        qb.orderBy('total_event', 'desc')
                        break;
                    case '5':
                        qb.orderBy('create_date', 'asc')
                        break;
                    case '6':
                        qb.orderBy('create_date', 'desc')
                        break;
                    default:
                        qb.orderBy('create_date', 'desc')
                        break;
                }
            })
            .groupBy('hashtag.word')
            .limit(req.limit)
            .offset(req.start)
            .then(datas=>{
                callback(null, datas)
            }).catch(function(error) { 
                callback(error, null)
            });
    },
    
    addData: function(req, callback){
        return exec.save(req, table, callback);
    },

    updateData: function(req, callback){
        return exec.findByIdAndUpdate(req.id, req, table, callback);
    },

    getHashtag  : function(req, callback){
        return exec.findAll({'publish' : '1'}, '*', 'word ASC', table, callback);
    },

    getHashtagByEvent : function(req, callback){
        return exec.knex('T_Hashtag as hashtag')
            .select('hashtag.*')
            .leftJoin('T_ as question', 'hashtag.question_id', '=', 'question.id')
            .leftJoin('T_Form as form', 'question.form_id', '=', 'form.id')
            .where(param)
            .orderBy('hashtag.create_date', 'desc')
            .orderBy('hashtag.sort', 'asc')
            .then(datas=>{
                callback(null, datas)
            }).catch(function(error) { 
                callback(error, null)
            });
    }
 
    
}