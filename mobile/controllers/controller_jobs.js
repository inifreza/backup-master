var job = require('../models/job')
const shareJob =  require('../models/shareJob')
const jobRecommend =  require('../models/AT_JobRecommend')
var user = require('../models/user')
let response = require('../../helpers/response')
const utility = require('../../helpers/utility')
const nodemailer = require('../../helpers/mail_adapter');
let moment = require('moment')
const formidable = require('formidable')
const path = require('path');
const fs = require('fs');
let appDir = path.dirname(require.main.filename);
let pathDir = appDir + '/uploads/job/'


exports.getAll = async (req, res) => {
    try{
      const middleware = {
        page        : 'required|text|'+req.body.page,  
        item        : 'no|text|'+req.body.item,
        type        : 'required|text|'+req.body.type,
        search      : 'no|text|'+req.body.search,
      }
      
      if(utility.validateRequest(middleware)){
        if(Object(req.body.type)== '1' || Object(req.body.type) == '2'){
            const bodyCount = {
                type   : req.body.type,
                title  : req.body.search,
                lineservice_id : req.body.lineservice_id,
                grade  : req.body.grade
            }
            job.getCountData(bodyCount,function(errResCount,rowsResCount) {
                console.log(errResCount);
                if (!errResCount) {
                   if (utility.issetVal(rowsResCount)) {
                        let itemPerRequest = utility.issetVal(req.body.item)?  parseInt(req.body.item) : 15;
                        let page = req.body.page;
                        let total_data =  rowsResCount;
                        let total_page = Math.ceil(total_data / itemPerRequest);

                        let limitBefore = page <= 1 || page == null ? 0 : (page-1) * itemPerRequest;

                        const PreparedData = {
                            start  : limitBefore,
                            limit  : itemPerRequest,
                            type   : req.body.type,
                            title  : req.body.search,
                            lineservice_id : req.body.lineservice_id,
                            grade  : req.body.grade
                        }

                        job.getAll(PreparedData,function(errRes,rowsRes) {
                        console.log(errRes);
                        if (!errRes) {
                            if (utility.issetVal(rowsRes)) {
                            
                                const totalInfo = {
                                total_page : total_page,
                                total_data_all : total_data,
                                total_data : rowsRes.length
                                }
                                res.status(200).send(new response(true, 200, 'Fetch Success', {
                                    data : rowsRes,
                                    total: totalInfo
                                } ))
                            } else {
                                res.status(200).send(
                                    new response(false, 401, 'Fetch Failed2')
                                )
                            }
                        }else {
                            res.status(200).send(
                            new response(false, 401, 'Fetch Failed1')
                            )
                        }
                        })
                    } else {
                        res.status(200).send(
                            new response(false, 401, 'Fetch Failed3')
                        )
                    }
                } else {
                    res.status(200).send(
                        new response(false, 401, 'Fetch Failed4')
                    )
                }
              })
        } else {
            res.status(200).send(
                new response(false, 140, 'Undefinied type')
            )
        }
        
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
            id              : 'required|text|'+req.body.id,
        }
        // console.log(middleware);
        if(utility.validateRequest(middleware)){
            const result = await user.getAuth(req.body,function(errAuth,resAuth){
                // console.log(errAuth);
                if(!errAuth){
                    if(!utility.issetVal(resAuth)){
                        res.status(200).send(
                            new response(false, 403, 'Unauthorized')
                        )
                    }else{
                        // console.log(resAuth.auth_code);
                        if(resAuth.auth_code == req.body.auth_code){
                            //here goes the function
                            const body = {
                                id : req.body.id,
                            }

                            job.getById(body,function(errRes,resData) {
                                // console.log(resData);
                                if (!errRes) {
                                    if (utility.issetVal(resData)) {
                                        job.getByLine({lineservice_id : resData.lineservice_id, job_id : resData.id}, (errLine, resLine)=>{
                                            if(utility.issetVal(resLine)){
                                                resData.related = resLine
                                                res.status(200).send(new response(true, 200, 'Fetch success', resData))
                                            } else {
                                                res.status(200).send(
                                                    new response(false, 401, 'Fetch Failed')
                                                )
                                            }
                                        })
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

exports.shareJob = async (req, res) =>{
    try{
        console.log(req.body);
        const middleware = {
            user_id         : 'required|text|'+req.body.user_id,
            auth_code       : 'required|text|'+req.body.auth_code,
            job_id          : 'required|text|'+req.body.job_id,
            share_to        : 'required|text|'+req.body.share_to,
        }
        // console.log(middleware);
        if(utility.validateRequest(middleware)){
            result = await user.getAuth(req.body,function(errAuth,resAuth){
                // console.log(errAuth);
                if(!errAuth){
                    if(!utility.issetVal(resAuth)){
                        res.status(200).send(
                            new response(false, 403, 'Unauthorized')
                        )
                    }else{
                        // console.log(resAuth.auth_code);
                        if(resAuth.auth_code == req.body.auth_code){
                            //here goes the function
                            const body = {
                                job_id      : req.body.job_id,
                                user_id     : req.body.user_id,
                                share_to    : req.body.share_to,
                                create_date : moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
                            }
                            shareJob.addData(body, function(errAdd, resAdd){
                                if(!errAdd){
                                    res.status(200).send(new response(true, 200, 'Insert Success'))
                                } else {
                                    res.status(200).send(new response(false, 401, 'Insert Failed'))
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

exports.submitRecommend = async (req, res) =>{
    try{
        console.log(req.body);
        const middleware = {
            user_id         : 'required|text|'+req.body.user_id,
            auth_code       : 'required|text|'+req.body.auth_code,
            job_id          : 'required|text|'+req.body.job_id,
            share_to        : 'required|text|'+req.body.share_to,
        }
        // console.log(middleware);
        if(utility.validateRequest(middleware)){
            result = await user.getAuth(req.body,function(errAuth,resAuth){
                // console.log(errAuth);
                if(!errAuth){
                    if(!utility.issetVal(resAuth)){
                        res.status(200).send(
                            new response(false, 403, 'Unauthorized')
                        )
                    }else{
                        // console.log(resAuth.auth_code);
                        if(resAuth.auth_code == req.body.auth_code){
                            //here goes the function
                            const body = {
                                job_id      : req.body.job_id,
                                user_id     : req.body.user_id,
                                share_to    : req.body.share_to,
                                create_date : moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
                            }
                            jobRecommend.addData(body, function(errAdd, resAdd){
                                if(!errAdd){
                                    res.status(200).send(new response(true, 200, 'Insert Success'))
                                } else {
                                    res.status(200).send(new response(false, 401, 'Insert Failed'))
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

