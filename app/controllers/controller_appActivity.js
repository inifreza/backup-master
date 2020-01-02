
var admin = require('../models/admin')
let response = require('../../helpers/response')
const utility = require('../../helpers/utility')
const nodemailer = require('../../helpers/mail_adapter');
let moment = require('moment')
const formidable = require('formidable')
const path = require('path');
const fs = require('fs');

const appActivity = require('../models/mAppActivity');


exports.getAllByUser = async (req, res) => {
    try{
      const middleware = {
        user_id         : `required|text|${req.body.user_id}`,
        auth_code       : `required|text|${req.body.auth_code}`,
        alumni_id       : `required|text|${req.body.alumni_id}`,
      }
      // console.log(middleware);
      if(utility.validateRequest(middleware)){
        const result = await admin.getAuth(req.body,(errAuth,resAuth) => {
            console.log(errAuth);
          if(!errAuth){
            if(!utility.issetVal(resAuth)){
                res.status(200).send(
                    new response(false, 403, 'Unauthorized')
                )
            }else{
                if(resAuth.auth_code == req.body.auth_code){
                    //here goes the function
                    let body = {
                        user_id : req.body.alumni_id
                    }
                    appActivity.getCountByUser(body,(errResCount,rowsResCount) =>  {
                        console.log('getcount', rowsResCount);
                        console.log('err    count', errResCount);
                        
                        if (!errResCount) {
                           if (utility.issetVal(rowsResCount)) {
                                let itemPerRequest = utility.issetVal(req.body.item)?  parseInt(req.body.item) : 15;
                                let page = req.body.page;
                                let total_data =  rowsResCount;
                                let total_page = Math.ceil(total_data / itemPerRequest);
            
                                let limitBefore = page <= 1 || page == null ? 0 : (page-1) * itemPerRequest;
            
                                const PreparedData = {
                                    start : limitBefore,
                                    limit : itemPerRequest,
                                    user_id : req.body.alumni_id
                                }
            
                                appActivity.getAllByUser(PreparedData,function(errRes,rowsRes) {
                                    console.log(errRes);
                                    if (!errRes) {
                                        const totalInfo = {
                                            total_page : total_page,
                                            total_data_all : total_data,
                                            total_data : rowsRes.length
                                        }
                                        if (utility.issetVal(rowsRes)) {
                                            res.status(200).send(new response(true, 200, 'Fetch Success', {
                                                data :rowsRes,
                                                total: totalInfo
                                            } ))
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




