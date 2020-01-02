//models
const user = require('../models/user')
const Room = require('../models/mRooms')
const RoomParticipants = require('../models/mRoomParticipants')

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


exports.roomList = async(req, res)=>{
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
      user.getAuth(req.body, function(errAuth, resAuth){
        if(utility.issetVal(resAuth)){
          if(resAuth.auth_code == auth_code){
            const PreparedCount = {
                user_id : user_id
            }
            utility.issetVal(search) ? PreparedCount.search = search : null;
            RoomParticipants.getData({user_id : user_id}, (err, resData)=> {
                console.log('as',resData.length)
            })
            Room.getCountData(PreparedCount,function(errCount, resCount){
            //   console.log('a', resCount)
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