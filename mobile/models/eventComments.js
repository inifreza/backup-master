
let mongoose = require('mongoose');
let _ = require('lodash');

const utility = require('../../helpers/utility')
const globals = require('../../configs/global')
const {
  config
} = require('../../default')
let url = globals[config.environment];

let Schema = mongoose.Schema;
let Model = require('../../data/schema_eventComment');
let eventCommentLikes = require('../models/eventCommentLikes')
let user = require('../models/user')
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

    getAllByEvent: function(req, callback){
        Model.find({'event_id' : req.event_id})
            .select()
            .skip(req.start)
            .limit(req.limit)
            .exec(callback);
    },

    getById: function(req, callback){
        //console.log(req.body.name);
        Model.findById(req.body.id).select().exec(callback);
    },

    submitLike: function(req, callback){
        //console.log(req.body.name);
        Model.findByIdAndUpdate(
            { _id: req.id},
            { $push: {
                    "like": {
                        "user_id": req.user_id,
                    }
                }
            }
          ).exec(callback);;
    },


    getCountData: function(req,callback){
        Model
        .find({event_id : req.event_id})
        .select()
        .then(postData =>{
          // console.log(postData);
           return Promise.all(postData.map(data =>{
              let result = {
                id : data.id,
                event_id : data.event_id,
                user_id : data.user_id,
              }
              // console.log(result);
              let promiseUser = new Promise( function(resolve, reject){
                user.getById({id : result.user_id},function(errRes,resData) {
                  if(!utility.issetVal(errRes)){
                      if(utility.issetVal(resData)){
                          resolve(resData)
                      } else {
                          resolve()
                      }
                      // console.log(resData);
                  } else {
                      resolve()
                  }
                });
              })
              return Promise.all([promiseUser])
              .then(arr=>{
                  if(utility.issetVal(arr[0])){
                      result.name = arr[0].name
                      utility.issetVal(arr[0].img) ? result.img = url.url_img + 'user/' + arr[0].img : result.img = null;
                  } else {
                      result.name = null;
                      result.img = null;
                  }
                  return result;
              
               
              })
              .catch(error =>{
                console.log(error);
              })
            }))
        })
        .then(userData =>{
          const newArr = _.filter(userData, function(item) { 
              console.log(item)
              return item.name !== null 
          });
          // return newArr
          callback(null, newArr.length)
        })
        .catch((error =>{
          callback(error, null)
        }))
    },


    getComment : function (req, callback){
        console.log('execute likes');
        console.log({req});
          Model
          .find({event_id : req.event_id})
          .select()
          .skip(req.start)
          .limit(req.limit)
          .sort({create_date: -1})
          .then(postData =>{
            // console.log(postData);
             return Promise.all(postData.map(data =>{
                let result = {
                  id : data.id,
                  event_id : data.event_id,
                  user_id : data.user_id,
                  content : data.content,
                  comment_type : data.comment_type,
                  create_date : data.create_date
                }
                // console.log(result);
                let promiseUser = new Promise( function(resolve, reject){
                  user.getById({id : result.user_id},function(errRes,resData) {
                    if(!utility.issetVal(errRes)){
                        if(utility.issetVal(resData)){
                            resolve(resData)
                        } else {
                            resolve()
                        }
                        // console.log(resData);
                    } else {
                        resolve()
                    }
                  });
                })
                let userLike = new Promise(function(resolve, reject){
                  eventCommentLikes.getData({comment_id : result.id,  user_id : req.user_id}, function(errLike,resLike ){
                    // console.log({errLike});
                    // console.log({resLike});
                    if(!utility.issetVal(errLike)){
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

                let countLike = new Promise(function(resolve, reject){
                  eventCommentLikes.getCountData({comment_id : result.id}, function(errLike,resLike ){
                 
                    if(!utility.issetVal(errLike)){
                      if(utility.issetVal(resLike)){
                          resolve(resLike)
                      } else {
                          resolve(resLike)
                      }
                      // console.log(resData);
                  } else {
                      resolve()
                  }
                  })
                })
                return Promise.all([promiseUser,userLike, countLike])
                .then(arr=>{
                  
                    result.like = arr[2];
                  // console.log(countLike)
                    if(utility.issetVal(arr[0])){
                        result.name = arr[0].name
                        utility.issetVal(arr[0].img) ? result.img = url.url_img + 'user/' + arr[0].img : result.img = null;
                    } else {
                        result.name = null;
                        result.img = null;
                    }

                    if(utility.issetVal(arr[1])){
                      result.liked = 1
                    } else {
                      result.liked = 0
                    }


                    return result;
                })
                .catch(error =>{
                  console.log(error);
                })
              }))
          })
          .then(userData =>{
            const newArr = _.filter(userData, function(item) { 
                // console.log(item)
                return item.name !== null 
            });
            // return newArr
            callback(null, newArr)
          })
          .catch((error =>{
            callback(error, null)
          }))
    }

}
