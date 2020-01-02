const response = require('../../helpers/response')
const utility = require('../../helpers/utility')
const globals = require('../../configs/global')
const { config } = require('../../default')
let url = globals[config.environment]; // development || production
const moment = require('moment')
let _ = require('lodash');

//models
const user = require('../models/user')
const interest = require('../models/interest')
const at_alumniInterest = require('../models/AT_AlumniInterest')
const Rooms = require('../models/rooms')
const RoomParticipantes = require('../models/roomParticipantes')

const Mongoose = require("mongoose");
const ObjectId = Mongoose.Types.ObjectId;

exports.getRoot = async (req, res) => {
  try{
    const middleware = {
      user_id      : 'required|text|'+req.body.user_id,
      auth_code    : 'required|text|'+req.body.auth_code,
      filter       : 'no|text|'+req.body.filter
    }
    // console.log(middleware);
    if(utility.validateRequest(middleware)){
      const result = await user.getAuth(req.body,function(errAuth,resAuth){
          console.log(errAuth);
        if(!errAuth){
          if(!utility.issetVal(resAuth)){
              res.status(200).send(
                  new response(false, 403, 'Unauthorized')
              )
          }else{
              if(resAuth.auth_code == req.body.auth_code){
                  //here goes the functionS      
                let body = {
                  parent_id : 'root'
                };
                utility.issetVal(req.body.filter)?  body.title = req.body.filter :  null;
                console.log(body); 
                interest.getAll(body,function(errRes,rowsRes) {
                    console.log(errRes);
                    if (!utility.issetVal(errRes)) {
                    
                      if (utility.issetVal(rowsRes)) {
                        for(let i = 0; i < rowsRes.length; i++){
                          if(utility.issetVal(rowsRes[i].img)){
                            rowsRes[i].img = url.url_img+'interest/'+rowsRes[i].img;
                          } else {
                            rowsRes[i].img = null
                          }
                        }
                        res.status(200).send(new response(true, 200, 'Fetch Success', rowsRes ))
                      } else {
                          res.status(200).send(
                              new response(false, 401, 'Fetch Failed4')
                          )
                      }
                    }else {
                        res.status(200).send(
                            new response(false, 401, 'Fetch Failed3')
                        )
                    }
                })
              }else{
                  res.status(200).send(
                  new response(false, 403, 'Unauthorized2')
                  )
              }
          }
        }else{
          res.status(200).send(
            new response(false, 403, 'Unauthorized3')
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

exports.getChild = async (req, res) => {
  try{
    const middleware = {
      user_id      : 'required|text|'+req.body.user_id,
      auth_code    : 'required|text|'+req.body.auth_code,
      parent_id    : 'required|text|'+req.body.parent_id,
      filter       : 'no|text|'+req.body.filter
    }
    // console.log(middleware);
    if(utility.validateRequest(middleware)){
      const result = await user.getAuth(req.body,function(errAuth,resAuth){
          console.log(errAuth);
        if(!errAuth){
          if(!utility.issetVal(resAuth)){
              res.status(200).send(
                  new response(false, 403, 'Unauthorized')
              )
          }else{
              if(resAuth.auth_code == req.body.auth_code){
                  //here goes the functionS      
                let body = {
                  user_id : req.body.user_id,
                  parent_id : req.body.parent_id
                };
                utility.issetVal(req.body.filter)?  body.title = req.body.filter :  null;
                console.log(body); 
                interest.getAll(body,function(errRes,rowsRes) {
                    console.log(errRes);
                    if (!utility.issetVal(errRes)) {
                    
                      if (utility.issetVal(rowsRes)) {
                        for(let i = 0; i < rowsRes.length; i++){
                          if(utility.issetVal(rowsRes[i].img)){
                            rowsRes[i].img = url.url_img+'interest/'+rowsRes[i].img;
                          } else {
                            rowsRes[i].img = null
                          }
                        }
                          res.status(200).send(new response(true, 200, 'Fetch Success', rowsRes ))
                      } else {
                          res.status(200).send(
                              new response(false, 401, 'Fetch Failed4')
                          )
                      }
                    }else {
                        res.status(200).send(
                            new response(false, 401, 'Fetch Failed3')
                        )
                    }
                })
              }else{
                  res.status(200).send(
                  new response(false, 403, 'Unauthorized2')
                  )
              }
          }
        }else{
          res.status(200).send(
            new response(false, 403, 'Unauthorized3')
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

exports.getFull = async (req, res) => {
  try{
    const middleware = {
      user_id      : 'required|text|'+req.body.user_id,
      auth_code    : 'required|text|'+req.body.auth_code,
      parent_id    : 'no|text|'+req.body.parent_id,
      filter       : 'no|text|'+req.body.filter
    }
    // console.log(middleware);
    if(utility.validateRequest(middleware)){
      const result = await user.getAuth(req.body,function(errAuth,resAuth){
          console.log(errAuth);
        if(!errAuth){
          if(!utility.issetVal(resAuth)){
              res.status(200).send(
                  new response(false, 403, 'Unauthorized')
              )
          }else{
              if(resAuth.auth_code == req.body.auth_code){
                  //here goes the functionS      
                let body = {
                  user_id : req.body.user_id,
                  parent_id : 'root'
                };
                utility.issetVal(req.body.filter)?  body.title = req.body.filter :  null;
                console.log(body); 
                interest.getFull(body,function(errRes,rowsRes) {
                    console.log(errRes);
                    if (!utility.issetVal(errRes)) {
                    
                      if (utility.issetVal(rowsRes)) {
                       
                          res.status(200).send(new response(true, 200, 'Fetch Success', rowsRes ))
                      } else {
                          res.status(200).send(
                              new response(false, 401, 'Fetch Failed4')
                          )
                      }
                    }else {
                        res.status(200).send(
                            new response(false, 401, 'Fetch Failed3')
                        )
                    }
                })
              }else{
                  res.status(200).send(
                  new response(false, 403, 'Unauthorized2')
                  )
              }
          }
        }else{
          res.status(200).send(
            new response(false, 403, 'Unauthorized3')
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

exports.getFollowedInterest = async (req, res) => {
  try{
    const middleware = {
      user_id      : 'required|text|'+req.body.user_id,
      auth_code    : 'required|text|'+req.body.auth_code,
      parent_id    : 'no|text|'+req.body.parent_id,
      filter       : 'no|text|'+req.body.filter
    }
    // console.log(middleware);
    if(utility.validateRequest(middleware)){
      const result = await user.getAuth(req.body,function(errAuth,resAuth){
          console.log(errAuth);
        if(!errAuth){
          if(!utility.issetVal(resAuth)){
              res.status(200).send(
                  new response(false, 403, 'Unauthorized')
              )
          }else{
              if(resAuth.auth_code == req.body.auth_code){
                  //here goes the functionS      
                let body = {
                  user_id : req.body.user_id,
                  follow : 1
                };
                utility.issetVal(req.body.filter)?  body.title = req.body.filter :  null;
                console.log(body); 
                interest.getAll(body,function(errRes,rowsRes) {
                    console.log(errRes);
                    
                    if (!utility.issetVal(errRes)) {
                      const newRess = _.filter(rowsRes, function(item) { 
                        console.log(item)
                        return item.parent_id != 'root' && item.follow != '0'
                      });
                      console.log(newRess)
                      if (utility.issetVal(newRess)) {
                        for(let i = 0; i < newRess.length; i++){
                          if(utility.issetVal(newRess[i].img)){
                            newRess[i].img = url.url_img+'interest/'+newRess[i].img;
                          } else {
                            newRess[i].img = null
                          }
                        }
                          res.status(200).send(new response(true, 200, 'Fetch Success', newRess ))
                      } else {
                          res.status(200).send(
                              new response(false, 401, 'Fetch Failed4')
                          )
                      }
                    }else {
                        res.status(200).send(
                            new response(false, 401, 'Fetch Failed3')
                        )
                    }
                })
              }else{
                  res.status(200).send(
                  new response(false, 403, 'Unauthorized2')
                  )
              }
          }
        }else{
          res.status(200).send(
            new response(false, 403, 'Unauthorized3')
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

exports.getRecentInterest = async (req, res) => {
  try{
    const middleware = {
      user_id      : 'required|text|'+req.body.user_id,
      auth_code    : 'required|text|'+req.body.auth_code,
      parent_id    : 'no|text|'+req.body.parent_id,
      filter       : 'no|text|'+req.body.filter
    }
    // console.log(middleware);
    if(utility.validateRequest(middleware)){
      const result = await user.getAuth(req.body,function(errAuth,resAuth){
          console.log(errAuth);
        if(!errAuth){
          if(!utility.issetVal(resAuth)){
              res.status(200).send(
                  new response(false, 403, 'Unauthorized')
              )
          }else{
              if(resAuth.auth_code == req.body.auth_code){
                  //here goes the functionS      
                let body = {
                  user_id : req.body.user_id,
                  follow : 1
                };
                utility.issetVal(req.body.filter)?  body.title = req.body.filter :  null;
                console.log(body); 
                interest.getRecent(body,function(errRes,rowsRes) {
                    console.log(errRes);
                    
                    if (!utility.issetVal(errRes)) {
                      const newRess = _.filter(rowsRes, function(item) { 
                        console.log(item)
                        return item.parent_id != 'root' && item.follow != '0'
                      });
                      console.log(newRess)
                      if (utility.issetVal(newRess)) {
                        for(let i = 0; i < newRess.length; i++){
                          if(utility.issetVal(newRess[i].img)){
                            newRess[i].img = url.url_img+'interest/'+newRess[i].img;
                          } else {
                            newRess[i].img = null
                          }
                        }
                          res.status(200).send(new response(true, 200, 'Fetch Success', newRess ))
                      } else {
                          res.status(200).send(
                              new response(false, 401, 'Fetch Failed4')
                          )
                      }
                    }else {
                        res.status(200).send(
                            new response(false, 401, 'Fetch Failed3')
                        )
                    }
                })
              }else{
                  res.status(200).send(
                  new response(false, 403, 'Unauthorized2')
                  )
              }
          }
        }else{
          res.status(200).send(
            new response(false, 403, 'Unauthorized3')
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

exports.follow = async (req, res) =>{
  console.log('Fllow Interest');
  try{
    const {user_id, auth_code, interest_id, status}= req.body
    const middleware = {
      user_id      : 'required|text|'+user_id,
      auth_code    : 'required|text|'+auth_code,
      interest_id  : 'required|text|'+interest_id,
      status       : 'required|text|'+status,
    }
    if(utility.validateRequest(middleware)){
      await user.getAuth(req.body, function(errAuth, resAuth){
        if(utility.issetVal(resAuth)){
          if(resAuth.auth_code == auth_code){
    
            if(status  === 'follow'){
              let body = {
                user_id     : user_id,
                interest_id : interest_id,
                create_date : moment(Date.now()).format('YYYY-MM-DD HH:mm:ss')
              }
              /* FOLLOW */
              at_alumniInterest.addData(body, function(errAdd, resAdd){
                if(!errAdd){
                  Rooms.findOne({creator_id : interest_id}, (err, res) => {
                    if(utility.issetVal(!err)){
                      let bodyAdd2 =
                      [{
                        room_id : res._id
                        , user_id : user_id
                        , type    : 'member'
                        , account : 'user'
                        , typeRoom: 'interest'
                      }]

                      RoomParticipantes.addData(bodyAdd2, function(errAdd, resData) {
                        console.log('errAdd', errAdd)
                        console.log('resData', resData)
                      })
                    }
                  })
                  res.status(200).send(new response(true, 200, 'Follow Interest Succes'))
                } else {
                  res.status(200).send(new response(false, 401, 'Follow Interest failed'))
                }
              })
            }else if(status  === 'unfollow'){
              /* UNFOLLOW */
              const body = {
                interest_id : interest_id,
                user_id : user_id
              }
              at_alumniInterest.getData(body, function(errData, resData){
                if(utility.issetVal(resData)){
                  at_alumniInterest.deleteData(body, function(errDel, resDel){
                    console.log(errDel);
                    console.log(resDel);
                    if(resDel){
                      Rooms.findOne({creator_id : interest_id}, (err, res) => {
                        if(utility.issetVal(!err)){
                          let bodyAdd2 =
                          [{
                            room_id : res._id
                            , user_id : user_id
                            , type    : 'member'
                            , account : 'user'
                            , typeRoom: 'interest'
                          }]
                          RoomParticipantes.deleteDataByOne({'room_id' : ObjectId(res._id), 'user_id' : user_id}, function(err, resAdd){
                            console.log('roomErr', err)
                            console.log('room_add', resAdd)
                          })
                        }
                      })
                      res.status(200).send(new response(true, 200, 'Unfollow Succes'))
                    } else {
                      res.status(200).send(new response(false, 401, 'Unfollow failed'))
                    }
                  })
                } else {
                  res.status(200).send(new response(false, 401, 'Unfollow failed'))
                }
              })
            }
          } else {
            res
            .status(200)
            .send(new response(false, 403, 'Unauthorized'))
          }
        } else {
          res
          .status(200)
          .send(new response(false, 403, 'Unauthorized'))
        }
      })
    } else {
      res
      .status(200)
      .send(new response(false, 400, 'Invalid input format'))
    }
  } catch(error){
    console.log(error);
    res
    .status(500)
    .send(new response(false, 500, 'Something went wrong'))
  }
}
