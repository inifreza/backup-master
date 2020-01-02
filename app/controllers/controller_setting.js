var admin = require('../models/admin')
var interest = require('../models/interest')
let response = require('../../helpers/response')
const utility = require('../../helpers/utility')
const setting = require('../models/T_Setting')
const settingInterest = require('../models/settingInterest')
const path = require('path');
const fs = require('fs');
let appDir = path.dirname(require.main.filename);
let pathDir = appDir + '/data/'
let _ = require('lodash');
let moment = require('moment')

exports.update = async (req, res) => {
  try{
    const middleware = {
        user_id             : 'required|text|'+req.body.user_id,
        auth_code           : 'required|text|'+req.body.auth_code,
        blacklist_interest  : 'no|json|'+req.body.blacklist_interest
    }
    if(utility.validateRequest(middleware)){
      const result = await admin.getAuth(req.body,function(errAuth,resAuth){
        if(!errAuth){
          if(!utility.issetVal(resAuth)){
            res.status(200).send(
            new response(false, 403, 'Unauthorized')
            )
          }else{
            setting.getOne(null, function(errGet, resSetting){
              console.log(errGet)
              if(utility.issetVal(resSetting)){
                
                let bodyUpdate = {
                  id        : resSetting.id,
                  show_post_comment: utility.booleanParse(req.body.post_comment),
                  show_comment: utility.booleanParse(req.body.comment),
                  show_polling: utility.booleanParse(req.body.polling),
                  show_share: utility.booleanParse(req.body.share),
                  show_post: utility.booleanParse(req.body.post),
                  show_message: utility.booleanParse(req.body.message)
                }
                console.log(bodyUpdate)
                setting.updateData(bodyUpdate, function(errUpdate, resUpdate){
                  console.log(errUpdate)
                  if(!errUpdate){
                    if(!utility.booleanParse(req.body.post)) {
                     
                      if(utility.issetVal(req.body.blacklist_interest)){
                        console.log('b')
                        let datInterest = JSON.parse(req.body.blacklist_interest);
                        console.log('array', datInterest.length)
                        settingInterest.deleteData({ setting_id  : bodyUpdate.id}, function(err,resData){
                          console.log({idx : err });
                        }) 
                        for(let idx = 0; idx <  datInterest.length; idx++) {
                            let object =  datInterest[idx];
                            // console.log({idx : object});

                            const bodyInterest = {
                                setting_id  : bodyUpdate.id,
                                interest_id : object.interest_id,
                                create_date : moment(Date.now()).format('YYYY-MM-DD HH:mm:ss')
                            }
                            
                            settingInterest.addData(bodyInterest, function(err,resData){
                                console.log({idx : err });
                            }) 
                        }
                      }
                    }
                    res
                    .status(200)
                    .send(new response(true, 200, 'Update Success'))
                  } else {
                    res
                    .status(200)
                    .send(new response(false, 401, 'Update Failed'))
                  }
                })
              } else {
                res
                .status(200)
                .send(new response(false, 404, 'Data  not exist'))
              }
            })  
          }
        }else{
          res.status(200).send(
            new response(false, 403, 'Unauthorized2')
          )
        }
      })
    }else{
      res.status(200).send(
        new response(false, 400, 'Invalid input format', middleware)
      )
    }
  } catch (e) {
    res.status(500).send(
      new response(false, 500, 'Something went wrong')
    )
  }
}

exports.get = async (req, res) => {
  try{
    const middleware = {
        user_id             : 'required|text|'+req.body.user_id,
        auth_code           : 'required|text|'+req.body.auth_code
    }
    if(utility.validateRequest(middleware)){
      const result = await admin.getAuth(req.body,function(errAuth,resAuth){
        console.log(errAuth)
        if(!errAuth){
          if(!utility.issetVal(resAuth)){
            res.status(200).send(
            new response(false, 403, 'Unauthorized')
            )
          }else{
            setting.getOne(null, function(errGet, resSetting){
              console.log(errGet)
              if(utility.issetVal(resSetting)){
                res
                .status(200)
                .send(new response(true, 200, 'Update Success', resSetting))
              } else {
                res
                .status(200)
                .send(new response(false, 404, 'Data  not exist'))
              }
            })  
          }
        }else{
          res.status(200).send(
            new response(false, 403, 'Unauthorized2')
          )
        }
      })
    }else{
      res.status(200).send(
        new response(false, 400, 'Invalid input format', middleware)
      )
    }
  } catch (e) {
    res.status(500).send(
      new response(false, 500, 'Something went wrong')
    )
  }
}