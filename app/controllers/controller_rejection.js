var admin = require('../models/admin')
let response = require('../../helpers/response')
const utility = require('../../helpers/utility')
const nodemailer = require('../../helpers/mail_adapter');
let moment = require('moment')
const formidable = require('formidable')
const path = require('path');
const fs = require('fs');
const dataPathUser = './data/rejectionUser.json';
const dataPathExternal = './data/rejectionExternal.json';



exports.getDetailUser = async (req, res) => {
    try{
      const middleware = {
        user_id      : 'required|text|'+req.body.user_id,
        auth_code    : 'required|text|'+req.body.auth_code,
      }
      
      if(utility.validateRequest(middleware)){
        const result = await admin.getAuth(req.body,function(errAuth,resAuth){
          console.log(errAuth);
          if(!errAuth){
            if(!utility.issetVal(resAuth)){
              res.status(200).send(
              new response(false, 403, 'Unauthorized')
            )}else{
              console.log(resAuth.auth_code);
              if(resAuth.auth_code == req.body.auth_code){
                //here goes the function
                utility.readJson(dataPathUser,'utf8',function(err,data){
                    if (!err) {
                        if(!utility.issetVal(data)){
                          res.status(200).send(new response(false, 401, 'Data not exist1'))
                        }else{
                            res.status(200).send(new response(true, 200, 'Fetch success', data))
                        }
                    } else {
                        res.status(200).send(new response(false, 401, 'Data not exist1'))
                    }
                });
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

exports.updateUser = async (req, res) => {
    try{
      const middleware = {
        user_id      : 'required|text|'+req.body.user_id,
        auth_code    : 'required|text|'+req.body.auth_code,
        subject      : 'required|text|'+req.body.subject,
        content      : 'required|text|'+req.body.content,
        publish      : 'required|number|'+req.body.publish,
      }
      if(utility.validateRequest(middleware)){
        const result = await admin.getAuth(req.body,function(errAuth,resAuth){
          console.log(errAuth);
          if(!errAuth){
            if(!utility.issetVal(resAuth)){
              res.status(200).send(
              new response(false, 403, 'Unauthorized')
            )}else{
              console.log(resAuth.auth_code);
              if(resAuth.auth_code == req.body.auth_code){
                //here goes the function
                const body = {
                    subject : req.body.subject,
                    content : req.body.content,
                    publish : req.body.publish,
                }
                // console.log(JSON.stringify(body))
                utility.readJson(dataPathUser,'utf8',function(err,data){
                    if (!err) {
                        if(!utility.issetVal(data)){
                          res.status(200).send(new response(false, 401, 'Data not exist1'))
                        }else{
                            utility.writeJson(JSON.stringify(body), dataPathUser, 'utf8',function(err,data){
                                if (!err) {
                                    res.status(200).send(new response(true, 200, 'Update success'))
                                } else {
                                    res.status(200).send(new response(false, 401, 'Update failed'))
                                }

                            });
                        }
                    } else {
                        res.status(200).send(new response(false, 401, 'Data not exist1'))
                    }
                });

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

exports.getDetailExternal = async (req, res) => {
  try{
    const middleware = {
      user_id      : 'required|text|'+req.body.user_id,
      auth_code    : 'required|text|'+req.body.auth_code,
    }
    
    if(utility.validateRequest(middleware)){
      const result = await admin.getAuth(req.body,function(errAuth,resAuth){
        console.log(errAuth);
        if(!errAuth){
          if(!utility.issetVal(resAuth)){
            res.status(200).send(
            new response(false, 403, 'Unauthorized')
          )}else{
            console.log(resAuth.auth_code);
            if(resAuth.auth_code == req.body.auth_code){
              //here goes the function
              utility.readJson(dataPathExternal,'utf8',function(err,data){
                  if (!err) {
                      if(!utility.issetVal(data)){
                        res.status(200).send(new response(false, 401, 'Data not exist1'))
                      }else{
                          res.status(200).send(new response(true, 200, 'Fetch success', data))
                      }
                  } else {
                      res.status(200).send(new response(false, 401, 'Data not exist1'))
                  }
              });
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

exports.updateExternal = async (req, res) => {
  try{
    const middleware = {
      user_id      : 'required|text|'+req.body.user_id,
      auth_code    : 'required|text|'+req.body.auth_code,
      subject      : 'required|text|'+req.body.subject,
      content      : 'required|text|'+req.body.content,
      publish      : 'required|number|'+req.body.publish,
    }
    if(utility.validateRequest(middleware)){
      const result = await admin.getAuth(req.body,function(errAuth,resAuth){
        console.log(errAuth);
        if(!errAuth){
          if(!utility.issetVal(resAuth)){
            res.status(200).send(
            new response(false, 403, 'Unauthorized')
          )}else{
            console.log(resAuth.auth_code);
            if(resAuth.auth_code == req.body.auth_code){
              //here goes the function
              const body = {
                subject : req.body.subject,
                content : req.body.content,
                publish : req.body.publish,
              }
              utility.readJson(dataPathExternal,'utf8',function(err,data){
                  if (!err) {
                      if(!utility.issetVal(data)){
                        res.status(200).send(new response(false, 401, 'Data not exist1'))
                      }else{
                          utility.writeJson(JSON.stringify(body), dataPathExternal, 'utf8',function(err,data){
                              if (!err) {
                                  res.status(200).send(new response(true, 200, 'Update success'))
                              } else {
                                  res.status(200).send(new response(false, 401, 'Update failed'))
                              }

                          });
                      }
                  } else {
                      res.status(200).send(new response(false, 401, 'Data not exist1'))
                  }
              });

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