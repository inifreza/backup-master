
let mongoose = require('mongoose');
let Schema = mongoose.Schema;
const utility = require('../../helpers/utility')

let Model = require('../../data/schema_postComment');

// Knex Setup 
const exec = require('../../helpers/mssql_adapter') 

// Additional Model
let postCommentLikes = require('../models/postcommentLikes')

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
        Model.find({'post_id' : req.post_id})
            .select()
            .skip(req.start)
            .limit(req.limit)
            .exec(callback);
    },

    getAllByPost: function(req, callback){
        let param = utility.issetVal(req.post_id) ? {'post_id' : req.post_id} :  {};
        Model.find(param)
            .select()
            .exec(callback);
    },

    getCountData: function(req, callback){
        Model.countDocuments({'post_id' : req.post_id}, callback);
    },

    getById: function(req, callback){
        //console.log(req.body.name);
        Model.findById(req.id).select().exec(callback);
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
                    comment: data.comment,
                    create_date: data.create_date
                }


                let promisePost = new Promise(function(resolve, reject) {
                    exec.findById(result.post_id, '*', 'T_Post' , (err, resData) =>{
                        if(!err){
                            resolve(resData)   
                        } else {
                            reject();
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
        Model.find({'user_id' : req.user_id})
        .select()
        .sort({create_date : -1})
        .skip(req.start)
        .limit(req.limit)
        .then(datas => {
            Promise.all(datas.map(data => {
                var result = {
                    id: data.id,
                    post_id: data.post_id,
                    user_id: data.user_id,
                    comment: data.comment,
                    create_date: data.create_date
                }


                let promisePost = new Promise(function(resolve, reject) {
                    exec.findById(result.post_id, '*', 'T_Post' , (err, resData) =>{
                        if(!err){
                            resolve(resData)   
                        } else {
                            reject();
                        }
                    });
                })

                let promiseLike = new Promise(function( resolve, reject){
                    postCommentLikes.getCountData({comment_id : result.id}, (errCount, resCount) => {
                      if(resCount){
                        resolve(resCount)
                      } else {
                        resolve(resCount)
                      }
                    })
                })

              

                return Promise.all([promisePost, promiseLike])
                .then(([post, likes]) =>{
                    // console.log('data', arr[0] )
                    if(utility.issetVal(post)){    
                        result.content = post.content;
                        result.type = post.type;
                        result.publish = post.publish;
                        result.removed = post.removed;
                        result.count_like = likes

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
                callback(null, datas)
            }).catch(function(error){ 
                callback(error, null)
            });
            
        })
    },
}
