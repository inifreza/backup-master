var forbiddenWord = require('../models/forbiddenWord')
var admin = require('../models/admin')
let response = require('../../helpers/response')
const utility = require('../../helpers/utility')
const nodemailer = require('../../helpers/mail_adapter');
let moment = require('moment')
const formidable = require('formidable')
const path = require('path');
const fs = require('fs');

exports.insert = async (req, res) => {
    try {
        const middleware = {
            user_id         : 'required|text|'+req.body.user_id,
            auth_code       : 'required|text|'+req.body.auth_code,
            word           : 'required|text|'+req.body.word,
            publish         : 'required|number|'+req.body.publish,
        }
        if(utility.validateRequest(middleware)){
            const result = await admin.getAuth(req.body,function(errAuth,resAuth){
                if(!errAuth){
                    if(resAuth == null || undefined){
                        res.status(200).send(
                        new response(false, 403, 'Unauthorized')
                        )
                    }else{
                        if(resAuth.auth_code == req.body.auth_code){
                            //here goes the function
                            const body = {
                                id :  utility.generateHash(32),
                                word : req.body.word,
                                publish  : req.body.publish,
                                create_date :  moment(Date.now()).format('YYYY-MM-DD HH:mm:ss')
                            }

                            forbiddenWord.addData(body, function(err,resData) {
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

exports.getAll = async (req, res) => {
    try{
      const middleware = {
        user_id      : 'required|text|'+req.body.user_id,
        auth_code    : 'required|text|'+req.body.auth_code,
        keyword      : 'no|text|'+req.body.keyword
      }
      // console.log(middleware);
      if(utility.validateRequest(middleware)){
        const result = await admin.getAuth(req.body,function(errAuth,resAuth){
            console.log(errAuth);
          if(!errAuth){
            if(!utility.issetVal(resAuth)){
                res.status(200).send(
                    new response(false, 403, 'Unauthorized')
                )
            }else{
                if(resAuth.auth_code == req.body.auth_code){
                    //here goes the function
                    let bodyCount = {
                        keyword : req.body.keyword
                    }
                    forbiddenWord.getCountData(bodyCount,function(errResCount,rowsResCount) {
                        console.log(rowsResCount);
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
                                    keyword: req.body.keyword
                                }
            
                                forbiddenWord.getAll(PreparedData,function(errRes,rowsRes) {
                                    console.log(errRes);
                                    if (!errRes) {
                                    const totalInfo = {
                                        total_page : total_page,
                                        total_data_all : total_data,
                                        total_data : rowsRes.length
                                    }
                                    if (rowsRes !='') {
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

exports.delete = async (req, res) => {
  try {
    const middleware = {
      user_id      : 'required|text|'+req.query.user_id,
      auth_code    : 'required|text|'+req.query.auth_code,
      id           : 'required|text|'+req.query.id,
    }
    if(utility.validateRequest(middleware)){
      const result = await admin.getAuth(req.query,function(errAuth,resAuth){
        if(!errAuth){
          if(!utility.issetVal(resAuth)){
            res.status(200).send(
            new response(false, 403, 'Unauthorized')
          )}else{
            if(resAuth.auth_code == req.query.auth_code){
              //here goes the function
              const body = {
                  user_id : req.query.user_id,
                  auth_code : req.query.auth_code,
                  id : req.query.id
              }
              forbiddenWord.getById(body, function(errGet,resGet) {
                console.log(errGet);

                if (!errGet) {
                    if(!utility.issetVal(resGet)){
                        res.status(200).send(
                            new response(false, 404, 'Data not exist')
                        )
                    }else{
                        forbiddenWord.deleteData(body, function(err,resData) {
                        // caches
                            if (!err) {
                            res.status(200).send(new response(true, 200, 'Delete success'))
                            } else {
                                res.status(200).send(
                                    new response(false, 401, 'Delete failed')
                                )
                            }
                        })
                    }
                } else {
                  res.status(200).send(
                    new response(false, 404, 'Data not exist')
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
            new response(false, 403, 'Unauthorized1')
          )
        }
      })
    }else{
      res.status(200).send(
        new response(false, 400, 'Invalid input format', middleware)
      )
    }
  } catch (e) {
    console.log(e);
    res.status(500).send(
      new response(false, 500, 'Something went wrong')
    )
  }
}

exports.update = async (req, res) => {
  try {
   
    const middleware = {
        user_id         : 'required|text|'+req.body.user_id,
        auth_code       : 'required|text|'+req.body.auth_code,
        word            : 'required|text|'+req.body.word,
        publish         : 'required|number|'+req.body.publish,
    }
    if(utility.validateRequest(middleware)){
        const result = admin.getAuth(req.body,function(errAuth,resAuth){
            if(!errAuth){
                if(!utility.issetVal(resAuth)){
                    res.status(200).send(
                        new response(false, 403, 'Unauthorized')
                    )
                }else{
                    //here goes the function
                    const body = {
                        id :   req.body.id,
                        word : req.body.word,
                        publish  : req.body.publish,
                    }

                    forbiddenWord.getById(body, function(err, resById){
                        if(!err){
                            forbiddenWord.updateData(utility.cleanJSON(body), function(err,resData) {
                                if (!err) {
                                    if(!utility.issetVal(resData)){
                                        res.status(200).send(new response(false, 404, 'Data not exist1'))
                                    }else{
                                        res.status(200).send(new response(true, 200, 'Update success', resData))
                                    }
                                } else {
                                    res.status(200).send(new response(false, 401, 'Update failed'))
                                }
                            })
                        }else{
                            console.log(err);
                            res.status(200).send(new response(false, 404, 'Data not exist2'))
                        }
                    })
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

exports.getDetail = async (req, res) => {
    try{
        const middleware = {
            user_id         : 'required|text|'+req.body.user_id,
            auth_code       : 'required|text|'+req.body.auth_code,
            id           : 'required|text|'+req.body.id,
        }
        console.log(middleware);
        if(utility.validateRequest(middleware)){
            const result = await admin.getAuth(req.body,function(errAuth,resAuth){
                // console.log(errAuth);
                if(!errAuth){
                    if(!utility.issetVal(resAuth)){
                        res.status(200).send(
                            new response(false, 403, 'Unauthorized')
                        )
                    }else{
                        console.log(resAuth.auth_code);
                        if(resAuth.auth_code == req.body.auth_code){
                            //here goes the function
                            const body = {
                                id : req.body.id,
                            }

                            forbiddenWord.getById(body,function(errRes,resData) {
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
                            new response(false, 403, 'Unauthorized1')
                            )
                        }
                    }
                }else{
                    res.status(200).send(
                        new response(false, 403, 'Unauthorized2')
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

