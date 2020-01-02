//models
const User = require('../models/user')
const admin = require('../models/admin')
const Room = require('../models/room')
const RoomParticipants = require('../models/roomParticipants')

//Utility
const response  = require('../../helpers/response')
const utility   = require('../../helpers/utility')
const _         = require('lodash')
const moment = require('moment')


//formidable
const formidable = require('formidable')
const path = require('path');
let appDir = path.dirname(require.main.filename);
let pathDir = appDir + '/uploads/room/'

exports.addRoom = async(req, res) =>{
  console.log('ADD ROOM');
  const {user_id, auth_code, participant_id} = req.body

  try{
    const middleware = {
      user_id        : 'required|text|'+user_id,
      auth_code      : 'required|text|'+auth_code,
      participant_id : 'required|text|'+participant_id,
    }
    if(utility.validateRequest(middleware)){
      await admin.getAuth(req.body, function(errAuth, resAuth){
        // console.log({errAuth : errAuth});
        // console.log({resAuth : resAuth});
        if(utility.issetVal(resAuth)){
          if(resAuth.auth_code == req.body.auth_code){
              User.getById({id : participant_id}, function(errGet, resGet){
                
                if(utility.issetVal(resGet)){
                  RoomParticipants.getData({
                    creator_id : user_id
                    , member_id : participant_id}, (err, res) =>{
                      console.log(res)
                  })
                  let bodyAdd = {
                    title : null,
                    type : "admin_chat",
                    creator_id : user_id,
                    creator_type : 'admin',
                    create_date  : moment(Date.now()).format('YYYY-MM-DD HH:mm:ss')
                  }
                  Room.addData(bodyAdd, function(err, resAdd){
                    if(!utility.issetVal(err)){
                      if(utility.issetVal(resAdd)){
                        let bodyAdd2 =
                        [{
                          room_id : resAdd._id,
                          user_id : participant_id,
                          type    : 'member',
                          account : 'user'
                        },
                        {
                          room_id : resAdd._id,
                          user_id : null,
                          type    : 'creator',
                          account : 'admin'
                        }]

                        RoomParticipants.addData(bodyAdd2, function(errAdd, resData) {
                          if(!utility.issetVal(errAdd)){
                            if(utility.issetVal(resData)){
                              // do action
                              res
                              .status(200)
                              .send(new response(true, 200, 'Insert Success'))
                            } else {
                              res
                              .status(200)
                              .send(new response(false, 401, 'Insert Failed'))
                            }
                          } else {
                            res
                            .status(200)
                            .send(new response(false, 401, 'Insert Failed'))
                            // do action
                          }
                        })
                      } else {
                        res
                        .status(200)
                        .send(new response(false, 401, 'Insert Failed'))
                        // do action
                      }
                    } else {
                      res
                      .status(200)
                      .send(new response(false, 401, 'Insert Failed'))
                      // do action
                    }
                  });
                } else {
                  res
                  .status(200)
                  .send(new response(false, 404, 'user not exist'))
                }
              }) 
          } else {
            res
            .status(200)
            .send(new response(false, 403, 'Unauthorized2'))
          }
        } else {
          res.status(200).send(
            new response(false, 403, 'Unauthorized1')
            )
        }
      })      
    }else{
      res.status(200).send(
        new response(false, 400, 'Invalid input format')
      )
    }
  } catch (e) {
    console.log(e);
    res.status(500).send(
      new response(false, 500, 'Something went wrong')
    )
  }
}

exports.chat_adminList = async(req, res)=>{
  console.log('GET ROOM LIST');
  try {
    const {user_id, auth_code, page, item, search} = req.body
    const middleware = {
      user_id         : 'required|text|'+user_id,
      auth_code       : 'required|text|'+auth_code,
      page            : 'required|text|'+page,
      item            : 'no|text|'+item,
      search          : 'no|text|'+search,
    }
    if(utility.validateRequest(middleware)){
      admin.getAuth(req.body, function(errAuth, resAuth){
        if(utility.issetVal(resAuth)){
          if(resAuth.auth_code == auth_code){
            const PreparedCount = {
              type : 'admin_chat'
            }
            utility.issetVal(search) ? PreparedCount.search = search : null;
            Room.getCountData(PreparedCount,function(errCount, resCount){
              console.log('a', resCount)
              if(utility.issetVal(resCount)){
                let itemPerRequest = utility.issetVal(req.body.item)?  parseInt(req.body.item) : 15;
                let page = req.body.page;
                let total_data =  resCount;
                let total_page = Math.ceil(total_data / itemPerRequest);

                let limitBefore = page <= 1 || page == null ? 0 : (page-1) * itemPerRequest;

                const PreparedData = {
                    start : limitBefore,
                    limit : itemPerRequest,
                    type : 'admin_chat'
                }
                utility.issetVal(search) ? PreparedData.search = search : null;
                Room.getAll(PreparedData, function(errGet, resGet){
                  console.log('ax',resGet)
                  const totalInfo = {
                    total_page : total_page,
                    total_data_all : total_data,
                    total_data : resGet.length
                    }
                  if(utility.issetVal(resGet)){
                    res
                    .status(200)
                    .send(new response(true, 200, 'Fetch Succes', {data : resGet, total :totalInfo}))  
                  } else {
                    res
                    .status(200)
                    .send(new response(false, 401, 'Fetch Failed'))
                  }
                })
              } else {
                res
                .status(200)
                .send(new response(false, 404, 'Data not exist')) 
              }
            })
          } else {
            res
            .status(200)
            .send(new response(false, 403, 'Unauthorized2'))
          }
        } else {
          res
          .status(200)
          .send(new response(false, 403, 'Unauthorized1'))
        }
      })
    } else {
      res
      .status(200)
      .send(new response(false, 400, 'Invalid input format', middleware))
    }
  } catch(error){
    console.log(error);
    res
    .status(500)
    .send(new response(false, 500, 'Something went wrong'))
  }
}