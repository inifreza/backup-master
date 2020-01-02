var admin = require('../models/admin')
let response = require('../../helpers/response')
const utility = require('../../helpers/utility')
const nodemailer = require('../../helpers/mail_adapter');
let moment = require('moment')
const formidable = require('formidable')
const path = require('path');
const fs = require('fs');
let appDir = path.dirname(require.main.filename);
let pathDir = appDir + '/uploads/admin/'

exports.login = async (req, res) => {
    try{
      const middleware = {
        email      : 'required|text|'+req.body.email,
        password   : 'required|text|'+req.body.password,
      }
      // console.log(middleware);
      if(utility.validateRequest(middleware)){
        const salt = await admin.getSalt(req, function(error, resSalt){
            if(!error){
                if(!utility.issetVal(resSalt)){
                    res.status(200).send(
                        new response(false, 405, 'Email not registered1')
                    )
                }else{
                    let password = utility.doHash(req.body.password, resSalt.salt_hash);
                    const loginData = {
                        email : req.body.email,
                        password : password,
                        publish : '1'
                    }
                    const result = admin.login(loginData, function(err,resData){
                        if(!err){
                            if(!utility.issetVal(resData)){
                                res.status(200).send(
                                  new response(false, 407, 'Password is wrong!')
                                )
                            }
                            else if(resData.publish != loginData.publish){
                              res.status(200).send(
                                new response(false, 406, 'Account Inactive!')
                              )
                            }else{
                                res.status(200).send(new response(true, 200, 'Login success', resData))
                            }
                        }else{
                            res.status(200).send(
                            new response(false, 401, 'Login failed1')
                            )
                        }
                    })
                }
            }else{
                res.status(200).send(
                new response(false, 405, 'Admin not registered2')
                )
            }
        })
      } else{
        res.status(200).send(
          new response(false, 400, 'Invalid input format')
        )
      }
    }
    catch(e){
        res.status(500).send(
        new response(false, 500, 'Something went wrong')
        )
    }
}


