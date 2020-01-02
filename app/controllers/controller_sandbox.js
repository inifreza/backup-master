let response = require('../../helpers/response')
const utility = require('../../helpers/utility')
const globals = require('../../configs/global')
const { config } = require('../../default')
let {firebase} = globals[config.environment]; // development || production
let _ = require('lodash');
let moment = require('moment')
// models
const admin = require('../models/admin')
const user = require('../models/user')
const device = require('../models/device')
const notification = require('../models/notification')

exports.pushNotif = async (req, res) => {
  try{
    const middleware = {
      user_id      : 'required|text|'+req.body.user_id,
      auth_code    : 'required|text|'+req.body.auth_code
    }
    // console.log(middleware);
    if(utility.validateRequest(middleware)){
      const result = await admin.getAuth(req.body,function(errAuth,resAuth){
          console.log(errAuth)
        if(!errAuth){
          if(!utility.issetVal(resAuth)){
            res.status(200).send(
            new response(false, 403, 'Unauthorized')
          )}else{
            if(resAuth.auth_code == req.body.auth_code){
                const content = {
                    headline : "New Event",
                    sub_headline : 'Test Event',
                    type : 'event',
                    id : 'dasdasd1231239zxc9123'
                }
              //here goes the function
                const getDevice = new Promise((resolve, reject) => {
                    device.getAll(null,function(errRes,tokens) {
                        console.log(errRes);
                        if(!utility.issetVal(errRes)){
                        if(utility.issetVal(tokens)){
                            resolve(tokens)
                        } else {
                            resolve()
                        }
                        }else {
                            resolve()
                        }
                    })
                    
                })

                Promise.all([getDevice]).then(arr => {
                    // console.log(arr[0])
                    let requests = "";
                    if(utility.issetVal(arr[0])){
                        if(utility.issetVal(arr[0]['android'])){
                             requests = utility.requestFCM("android"
                                    , firebase.base_url
                                    , firebase.server_key
                                    , arr[0]['android']
                                    , content);
                            // console.log('android', request)
                            
                        }
                        if(utility.issetVal(arr[0]['ios'])){
                            requests = utility.requestFCM("ios"
                                    , firebase.base_url
                                    , firebase.server_key
                                    , arr[0]['ios']
                                    , content);
                            // console.log('android', request)
                        }
                    }

                    res.status(200).send(
                        new response(true, 200, 'Fetch Success')
                    )
                })
               
            }else{
              res.status(200).send(
              new response(false, 403, 'Unauthorized')
              )
            }
          }
        }else{
          res.status(200).send(
            new response(false, 403, 'Unauthorized')
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

exports.pushNotifSpesificUser = async (req, res) => {
  try{
    const middleware = {
      user_id      : 'required|text|'+req.body.user_id,
      auth_code    : 'required|text|'+req.body.auth_code
    }
    // console.log(middleware);
    if(utility.validateRequest(middleware)){
      const result = await admin.getAuth(req.body,function(errAuth,resAuth){
          console.log(errAuth)
        if(!errAuth){
          if(!utility.issetVal(resAuth)){
            res.status(200).send(
            new response(false, 403, 'Unauthorized')
          )}else{
            if(resAuth.auth_code == req.body.auth_code){
                const content = {
                    headline : "New Event",
                    sub_headline : 'Test Event',
                    type : 'event',
                    id : 'dasdasd1231239zxc9123'
                }
              //here goes the function
                const getDevice = new Promise((resolve, reject) => {
                    const subject = ['C56b8h1JUCpMjLLKkYKlqBLqn7xoezor','HbtcKzrPbh6cvyFTsyOmnFa4moHdmUcN','qvxyO2UPYGfcE1c8xiRwor0Zm13oj1GQ']
                    device.getSpesificUser(subject,function(errRes,tokens) {
                        console.log(errRes);
                        if(!utility.issetVal(errRes)){
                        if(utility.issetVal(tokens)){
                            resolve(tokens)
                        } else {
                            resolve()
                        }
                        }else {
                            resolve()
                        }
                    })
                    
                })

                Promise.all([getDevice]).then(arr => {
                    // console.log(arr[0])
                    let requests = "";
                    if(utility.issetVal(arr[0])){
                        if(utility.issetVal(arr[0]['android'])){
                             requests = utility.requestFCM("android"
                                    , firebase.base_url
                                    , firebase.server_key
                                    , arr[0]['android']
                                    , content);
                            // console.log('android', request)
                            
                        }
                        if(utility.issetVal(arr[0]['ios'])){
                            requests = utility.requestFCM("ios"
                                    , firebase.base_url
                                    , firebase.server_key
                                    , arr[0]['ios']
                                    , content);
                            // console.log('android', request)
                        }
                    }

                    res.status(200).send(
                        new response(true, 200, 'Fetch Success')
                    )
                })
               
            }else{
              res.status(200).send(
              new response(false, 403, 'Unauthorized')
              )
            }
          }
        }else{
          res.status(200).send(
            new response(false, 403, 'Unauthorized')
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


exports.getAllVerified = async (req, res) => {
  try{
    const middleware = {
      user_id      : 'required|text|'+req.body.user_id,
      auth_code    : 'required|text|'+req.body.auth_code
    }
    // console.log(middleware);
    if(utility.validateRequest(middleware)){
      const result = await admin.getAuth(req.body,function(errAuth,resAuth){
          console.log(errAuth)
        if(!errAuth){
          if(!utility.issetVal(resAuth)){
            res.status(200).send(
            new response(false, 403, 'Unauthorized')
          )}else{
            if(resAuth.auth_code == req.body.auth_code){
              const content = {
                headline : "Inside Promise",
                sub_headline : 'Test Inside',
                type : 'event',
                id : 'dasdasd1231239zxc9123',
                redirect  : true
              }
              

              let userData;
              let promiseUser = new Promise(function(resolve, reject) {
                user.getAllVerified(null, (err, res)=>{
                  if(!utility.issetVal(err)){
                    resolve(res)
                   
                    userData = res
                    return userData;
                  }
                })
              });
              setTimeout(function(){
                const getDevice = new Promise((resolve, reject) => {
                  const subject = userData
                  console.log('subb', subject)
                  device.getSpesificUser(subject,function(errRes,tokens) {
                    console.log(errRes);
                    if(!utility.issetVal(errRes)){
                      if(utility.issetVal(tokens)){
                        console.log('subject', tokens)
                            resolve(tokens)
                        } else {
                            resolve()
                        }
                      }else {
                          resolve()
                      }
                  })   
                })

                Promise.all([promiseUser, getDevice]).then(arr => {
                  console.log(arr[0])
                  if(utility.issetVal(arr[1])){
                      if(utility.issetVal(arr[1]['android'])){
                           utility.requestFCM("android"
                                  , firebase.base_url
                                  , firebase.server_key
                                  , arr[1]['android']
                                  , content);
                          // console.log('android', request)
                          
                      }
                      if(utility.issetVal(arr[1]['ios'])){
                           utility.requestFCM("ios"
                                  , firebase.base_url
                                  , firebase.server_key
                                  , arr[1]['ios']
                                  , content);
                          // console.log('android', request)
                      }
                  }
                  
                  // Array Mapping data user
                  _.map(arr[0], (o) => {
                    const arrayNotification = {
                      id              : utility.generateHash(32),
                      sender_id       : null,
                      recipient_id    : o,
                      create_date     : moment(Date.now()).format('YYYY-MM-DD HH:mm:ss'),
                      predicate       : 'create',
                      redirect        : 1,
                      type_id         : 'asdxcaxc',
                      type            : 'test',
                      seen            : 0,
                    }
                    notification.addData(arrayNotification, (err, res)=>{
                      utility.issetVal(err)? console.log(`submit data ${o}`, err) : null;
                    })
                    
                  });
                }).then(arr => {
                  res.status(200).send(
                    new response(true, 200, 'Fetch Success', arr)
                  )
                }).catch( err => {
                  console.log(err);
                } );
              }, 1000); // assume the fetch calls finish in 1s

            }else{
              res.status(200).send(
              new response(false, 403, 'Unauthorized')
              )
            }
          }
        }else{
          res.status(200).send(
            new response(false, 403, 'Unauthorized')
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