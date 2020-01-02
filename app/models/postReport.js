let mongoose = require('mongoose');
let Schema = mongoose.Schema;
var Model = require('../../data/schema_postReport');
let _ = require('lodash');

// models
const post = require('../models/post')
const user = require('../models/user')
const exec = require('../../helpers/mssql_adapter')
const utility = require('../../helpers/utility')

// setting image
const globals = require('../../configs/global')
const { config } = require('../../default')
let url = globals[config.environment]; // development || production

module.exports = {
    addData: function(req, callback){
        let newData = new Model(req);
        newData.save(callback);
    },

    deleteData: function(param, callback){
        Model.deleteMany(param.id, callback);
    },
    deleteById : function(req, callback){
      Model
      .findOneAndRemove({_id : req.id})
      .exec(callback)
    },

    updateData: function(param, callback){
        Model.findByIdAndUpdate(param.id, param, callback);
    },

    getAll: function(req, callback){
        console.log({req : req});
        Model
        .find({})
        .select()
        .where({type : req.type})
        .skip(req.start)
        .limit(req.limit)
        .then(reports =>{
          // console.log({postReport : reports});
          Promise.all(reports.map(report =>{
            const {_id, user_id, post_id, reason, createdAt } = report
            let result = {
              id           : _id,
              user_id      : user_id,
              post_id      : post_id,
              user_name    : null,
              user_img     : null, 
              reason       : reason,
              post_content : null,
              post_by      : null,
              create_date  : createdAt,
              report_date  : createdAt
            }
            return new Promise (function (resolve, reject){
              // console.log({report : report});
              exec
              .knex('T_Post')
              // .select('T_Post.removed as removed','T_User.name as user_name', 'T_Admin.name as admin_name', 'T_User.img as user_img', 'T_Admin.img as admin_img', 'content')
              
              .max('T_post.id as post_id')
              .max('T_Post.removed as removed')
              /*
              .max('T_User.name as user_name')
              .max('T_Admin.name as admin_name')
              */
              .max('VW_Author.screen_name as user_name')
              /*
              .max('T_User.img as user_img')
              .max('T_Admin.img as admin_img')
              */
              .max('VW_Author.img AS user_img')
              .max('T_Post.content as content')
              /*
              .leftJoin('T_User', 'T_User.id', '=', 'T_Post.user_id')
              .leftJoin('T_Admin', 'T_Admin.id', '=', 'T_Post.user_id')
              */
             .leftJoin('VW_Author', 'VW_Author.id', '=', 'T_Post.user_id')
              .where('T_post.id', post_id)
              // .modify(qb=>{
              //   if(utility.issetVal(req.post))
              //     qb.andWhere('T_post.content', 'LIKE', `%${req.post}%`)
                
              //   if(utility.issetVal(req.posted_by))
              //     qb.andWhere('VW_Author.screen_name', 'LIKE', `%${req.posted_by}%`)

              // })
              .groupBy('T_Post.id')
              .then(postReport =>{
                // console.log({user_name : user_name});
                console.log({'T_post' : postReport});
                if(utility.issetVal(postReport[0])){
                  if(utility.issetVal(postReport[0].admin_name)){
                    // result.user_name = admin_name
                    // result.user_img = `${url.url_img}user/${admin_img}`
                    result.post_by = 'Administrator'
                  } else {
                    // result.user_name = user_name
                    // result.user_img = `${url.url_img}user/${user_img}`
                    result.post_by = postReport[0].user_name
                  }
                  if(utility.issetVal(postReport[0].content)){
                    result.post_content = postReport[0].content           
                  }
  
                  if(utility.issetVal(postReport[0].removed)){
                    result.removed = postReport[0].removed
                  }
                }

                return result;
              }).then(result => {
                // console.log(result.post_by);
                exec
                .knex('T_User')
                .select('T_User.name as user_name', 'T_User.img as user_img')
                .where('T_User.id', user_id)
                .then(res =>{
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

              })
              .catch(error =>{
                reject(error)
              })
            })
            .then(result =>{
              return result
            })
          }))
          .then( result => {
            // console.log({'result akhir' : result});
            let newItem = result
            // console.log({post : req.post});
            // console.log({newItem});
            if(utility.issetVal(req.post)){
              // let regex = new RegExp("\\b" + req.post + "\\b")
              newItem = _.filter(result, (obj) => {
                // console.log({obj : obj.post_content});
                if(utility.issetVal(obj.post_content)){
                  // console.log(obj.post_content.search(req.post));
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
              // let regex = new RegExp("\\b" + req.posted_by + "\\b")
              // console.log({author : req.posted_by});
              newItem = _.filter(newItem, obj => {
                // console.log({post_by : obj.post_by});
                  if(utility.issetVal(obj.post_by)){
                    let lowPostBy = obj.post_by.toLowerCase()
                    // console.log({author : req.posted_by});
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
                // console.log({splitedDate : splitedDate});
                newItem = _.filter(newItem, obj => {
                  if(utility.issetVal(obj.create_date)){
                    let dateFrom = splitedDate[0].split("/")
                    let dateTo = splitedDate[1].split("/")
                    let dateCheck = JSON.stringify(obj.create_date).substring(1,11).split("-").reverse()

                    // console.log({dateFrom : dateFrom});
                    // console.log({dateTo : dateTo});
                    // console.log({dateCheck : dateCheck});

                    let from = new Date(dateFrom[2], parseInt(dateFrom[0])-1, dateFrom[1]);  // -1 because months are from 0 to 11
                    let to   = new Date(dateTo[2], parseInt(dateTo[0])-1, dateTo[1]);
                    let check = new Date(dateCheck[2], parseInt(dateCheck[1])-1, dateCheck[0]);
                    // console.log(check >= from && check <= to)

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

    // getAllByPost: function(req, callback){
    //     Model.find(req)
    //         .select()
    //         .exec(callback);
    // },

    getCountData: function(req,callback){
        let query = req || {}
        Model.countDocuments(query, callback);
    },

    getByPost : function(req, callback){
      Model.find(req).select().exec(callback)
    }

    // getById: function(req, callback){
    //     console.log(req);
    //     Model.findById(req).select().exec(callback);
    // },

    // getData : function (req, callback){
    //     Model.find(req, callback)
    // }
}
