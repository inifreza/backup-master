let mongoose = require('mongoose');
let Schema = mongoose.Schema;
var Model = require('../../data/schema_postRemoved');

// models
const post = require('../models/post')
const user = require('../models/user')

// utils
const utility = require('../../helpers/utility')
const exec = require('../../helpers/mssql_adapter')
const globals = require('../../configs/global')
const { config } = require('../../default')
let url = globals[config.environment]; // development || production
let _ = require('lodash');

module.exports = {
    addData: function(req, callback){
        let newData = new Model(req);
        newData.save(callback);
    },

    getCountData: function(req,callback){
        let query = req || {}
        Model.countDocuments(query, callback);
    },

    getAll: function(req, callback){
      console.log({req});
        Model
        .find({})
        .select()
        .where({'type' : req.type})
        .skip(req.start)
        .limit(req.limit)
        .sort({createdAt:-1})
        .then(removeds =>{
        //   console.log({removeds : removeds});
          Promise.all(removeds.map(removed =>{
            // const {_id, user_id, post_id, reason,createdAt } = removed
            let result = {
              id           : removed._id,
              user_id      : removed.user_id,
              post_id      : removed.post_id,
              user_name    : null,
              user_img     : null, 
              reason       : removed.reason,
              post_content : null,
              post_by      : null,
              create_date  : removed.createdAt,
              removed_date : removed.createdAt
            }
            // console.log(result);
            return new Promise (function (resolve, reject){
              exec
              .knex('T_Post')
              .select('T_User.name as user_name', 'T_Admin.name as admin_name', 'T_User.img as user_img', 'T_Admin.img as admin_img', 'content')
              .leftJoin('T_User', 'T_User.id', '=', 'T_Post.user_id')
              .leftJoin('T_Admin', 'T_Admin.id', '=', 'T_Post.user_id')
              .where('T_post.id', removed.post_id)
              .then((datas) =>{
                if(utility.issetVal(datas)){
                  if(utility.issetVal(datas[0].admin_name)){
                  //   result.user_name = admin_name
                  //   result.user_img = `${url.url_img}user/${admin_img}`
                    result.post_by = 'Administrator'
                  } else {
                  //   result.user_name = user_name
                  //   result.user_img = `${url.url_img}user/${user_img}`
                    result.post_by = datas[0].user_name
                  }
                  result.post_content = datas[0].content                
                }
                return result;
              }).then(result => {
                // console.log(result.post_by);
                exec
                .knex('T_Admin')
                .select('T_Admin.name as user_name', 'T_Admin.img as user_img')
                .where('T_Admin.id', removed.user_id)
                .then(res =>{
                    // console.log({res: res});
                  result.user_name  = 'freee'
                  // console.log(res[0])
                  if(utility.issetVal(res[0])){
                    // console.log('ada')
                    result.user_name = res[0].user_name
                    result.user_img = res[0].user_img
                  } else {
                    // console.log('ga')
                    result.user_name = null
                    result.user_img = null
                  }
                  resolve(result);
                })


              }).catch(error =>{
                reject(error)
              })
            })
            .then(result =>{
              return result
            })
          }))
          .then( result => {
            let newItem = result
            if(utility.issetVal(req.post)){
              newItem = _.filter(result, (obj) => {
                if(utility.issetVal(obj.post_content)){
                  let lowContent = obj.post_content.toLowerCase()
                  if(lowContent.search(req.post.toLowerCase()) !== -1){
                    return obj
                  } else {
                    return false
                  }
                } else {
                  return false
                }
              })
            }
            if(utility.issetVal(req.posted_by)){
              newItem = _.filter(newItem, obj => {
                  if(utility.issetVal(obj.post_by)){
                    let lowPostBy = obj.post_by.toLowerCase()
                    if(lowPostBy.search(req.posted_by.toLowerCase()) !== -1){
                      return obj
                    } else {
                      return false
                    }
                  } else {
                    return false 
                  }
              })
            }
            if(utility.issetVal(req.create_date)){
                let splitedDate = req.create_date.split('-').map(x=>{
                  return x.trim()
                })
                newItem = _.filter(newItem, obj => {
                  if(utility.issetVal(obj.create_date)){
                    let dateFrom = splitedDate[0].split("/")
                    let dateTo = splitedDate[1].split("/")
                    let dateCheck = JSON.stringify(obj.create_date).substring(1,11).split("-").reverse()

                    let from = new Date(dateFrom[2], parseInt(dateFrom[0])-1, dateFrom[1]);  // -1 because months are from 0 to 11
                    let to   = new Date(dateTo[2], parseInt(dateTo[0])-1, dateTo[1]);
                    let check = new Date(dateCheck[2], parseInt(dateCheck[1])-1, dateCheck[0]);

                    if(check >= from && check <= to){
                      return obj
                    } else {
                      return false
                    }
                  } else {
                    return false
                  }
                })
            }
            callback(null, newItem)
          })
        })
        .catch(error =>{
          // console.log(error);
          callback(error, null)
        })
    },

    deleteData: function(param, callback){
      Model.findByIdAndDelete(param.id, callback);
    },

    getById: function(req, callback){
      //console.log(req.body.name);
      Model.findById(req.id).select().exec(callback);
    }
}
