const appVersion = require('../models/appVersion')
const user = require('../models/user')
const response = require('../../helpers/response')
const utility = require('../../helpers/utility')
const nodemailer = require('../../helpers/mail_adapter');
const moment = require('moment')
const formidable = require('formidable')
const path = require('path');
const fs = require('fs');

exports.notice = async (req, res) => {
  try{
    const middleware = {
      user_id      : 'required|text|'+req.body.user_id,
      auth_code    : 'required|text|'+req.body.auth_code,
      platform     : 'required|text|'+req.body.platform,
      now_version  : 'required|text|'+req.body.now_version
    }
    console.log(middleware);
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
                  //here goes the function
                  const body = {
                      platform        : req.body.platform
                      , publish       : 1
                  }
                  // ,
                      // now_version     : req.body.now_version

                  appVersion.getOne(body,function(errData, resData) {
                      console.log( resData);
                      if (!errData) {
                         if (utility.issetVal( resData)) {
                            if(resData.version_name == req.body.now_version){
                              res.status(200).send(
                                new response(false, 404, 'Belum Ada update')
                              )
                            } else {
                              res.status(200).send(
                                new response(true, 200, 'Update Avaiable', resData)
                              )
                            }
                          } else {
                              res.status(200).send(
                                  new response(false, 401, 'Fetch Failed2')
                              )
                          }
                      } else {
                          res.status(200).send(
                              new response(false, 401, 'Fetch Failed1')
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