exports.insert = async (req, res) => {
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
          file.path = appDir + '/uploads/admin/' + file.name;
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
  
        const middleware = {
          user_id      : 'required|text|'+formJSON.user_id,
          auth_code    : 'required|text|'+formJSON.auth_code,
          img          : 'required|images|'+formJSON.img,
          name         : 'required|text|'+formJSON.name,
          email        : 'required|text|'+formJSON.email,
          role_id      : 'required|text|'+formJSON.role_id,
          publish      : 'required|number|'+formJSON.publish,
          password     : 'required|text|'+formJSON.password
        }
        if(utility.validateRequest(middleware)){
          const result = admin.getAuth(formJSON,function(errAuth,resAuth){
            if(!errAuth){
              if(!utility.issetVal(resAuth)){
                res.status(200).send(
                new response(false, 403, 'Unauthorized')
              )}else{
                if(resAuth.auth_code == formJSON.auth_code){
                  //here goes the function
                  let salt = utility.generateHash(5);
                  let user_id = utility.generateHash(32);
                  let auth_code = utility.generateHash(32);
                  let password = utility.doHash(formJSON.password, salt);
                  const body = {
                      id            :  user_id,
                      name          :  formJSON.name,
                      img           :  formJSON.img,
                      email         :  formJSON.email,
                      role_id       :  formJSON.role_id,
                      password      :  password,
                      salt_hash     :  salt,
                      reset_code    :  '',
                      auth_code     :  auth_code,
                      publish       :  formJSON.publish,
                      create_date   : moment(Date.now()).format('YYYY-MM-DD HH:mm:ss')
                  }
                  admin.checkEmail(formJSON, function(error, resData1){
                    if(!error){
                      if(resData1 <= 0){
                        const result = admin.addData(body, function(err,resData) {
                          if (!err) {
                            res.status(200).send(
                              new response(true, 200, 'Register success', resData))
                          } else {
                            res.status(200).send(
                              new response(false, 401, 'Register failed1', err)
                            )
                          }
                        })
                      }else{
                        res.status(200).send(
                          new response(false, 402, 'Email already registered')
                        )
                      }
                    }else{
                      res.status(200).send(
                        new response(false, 401, 'Register failed')
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
      })
    } catch (e) {

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
      page         : 'required|text|'+req.body.page,
      item         : 'no|text|'+req.body.item,
    }
    if(utility.validateRequest(middleware)){
      const result = await admin.getAuth(req.body,function(errAuth,resAuth){
  
        if(!errAuth){
          if(!utility.issetVal(resAuth)){
            res.status(200).send(
            new response(false, 403, 'Unauthorized')
          )}else{
            if(resAuth.auth_code == req.body.auth_code){
              //here goes the function
              admin.getCountData('',function(errResCount,rowsResCount) {
                if (!errResCount) {
                 if (utility.issetVal(rowsResCount)) {
                      let itemPerRequest = utility.issetVal(req.body.item)?  parseInt(req.body.item) : 15;
                      let page = req.body.page;
                      let total_data =  rowsResCount;
                      let total_page = Math.ceil(total_data / itemPerRequest);

                      let limitBefore = page <= 1 || page == null ? 0 : (page-1) * itemPerRequest;

                      const PreparedData = {
                          start : limitBefore,
                          limit : itemPerRequest
                      }

                      admin.getAll(PreparedData,function(errRes,rowsRes) {
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
              admin.getById(body, function(errGet,resGet) {
                console.log(resGet);
                if (!errGet) {
                  if(!utility.issetVal(resGet)){
                    res.status(200).send(
                      new response(false, 405, 'User not registered1')
                    )
                  }else{
                    admin.deleteData(body, function(err,resData) {
                        if (!err) {
                          if(utility.issetVal(resGet.img)){
                            let pathUrl = appDir + '/uploads/admin/';
                            utility.cleanImage(resGet.img,pathUrl)
                          }
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
                    new response(false, 401, 'Data not exist')
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
        new response(false, 400, 'Invalid input format')
      )
    }
  } catch (e) {
    res.status(500).send(
      new response(false, 500, 'Something went wrong')
    )
  }
}

exports.search = async (req, res) => {
  try {
    const middleware = {
      user_id      : 'required|text|'+req.body.user_id,
      auth_code    : 'required|text|'+req.body.auth_code,
      keyword      : 'required|text|'+req.body.keyword,
    }
    if(utility.validateRequest(middleware)){
      const result = await admin.getAuth(req.body,function(errAuth,resAuth){
        if(!errAuth){
          if(!utility.issetVal(resAuth)){
            res.status(200).send(
            new response(false, 403, 'Unauthorized')
          )}else{
            if(resAuth.auth_code == req.body.auth_code){
              //here goes the function
              const body = {
                  user_id : req.body.user_id,
                  auth_code : req.body.auth_code,
                  keyword : req.body.keyword
              }
              admin.getSearch(body, function(errData,resData) {
                if (!errData) {
                  if(!utility.issetVal(resData)){
                    res.status(200).send(
                      new response(false, 405, 'Data Not Exist!2')
                    )
                  }else{
                    res.status(200).send(
                      new response(true, 200, 'Fetch success', resData))
                  }
                } else {
                  res.status(200).send(
                    new response(false, 401, 'Data not exist!1')
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
        new response(false, 400, 'Invalid input format')
      )
    }
  } catch (e) {
    res.status(500).send(
      new response(false, 500, 'Something went wrong')
    )
  }
}

exports.update = async (req, res) => {
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
        file.path = pathDir + file.name;
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
      
      const middleware = {
        user_id      : 'required|text|'+formJSON.user_id,
        auth_code    : 'required|text|'+formJSON.auth_code,
        id           : 'required|text|'+formJSON.id,
        img          : 'no|images|'+formJSON.img,
        name         : 'required|text|'+formJSON.name,
        email        : 'required|text|'+formJSON.email,
        role_id      : 'required|text|'+formJSON.role_id,
        publish      : 'required|number|'+formJSON.publish,
        password     : 'no|text|'+formJSON.password
      }
      if(utility.validateRequest(middleware)){
        const result = admin.getAuth(formJSON,function(errAuth,resAuth){
          if(!errAuth){
            if(!utility.issetVal(resAuth)){
              utility.cleanImage(formJSON.img,pathDir)
              res.status(200).send(
              new response(false, 403, 'Unauthorized')
            )}else{
              if(resAuth.auth_code == formJSON.auth_code){
                //here goes the function
               

                const body = {
                  id            :  formJSON.id,
                  name          :  formJSON.name,
                  img           :  formJSON.img,
                  email         :  formJSON.email,
                  role_id       :  formJSON.role_id,
                  publish       :  formJSON.publish,
                  salt_hash     : ''
                }

                
                admin.getById(body, function(errUser, resUser){
                  if(!errUser){
                    body.salt_hash = resUser.salt_hash;
                    if(utility.issetVal(formJSON.password)){
                      body.password = utility.doHash(formJSON.password, body.salt_hash);
                    }
                    if(!utility.issetVal(body.img)){
                      utility.cleanImage(resUser.img,pathDir)
                    }
                    admin.updateData(utility.cleanJSON(body), function(err,resData) {
                        if (!err) {
                          if(!utility.issetVal(resData)){
                            utility.cleanImage(formJSON.img,pathDir)
                            res.status(200).send(new response(false, 401, 'Data not exist1'))
                          }else{
                            res.status(200).send(new response(true, 200, 'Update success', resData))
                          }
                        } else {
                           
                            utility.cleanImage(formJSON.img,pathDir)
                            res.status(200).send(new response(false, 401, 'Update failed'))
                        }
                    })
                  }else{
                    utility.cleanImage(formJSON.img,pathDir)
                    res.status(200).send(
                    new response(false, 401, 'Data not exist2', errUser))
                  }
                })
              }else{
                utility.cleanImage(formJSON.img,pathDir)
                res.status(200).send(
                new response(false, 403, 'Unauthorized')
                )
              }
            }
          }else{
            utility.cleanImage(formJSON.img,pathDir)
            res.status(200).send(
              new response(false, 403, 'Unauthorized')
            )
          }
        })
      }else{
        utility.cleanImage(formJSON.img,pathDir)
        res.status(200).send(
          new response(false, 400, 'Invalid input format')
        )
      }
    })
  } catch (e) {
    res.status(500).send(
      new response(false, 500, 'Something went wrong')
    )
  }
}

exports.changeActive = async (req, res) => {
  try {
    const middleware = {
      user_id      : 'required|text|'+req.body.user_id,
      auth_code    : 'required|text|'+req.body.auth_code,
      id           : 'required|text|'+req.body.id,
    }
    if(utility.validateRequest(middleware)){
      const result = await admin.getAuth(req.body,function(errAuth,resAuth){
        if(!errAuth){
          if(!utility.issetVal(resAuth)){
            res.status(200).send(
            new response(false, 403, 'Unauthorized')
          )}else{
            if(resAuth.auth_code == req.body.auth_code){
              //here goes the function
              const body = {
                  publish   : '1',
                  id        : req.body.id
              }

              admin.getById(body, function(errGet,resGet) {
                if (!errGet) {
                  if(!utility.issetVal(resGet)){
                    res.status(200).send(
                      new response(false, 401, 'Data Not Exist')
                    )
                  }else{
                    admin.updateData(body, function(err,resData) {
                        if (!err) {
                          res.status(200).send(new response(true, 200, 'Change Status Active success'))
                        } else {
                            res.status(200).send(
                                new response(false, 401, 'Change Status Active failed')
                            )
                        }
                    })
                  }
                } else {
                  res.status(200).send(
                    new response(false, 401, 'Data not exist')
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
        new response(false, 400, 'Invalid input format')
      )
    }
  } catch (e) {
    res.status(500).send(
      new response(false, 500, 'Something went wrong')
    )
  }
}

exports.changeInActive = async (req, res) => {
  try {
    const middleware = {
      user_id      : 'required|text|'+req.body.user_id,
      auth_code    : 'required|text|'+req.body.auth_code,
      id           : 'required|text|'+req.body.id,
    }
    if(utility.validateRequest(middleware)){
      const result = await admin.getAuth(req.body,function(errAuth,resAuth){
        if(!errAuth){
          if(!utility.issetVal(resAuth)){
            res.status(200).send(
            new response(false, 403, 'Unauthorized')
          )}else{
            if(resAuth.auth_code == req.body.auth_code){
              //here goes the function
              const body = {
                  publish   : '0',
                  id        : req.body.id
              }

              admin.getById(body, function(errGet,resGet) {
                if (!errGet) {
                  if(!utility.issetVal(resGet)){
                    res.status(200).send(
                      new response(false, 401, 'Data Not Exist')
                    )
                  }else{
                    admin.updateData(body, function(err,resData) {
                        if (!err) {
                          res.status(200).send(new response(true, 200, 'Change Status Inactive success'))
                        } else {
                            res.status(200).send(
                                new response(false, 401, 'Change Status Inactive failed')
                            )
                        }
                    })
                  }
                } else {
                  res.status(200).send(
                    new response(false, 401, 'Data not exist')
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
        new response(false, 400, 'Invalid input format')
      )
    }
  } catch (e) {
    res.status(500).send(
      new response(false, 500, 'Something went wrong')
    )
  }
}

exports.getDetail = async (req, res) => {
  try{
    const middleware = {
        user_id      : 'required|text|'+req.body.user_id,
        auth_code    : 'required|text|'+req.body.auth_code,
        id         : 'required|text|'+req.body.id,
    }
    console.log(middleware);
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
                  id : req.body.id,
              }

              admin.getById(body, function(errRes,resData) {
                if (!errRes) {
                  if(utility.issetVal(resData)){
                      res.status(200).send(new response(true, 200, 'Fetch success', resData))
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

exports.setPassword = async (req, res) => {
  try {
    const middleware = {
      user_id         : 'required|text|'+req.body.user_id,
      auth_code       : 'required|text|'+req.body.auth_code,
      password        : 'required|text|'+req.body.password,
      passwordConfirm : 'required|text|'+req.body.confirm_password,
      id              : 'required|text|'+req.body.id,
    }
    if(utility.validateRequest(middleware)){
      const result = await admin.getAuth(req.body,function(errAuth,resAuth){
        if(!errAuth){
          if(!utility.issetVal(resAuth)){
            res.status(200).send(
            new response(false, 403, 'Unauthorized')
          )}else{
            if(resAuth.auth_code == req.body.auth_code){
              //here goes the function
              const body = {
                  publish   : '1',
                  id        : req.body.id
              }

              admin.getById(body, function(errGet,resGet) {
                if (!errGet) {
                  if(!utility.issetVal(resGet)){
                    res.status(200).send(
                      new response(false, 401, 'Data Not Exist')
                    )
                  }else{
                    let password = utility.doHash(req.body.password, resGet.salt_hash);
                    body.password = password;
                    admin.updateData(body, function(err,resData) {
                      if (!err) {
                        res.status(200).send(new response(true, 200, 'Set Password success'))
                      } else {
                        res.status(200).send(new response(false, 401, 'Set Password Failed'))
                      }
                    })
                  }
                } else {
                  res.status(200).send(
                    new response(false, 401, 'Data not exist')
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
        new response(false, 400, 'Invalid input format')
      )
    }
  } catch (e) {
    res.status(500).send(
      new response(false, 500, 'Something went wrong')
    )
  }
}