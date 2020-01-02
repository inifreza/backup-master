
let mongoose = require('mongoose');
let Schema = mongoose.Schema;
var Model = require('../../data/schema_postComment');
let _ = require('lodash');

const utility = require('../../helpers/utility')




// setting image
const globals = require('../../configs/global')
const { config } = require('../../default')
let url = globals[config.environment]; // development || production

// Additional Model
const postCommentLikes = require('../models/postcommentLikes')
const User = require('../models/user')
const postResponse = require('../models/mPollingResponse')
const postPolling = require('../models/postPolling')

// Knex Setup 
const exec = require('../../helpers/mssql_adapter') 

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
        Model.countDocuments({post_id : req.post_id, publish : 1}).exec(callback)
    },

    getById: function(req, callback){
        Model.findById(req.id).select().exec(callback);
    },

    getCommentByPost : function(req, callback){
      console.log('=== GET COMMENT BY POST ===');
        Model
        .find({post_id : req.post_id, publish : 1})
        .select()
        .skip(req.start)
        .limit(req.limit)
        .sort({create_date : -1})
        .then(comments =>{
        Promise.all(comments.map(comment =>{
            let result = {
              id : comment._id
              , content : comment.comment
              , create_date : comment.create_date
              , comment_type : comment.comment_type
            }
            let promiseUser = new Promise(function(resolve, reject){
              User.getById({id :comment.user_id}, function(errGet, resGet){
                if(utility.issetVal(resGet)){
                  resolve(resGet)
                } else {
                  reject(errGet)
                }
              })
            })

            let promiseCount = new Promise(function( resolve, reject){
              postCommentLikes.getCountData({comment_id : comment.id}, function(errCount, resCount){
                if(resCount){
                  resolve(resCount)
                } else {
                  resolve(resCount)
                }
              })
            })

            let promiseUserLike = new Promise(function(resolve, reject){
              postCommentLikes.getData({comment_id : result.id,  user_id : req.user_id}, function(errLike,resLike ){               
                if(!utility.issetVal(errLike)){
                  console.log(req);
                  if(utility.issetVal(resLike)){
                      resolve(resLike)
                  } else {
                      resolve()
                  }
                  // console.log(resData);
              } else {
                  resolve()
              }
              })
            })

            return Promise.all([promiseUser, promiseCount, promiseUserLike])
            .then(([user, count, userLike]) =>{
              result.user_id = user.id
              result.name = user.name
              user.id == req.user_id ?
                result.owned = true : result.owned = false;
              utility.issetVal(user.img)  ? 
                result.image = url.url_img+'user/'+user.img 
                : result.image = null;
              // result.user_image = url.url_img+'user/'+user.img;
              result.count_like = count
              if(utility.issetVal(userLike)){
                result.liked = 1
              } else {
                result.liked = 0
              }
              return result
            })
          }))
          .then(result =>{
            callback(null, result)
          })
          .catch(error =>{
            callback(error, null)
          })
        })
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
                  comment_type: data.comment_type,
                  create_date: data.create_date
              }

              let promisePost = new Promise(function(resolve, reject) {
                exec.findOne({'id' : result.post_id
                          , 'publish' : 1
                          , 'removed' : 0  }, '*', null, 'T_Post' , (err, resData) =>{
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
                            // resolve(resData)
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
                  postCommentLikes.getCountData({comment_id : result.id}, (errCount, resCount) => {
                    if(resCount){
                      resolve(resCount)
                    } else {
                      resolve(resCount)
                    }
                  })
              })
              
              let promiseComment = new Promise(function( resolve, reject){
                Model.countDocuments({post_id : result.post_id, publish : 1}, (errCount, resCount) => {
                    if(resCount){
                      resolve(resCount)
                    } else {
                      resolve(resCount)
                    }
                  })
              })


              let promiseUserLike = new Promise(function(resolve,reject){
                postCommentLikes.getData({comment_id : result.id, user_id : req.user_id}, function(errLike, resLike){
                  if(!errLike){
                    if(utility.issetVal(resLike)){
                      resolve(1)
                    } else {
                      resolve(0)
                    } 
                  } else {
                    resolve(0)
                  }
                })
              })

              let promisePolling = new Promise(function(resolve, reject) {
                postPolling.getByPostId({post_id : result.post_id}, (errRes,resPolling) => {
                  console.log({errRes});
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

              return Promise.all([promisePost, promiseLike, promiseUserLike, promiseParticipant, promisePolling, promiseComment])
              .then(([post, likes, userLike, participant, polling, comment]) =>{
                // console.log({post});
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
                      result.liked = userLike
                      result.total_comment = comment
                     
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
                            callback(error, null)
                        });
    
                    } else {
                        return result
                    }
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
            console.log({error});
              callback(error, null)
          });
          
      })
  },


}


