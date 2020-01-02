//Schema
const Model = require('../../data/schema_rooms')
const response = require('../../helpers/response')

// utils
const utility = require('../../helpers/utility')
const exec = require('../../helpers/mssql_adapter')
const globals = require('../../configs/global')
const { config } = require('../../default')
let url = globals[config.environment]; // development || production

let user = require('../models/user')
let roomParticipant = require('../models/roomParticipants')
let _ = require('lodash');

module.exports = {
  addData: function(req, callback){
      let newData = new Model(req);
      newData.save(callback);
  },

  deleteData: function(param, callback){
      Model.findByIdAndDelete(param.id, callback);
  },

  updateData: function(param, req,  callback){
      Model.findOneAndUpdate(param, req, {upsert: true}, callback);
  },


  deleteDataByInterest: function(param, callback){
    Model.findOneAndDelete(param, callback);
  },

  updateDataByInterest: function(param, req,  callback){
      Model.findOneAndUpdate(param, req, {upsert: true}, callback);
  },

  getCountData: function(req,callback){
    Model
    .find({type : req.type})
    .select()
    .sort({createdAt:-1})
    .then(datas =>{
      Promise.all(datas.map(data =>{
        const {_id, img, publish, title, type, creator_id, creator_type, create_date } = data
        let result = {
          id            : _id,
          img           : img,
          publish       : publish,
          title         : title, 
          type          : type,
          creator_id    : creator_id,
          creator_type  : creator_type,
          create_date   : create_date,
        }
        let promiseParticipant = new Promise (function (resolve, reject){
          roomParticipant.getData({room_id : result.id}, (err, dataParticipant)=>{
            if(!utility.issetVal(err)){
              // console.log('prepare', dataParticipant)
              // resolve(dataParticipant)
              let participantData = [];
              Promise.all(dataParticipant.map(userParticipant => {
                let participant = {
                  id : userParticipant._id
                  , user_id :userParticipant.user_id
                  , room_id : userParticipant.room_id
                  , type    : userParticipant.type
                  , mute    : userParticipant.mute
                  , publish : userParticipant.publish
                  , account : userParticipant.account
                  , create_date : userParticipant.createdAt
                  , last_active  : null
                  , last_seen  : null
                  , last_seen  : null
                }
                return new Promise (function (resolve, reject){
                  exec
                  .knex('T_User')
                  .select('T_User.name as user_name', 'T_User.img as user_img' )
                  .where('T_User.id', participant.user_id)
                  .then(res =>{
                     resolve(res[0])
                  }).catch(error =>{
                    resolve()
                  })
                })
                .then(result =>{
                  participant.name  = null;
                  participant.img   = null;

                  if(utility.issetVal(result)){
                    console.log(result)
                    participant.name  = result.user_name;
                    participant.img   = result.user_img;
                    data.title = result.user_name;
                    console.log(data)
                  } 
                  // participantData.push(participant)
                  return participant
                })
              })).then( result => {
                resolve(result)
              })
            } else{
              resolve()
            }
          })
        })

        return Promise.all([promiseParticipant])
        .then(([participant]) =>{
            // console.log('data', arr[0] )
            if(utility.issetVal(participant)){    
                result.participant = participant;
            }
            Promise.all(participant.map(userParticipant => {
              if(userParticipant.account == "user"){
                result.title = userParticipant.name;
              }
            }))
            return result
        })
      }))
      .then(result => {
        console.log(result);
        if(utility.issetVal(req.search)){
          return _.filter(result, (p) => {
            return p.title == `${req.search}`;
          });
        } else {
          return result;
        }
      })
      .then( result => {
        callback(null, result.length)
      })
    })
    .catch(error =>{
      // console.log(error);
      callback(error, null)
    })
  },

  getAll: function(req, callback){
     
      Model
      .find({type : req.type})
      .select()
      .skip(req.start)
      .limit(req.limit)
      .sort({createdAt:-1})
      .then(datas =>{
        Promise.all(datas.map(data =>{
          const {_id, img, publish, title, type, creator_id, creator_type, create_date } = data
          let result = {
            id            : _id,
            img           : img,
            publish       : publish,
            title         : title, 
            type          : type,
            creator_id    : creator_id,
            creator_type  : creator_type,
            create_date   : create_date,
            pathImg       : "room",
            last_content : "Dummy Last Content",
            count_unread : 10
          }
          let promiseParticipant = new Promise (function (resolve, reject){
            roomParticipant.getData({room_id : result.id}, (err, dataParticipant)=>{
              if(!utility.issetVal(err)){
                // console.log('prepare', dataParticipant)
                // resolve(dataParticipant)
                let participantData = [];
                Promise.all(dataParticipant.map(userParticipant => {
                  let participant = {
                    id : userParticipant._id
                    , user_id :userParticipant.user_id
                    , room_id : userParticipant.room_id
                    , type    : userParticipant.type
                    , mute    : userParticipant.mute
                    , publish : userParticipant.publish
                    , account : userParticipant.account
                    , create_date : userParticipant.createdAt
                    , last_active  : null
                    , last_seen  : null
                    , last_seen  : null
                  }
                  return new Promise (function (resolve, reject){
                    exec
                    .knex('T_User')
                    .select('T_User.name as user_name', 'T_User.img as user_img' )
                    .where('T_User.id', participant.user_id)
                    .then(res =>{
                       resolve(res[0])
                    }).catch(error =>{
                      resolve()
                    })
                  })
                  .then(result =>{
                    participant.name  = null;
                    participant.img   = null;

                    if(utility.issetVal(result)){
                      console.log(result)
                      participant.name  = result.user_name;
                      participant.img   = result.user_img;
                      data.title = result.user_name;
                      console.log(data)
                    } 
                    // participantData.push(participant)
                    return participant
                  })
                })).then( result => {
                  resolve(result)
                })
              } else{
                resolve()
              }
            })
          })

          return Promise.all([promiseParticipant])
          .then(([participant]) =>{
              // console.log('data', arr[0] )
              if(utility.issetVal(participant)){    
                  result.participant = participant;
              }
              Promise.all(participant.map(userParticipant => {
                if(userParticipant.account == "user"){
                  result.title = userParticipant.name;
                  result.img = userParticipant.img;
                  result.pathImg = 'user';
                }
              }))
              return result
          })
        }))
        .then(result => {
          console.log(result);
          if(utility.issetVal(req.search)){
            return _.filter(result, (p) => {
              return p.title == `${req.search}`;
            });
          } else {
            return result;
          }
        })
        .then( result => {
          callback(null, result)
        })
      })
      .catch(error =>{
        // console.log(error);
        callback(error, null)
      })
  },
}
