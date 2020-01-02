let mongoose = require('mongoose');
let Schema = mongoose.Schema;
let _ = require('lodash');
var Model = require('../../data/schema_postLikes');
const utility = require('../../helpers/utility')

// setting image
const globals = require('../../configs/global')
const { config } = require('../../default')
let url = globals[config.environment]; // development || production

// Knex Setup 
const exec = require('../../helpers/mssql_adapter') 

// Additional Model
const postCommentLikes = require('../models/postcommentLikes')
const postComment = require('../models/postComments')
const User = require('../models/user')
const postResponse = require('../models/mPollingResponse')
const postPolling = require('../models/postPolling')

module.exports = {
    addData: function(req, callback){
        let newData = new Model(req);
        newData.save(callback);
    },

    deleteData: function(param, callback){
        Model.findByIdAndDelete(param.id, callback);
    },

    updateData: function(param, callback){
        Model.findByIdAndUpdate(param.id, param, callback);
    },

    getAll: function(req, callback){
        Model.find({})
            .select()
            .skip(req.start)
            .limit(req.limit)
            .exec(callback);
    },

    getAllByPost: function(req, callback){
        Model.find(req)
            .select()
            .exec(callback);
    },

    getCountData: function(req,callback){
        Model.countDocuments(req, callback);
    },

    getById: function(req, callback){
        //console.log(req.body.name);
        Model.findById(req.body.id).select().exec(callback);
    },

    getData : function (req, callback){
        Model.find(req, callback)
    },

    getCountByUser: function(req, callback){
        Model.find({'user_id' : req.user_id})
        .select()
        .then(datas => {
            Promise.all(datas.map(data => {
                var result = {
                    id: data.id,
                    post_id: data.post_id,
                    user_id: data.user_id,
                    create_date: data.create_date
                }

                let promisePost = new Promise(function(resolve, reject) {
                    exec.findById(result.post_id, '*', 'T_Post' , (err, resData) =>{
                        if(!err){
                            resolve(resData)   
                        } else {
                            resolve();
                        }
                    });
                })

                return Promise.all([promisePost])
                .then(([post]) =>{
                    // console.log('data', arr[0] )
                    if(utility.issetVal(post)){    
                        result.content = post.content;
                        result.type = post.type;
                        result.publish = post.publish;
                        result.removed = post.removed;
                        return result
                    }
                })
            })).then(response => {
                datas = [];
                response.map(data => {
                    if(utility.issetVal(data)){
                        datas.push(data)
                    }
                })
                callback(null, datas.length)
            }).catch(function(error){ 
                callback(error, null)
            });
            
        })
    },

    getAllByUser: function(req, callback){
        // console.log(req)
        Model.find({'user_id' : req.user_id})
        .select()
        .sort({create_date : -1})
        .skip(req.start)
        .limit(req.limit)
        .then(datas => {
            // console.log('likes', datas)
            Promise.all(datas.map(data => {
                var result = {
                    id: data.id,
                    post_id: data.post_id,
                    user_id: data.user_id,
                    create_date: data.create_date
                }
                // console.log('result1', result)

                let promisePost = new Promise(function(resolve, reject) {
                    exec.findOne({'id' : result.post_id
                                , 'publish' : 1
                                , 'removed' : 0  }, '*', null,  'T_Post' , (err, resData) =>{
                        if(!err){
                            let resPost = resData;
                            exec.findById(resData.user_id,'*', 'T_User', (err, resUser)=>{
                              if(!err){
                                resPost.user = resUser;
                                exec.findOne({post_id : result.post_id},'*', null, 'T_PostImages', (err, resImage)=>{
                                    console.log({resImage : resImage});
                                    if(!err){
                                        resPost.img_post = resImage.img
                                        console.log({resData : resData});
                                    }
                                    resolve(resPost)
                                })
                              } 
                            //   resolve(resData)
                            })  
                        } else {
                            resolve();
                        }
                    });
                })

                let promiseParticipant = new Promise(function( resolve, reject){
                    postResponse.getCountData({id : result.post_id}, function(errCount, resCount){
                        if(!utility.issetVal(errCount)){
                            resolve(resCount)
                        } else {
                            resolve(resCount)
                        }
                    })
                })
                
                let promiseLike = new Promise(function( resolve, reject){
                    Model.countDocuments({post_id : result.post_id}, (errCount, resCount) => {
                        if(resCount){
                        resolve(resCount)
                        } else {
                        resolve(resCount)
                        }
                    })
                })


                let promisePolling = new Promise(function(resolve, reject) {
                    postPolling.getByPostId({post_id : result.post_id}, (errRes,resPolling) => {
                    // console.log({errRes});
                        if(!errRes){
                            if(utility.issetVal(resPolling)){
                                // console.log(resPolling);
                                resolve(resPolling);
                            } else {
                            resolve();
                            }
                        } else {
                        resolve();
                        }
                    });
                });

                let promiseComment = new Promise(function( resolve, reject){
                    postComment.getCountData({post_id : result.post_id}, function(errCount, resCount){
                        if(resCount){
                            resolve(resCount)
                        } else {
                            resolve(resCount)
                        }
                    })
                })

                return Promise.all([promisePost, promiseLike, promiseParticipant, promisePolling, promiseComment])
                .then(([post, likes, participant, polling, comment]) =>{
                    console.log({post : post});
                    // console.log('result', result);
                    if(utility.issetVal(post)){    
                        let user = post.user; 
                        result.content = post.content;
                        result.type = post.type;
                        result.publish = post.publish;
                        result.user_type = post.user_type
                        result.username = utility.issetVal(user) ? user.name : 'PwC Admin';
                        result.phone = utility.issetVal(user) ? user.phone : null;
                        result.gender = utility.issetVal(user) ? user.gender : null;
                        result.img = utility.issetVal(user) ? (utility.issetVal(user.img) ? url.url_img+'user/'+user.img : null) : null;
                        result.img_post = utility.issetVal(post) ? (utility.issetVal(post.img_post) ? url.url_img+'post/'+post.img_post : null) : null;
                        result.removed = post.removed;
                        result.like = likes
                        result.comment = comment
                        
                        if(result.type == 'polling') {
                        
                            const filterVoted = _.filter(participant, o => o.user_id === req.user_id);
                            utility.issetVal(filterVoted) ? 
                                result.voted = 1 
                                : result.voted = 0;
                            
                            result.participant = participant.length
                            return Promise.all(polling.map(resMap => {
                                let promiseResponse = new Promise(function(resolve, reject) {
                                    const body = {
                                        post_id : resMap.post_id,
                                        polling_id : resMap.id
                                    }
                                    // console.log(body);
                                    postResponse.getResponse(body,function(errRes,resData) {
                                        // console.log(errRes);
                                        if(!errRes){
                                            resolve(resData)
                                        }
                                    });
                                })
                                
                                return Promise.all([promiseResponse]).then(arr => {
                                    if(utility.issetVal(arr[0])){
                                        resMap.answer = arr[0].length
                                        let persentase = (arr[0].length/participant.length)*100;
                                        resMap.persentase = `${Math.round(persentase)}%`;
                                    } else {
                                        resMap.answer = `${0}%`;
                                    }
                                    return resMap
                                })
                                
                            })).then(resData => {
                                // console.log('ress', resData);
                                result.polling = resData
                                return result; 
                            }).catch(function(error){ 
                                console.log({error});
                                // callback(error, null)
                            });
        
                        } else {
                            return result
                        }
                    } else {
                        return result
                    }
                   
                }).catch(function(error){ 
                    console.log('hello');
                    // callback(error, null)
                });
            })).then(response => {
                datas = [];
                response.map(data => {
                    if(utility.issetVal(data)){
                        datas.push(data)
                    }
                })
                callback(null, datas)
            }).catch(function(error){ 
                callback(error, null)
            });
            
        })
    },
}
