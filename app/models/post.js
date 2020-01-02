
let table = 'T_Post';
const exec = require('../../helpers/mssql_adapter') 
var stringInject = require('stringinject')
const utility = require('../../helpers/utility')
let moment = require('moment')
const _ = require('lodash')

// Calll Models
const postInterest = require('../models/postInterest')
const postResponse = require('../models/mPollingResponse')
const postLike = require('../models/postLikes')
const postComment = require('../models/postComments')
const modelResponse = require('../../data/schema_pollingResponse');

module.exports = {
    deleteData : function(req, callback){
        console.log(req)
        return exec.findByIdAndUpdate(req.id, {removed : 1}, table, callback);
    },

    deletePermanent : function(req, callback){
        return exec.findByIdAndDelete(req.id, table, callback);
    },
    
    getById  : function(req, callback){
        return exec.findById(req.id, '*', table , callback);
    },

    getCountData  : function(req, callback){
        // return exec.getCountData(req, table, callback);
        return exec.knex('T_Post as post')
        .max('post.id as id')
        .max('post.user_id as user_id')
        .max('post.content as content')
        .max('post.type as type')
        .max('post.notes as notes')
        .max('post.featured as featured')
        .max('post.publish as publish')
        .max('post.modify_date as modify_date')
        .max('post.create_date as create_date')
        .max('post.user_type as user_type')
        .max('post.publish_date as publish_date')
        .max('post.font_style as font_style')
        .max('post.removed as removed')
        .max('user.name as user_name') 
        .leftJoin('T_User as user', 'user.id', '=', 'post.user_id' )
        .where({'post.type' : req.type, 'post.removed' : req.removed})
        .modify(qb=>{
            if(utility.issetVal(req.post))
                qb.andWhere('post.content', 'LIKE', `%${req.post}%`)
            if(utility.issetVal(req.posted_by))
                qb.andWhere('user.name', 'LIKE', `%${req.posted_by}%`)
            if(utility.issetVal(req.create_date)){
                let date = req.create_date.split('-').map(x=>{
                    return x.trim()
                })
                console.log({date});
                qb.whereBetween('post.create_date', date)
            }
        })
        .groupBy('post.id')
        .then(datas=>{
            // console.log({datas})
            callback(null, datas.length)
        })
        .catch(error=>{
            console.log(error);
            callback(error, null)
        })
    },

    getAll  : function(req, callback){
        console.log({req});
        // return exec.getAll({'type' : req.type, 'removed' : req.removed}, '*', req.start, req.limit, 'featured DESC, create_date DESC',  table, callback);
        return exec.knex('T_Post as post')
        .max('post.id as id')
        .max('post.user_id as user_id')
        .max('post.content as content')
        .max('post.type as type')
        .max('post.notes as notes')
        .max('post.featured as featured')
        .max('post.publish as publish')
        .max('post.modify_date as modify_date')
        .max('post.create_date as create_date')
        .max('post.user_type as user_type')
        .max('post.publish_date as publish_date')
        .max('post.font_style as font_style')
        .max('post.removed as removed')
        .max('user.name as user_name') 
        .leftJoin('T_User as user', 'user.id', '=', 'post.user_id' )
        .where({'post.type' : req.type, 'post.removed' : req.removed})
        .modify(qb=>{
            if(utility.issetVal(req.post))
                qb.andWhere('post.content', 'LIKE', `%${req.post}%`)
            if(utility.issetVal(req.posted_by))
                qb.andWhere('user.name', 'LIKE', `%${req.posted_by}%`)
            if(utility.issetVal(req.create_date)){
                let date = req.create_date.split('-').map(x=>{
                    return x.trim()
                })
                console.log({date});
                qb.whereBetween('post.create_date', date)
            }
        })
        .groupBy('post.id')
        .orderBy('featured', 'DESC')
        .orderBy('create_date','DESC')
        .limit(req.limit)
        .offset(req.start)
        .then(datas=>{
            callback(null, datas)
        })
        .catch(error=>{
            console.log(error);
            callback(error, null)
        })
    },

    addData: function(req, callback){
        return exec.save(req, table, callback);
    },

    updateData: function(req, callback){
        return exec.findByIdAndUpdate(req.id, req, table, callback);
    },

    checkFeatured: function(req, callback){
        return exec.getCountData(req, table, callback);
    },

    getCountHashtag  : function(req, callback){
        let param = {}
        
        if(utility.issetVal(req.hashtag_id)){
            param['atPostHash.hashtag_id'] =  req.hashtag_id
        }
        if(utility.issetVal(req.user_id)){
            param['post.user_id'] =  req.user_id
        }

        return exec.knex('T_Post as post')
            .max('hashtag.id as id')
            .leftJoin('AT_PostHashtag as atPostHash', 'post.id', '=', 'atPostHash.post_id')
            .leftJoin('T_Hashtag as hashtag', 'hashtag.id', '=', 'atPostHash.hashtag_id')
            .where(param)
            .whereNotNull('word')
            .groupBy('word')
            .then(datas=>{
                callback(null, datas.length)
            }).catch(function(error) { 
                callback(error, null)
            });
    },

    getAllHashtag  : function(req, callback){
        let param = {}
        
        if(utility.issetVal(req.hashtag_id)){
            param['atPostHash.hashtag_id'] =  req.hashtag_id
        }
        if(utility.issetVal(req.user_id)){
            param['post.user_id'] =  req.user_id
        }

        return exec.knex('T_Post as post')
        .max('hashtag.id as id')
        .max('hashtag.word as word')
        .count('hashtag.word as used')
        .leftJoin('AT_PostHashtag as atPostHash', 'post.id', '=', 'atPostHash.post_id')
        .leftJoin('T_Hashtag as hashtag', 'hashtag.id', '=', 'atPostHash.hashtag_id')
        .where(param)
        .whereNotNull('word')
        .groupBy('word')
        .orderBy('used', 'DESC')
        .limit(req.limit)
        .offset(req.start)
        .then(datas=>{
            callback(null, datas)
        }).catch(function(error) { 
            callback(error, null)
        });
    },
    
    getData  : function(req, callback){
        let column = [
            'id'
            , 'content'
        ]
        return exec.findAll(req, column, 'content ASC', table, callback);
    },


    replicate: function(req, callback){
        var now = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss')
        return exec.knex(table)
            .select('id', 'content', 'type', exec.knex.raw(`'0' as publish`), 
                exec.knex.raw(`'`+now+`' as create_date`))
            .where(req)
            .then(datas => {
                // console.log(datas);
                var result = {
                    id: utility.generateHash(32),
                    replicate_id: datas[0].id,
                    content: datas[0].content + ' Copy',
                    type: datas[0].type,
                    publish: datas[0].publish,
                    create_date: datas[0].create_date
                }
                let promisePolling = new Promise((resolve, reject)=> {
                    exec.knex('T_PostPolling')
                    .select(exec.knex.raw(`'' as new_id`), 'id', exec.knex.raw(`'`+result.id+`' as post_id`), 
                        'title', 'sort', 
                        exec.knex.raw(`'`+now+`' as create_date`))
                    .where({post_id: result.replicate_id})
                    .orderBy('sort', 'asc')
                    .then(datas1 => {
                        resolve(datas1)
                    })
                    .catch(function(error){ 
                        reject(error)
                    });
                })
                let promiseInterest = new Promise((resolve, reject)  => {
                    postInterest.getData({post_id : result.replicate_id}, (errInteres, resInterest)=>{
                        if(utility.issetVal(resInterest)){
                            resolve(resInterest)
                        } else {
                            reject(errInteres)
                        }
                    })
                })
                return Promise.all([promisePolling, promiseInterest])
                .then(([polling, interest])=>{
                    interest = interest.map(el => {
                        el.post_id = result.id
                        return el
                    })
                    result.question = polling
                    result.interest = interest
                    console.log({'respolling' : result.question});
                    console.log({'resInterest': result.interest[0].post_id});
                    console.log({'Interest  Finish'  :  result.interest});
                    callback(null, result)
                })
                
            }).catch(function(error){ 
                callback(error, null)
            });
    },


    getAnalyzeResult: function(req, callback){
        return exec.knex(table + ' as post')
            .max('post.id as id')
            .max('post.content as content')
            .max('post.publish as publish')
            .max('post.create_date as create_date')
            .max('post.end_date as end_date')
            .where({'id': req.id, 'type' : 'polling'})
            .groupBy('post.id')
            .then(datas => {
                var result = datas[0];
                let promiseCountResponse = new Promise(function(resolve, reject) {
                    const body = {
                        id : result.id,
                    }
                    postResponse.getCountData(body,function(errRes,resData) {
                        if(!errRes){
                            resolve(resData)
                        }
                    });
                })
                return Promise.race([promiseCountResponse]).then(arr => {
                    result.total_participant = arr;
                    return result
                })
            })  
            .then(result => {
                // console.log(result);
                
                exec.knex('T_PostPolling')
                .select('id', 'title', 'post_id', 'sort', 'create_date')
                .where({post_id: result.id})
                .orderBy('sort', 'asc')
                
                .then(datas1 => {
                    Promise.all(datas1.map(data => {
                        let promiseResponse = new Promise(function(resolve, reject) {
                            const body = {
                                post_id : data.post_id,
                                polling_id : data.id
                            }
                            // console.log(body);
                            postResponse.getResponse(body,function(errRes,resData) {
                                console.log(errRes);
                                if(!errRes){
                                    resolve(resData)
                                }
                            });
                        })
                       
                        return Promise.all([promiseResponse]).then(arr => {
                            if(utility.issetVal(arr[0])){
                                console.log(arr[0][arr[0].length-1])
                                if(utility.issetVal(arr[0][arr[0].length-1])){
                                    data.last_modify = arr[0][arr[0].length-1].modify_date
                                } else {
                                    data.last_modify = null;
                                }
                                data.answer = arr[0]
                            } else {
                                data.answer = null;
                            }
                            return data
                        })
                       
                    })).then(response => {
                        if(utility.issetVal(response[response.length-1])){
                            result.modify_date = response[response.length-1].last_modify
                        } else {
                            result.modify_date = null;
                        }
                        // console.log(response);
                        result.question = response
                        callback(null, result)
                    }).catch(function(error){ 
                        callback(error, null)
                    });
                }).catch(function(error){
                    callback(error, null)
                });
               
            }).catch(function(error){ 
                callback(error, null)
            });
    },

    getIndividualResult: function(req, callback){
        return exec.knex('T_PostPolling')
            .select('*')
            .where({post_id: req.id})
            .orderBy('sort', 'asc')
            .then(datas => {
                Promise.all(datas.map(data => {
                    let promiseResponse = new Promise(function(resolve, reject) {
                        const body = {
                            post_id : data.post_id,
                            polling_id : data.id,
                            user_id : req.user_id
                        }
                        postResponse.getResponse(body,function(errRes,resData) {
                            // console.log('data',resData);
                            // console.log('err',errRes)
                            if(!errRes){
                                resolve(resData)
                                
                            }
                        });
                    })
                   
                    return Promise.all([promiseResponse]).then(arr => {
                        if(utility.issetVal(arr[0])){
                            data.answer = true
                        }
                        else {
                            data.answer = false
                        }
                        return data
                    })
                })).then(response => {
                    callback(null, response)
                });
            }).catch(function(error){
                callback(error, null)
            });
    },

    autocomplete: function(req, callback){
        return exec.knex(table)
            .select('id', 'content', 'create_date')
            .where('content', 'like', '%'+req.keyword+'%')
            .where('type', req.type)
            .then(datas => {
                callback(null, datas)
            }).catch(function(error){ 
                callback(error, null)
            });
    },
    
    getLatest: function(req, callback){
        return exec.knex(table)
            .select('id', 'content', 'create_date')
            .orderBy('create_date', 'desc')
            .where('type', req.type)
            .limit(10)
            .then(datas => {
                callback(null, datas)
            }).catch(function(error){
                callback(error, null)
            })
    },

    getCountByUser  : function(req, callback){
        let param = {
            'post.user_id' :  req.user_id
            , 'post.type'  : req.type
            , 'post.removed' : 0
            , 'post.publish' : 1
        }

        
        return exec.knex('T_Post as post')
            .count('post.id as id')
            .where(param)
            .then(datas=>{
                callback(null, datas[0].id)
            }).catch(function(error) { 
                callback(error, null)
            });
    },

    getAllByUser  : function(req, callback){
        let param = {
            'post.user_id' :  req.user_id
            , 'post.type'  : req.type
            , 'post.removed' : 0
            , 'post.publish' : 1
        }

        return exec.knex('T_Post as post')
        .select('*')
        .where(param)
        .limit(req.limit)
        .offset(req.start)
        .then(datas=>{
            return Promise.all(datas.map(data => {
                let promiseComment = new Promise(function( resolve, reject){
                    postComment.getCountData({post_id : data.id}, function(errCount, resCount){
                        if(resCount){
                            resolve(resCount)
                        } else {
                            resolve(resCount)
                        }
                    })
                })
    
                let promiseLike = new Promise(function( resolve, reject){
                    postLike.getCountData({post_id : data.id}, function(errCount, resCount){
                        if(resCount){
                            resolve(resCount)
                        } else {
                            resolve(resCount)
                        }
                    })
                })

                let promiseParticipant = new Promise(function( resolve, reject){
                    postResponse.getCountData({id : data.id}, function(errCount, resCount){
                        if(resCount){
                            resolve(resCount)
                        } else {
                            resolve(resCount)
                        }
                    })
                })

                return Promise.all([promiseComment, promiseLike, promiseParticipant])
                .then(([comment, like, participant]) =>{
                    data.count_comment = comment
                    data.count_like = like
                    data.type == 'polling'?  data.count_participant = participant : '';
                    return data
                })
            })).then(response => {
                return response
            });
        })
        .then(datas=>{
            callback(null, datas)
        }).catch(function(error) { 
            callback(error, null)
        });
    },

    Export: async function(req){
        const polling = await exec.knex('T_Post as post')
        .select(
        ['post.id as id',
        'post.user_id as user_id',
        'post.content as content',
        'post.create_date as create_date',
        'user.name as user_name']) 
        .leftJoin('T_User as user', 'user.id', '=', 'post.user_id' )
        .whereRaw("post.type = 'polling' AND post.removed = '0'")
        .modify(qb=>{
            if(utility.issetVal(req.post))
                qb.andWhere('post.content', 'LIKE', `%${req.post}%`)
            if(utility.issetVal(req.posted_by))
                qb.andWhere('user.name', 'LIKE', `%${req.posted_by}%`)
            if(utility.issetVal(req.create_date)){
                let date = req.create_date.split('-').map(x=>{
                    return x.trim()
                })
                qb.whereBetween('post.create_date', date)
            }
        })
        .orderBy('create_date','DESC')

        const x = polling.map(async data => {
                const response = await modelResponse.countDocuments({'post_id': data.id})
                console.log(response);
                
        })
        return x;
    }
}