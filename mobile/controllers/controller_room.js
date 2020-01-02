//models
const User = require('../models/user')
const Room = require('../models/room')
const RoomParticipants = require('../models/roomParticipants')

//Utility
const response  = require('../../helpers/response')
const utility   = require('../../helpers/utility')
const _         = require('lodash')

//formidable
const formidable = require('formidable')
const path = require('path');
let appDir = path.dirname(require.main.filename);
let pathDir = appDir + '/uploads/room/'

exports.addRoom = async(req, res) =>{
  console.log('ADD ROOM');
  console.log(req.body);
  const {user_id, auth_code, participant_id} = req.body

  try{
    const middleware = {
      user_id        : 'required|text|'+user_id,
      auth_code      : 'required|text|'+auth_code,
      participant_id : 'required|text|'+participant_id,
    }
    if(utility.validateRequest(middleware)){
      await User.getAuth(req.body, function(errAuth, resAuth){
        // console.log({errAuth : errAuth});
        // console.log({resAuth : resAuth});
        if(utility.issetVal(resAuth)){
          if(resAuth.auth_code == req.body.auth_code){
              User.getById({id : participant_id}, function(errGet, resGet){
                console.log({errGet : errGet});
                console.log({resGet : resGet});
                if(utility.issetVal(resGet)){
              let bodyAdd = {
                title : null,
                type : "chat",
                creator_id : user_id,
                creator_type : 'user',
              }
              Room
              .add(bodyAdd)
              .then(resAdd=>{
                let bodyAdd2 =
                  [{
                    room_id : resAdd._id,
                    user_id : participant_id,
                    type    : 'member'
                  },
                  {
                    room_id : resAdd._id,
                    user_id : user_id,
                    type    : 'creator'
                  }]
                  RoomParticipants.add(bodyAdd2)
                  return resAdd._id;
              })
              .then(resAdd=>{
                console.log(resAdd)
                res
                .status(200)
                .send(new response(true, 200, 'Insert Success',  {room_id : resAdd }))
              })
              .catch(error =>{
                res
                .status(200)
                .send(new response(false, 401, 'Insert Failed'))
              })
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

exports.addGroup= async(req, res)=>{
  try{
    let formData = new Array();
      new formidable.IncomingForm().parse(req)
      .on('field', (name, field) => {
        if(utility.isJson(field)){
          formData.push('"' +name+ '"'+ ':'+field);
        } else {
          formData.push('"' +name+ '"'+ ':'+'"'+utility.escapeHtml(field)+'"')
        }
      })
      .on('file', (name, file) => {
        formData.push('"' +name+ '"'+ ':'+'"'+file.name+'"')
      })
      .on('fileBegin', function (name, file){
        if(utility.checkImageExtension(file.name)){
          let fileType = file.type.split('/').pop();
          file.name = utility.generateHash(16)+ '.' + fileType;
          file.path = appDir + '/uploads/room/' + file.name;
        }
      })
      .on('aborted', () => {
        console.error('Request aborted by the user')
      })
      .on('error', (err) => {
        console.error('Error', err)
        throw err
      })
      .on('end', () => {

    let temp = '{'+formData.toString() +'}'
    let formJSON = JSON.parse(temp)
    // console.log(formJSON);
    const {user_id, auth_code, name, participant_list, img} = formJSON
    const middleware = {
      user_id         : 'required|text|'+formJSON.user_id,
      auth_code       : 'required|text|'+formJSON.auth_code,
      name            : 'required|text|'+formJSON.name,
      participant_list: 'required|text|'+formJSON.participant_list,
      img             : 'no|text'+formJSON.img
    }
    if(utility.validateRequest(middleware)){
      User.getAuth(formJSON, function(errAuth, resAuth){
        if(utility.issetVal(resAuth)){
          if(resAuth.auth_code == formJSON.auth_code){
            let addGroup = {
              title : name,
              type  : 'group',
              creator_id : user_id,
              creator_type : 'user',
              img :formJSON.img
            }
            Room
            .add(addGroup)
            .then(resAdd =>{
              let newParticipants = {
                room_id : resAdd.id,
                type    : 'creator',
                user_id : user_id,
              }
              let participant_list = formJSON.participant_list.map(user =>{
                  user.room_id = resAdd.id,
                  user.type    = 'member'
                return user
              })
              participant_list.push(newParticipants)
              RoomParticipants.add(participant_list)
              return resAdd._id;
            })
            .then(resAdd=>{
              res
              .status(200)
              .send(new response(true, 200, 'Insert Success',  {room_id : resAdd }))
            })
            .catch(error=>{
              console.log(error);
              res
              .status(200)
              .send(new response(false, 401, 'Insert Failed'))
            })
          } else {
            res
            .status(200)
            .send(new response(false, 403, 'Unauthorized2'))
          }
        }else {
          res
          .status(200)
          .send(new response(false, 403, 'Unauthorized1'))
        }
      })
    } else {
      res
      .status(200)
      .send(new response(false, 400, 'Invalid input format'))
    }
    })
  } catch (e) {
    console.log(e);
    res
    .status(500)
    .send(new response(false, 500, 'Something went wrong'))
  }
}

exports.getInformation = async(req, res)=>{
  console.log('Group Information');
  try{
    // console.log(req.body);
    const { user_id, auth_code, room_id} = req.body
    const middleware = {
      user_id         : 'required|text|'+user_id,
      auth_code       : 'required|text|'+auth_code,
      room_id         : 'required|text'+room_id
    }
    if(utility.validateRequest(middleware)){
      User.getAuth(req.body, function(errAuth, resAuth){
        if(utility.issetVal(resAuth)){
          if(resAuth.auth_code == req.body.auth_code){
            let data = {
              room_id : null,
              name    : null,
              img     : null,
              member  : []
            }
            Room
            .findById(room_id)
            .then(resFind=>{
              if(utility.issetVal(resFind)){
                console.log({resFind : resFind});
                const {img, title, _id} = resFind
                data.room_id = _id
                data.name = title
                data.img = img
                return RoomParticipants.findAll({_id : room_id})
              }else {
                res
                .status(200)
                .send(new response(false, 404, 'rooms not exist'))
              }
            })
            .then(resFindAll=>{
              data.member= resFindAll
              // console.log({data});
              // console.log({resFindAll : resFindAll});
              res
              .status(200)
              .send(new response(true, 200, 'Fetch Success', data))
            })
            .catch(error =>{
              res
              .status(200)
              .send(new response(false, 401, 'Fetch Failed'))
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
  } catch (e) {
    console.log(e);
    res
    .status(500)
    .send(new response(false, 500, 'Something went wrong'))
  }
}

exports.deleteGroup = async(req, res)=>{
  console.log('DELETE GROUP');
  try {
    const { user_id, auth_code, room_id} = req.body
    const middleware = {
      user_id         : 'required|text|'+user_id,
      auth_code       : 'required|text|'+auth_code,
      room_id         : 'required|text|'+room_id,
    }
    if(utility.validateRequest(middleware)){
      User.getAuth(req.body, function(errAuth, resAuth){
        if(utility.issetVal(resAuth)){
          if(resAuth.auth_code == req.body.auth_code){
            Room
            .findById(room_id)
            .then(resFind=>{
              if(utility.issetVal(resFind)){
                console.log({resFind : resFind});
                let deleteRoom = Room.findOneAndDelete({_id : room_id})
                let deleteRoomParticipant = RoomParticipants.findOneAndDelete({room_id : room_id})
                return Promise.all([deleteRoom, deleteRoomParticipant])
              } else {
                throw (new response(false, 404,'Group Not Exist'))
              }
            })
            .then(datas=>{
              console.log({datas: datas});
              res
              .status(200)
              .send(new response(true, 200, 'Delete Success'))
            })
            .catch(error =>{
              res
              .status(200)
              .send(error)
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
  } catch (error){
    console.log(error);
    res
    .status(500)
    .send(new response(false, 500, 'Something went wrong'))
  }
}

exports.leaveGroup = async(req,res)=>{
  console.log('LEAVE GROUP');
  try {
    const { user_id, auth_code, room_id} = req.body
    const middleware = {
      user_id         : 'required|text|'+user_id,
      auth_code       : 'required|text|'+auth_code,
      room_id         : 'required|text|'+room_id,
    }
    if(utility.validateRequest(middleware)){
      User.getAuth(req.body, function(errAuth, resAuth){
        if(utility.issetVal(resAuth)){
          if(resAuth.auth_code == req.body.auth_code){
            Room
            .findById(room_id)
            .then(resFind=>{
              console.log({resFind : resFind});
              if(utility.issetVal(resFind)){
                return RoomParticipants.findOne({user_id : user_id})
              } else {
                throw (new response(false, 404,'Group Not Exist'))
              }
            })
            .then(data=>{
              console.log({data: data});
              const {type} = data
              if(type != 'creator'){
                return RoomParticipants.findOneAndDelete({user_id : user_id})
              } else {
                throw (new response(false, 402,'You are is Admin'))
              }
            })
            .then(delUser=>{
              console.log({delUser : delUser});
              res
              .status(200)
              .send(new response(true, 200, 'Delete Success'))
            })
            .catch(error =>{
              res
              .status(200)
              .send(error)
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
  } catch (error){
    console.log(error);
    res
    .status(500)
    .send(new response(false, 500, 'Something went wrong'))
  }
}

exports.roomList = async(req, res)=>{
  console.log('GET ROOM LIST');
  try {
    const {user_id, auth_code, page, item} = req.body
    const middleware = {
      user_id         : 'required|text|'+user_id,
      auth_code       : 'required|text|'+auth_code,
      // page            : 'required|text|'+page,
      // item            : 'required|text|'+item,
    }
    if(utility.validateRequest(middleware)){
      User.getAuth(req.body, function(errAuth, resAuth){
        // console.log({errAuth : errAuth});
        // console.log({resAuth : resAuth});
        if(utility.issetVal(resAuth)){
          if(resAuth.auth_code == req.body.auth_code){
            RoomParticipants
            .getCount({user_id : user_id})
            .then(resCount=>{
              if(utility.issetVal(resCount)){
                
                res
                .status(200)
                .send(new response(true, 200, 'Fetch Succes', resCount))
              } else {
                res
                .status(200)
                .send(new response(false, 401, 'Fetch Failed'))
              }
            })
            .catch(error=>{
              console.log(error);
            })

            /*
            if(utility.issetVal(resCount)){
                
                res
                .status(200)
                .send(new response(true, 200, 'Fetch Succes', resCount))
              } else {
                res
                .status(200)
                .send(new response(false, 401, 'Fetch Failed'))
              }
            */
            /* Room.findAll({creator_id : user_id},page,item) */
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

exports.getUserInformation = async(req, res)=>{
  console.log(req.body);
  if(utility.issetVal(req)){
    let list_data = JSON.parse(req.body.datas)
    RoomParticipants.getUserinformation({datas:list_data})
    .then(resUser=>{
      console.log({resUser});
      res
      .status(200)
      .send(new response(true, 200, 'Fecth Succes', resUser))
    })
    .catch(error=>{
      console.log(error);
      res
      .status(200)
      .send(new response(false, 401, 'Fecth Failed'))
    })    
  } else {

  }
}
