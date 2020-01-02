var post = require('../models/post')
var postPolling = require('../models/postPolling')
var postInterest = require('../models/postInterest')
var postLikes = require('../models/postLikes')
var postComments = require('../models/postComments')
var admin = require('../models/admin')
let response = require('../../helpers/response')
const utility = require('../../helpers/utility')
const nodemailer = require('../../helpers/mail_adapter');
const globals = require('../../configs/global')
const { config } = require('../../default')
let url = globals[config.environment]; // development || production
let moment = require('moment')
const formidable = require('formidable')
const path = require('path');
const fs = require('fs');
var user = require('../models/user')

exports.list = async (req, res) => {
    try{
      const middleware = {
        user_id      : 'required|text|'+req.body.user_id,
        auth_code    : 'required|text|'+req.body.auth_code,
        content       : 'no|text|'+req.body.content,
        interest_list  : 'no|text|'+req.body.interest_id  
      }
      // console.log(middleware);
      if(utility.validateRequest(middleware)){
        // console.log(middleware);
        const result = await user.getAuth(req.body,function(errAuth,resAuth){
            console.log(errAuth);
          if(!errAuth){
            if(!utility.issetVal(resAuth)){
                res.status(200).send(
                    new response(false, 403, 'Unauthorized')
                )
            }else{
                if(resAuth.auth_code == req.body.auth_code){
                
                    let arrayDatas = [];
                    let arrayData = {};
                    let interests = [];

                    if(utility.issetVal(req.body.interest_list)){
                      let datInterest = JSON.parse(req.body.interest_list)
                      .map(data => {
                        interests.push(data.interest_id);
                      })
                    }
                    
                   

                    let promisePost = new Promise(function(resolve, reject) {
                      let param = {
                        removed : 0
                        , user_id : req.body.user_id
                      }
                      // utility.issetVal(req.body.interest_id)  ? param.interest_id = req.body.interest_id : param.interest_id = null;
                      utility.issetVal(interests) ? param.interest = interests : null;
                      utility.issetVal(req.body.search) ? param.content = req.body.search : null;
                      post.getCountInterest(param, function(errResCount,rowsResCount) {
                        console.log('rowsResCount:', rowsResCount);
                        console.log('errResCount:', errResCount);
                        if (!errResCount) {
                           if (utility.issetVal(rowsResCount)) {
                                let itemPerRequest = utility.issetVal(req.body.item)?  parseInt(req.body.item) : 15;
                                let page = req.body.page;
                                let total_data =  rowsResCount;
                                let total_page = Math.ceil(total_data / itemPerRequest);
            
                                let limitBefore = page <= 1 || page == null ? 0 : (page-1) * itemPerRequest;
            
                                const PreparedData = {
                                    start   : limitBefore,
                                    limit   : itemPerRequest,
                                    removed : 0,
                                    user_id : req.body.user_id,
                                    month   : moment(Date.now()).format('MM'),
                                    week    : moment(Date.now()).format('WW'),
                                    year    : moment(Date.now()).format('YYYY'),
                                    sort    : req.body.sort
                                }

                                utility.issetVal(interests) ? PreparedData.interest = interests : null;

                                utility.issetVal(req.body.search) ? PreparedData.content = req.body.search : null;
            
                                post.getAllInterest(PreparedData,function(errRes,rowsRes) {
                                    console.log(errRes);
                                    if (!utility.issetVal(errRes)) {
                                      const totalInfo = {
                                          total_page : total_page,
                                          total_data_all : total_data,
                                          total_data : rowsRes.length
                                      }
                                      if (utility.issetVal(rowsRes)) {
                                          const arrayRows = {
                                              data :rowsRes,
                                              total: totalInfo
                                          }
                                          resolve(arrayRows);
                                          
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
                              resolve();
                            }
                        } else {
                          resolve();
                        }
                      })
                    });

                    Promise.all([promisePost]).then(arr => {
                    
                      
                      if(utility.issetVal(arr[0])){
                        
                        arrayPost     = arr[0];
                        arrayData.post = []
                       
                        arrayData.post  = arrayPost.data;
                        arrayData.total = arrayPost.total;
                        // arrayData.post.push(arrayPost);
                        arrayDatas.push(arrayData);
                        res.status(200).send(new response(true, 200, 'Fetch success', arrayDatas))
                      } else {
                        res.status(200).send(new response(false, 401, 'Fetch Failed'))
                      }
                      
                    }).catch( err => {
                      console.log(err);
                      res.status(200).send(
                        new response(false, 401, 'Fetch Failed', err)
                      )
                    } );
                  
                   
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


