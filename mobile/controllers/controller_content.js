const admin = require('../models/admin')
const user = require('../models/user')
const response = require('../../helpers/response')
const utility = require('../../helpers/utility')
const nodemailer = require('../../helpers/mail_adapter');
const moment = require('moment')
const formidable = require('formidable')
const path = require('path');
const fs = require('fs');
const aboutContent = './data/about_content.json'
const birthdayContent = './data/birthday_content.json'
const guidelineContent = './data/guideline_content.json'
const privacyPolicy = './data/privacy_policy.json'
const tnc = './data/tnc.json'
let appDir = path.dirname(require.main.filename);
let pathDir = appDir + '/uploads/birthday/'

const globals = require('../../configs/global')
const { config } = require('../../default')
let url = globals[config.environment]; // development || production

exports.getAbout = async (req, res) => {
  try {
    console.log(req.body);
    const middleware = {
      user_id      : 'required|text|'+req.body.user_id,
      auth_code    : 'required|text|'+req.body.auth_code,
    }
    if(utility.validateRequest(middleware)) {
      const result =  await user.getAuth(req.body, (errAuth, resAuth) => {
        if(utility.issetVal(resAuth)){
          if(resAuth.auth_code == req.body.auth_code){
            utility.readJson(aboutContent, 'utf8', (err, data)=>{
              console.log({data});
              if(utility.issetVal(data)){
                res
                .status(200)
                .send(new response(true, 200, 'Fetch success', data))
              } else  {
                res
                .status(200)
                .send(new response(false, 401, 'Fetch Failed'))
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
      .send(new response(false, 400, 'Invalid input format'))
    }
  } catch (e) {
    console.log(e);
    res
    .status(500)
    .send(new response(false, 500, 'Something went wrong'))
  }
}

exports.updateAbout = async (req, res) => {
  try {
    const middleware = {
      user_id      : 'required|text|'+req.body.user_id,
      auth_code    : 'required|text|'+req.body.auth_code,
      content      : 'required|text|'+req.body.content,
    }
    if(utility.validateRequest(middleware)){
      const result = await user.getAuth(req.body, (errAuth , resAuth)=> {
        if(utility.issetVal(resAuth)){
          if(resAuth.auth_code == req.body.auth_code){
            let bodyUpdate = {
              content : req.body.content
            }
            utility.readJson(aboutContent, 'utf8', (err, data)=>{
              if(utility.issetVal(data)){
                utility.writeJson(JSON.stringify(bodyUpdate), aboutContent, 'utf8', (err,data)=>{
                  if(!err){
                    res
                    .status(200)
                    .send(new response(true, 200, 'Update success'))
                  } else {
                    res
                    .status(200)
                    .send(new response(false, 401, 'Update failed'))
                  }
                })
              } else {
                res
                .status(200)
                .send(new response(false, 401, 'Data not exist1'))
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
    } else {
      res
      .status(200)
      .send(new response(false, 400, 'Invalid input format'))
    }
  } catch (error){
    console.log(error);
    res
    .status(500)
    .send(new response(false, 500, 'Something went wrong'))
  }
}

exports.updateBirthday = async (req, res) => {
  try {
    let formData = new Array();
      new formidable.IncomingForm().parse(req)
      .on('field', (name, field) => {
        formData.push('"' +name+ '"'+ ':'+'"'+utility.escapeHtml(field)+'"')
      })
      .on('file', (name, file) => {
        formData.push('"' +name+ '"'+ ':'+'"'+file.name+'"')
      })
      .on('fileBegin', function (name, file){
        if(utility.checkImageExtension(file.name)){
          let fileType = file.type.split('/').pop();
          file.name = utility.generateHash(16)+ '.' + fileType;
          file.path = appDir + '/uploads/birthday/' + file.name;
        }
      })
      .on('aborted', () => {
        console.error('Request aborted by the user')
      })
      .on('error', (err) => {
        console.error('Error', err)
        throw err
      })
      .on('end', () => {
        let temp = '{'+formData.toString() +'}'
        let formJSON = JSON.parse(temp)
        console.log({formJSON});
        const middleware = {
          user_id      : 'required|text|'+formJSON.user_id,
          auth_code    : 'required|text|'+formJSON.auth_code,
          img          : 'required|images|'+formJSON.img,
          title        : 'required|text|'+formJSON.title,
          content      : 'required|text|'+formJSON.content
        }
        if(utility.validateRequest(middleware)){
          const result = user.getAuth(formJSON,(errAuth, resAuth)=>{
            if(utility.issetVal(resAuth)){
              if(resAuth.auth_code == formJSON.auth_code){
                console.log('sudah validati code');
                  utility
                  // if(utility.issetVal(formJSON.img)){
                  //   utility.cleanImage(formJSON.img, pathDir)
                  // }
                utility.readJson(birthdayContent, 'utf8', (err,data) => {
                  if(utility.issetVal(data)){
                    console.log({data});
                    let bodyUpdate = {
                      title : formJSON.title,
                      content : formJSON.content,
                      img : formJSON.img
                    }
                    utility.cleanImage(data.img, pathDir)
                    utility.writeJson(JSON.stringify(bodyUpdate), birthdayContent,'utf8', (err,data)=>{
                      if(!err){
                        res
                        .status(200)
                        .send(new response(true, 200, 'Update success'))
                      } else {
                        utility.cleanImage(formJSON.img, pathDir)
                        res
                        .status(200)
                        .send(new response(false, 401, 'Update failed'))
                      }
                    })
                  } else {
                    res
                    .status(200)
                    .send(new response(false, 404, 'Data not exist'))
                  }
                })
              } else {
                res
                .status(200)
                .send(new response(false, 403, 'Unauthorized1'))  
              }
            } else {
              utility.cleanImage(formJSON.img, pathDir)
              res
              .status(200)
              .send(new response(false, 403, 'Unauthorized'))
            }
          })
        } else {
          res
          .status(200)
          .send(new response(false, 400, 'Invalid input format'))
        }
      })
  } catch (error){
    console.log(e);
    res
    .status(500)
    .send(new response(false, 500, 'Something went wrong'))
  }
}

exports.getBirthday = async (req, res) => {
  try {
    const middleware = {
      user_id      : 'required|text|'+req.body.user_id,
      auth_code    : 'required|text|'+req.body.auth_code,
    }
    if(utility.validateRequest(middleware)){
      const result =  await user.getAuth(req.body, (errAuth, resAuth) => {
        if(utility.issetVal(resAuth)){
          if(resAuth.auth_code == req.body.auth_code){
            utility.readJson(birthdayContent, 'utf8', (err,data)=> {
              if(utility.issetVal(data)){
                if(utility.issetVal(data.img)){
                  data.img =  url.url_img+'birthday/'+data.img;
                } else {
                  data.img = null;
                }
                res
                .status(200)
                .send(new response(true, 200, 'Fetch success', data))
              } else  {
                res
                .status(200)
                .send(new response(false, 401, 'Fetch Failed'))
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
      .send(new response(false, 400, 'Invalid input format'))
    }
  } catch (error) {
    console.log(error);
    res
    .status(500)
    .send(new response(false, 500, 'Something went wrong'))
  }
}

exports.getGuideline = async (req, res) => {
  console.log('guideline');
  try {
    console.log(req.body);
    const middleware = {
      user_id      : 'required|text|'+req.body.user_id,
      auth_code    : 'required|text|'+req.body.auth_code,
    }
    if(utility.validateRequest(middleware)) {
      const result =  await user.getAuth(req.body, (errAuth, resAuth) => {
        if(utility.issetVal(resAuth)){
          if(resAuth.auth_code == req.body.auth_code){
            utility.readJson(guidelineContent, 'utf8', (err, data)=>{
              console.log({data});
              if(utility.issetVal(data)){
                res
                .status(200)
                .send(new response(true, 200, 'Fetch success', data))
              } else  {
                res
                .status(200)
                .send(new response(false, 401, 'Fetch Failed'))
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
      .send(new response(false, 400, 'Invalid input format'))
    }
  } catch (e) {
    console.log(e);
    res
    .status(500)
    .send(new response(false, 500, 'Something went wrong'))
  }
}

exports.updateGuideline = async (req, res) => {
  try {
    const middleware = {
      user_id      : 'required|text|'+req.body.user_id,
      auth_code    : 'required|text|'+req.body.auth_code,
      content      : 'required|text|'+req.body.content,
    }
    if(utility.validateRequest(middleware)){
      const result = await user.getAuth(req.body, (errAuth , resAuth)=> {
        if(utility.issetVal(resAuth)){
          if(resAuth.auth_code == req.body.auth_code){
            let bodyUpdate = {
              content : req.body.content
            }
            utility.readJson(guidelineContent, 'utf8', (err, data)=>{
              if(utility.issetVal(data)){
                utility.writeJson(JSON.stringify(bodyUpdate), guidelineContent, 'utf8', (err,data)=>{
                  if(!err){
                    res
                    .status(200)
                    .send(new response(true, 200, 'Update success'))
                  } else {
                    res
                    .status(200)
                    .send(new response(false, 401, 'Update failed'))
                  }
                })
              } else {
                res
                .status(200)
                .send(new response(false, 401, 'Data not exist1'))
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
    } else {
      res
      .status(200)
      .send(new response(false, 400, 'Invalid input format'))
    }
  } catch (error){
    console.log(error);
    res
    .status(500)
    .send(new response(false, 500, 'Something went wrong'))
  }
}

exports.getPrivacyPolicy = async (req, res) => {
  try {
    console.log(req.body);
    const middleware = {
      user_id      : 'required|text|'+req.body.user_id,
      auth_code    : 'required|text|'+req.body.auth_code,
    }
    if(utility.validateRequest(middleware)) {
      const result =  await user.getAuth(req.body, (errAuth, resAuth) => {
        if(utility.issetVal(resAuth)){
          if(resAuth.auth_code == req.body.auth_code){
            utility.readJson(privacyPolicy, 'utf8', (err, data)=>{
              console.log({data});
              if(utility.issetVal(data)){
                res
                .status(200)
                .send(new response(true, 200, 'Fetch success', data))
              } else  {
                res
                .status(200)
                .send(new response(false, 401, 'Fetch Failed'))
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
      .send(new response(false, 400, 'Invalid input format'))
    }
  } catch (e) {
    console.log(e);
    res
    .status(500)
    .send(new response(false, 500, 'Something went wrong'))
  }
}

exports.updatePrivacyPolicy = async (req, res) => {
  try {
    const middleware = {
      user_id      : 'required|text|'+req.body.user_id,
      auth_code    : 'required|text|'+req.body.auth_code,
      content      : 'required|text|'+req.body.content,
    }
    if(utility.validateRequest(middleware)){
      const result = await user.getAuth(req.body, (errAuth , resAuth)=> {
        if(utility.issetVal(resAuth)){
          if(resAuth.auth_code == req.body.auth_code){
            let bodyUpdate = {
              content : req.body.content
            }
            utility.readJson(privacyPolicy, 'utf8', (err, data)=>{
              if(utility.issetVal(data)){
                utility.writeJson(JSON.stringify(bodyUpdate), privacyPolicy, 'utf8', (err,data)=>{
                  if(!err){
                    res
                    .status(200)
                    .send(new response(true, 200, 'Update success'))
                  } else {
                    res
                    .status(200)
                    .send(new response(false, 401, 'Update failed'))
                  }
                })
              } else {
                res
                .status(200)
                .send(new response(false, 401, 'Data not exist1'))
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
    } else {
      res
      .status(200)
      .send(new response(false, 400, 'Invalid input format'))
    }
  } catch (error){
    console.log(error);
    res
    .status(500)
    .send(new response(false, 500, 'Something went wrong'))
  }
}

exports.getTnc = async (req, res) => {
  try {
    console.log(req.body);
    const middleware = {
      user_id      : 'required|text|'+req.body.user_id,
      auth_code    : 'required|text|'+req.body.auth_code,
    }
    if(utility.validateRequest(middleware)) {
      const result =  await user.getAuth(req.body, (errAuth, resAuth) => {
        console.log({resAuth});
        if(utility.issetVal(resAuth)){
          if(resAuth.auth_code == req.body.auth_code){
            utility.readJson(tnc, 'utf8', (err, data)=>{
              console.log({data});
              if(utility.issetVal(data)){
                res
                .status(200)
                .send(new response(true, 200, 'Fetch success', data))
              } else  {
                res
                .status(200)
                .send(new response(false, 401, 'Fetch Failed'))
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
      .send(new response(false, 400, 'Invalid input format'))
    }
  } catch (e) {
    console.log(e);
    res
    .status(500)
    .send(new response(false, 500, 'Something went wrong'))
  }
}

exports.updateTnc = async (req, res) => {
  try {
    const middleware = {
      user_id      : 'required|text|'+req.body.user_id,
      auth_code    : 'required|text|'+req.body.auth_code,
      content      : 'required|text|'+req.body.content,
    }
    if(utility.validateRequest(middleware)){
      const result = await user.getAuth(req.body, (errAuth , resAuth)=> {
        if(utility.issetVal(resAuth)){
          if(resAuth.auth_code == req.body.auth_code){
            let bodyUpdate = {
              content : req.body.content
            }
            utility.readJson(tnc, 'utf8', (err, data)=>{
              if(utility.issetVal(data)){
                utility.writeJson(JSON.stringify(bodyUpdate), tnc, 'utf8', (err,data)=>{
                  if(!err){
                    res
                    .status(200)
                    .send(new response(true, 200, 'Update success'))
                  } else {
                    res
                    .status(200)
                    .send(new response(false, 401, 'Update failed'))
                  }
                })
              } else {
                res
                .status(200)
                .send(new response(false, 401, 'Data not exist1'))
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
    } else {
      res
      .status(200)
      .send(new response(false, 400, 'Invalid input format'))
    }
  } catch (error){
    console.log(error);
    res
    .status(500)
    .send(new response(false, 500, 'Something went wrong'))
  }
}
