var form = require('../models/form')
var at_form = require('../models/AT_Form')
var at_form_answer = require('../models/AT_FormAnswer')
var question = require('../models/question')
var answer = require('../models/answer')
var admin = require('../models/admin')
var user = require('../models/user')
let response = require('../../helpers/response')
const utility = require('../../helpers/utility')
const nodemailer = require('../../helpers/mail_adapter');
let moment = require('moment')
const formidable = require('formidable')
const path = require('path');
const fs = require('fs');

exports.individualResult = async (req, res) => {
  try{
    const middleware = {
      user_id      : 'required|text|'+req.body.user_id,
      auth_code    : 'required|text|'+req.body.auth_code,
      id           : 'required|text|'+req.body.id,
      current_id   : 'required|text|'+req.body.current_id
    }
    if(utility.validateRequest(middleware)){
      const result = await admin.getAuth(req.body, function(errAuth, resAuth){
        if(!errAuth){
          if(!utility.issetVal(resAuth)){
            res.status(200).send(
            new response(false, 403, 'Unauthorized')
          )}else{
            form.getIndividualResult({id: req.body.id, user_id: req.body.current_id}, function(errData, resData) {
              if(!utility.issetVal(errData)){
                if(utility.issetVal(resData)){
                  res.status(200).send(
                    new response(true, 200, 'Data exist', resData)
                  )
                }else{
                  res.status(200).send(
                    new response(false, 401, 'No data')
                  )
                }
              }else{
                res.status(200).send(
                  new response(false, 401, 'No data')
                )
              }
            })
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
    res.status(500).send(
      new response(false, 500, 'Something went wrong')
    )
  }
}

exports.getIndividual = async (req, res) => {
  try{
    const middleware = {
      user_id      : 'required|text|'+req.body.user_id,
      auth_code    : 'required|text|'+req.body.auth_code,
      id           : 'required|text|'+req.body.id
    }
    if(utility.validateRequest(middleware)){
      const result = await admin.getAuth(req.body, function(errAuth, resAuth){
        if(!errAuth){
          if(!utility.issetVal(resAuth)){
            res.status(200).send(
            new response(false, 403, 'Unauthorized')
          )}else{
            at_form.getIndividual({id: req.body.id}, function(errIndividual, resIndividual) {
              if(errIndividual){
                res.status(200).send(
                  new response(false, 401, 'No data')
                )
              }else{
                var current_id = utility.issetVal(req.body.current_id) ? req.body.current_id : '';
                at_form.getCurrentIndividual({id: req.body.id, user_id: current_id}, function(errCurrent, resCurrent) {
                  if(!utility.issetVal(errCurrent)){
                    if(utility.issetVal(resCurrent)){
                      res.status(200).send(
                        new response(true, 200, 'Data exist', {list: resIndividual, current_user: resCurrent})
                      )
                    }else{
                      res.status(200).send(
                        new response(true, 200, 'Data exist without prev/next user', {list: resIndividual})
                      )
                    }
                  }else{
                    res.status(200).send(
                      new response(true, 200, 'Data exist without prev/next user', {list: resIndividual})
                    )
                  }
                })
              }
            })
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
    res.status(500).send(
      new response(false, 500, 'Something went wrong')
    )
  }
}

exports.analyzeResult = async (req, res) => {
  try{
    const middleware = {
      user_id      : 'required|text|'+req.body.user_id,
      auth_code    : 'required|text|'+req.body.auth_code,
      id           : 'required|text|'+req.body.id
    }
    if(utility.validateRequest(middleware)){
      const result = await admin.getAuth(req.body, function(errAuth, resAuth){
        if(!errAuth){
          if(!utility.issetVal(resAuth)){
            res.status(200).send(
            new response(false, 403, 'Unauthorized')
          )}else{
            form.getAnalyzeResult({id: req.body.id}, function(errData, resData) {
              if(!utility.issetVal(errData)){
                if(utility.issetVal(resData)){
                  res.status(200).send(
                    new response(true, 200, 'Data exist', resData)
                  )
                }else{
                  res.status(200).send(
                    new response(false, 401, 'No data')
                  )
                }
              }else{
                res.status(200).send(
                  new response(false, 401, 'No data')
                )
              }
            })
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
    res.status(500).send(
      new response(false, 500, 'Something went wrong')
    )
  }
}

exports.deleteParticipant = async (req, res) => {
  try{
    const middleware = {
      user_id      : 'required|text|'+req.body.user_id,
      auth_code    : 'required|text|'+req.body.auth_code,
      form_code    : 'required|text|'+req.body.form_code
    }
    if(utility.validateRequest(middleware)){
      const result = await admin.getAuth(req.body, function(errAuth, resAuth){
        if(!errAuth){
          if(!utility.issetVal(resAuth)){
            res.status(200).send(
            new response(false, 403, 'Unauthorized')
          )}else{
            at_form.deleteData({code: req.body.form_code}, function(errData, resData){
              if(errData){
                res.status(200).send(
                  new response(false, 400, 'Delete failed')
                )
              }else{
                at_form_answer.deleteByCode({code: req.body.form_code}, null)
                res.status(200).send(
                  new response(true, 200, 'Delete success')
                )
              }
            })
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
    res.status(500).send(
      new response(false, 500, 'Something went wrong')
    )
  }
}

exports.getParticipant = async (req, res) => {
  try{
    const middleware = {
      user_id      : 'required|text|'+req.body.user_id,
      auth_code    : 'required|text|'+req.body.auth_code,
      id           : 'required|text|'+req.body.id,
      page         : 'required|text|'+req.body.page
    }
    if(utility.validateRequest(middleware)){
      if(Number(req.body.page)){
        const result = await admin.getAuth(req.body, function(errAuth, resAuth){
          if(!errAuth){
            if(!utility.issetVal(resAuth)){
              res.status(200).send(
                new response(false, 403, 'Unauthorized')
              )
            }else{
              at_form.countGetParticipant({id: req.body.id}, function(errCount, resCount){
                console.log(errCount)
                if(errCount){
                  res.status(200).send(
                    new response(false, 401, 'No data')
                  )
                }else{
                  var itemPerPage = 6
                  var options = {
                    start : req.body.page <= 1 || req.body.page == null ? 0 : (req.body.page-1) * itemPerPage,
                    limit : itemPerPage,
                    id: req.body.id
                  }
                  at_form.getParticipant(options, function(errRes, resData){
                    if(!utility.issetVal(errRes)){
                      if(utility.issetVal(resData)){
                        var datas = {
                          total_page: Math.ceil(resCount / itemPerPage),
                          total_data: resData.length,
                          total_data_all: resCount,
                          remaining: resCount - (((req.body.page-1) * itemPerPage) + resData.length),
                          data: resData
                        }
                        res.status(200).send(
                          new response(true, 200, 'Data exist', datas)
                        )
                      }else{
                        res.status(200).send(
                          new response(false, 401, 'No data')
                        )
                      }
                    }else{
                      res.status(200).send(
                        new response(false, 401, 'No data')
                      )
                    }
                  })
                }
              })
            }
          }else{
            res.status(200).send(
              new response(false, 403, 'Unauthorized2')
            )
          }
        })
      }else{
        res.status(200).send(
          new response(false, 401, 'Invalid page number, should start with 1')
        )
      }
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

exports.submitPreview = async (req, res) => {
  try{
    const middleware = {
      form_id        : 'required|text|'+req.body.form_id,
      form_code      : 'required|text|'+req.body.form_code,
      answers        : 'required|json|'+req.body.answers
    }
    if(utility.validateRequest(middleware)){
      var body = {
        form_id: req.body.form_id,
        form_code: req.body.form_code
      }
      at_form.checkExist(body, function(errCheck, resCheck) {
        // console.log('1',resCheck['answered']);
        // return false;
        if(utility.issetVal(resCheck)){
          if(resCheck['answered']===1){
            res.status(200).send(
              new response(false, 402, 'Submit form already exist')
              )
          } else {
            var bodyAnswer = {
              id      : req.body.form_code, 
              form_id : req.body.form_id, 
              answers : req.body.answers
            }
            at_form_answer.addMultiple(bodyAnswer, function(errAnswer, resAnswer) {
              if(errAnswer){
                res.status(200).send(
                  new response(true, 200, 'Submit form success without multiple answer')
                )
              }else{
                res.status(200).send(
                  new response(true, 200, 'Submit form success')
                )
              }
              // Executed function updateData
              body.answered = 1;
              at_form.updateData(body, (err, res)=>{

              })
              
            })
          }
        }else{
          res.status(200).send(
            new response(true, 404, "This Account don't have access")
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

exports.preview = async (req, res) => {
  try{
    const middleware = {
      user_id      : 'required|text|'+req.body.user_id,
      auth_code    : 'required|text|'+req.body.auth_code,
      id           : 'required|text|'+req.body.id
    }
    if(utility.validateRequest(middleware)){
      const result = await admin.getAuth(req.body, function(errAuth, resAuth){
        if(!errAuth){
          if(!utility.issetVal(resAuth)){
            res.status(200).send(
            new response(false, 403, 'Unauthorized')
          )}else{
            form.getPreview({id: req.body.id}, function(errData, resData) {
              if(!utility.issetVal(errData)){
                if(utility.issetVal(resData)){
                  res.status(200).send(
                    new response(true, 200, 'Data exist', resData)
                  )
                }else{
                  res.status(200).send(
                    new response(false, 401, 'No data')
                  )
                }
              }else{
                res.status(200).send(
                  new response(false, 401, 'No data')
                )
              }
            })
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
    res.status(500).send(
      new response(false, 500, 'Something went wrong')
    )
  }
}

exports.latest = async (req, res) => {
  try{
    const middleware = {
      user_id      : 'required|text|'+req.body.user_id,
      auth_code    : 'required|text|'+req.body.auth_code
    }
    if(utility.validateRequest(middleware)){
      const result = await admin.getAuth(req.body, function(errAuth, resAuth){
        if(!errAuth){
          if(!utility.issetVal(resAuth)){
            res.status(200).send(
            new response(false, 403, 'Unauthorized')
          )}else{
            form.getLatest(null, function(errData, resData) {
              if(!utility.issetVal(errData)){
                if(utility.issetVal(resData)){
                  res.status(200).send(
                    new response(true, 200, 'Data exist', resData)
                  )
                }else{
                  res.status(200).send(
                    new response(false, 401, 'No data')
                  )
                }
              }else{
                res.status(200).send(
                  new response(false, 401, 'No data')
                )
              }
            })
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
    res.status(500).send(
      new response(false, 500, 'Something went wrong')
    )
  }
}

exports.autocomplete = async (req, res) => {
  try{
    const middleware = {
      user_id      : 'required|text|'+req.body.user_id,
      auth_code    : 'required|text|'+req.body.auth_code,
      keyword      : 'required|text|'+req.body.keyword
    }
    if(utility.validateRequest(middleware)){
      const result = await admin.getAuth(req.body, function(errAuth, resAuth){
        if(!errAuth){
          if(!utility.issetVal(resAuth)){
            res.status(200).send(
            new response(false, 403, 'Unauthorized')
          )}else{
            form.autocomplete({keyword: req.body.keyword}, function(errData, resData) {
              if(!utility.issetVal(errData)){
                if(utility.issetVal(resData)){
                  res.status(200).send(
                    new response(true, 200, 'Data exist', resData)
                  )
                }else{
                  res.status(200).send(
                    new response(false, 401, 'No data')
                  )
                }
              }else{
                res.status(200).send(
                  new response(false, 401, 'No data')
                )
              }
            })
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
    res.status(500).send(
      new response(false, 500, 'Something went wrong')
    )
  }
}

exports.replicate = async (req, res) => {
  try{
    const middleware = {
      user_id      : 'required|text|'+req.body.user_id,
      auth_code    : 'required|text|'+req.body.auth_code,
      id           : 'required|text|'+req.body.id
    }
    if(utility.validateRequest(middleware)){
      const result = await admin.getAuth(req.body, function(errAuth, resAuth){
        if(!errAuth){
          if(!utility.issetVal(resAuth)){
            res.status(200).send(
            new response(false, 403, 'Unauthorized')
          )}else{
            form.replicate({id: req.body.id}, function(errData, resData) {
              if(!utility.issetVal(errData)){
                if(utility.issetVal(resData)){
                  //promise add form
                  const addForm = new Promise((resolve, reject) => {
                    var bodyForm = {
                      id: resData.id,
                      title: resData.title,
                      description: resData.description,
                      publish: resData.publish,
                      create_date: resData.create_date
                    }
                    form.addData(bodyForm, function(errForm, resForm) {
                      if(!errForm){
                        resolve(true)
                      }
                    })
                  })
                  //promise add question
                  const addQuestion = new Promise((resolve, reject) => {
                    var bodyQuestion = resData.question
                    question.addMultiple(bodyQuestion, function(errQuestion, resQuestion) {
                      if(!errQuestion){
                        resolve(true)
                      }
                    })
                  })
                  //promise add answer
                  const addAnswer = new Promise((resolve, reject) => {
                    var bodyAnswer = resData.question
                    answer.addMultiple(bodyAnswer, function(errAnswer, resAnswer) {
                      if(!errAnswer){
                        resolve(true)
                      }
                    })
                  })
                  //run promise race for insert replicate
                  Promise.race([addForm, addQuestion, addAnswer]).then(result => {
                    if(result){
                      res.status(200).send(
                        new response(true, 200, 'Replicate form success', {id: resData.id})
                      )
                    }
                  })
                }else{
                  res.status(200).send(
                    new response(false, 401, 'Replicate form failed')
                  )
                }
              }else{
                res.status(200).send(
                  new response(false, 401, 'Replicate form failed')
                )
              }
            })
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
    res.status(500).send(
      new response(false, 500, 'Something went wrong')
    )
  }
}

exports.use_this_form = async (req, res) => {
  try{
    const middleware = {
      user_id      : 'required|text|'+req.body.user_id,
      auth_code    : 'required|text|'+req.body.auth_code,
      id           : 'required|text|'+req.body.id
    }
    if(utility.validateRequest(middleware)){
      const result = await admin.getAuth(req.body, function(errAuth, resAuth){
        if(!errAuth){
          if(!utility.issetVal(resAuth)){
            res.status(200).send(
            new response(false, 403, 'Unauthorized')
          )}else{
            form.unpublishAll(null)
            form.updateData({id: req.body.id, publish: 1}, function(errUse, resUse) {
              if(errUse){
                res.status(200).send(
                  new response(false, 400, 'Use this form failed')
                )
              }else{
                res.status(200).send(
                  new response(true, 200, 'Use this form success')
                )
              }
            })
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
    res.status(500).send(
      new response(false, 500, 'Something went wrong')
    )
  }
}

exports.insert = async (req, res) => {
    try {
        const middleware = {
            user_id         : 'required|text|'+req.body.user_id,
            auth_code       : 'required|text|'+req.body.auth_code,
            title           : 'required|text|'+req.body.title,
            description     : 'no|text|'+req.body.description,
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
                            title : req.body.title,
                            description : req.body.description,
                            publish  : req.body.publish,
                            create_date :  moment(Date.now()).format('YYYY-MM-DD HH:mm:ss')
                        }

                        form.addData(body, function(err,resData) {
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
        auth_code    : 'required|text|'+req.body.auth_code
      }
      // console.log(middleware);
      if(utility.validateRequest(middleware)){
        const result = await admin.getAuth(req.body,function(errAuth,resAuth){
            console.log(errAuth);
          if(!errAuth){
            if(!utility.issetVal(resAuth)){
              res.status(200).send(
              new response(false, 403, 'Unauthorized')
            )}else{
                if(resAuth.auth_code == req.body.auth_code){
                    //here goes the function
                    let bodyCount = {
                      keyword : req.body.keyword
                    }
                    form.getCountData(bodyCount,function(errResCount,rowsResCount) {
                        console.log(rowsResCount);
                        if (!errResCount) {
                            if (rowsResCount !='') {
                                let itemPerRequest = utility.issetVal(req.body.item)?  parseInt(req.body.item) : 15;
                                let page = req.body.page;
                                let total_data =  rowsResCount;
                                let total_page = Math.ceil(total_data / itemPerRequest);
            
                                let limitBefore = page <= 1 || page == null ? 0 : (page-1) * itemPerRequest;
            
                                const PreparedData = {
                                    start : limitBefore,
                                    limit : itemPerRequest,
                                    keyword : req.body.keyword,
                                    sort : req.body.sort
                                }
            
                                form.getAll(PreparedData,function(errRes,rowsRes) {
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
              form.getById(body, function(errGet,resGet) {
                console.log(errGet);

                if (!errGet) {
                    if(!utility.issetVal(resGet)){
                        res.status(200).send(
                            new response(false, 404, 'Data not exist')
                        )
                    }else{
                        form.deleteData(body, function(err,resData) {
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
        title           : 'required|text|'+req.body.title,
        description     : 'no|text|'+req.body.description,
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
                        title : req.body.title,
                        description : req.body.description,
                        publish  : req.body.publish,
                    }

                    form.getById(body, function(err, resById){
                        if(!err){
                            form.updateData(utility.cleanJSON(body), function(err,resData) {
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
                            res.status(200).send(
                            new response(false, 404, 'Data not exist2'))
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

                            form.getById(body,function(errRes,resData) {
                                console.log(errRes);
                                let arrayDatas = [];
                                if (!errRes) {
                                    if(utility.issetVal(resData)){
                                        let arrayDatas = [];
                                        let arrayData = {};
                                        arrayData = resData;

                                        let promiseQuestion = new Promise(function(resolve, reject) {
                                            question.getByForeignkeyId(body, (errRes,resData) => {
                                                if(!errRes){
                                                    if(utility.issetVal(resData)){
                                                        resolve(resData);
                                                    } else {
                                                      resolve();
                                                    }
                                                } else {
                                                  resolve();
                                                }
                                            });
                                        });

                                      
                                        Promise.all([promiseQuestion]).then(arr => {
                                            console.log(arr[0])
                                            let datas = [];
                                            let data = {};
                                            data = arrayData;
                                            data.question = [];
                                            if(utility.issetVal(arr[0])){
                                                // arrayData     = arr[0];
                                                arrayQuestion = arr[0];
                                                // arrayAnswer   = arr[1];
                                                let num = 0;
                                                for (let value of arrayQuestion) {
                                                //   data = value;
                                                    data.question.push(value);
                                                   
                                                    num++;
                                                }
                                            }
                                            datas.push(data);
                                            res.status(200).send(new response(true, 200, 'Fetch success', datas))
                                        }).catch( err => {
                                            res.status(200).send(
                                                new response(false, 401, 'Fetch Failed')
                                            )
                                        } );

                                       
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


exports.insertQuestion = async (req, res) => {
    try {
        const middleware = {
            user_id         : 'required|text|'+req.body.user_id,
            auth_code       : 'required|text|'+req.body.auth_code,
            form_id         : 'required|text|'+req.body.form_id,
            title           : 'required|text|'+req.body.title,
            type            : 'required|text|'+req.body.type,
            sort            : 'required|text|'+req.body.sort,
            key_answer      : 'no|text|'+req.body.key_answer,
            required        : 'no|text|'+req.body.required,
            placeholder     : 'no|text|'+req.body.placeholder,
            publish         : 'required|number|'+req.body.publish,
        }
        if(utility.validateRequest(middleware)){
            const result = await admin.getAuth(req.body,function(errAuth,resAuth){
                if(!errAuth){
                    if(!utility.issetVal(resAuth)){
                        res.status(200).send(
                        new response(false, 403, 'Unauthorized')
                        )
                    }else{
                        if(resAuth.auth_code == req.body.auth_code){
                            let required = 'no';
                            if(utility.issetVal(req.body.required)){
                                required = 'yes';
                            }
                            //here goes the function
                            const body = {
                                id              : utility.generateHash(32),
                                form_id         : req.body.form_id,
                                title           : req.body.title,
                                type            : req.body.type,
                                sort            : req.body.sort,
                                key_answer      : req.body.key_answer,
                                required        : required,
                                placeholder     : req.body.placeholder,
                                publish         : req.body.publish,
                                create_date     :  moment(Date.now()).format('YYYY-MM-DD HH:mm:ss')
                            }

                            question.addData(body, function(err,resData) {
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

exports.updateQuestion = async (req, res) => {
    try {
        const middleware = {
            user_id         : 'required|text|'+req.body.user_id,
            auth_code       : 'required|text|'+req.body.auth_code,
            id              : 'required|text|'+req.body.id,
            title           : 'required|text|'+req.body.title,
            type            : 'required|text|'+req.body.type,
            sort            : 'required|text|'+req.body.sort,
            key_answer      : 'no|text|'+req.body.key_answer,
            required        : 'no|text|'+req.body.required,
            placeholder     : 'no|text|'+req.body.placeholder,
            publish         : 'required|number|'+req.body.publish,
        }
        if(utility.validateRequest(middleware)){
            const result = await admin.getAuth(req.body,function(errAuth,resAuth){
                if(!errAuth){
                    if(!utility.issetVal(resAuth)){
                        res.status(200).send(
                        new response(false, 403, 'Unauthorized')
                        )
                    } else {
                        if(resAuth.auth_code == req.body.auth_code){
                            let required = 'no';
                            if(utility.issetVal(req.body.required)){
                                required = 'yes';
                            }
                            //here goes the function
                            const body = {
                                id              : req.body.id,
                                title           : req.body.title,
                                type            : req.body.type,
                                sort            : req.body.sort,
                                key_answer      : req.body.key_answer,
                                required        : required,
                                placeholder     : req.body.placeholder,
                                publish         : req.body.publish
                            }

                            question.updateData(body, function(err,resData) {
                                console.log(resData)
                                if (!err) {
                                    if(!utility.issetVal(resData)){
                                        res.status(200).send(
                                            new response(false, 400, 'Update Data failed')
                                        )
                                      }else{
                                        res.status(200).send(new response(true, 200, 'Update success', resData))
                                      }
                                } else {
                                    res.status(200).send(
                                        new response(false, 400, 'Update Data failed')
                                    )
                                }
                            })
                        }else{
                            res.status(200).send(
                            new response(false, 403, 'Unauthorized')
                            )
                        }
                    }
                } else {
                    res.status(200).send(
                        new response(false, 403, 'Unauthorized')
                    )
                }
            })
        } else {
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

exports.deleteQuestion = async (req, res) => {
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
                    user_id     : req.query.user_id,
                    auth_code   : req.query.auth_code,
                    id          : req.query.id
                }
                question.getById(body, function(errGet,resGet) {
                  console.log(errGet);
  
                  if (!errGet) {
                      if(!utility.issetVal(resGet)){
                          res.status(200).send(
                              new response(false, 404, 'Data not exist')
                          )
                      }else{
                        question.deleteData(body, function(err,resData) {
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

exports.insertAnswer = async (req, res) => {
    try {
        const middleware = {
            user_id         : 'required|text|'+req.body.user_id,
            auth_code       : 'required|text|'+req.body.auth_code,
            question_id     : 'required|text|'+req.body.question_id,
            title           : 'required|text|'+req.body.title,
            sort            : 'required|text|'+req.body.sort,
            correct         : 'required|text|'+req.body.correct,
            publish         : 'required|number|'+req.body.publish,
        }
        if(utility.validateRequest(middleware)){
            const result = await admin.getAuth(req.body,function(errAuth,resAuth){
                if(!errAuth){
                    if(!utility.issetVal(resAuth)){
                        res.status(200).send(
                        new response(false, 403, 'Unauthorized')
                        )
                    }else{
                        if(resAuth.auth_code == req.body.auth_code){
                            let required = 'no';
                            if(utility.issetVal(req.body.required)){
                                required = 'yes';
                            }
                            //here goes the function
                            const body = {
                                id              : utility.generateHash(32),
                                question_id     : req.body.question_id,
                                title           : req.body.title,
                                sort            : req.body.sort,
                                correct         : req.body.correct,
                                publish         : req.body.publish,
                                create_date     :  moment(Date.now()).format('YYYY-MM-DD HH:mm:ss')
                            }

                            answer.addData(body, function(err,resData) {
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

exports.updateAnswer = async (req, res) => {
    try {
        const middleware = {
            user_id         : 'required|text|'+req.body.user_id,
            auth_code       : 'required|text|'+req.body.auth_code,
            id              : 'required|text|'+req.body.id,
            title           : 'required|text|'+req.body.title,
            sort            : 'required|text|'+req.body.sort,
            correct         : 'required|text|'+req.body.correct,
            publish         : 'required|number|'+req.body.publish,
        }
        if(utility.validateRequest(middleware)){
            const result = await admin.getAuth(req.body,function(errAuth,resAuth){
                if(!errAuth){
                    if(!utility.issetVal(resAuth)){
                        res.status(200).send(
                        new response(false, 403, 'Unauthorized')
                        )
                    } else {
                        if(resAuth.auth_code == req.body.auth_code){
                            
                            //here goes the function
                            const body = {
                                id              : req.body.id,
                                title           : req.body.title,
                                sort            : req.body.sort,
                                correct      : req.body.correct,
                                publish         : req.body.publish
                            }

                            answer.updateData(body, function(err,resData) {
                                console.log(resData)
                                if (!err) {
                                    if(!utility.issetVal(resData)){
                                        res.status(200).send(
                                            new response(false, 400, 'Update Data failed')
                                        )
                                      }else{
                                        res.status(200).send(new response(true, 200, 'Update success', resData))
                                      }
                                } else {
                                    res.status(200).send(
                                        new response(false, 400, 'Update Data failed')
                                    )
                                }
                            })
                        }else{
                            res.status(200).send(
                            new response(false, 403, 'Unauthorized')
                            )
                        }
                    }
                } else {
                    res.status(200).send(
                        new response(false, 403, 'Unauthorized')
                    )
                }
            })
        } else {
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

exports.deleteAnswer = async (req, res) => {
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
                    user_id     : req.query.user_id,
                    auth_code   : req.query.auth_code,
                    id          : req.query.id
                }
                answer.getById(body, function(errGet,resGet) {
                  console.log(errGet);
  
                  if (!errGet) {
                      if(!utility.issetVal(resGet)){
                          res.status(200).send(
                              new response(false, 404, 'Data not exist')
                          )
                      }else{
                        answer.deleteData(body, function(err,resData) {
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

exports.getAnswer = async (req, res) => {
    try{
        const middleware = {
            user_id         : 'required|text|'+req.body.user_id,
            auth_code       : 'required|text|'+req.body.auth_code,
            question_id     : 'required|text|'+req.body.question_id,
        }
        if(utility.validateRequest(middleware)){
            const result = await admin.getAuth(req.body,function(errAuth,resAuth){
                // console.log(errAuth);
                if(!errAuth){
                    if(!utility.issetVal(resAuth)){
                        res.status(200).send(
                            new response(false, 403, 'Unauthorized')
                        )
                    }else{
                        if(resAuth.auth_code == req.body.auth_code){
                            //here goes the function
                            const body = {
                                question_id : req.body.question_id,
                            }

                            answer.getByForeignkeyId(body,function(errRes,resData) {
                                if (!errRes) {
                                    if (utility.issetVal(resData)) {
                                        // console.log(resData);
                                        let array = [];
                                        for(let idx = 0; idx <  resData.length; idx++) {
                                            array.push(resData[idx]);
                                        }
                                        res.status(200).send(
                                            new response(true, 200, 'Fetch Success', array)
                                        )
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

exports.viewValidation = async(req,res) =>{
  try {
    const{form_id, form_code} = req.body
    const middleware = {
      form_id      : 'required|text|'+form_id,
      form_code    : 'required|text|'+form_code
    }
    if(utility.validateRequest(middleware)){
      await form.getById({id : form_id}, function(errfind, resFind){
        if(utility.issetVal(resFind)){
          at_form.checkExist(req.body, function(errAuth, resAuth){
            console.log({errAuth : errAuth});
            console.log({resAuth : resAuth});
            if(utility.issetVal(resAuth)){
              form.getPreview({id: req.body.form_id}, function(errData, resData) {
                if(!utility.issetVal(errData)){
                  if(utility.issetVal(resData)){
                    resFind.question = resData;
                    res.status(200).send(
                      new response(true, 200, 'Data exist', resFind)
                    )
                  }else{
                    res.status(200).send(
                      new response(false, 401, 'No data')
                    )
                  }
                }else{
                  res.status(200).send(
                    new response(false, 401, 'No data')
                  )
                }
              })
            } else {
              res
                .status(200)
                .send(new response(false, 401, 'Access Denied'))   
            }
          })
        } else {
          res
          .status(200)
          .send(new response(false, 404, 'Data Not Exist1'))
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

exports.sentValidation = async (req, res)=>{
  console.log(req.query);
  try {
    const {user_id, auth_code, alumni_id } = req.query
    const middleware = {
      user_id   : 'required|text|'+user_id,
      auth_code : 'required|text|'+auth_code,
      alumni_id : 'required|text|'+alumni_id,
    }
    if(utility.validateRequest(middleware)){
      await admin.getAuth(req.query, function(errAuth, resAuth){
        if(utility.issetVal(resAuth)){
          if(resAuth.auth_code == auth_code){
            form.getOne({publish : 1}, function(errGet, resGet){
              console.log({resGet : resGet});
              if(utility.issetVal(resGet)){
                let body_atForm = {
                  form_code     : utility.generateHash(32),
                  form_id       : resGet.id,
                  user_id       : alumni_id,
                  create_date   : moment(Date.now()).format('YYYY-MM-DD HH:mm:ss')
                }
                user.getById({id : alumni_id}, function(errGetAlumni, resGetAlumni){
                  if(utility.issetVal(resGetAlumni)){
                    const {email} = resGetAlumni
                    at_form.addData(body_atForm, function(errAdd, resAdd){
                      if(!errAdd){
                        let link = `https://www.eannovate.com/dev72/oneplus/form-personal.php?id=${resGet.id}&code=${body_atForm.form_code}`
                        const mailBody = {
                        receiver: email,
                        subject: 'Form Validation',
                        body: '<p><i>*This is a message from OnePlus </i></p>' +
                          '<p>Thank you for using this app, please click this link below.</p>' +
                          '<p>Form Validation : <a href=' + link + '>*Click here*</a></p>' +
                          '<p><i>*Do not reply to this e-mail.</i></p>' +
                          '<p><i>Thank you!</i></p>'
                        }
                        nodemailer.mailSend(mailBody, function (err, resData) {
                          if (!err) {
                            res.status(200).send(new response(true, 200, 'Email send!'))
                          } else {
                            res.status(200).send(new response(false, 401, 'Insert failed'))
                          }
                        })
                      } else {
                        res
                        .status(200)
                        .send(new response(false, 404, 'Data Not Exist'))
                      }
                    })
                  } else {
                    res
                    .status(200)
                    .send(new response(false, 401, 'Insert failed'))
                  }
                })
              } else {
                res
                .status(200)
                .send(new response(false, 404, 'Data Not Exist'))
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
      .send(new response(false, 400, 'Invalid input format', middleware))
    }
  } catch (error){
    console.log(error);
    res
    .status(500)
    .send(new response(false, 500, 'Something went wrong'))
  }
}