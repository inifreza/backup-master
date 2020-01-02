// models
const admin = require('../models/admin')
const setting = require('../models/T_Setting')
const utility = require('../../helpers/utility')
const response = require('../../helpers/response')

//time
const moment = require('moment')

exports.setWeekly = async (req, res)=>{
  console.log('Display Weekly');
  try {
    const middleware = {
      user_id         : 'required|text|'+req.body.user_id,
      auth_code       : 'required|text|'+req.body.auth_code,
      id              : 'required|text|'+req.body.id,
      status          : 'required|text|'+req.body.status
    }
    if(utility.validateRequest(middleware)){
      admin.getAuth(req.body, function(errAuth, resAuth){
        if(utility.issetVal(resAuth)){
          if(resAuth.auth_code == req.body.auth_code){
            setting.getById({id : req.body.id}, function(errGet, resSetting){
              if(utility.issetVal(resSetting)){
                if(req.body.status == '1'){
                  let bodyUpdate = {
                    id        : req.body.id,
                    show_week : 1
                  }
                  setting.updateData(bodyUpdate, function(errUpdate, resUpdate){
                    if(!errUpdate){
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
                  let bodyUpdate = {
                    id        : req.body.id,
                    show_week : 0
                  }
                  setting.updateData(bodyUpdate, function(errUpdate, resUpdate){
                    if(!errUpdate){
                      res
                      .status(200)
                      .send(new response(true, 200, 'Update Success'))
                    } else {
                      res
                      .status(200)
                      .send(new response(false, 401, 'Update Failed'))
                    }
                  })
                }
              } else {
                res
                .status(200)
                .send(new response(false, 404, 'Data  not exist'))
              }
            })
          } else {
            res
            .status(200)
            .send(new response(false, 403, 'Unauthorized 2'))
          }
        } else {
          res
          .status(200)
          .send(new response(false, 403, 'Unauthorized 1'))
        }
      })
    } else {
      res
      .status(200)
      .send(new response(false, 400, 'Invalid Input Format'))
    }
  } catch (error){
    console.log(error);
    res
    .status(500)
    .send(new response(false, 500, 'Something went wrong'))
  }
}

exports.setMonthly = async (req,res)=>{
  console.log('Display Mothly');
  try {
    const middleware = {
      user_id         : 'required|text|'+req.body.user_id,
      auth_code       : 'required|text|'+req.body.auth_code,
      id              : 'required|text|'+req.body.id,
      status          : 'required|text|'+req.body.status
    }
    if(utility.validateRequest(middleware)){
      admin.getAuth(req.body, function(errAuth, resAuth){
        if(utility.issetVal(resAuth)){
          if(resAuth.auth_code == req.body.auth_code){
            setting.getById({id : req.body.id}, function(errGet, resSetting){
              if(utility.issetVal(resSetting)){
                if(req.body.status == '1'){
                  let bodyUpdate = {
                    id            : req.body.id,
                    show_month  : 1
                  }
                  setting.updateData(bodyUpdate, function(errUpdate, resUpdate){
                    console.log({resUpdate});
                    if(!errUpdate){
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
                  let bodyUpdate = {
                    id            : req.body.id,
                    show_month  : 0
                  }
                  setting.updateData(bodyUpdate, function(errUpdate, resUpdate){
                    if(!errUpdate){
                      res
                      .status(200)
                      .send(new response(true, 200, 'Update Success'))
                    } else {
                      res
                      .status(200)
                      .send(new response(false, 401, 'Update Failed'))
                    }
                  })
                }
              } else {
                res
                .status(200)
                .send(new response(false, 404, 'Data  not exist'))
              }
            })
          } else {
            res
            .status(200)
            .send(new response(false, 403, 'Unauthorized 2'))
          }
        } else {
          res
          .status(200)
          .send(new response(false, 403, 'Unauthorized 1'))
        }
      })
    } else {
      res
      .status(200)
      .send(new response(false, 400, 'Invalid Input Format'))
    }
  } catch (error){
    console.log(error);
    res
    .status(500)
    .send(new response(false, 500, 'Something went wrong'))
  }
}

exports.displayWeekly = async (req, res)=>{
  console.log('Display Weekly');
  try {
    const middleware = {
      user_id         : 'required|text|'+req.body.user_id,
      auth_code       : 'required|text|'+req.body.auth_code,
      id              : 'required|text|'+req.body.id
    }
    if(utility.validateRequest(middleware)){
      admin.getAuth(req.body, function(errAuth, resAuth){
        if(utility.issetVal(resAuth)){
          if(resAuth.auth_code == req.body.auth_code){
            setting.getById({id : req.body.id}, function(errGet, resSetting){
              if(utility.issetVal(resSetting)){
                res
                .status(200)
                .send(new response(true, 200, 'Fetch Success',  {'show_week' : resSetting.show_week} ))
              } else {
                res
                .status(200)
                .send(new response(false, 401, 'Fetch Failed'))
              }
            })
          } else {
            res
            .status(200)
            .send(new response(false, 403, 'Unauthorized 2'))
          }
        } else {
          res
          .status(200)
          .send(new response(false, 403, 'Unauthorized 1'))
        }
      })
    } else {
      res
      .status(200)
      .send(new response(false, 400, 'Invalid Input Format'))
    }
  } catch (error){
    console.log(error);
    res
    .status(500)
    .send(new response(false, 500, 'Something went wrong'))
  }
}


exports.displayMonthly = async (req, res)=>{
  console.log('Display Monthly');
  try {
    const middleware = {
      user_id         : 'required|text|'+req.body.user_id,
      auth_code       : 'required|text|'+req.body.auth_code,
      id              : 'required|text|'+req.body.id
    }
    if(utility.validateRequest(middleware)){
      admin.getAuth(req.body, function(errAuth, resAuth){
        if(utility.issetVal(resAuth)){
          if(resAuth.auth_code == req.body.auth_code){
            setting.getById({id : req.body.id}, function(errGet, resSetting){
              if(utility.issetVal(resSetting)){
                res
                .status(200)
                .send(new response(true, 200, 'Fetch Success', {'show_month' : resSetting.show_month} ))
              } else {
                res
                .status(200)
                .send(new response(false, 401, 'Fetch Failed'))
              }
            })
          } else {
            res
            .status(200)
            .send(new response(false, 403, 'Unauthorized 2'))
          }
        } else {
          res
          .status(200)
          .send(new response(false, 403, 'Unauthorized 1'))
        }
      })
    } else {
      res
      .status(200)
      .send(new response(false, 400, 'Invalid Input Format'))
    }
  } catch (error){
    console.log(error);
    res
    .status(500)
    .send(new response(false, 500, 'Something went wrong'))
  }
}