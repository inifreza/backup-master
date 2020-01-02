var eula = require('../models/eula')
var admin = require('../models/admin')
const user = require('../models/user')
let response = require('../../helpers/response')
const utility = require('../../helpers/utility')
const nodemailer = require('../../helpers/mail_adapter');
let moment = require('moment')
const formidable = require('formidable')
const path = require('path');
const fs = require('fs');

exports.getActive = async (req, res) => {
    try{
        const middleware = {
            user_id         : 'no|text|'+req.body.user_id,
            auth_code       : 'no|text|'+req.body.auth_code,
        }
        console.log(middleware);
        if(utility.validateRequest(middleware)){
            eula.getOne(null,function(errRes,resData) {
                console.log(resData);
                if (!errRes) {
                    if (utility.issetVal(resData)) {
                        res.status(200).send(new response(true, 200, 'Fetch success', resData))
                    } else {
                        res.status(200).send(
                            new response(false, 401, 'Fetch Failed')
                        )
                    }
                }else {
                    res.status(200).send(
                        new response(false, 401, 'Fetch Failed')
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

exports.getNotice = async (req, res) => {
    try{
      const middleware = {
        user_id      : 'required|text|'+req.body.user_id,
        auth_code    : 'required|text|'+req.body.auth_code,
        version_name : 'required|text|'+req.body.version_name
      }
      console.log(middleware);
      if(utility.validateRequest(middleware)){
      const result = await user.getAuth(req.body,function(errAuth,resAuth){
          if(utility.issetVal(resAuth)){
            if(resAuth.auth_code == req.body.auth_code){
                let body = {
                    version_name : req.body.version_name,
                    publish      : 1,
                }
                eula.findOne(body, (errFind, resFind) => {
                    if(resFind.version_name == req.body.version_name){
                        res
                        .status(200)
                        .send(new response(true, 200, 'Update Avaiable', resFind))
                    } else {
                        res
                        .status(200)
                        .send(new response(false, 401, 'Belum Ada update'))
                    }
                })
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
