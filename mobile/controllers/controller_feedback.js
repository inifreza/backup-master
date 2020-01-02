const admin = require('../models/admin')
const user = require('../models/user')
const feedback = require('../models/feedback')
const response = require('../../helpers/response')
const utility = require('../../helpers/utility')
const nodemailer = require('../../helpers/mail_adapter');
let moment = require('moment')
const formidable = require('formidable')
const path = require('path');
const fs = require('fs');

exports.getFeedback = async (req, res) => {
  try {
    const middleware = {
      user_id      : 'required|text|'+req.body.user_id,
      auth_code    : 'required|text|'+req.body.auth_code,
      page         : 'required|number|'+req.body.page,
    }
    if(utility.validateRequest(middleware)){
      const result = user.getAuth(req.body, (errAuth, resAuth)=> {
        console.log({errAuth});
        if(utility.issetVal(resAuth)){
          if(resAuth.auth_code == req.body.auth_code){
            let bodyCount = {
              keyword : req.body.keyword,
              create_date : req.body.create_date,
              app_version : req.body.app_version
            }

            feedback.getCount(bodyCount, (errCount, resCount)=> {
              console.log({errCount});
              let itemPerRequest = utility.issetVal(req.body.item)?  parseInt(req.body.item) : 15;
              let page = req.body.page;
              let total_data =  resCount;
              let total_page = Math.ceil(total_data / itemPerRequest);

              let limitBefore = page <= 1 || page == null ? 0 : (page-1) * itemPerRequest;

              if(!errCount){
                console.log({resCount});
                let bodyGet = {
                  start       : limitBefore,
                  limit       : itemPerRequest,                   
                  keyword     : req.body.keyword,
                  create_date : req.body.create_date,
                  app_version : req.body.app_version
                }
                feedback.getAll(bodyGet, (errGet, resGet) => {
                  if(utility.issetVal(resGet)){
                    const totalInfo = {
                      total_page : total_page,
                      total_data_all : total_data,
                      total_data : resGet.length
                    }
                    res.status(200).send(new response(true, 200, 'Fetch Success', {
                      data :resGet,
                      total: totalInfo
                    }))
                  } else {
                    res
                    .status(200)
                    .send(new response(false, 401, 'Fetch Failed2'))
                  }
                })
              } else {
                res
                .status(200)
                .send(new response(false, 401, 'Fetch Failed1'))
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
  } catch (error) {
    console.log(error);
    res
    .status(500)
    .send(new response(false, 500, 'Something went wrong'))
  }
}

exports.submitData = async (req, res) => {
  try {
    const middleware = {
      user_id      : 'required|text|'+req.body.user_id,
      auth_code    : 'required|text|'+req.body.auth_code,
      app_version  : 'required|text|'+req.body.app_version,
      platform     : 'required|text|'+req.body.platform,
      content      : 'required|text|'+req.body.content,
    }
    if(utility.validateRequest(middleware)){
      const result = user.getAuth(req.body, (errAuth, resAuth)=> {
        console.log({errAuth});
        if(utility.issetVal(resAuth)){
          if(resAuth.auth_code == req.body.auth_code){
            const body = {
              id: utility.generateHash(32),
              app_version : req.body.app_version,
              platform : req.body.platform,
              user_id     : req.body.user_id,
              content     : req.body.content,
              create_date : moment(Date.now()).format('YYYY-MM-DD HH:mm:ss')
            }
            
            feedback.addData(body, function(err,resData) {
              if (!err) {
                res.status(200).send(new response(true, 200, 'Insert Data success', resData));
              } else {
                res.status(200).send(new response(false, 400, 'Insert Data failed'));
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
  } catch (error) {
    console.log(error);
    res
    .status(500)
    .send(new response(false, 500, 'Something went wrong'))
  }
}