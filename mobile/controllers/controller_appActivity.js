
var user = require('../models/user')
let response = require('../../helpers/response')
const utility = require('../../helpers/utility')
const nodemailer = require('../../helpers/mail_adapter');
let moment = require('moment')
const formidable = require('formidable')
const path = require('path');
const fs = require('fs');

const appActivity = require('../models/mAppActivity');


exports.insert = async (req, res) => {
    try {
        const middleware = {
            user_id         : `required|text|${req.body.user_id}`,
            auth_code       : `required|text|${req.body.auth_code}`,
            type            : `required|text|${req.body.type}`,
        }
        if(utility.validateRequest(middleware)){
            if(!utility.validateActivity(req.body.type)){
                res
                .status(200)
                .send(new response(false, 405, 'Undefined Type')) 
                return false;
            } 
            const result = await user.getAuth(req.body,function(errAuth,resAuth){
                if(!errAuth){
                    if(resAuth == null || undefined){
                        res.status(200).send(
                        new response(false, 403, 'Unauthorized')
                        )
                    }else{
                        if(resAuth.auth_code == req.body.auth_code){
                            //here goes the function
                           
                            const body = {
                                user_id         : req.body.user_id,
                                type            : req.body.type,
                                date            :  moment(Date.now()).format('YYYY-MM-DD'),
                                create_date     :  moment(Date.now()).format('YYYY-MM-DD HH:mm:ss')
                            }

                            appActivity.addData(body, function(err,resData) {
                                console.log(err)
                                if (!err) {
                                    res.status(200).send(new response(true, 200, 'Insert Data success', resData))
                                } else {
                                    res.status(200).send(
                                        new response(false, 400, 'Insert Data failed')
                                    )
                                }
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



