var admin = require('../models/admin')
var postMonthly = require('../models/postMonthly')
var at_postMonthly = require('../models/AT_PostMonthly')
let response = require('../../helpers/response')
const utility = require('../../helpers/utility')
let moment = require('moment')

exports.viewPost = async (req, res) => {
  console.log('View Post')
  // req.body.year = parseInt(req.body.year)
  // req.body.month = parseInt(req.body.month)
  
  // console.log(req.body)
  try{
    const middleware = {
      user_id      : 'required|text|'+req.body.user_id,
      auth_code    : 'required|text|'+req.body.auth_code,
      // id           : 'required|text|'+req.body.id,
      page         : 'required|text|'+req.body.page,
      year         : 'required|number|'+req.body.year,
      month        : 'required|number|'+req.body.month,
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
              at_postMonthly.countGetByMonthly(req.body, function(errCount, resCount){
                // console.log({errCount : errCount})
                // console.log({resCount : resCount})
                if(errCount){
                  res.status(200).send(
                    new response(false, 401, 'No data')
                  )
                }else{
                  var itemPerPage =  utility.issetVal(req.body.item)?  parseInt(req.body.item) : 15
                  var options = {
                    year  : req.body.year,
                    month : req.body.month,
                    start : req.body.page <= 1 || req.body.page == null ? 0 : (req.body.page-1) * itemPerPage,
                    limit : itemPerPage
                  }
                  console.log(options)
                  at_postMonthly.getDataByMonthly(options, function(errRes, resData){
                    if(!utility.issetVal(errRes)){
                      if(utility.issetVal(resData)){
                        console.log(resData)
                        var datas = {
                          monthly_id: resData[0].monthly_id,
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
        new response(false, 400, 'Invalid input format',middleware)
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
      id           : 'required|text|'+req.body.id
    }
    if(utility.validateRequest(middleware)){
      const result = await admin.getAuth(req.body,function(errAuth,resAuth){
        if(!errAuth){
          if(!utility.issetVal(resAuth)){
            res.status(200).send(
              new response(false, 403, 'Unauthorized')
            )
          }else{
            postMonthly.getById({id: req.body.id}, function(errRes, resData){
              if(!utility.issetVal(errRes)){
                if(utility.issetVal(resData)){
                  at_postMonthly.getPostByMonthly({monthly_id: req.body.id}, function(errPost, resPost){
                    if(!utility.issetVal(errPost)){
                      if(utility.issetVal(resPost)){
                        var datas = resData;
                        datas.post = resPost
                        res.status(200).send(
                          new response(true, 200, 'Data exist', datas)
                        )
                      }else{
                        res.status(200).send(
                          new response(true, 200, 'Data exist without post', resData)
                        )
                      }
                    }else{
                      res.status(200).send(
                        new response(true, 200, 'Data exist without post', resData)
                      )
                    }
                  })
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

exports.getAll = async (req, res) => {
  try{
    const middleware = {
      user_id      : 'required|text|'+req.body.user_id,
      auth_code    : 'required|text|'+req.body.auth_code,
      page         : 'required|number|'+req.body.page,
      item         : 'no|number|'+req.body.item,
      year         : 'no|number|'+req.body.year,
      month        : 'no|number|'+req.body.month,
      create_date  : 'no|text|'+req.body.create_date
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
              let bodyCount ={
                year  : req.body.year,
                month : req.body.month,
                create_date : req.body.create_date
              }
              postMonthly.countGetAll(bodyCount, function(errCount, resCount){
                if(errCount){
                  res.status(200).send(
                    new response(false, 401, 'No data')
                  )
                }else{
                  var itemPerPage = req.body.item || 6
                  var options = {
                    start : req.body.page <= 1 || req.body.page == null ? 0 : (req.body.page-1) * itemPerPage,
                    limit : itemPerPage,
                    year  : req.body.year,
                    month : req.body.month,
                    create_date : req.body.create_date

                  }
                  postMonthly.getAll(options, function(errRes, resData){
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

exports.delete = async (req, res) => {
  try{
    const middleware = {
      user_id      : 'required|text|'+req.query.user_id,
      auth_code    : 'required|text|'+req.query.auth_code,
      id           : 'required|text|'+req.query.id
    }
    if(utility.validateRequest(middleware)){
      const result = await admin.getAuth(req.query, function(errAuth, resAuth){
        if(!errAuth){
          if(!utility.issetVal(resAuth)){
            res.status(200).send(
            new response(false, 403, 'Unauthorized')
          )}else{
            postMonthly.deleteData({id: req.query.id}, function(errData, resData){
              console.log(resData)
              if(resData == 0){
                res.status(200).send(
                  new response(false, 401, 'Delete failed')
                )
              }else{
                at_postMonthly.deleteByMonthly({id: req.query.id}, (err, resData) => {
                 
                })
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

exports.edit = async (req, res) => {
  try{
    const middleware = {
      user_id      : 'required|text|'+req.body.user_id,
      auth_code    : 'required|text|'+req.body.auth_code,
      id           : 'required|text|'+req.body.id,
      year         : 'required|text|'+req.body.year,
      month        : 'required|text|'+req.body.month,
      start_date   : 'required|date|'+req.body.start_date,
      end_date     : 'required|date|'+req.body.end_date,
      publish      : 'required|number|'+req.body.publish,
      post         : 'required|json|'+req.body.post
    }
    if(utility.validateRequest(middleware)){
      const result = await admin.getAuth(req.body, function(errAuth, resAuth){
        if(!errAuth){
          if(!utility.issetVal(resAuth)){
            res.status(200).send(
            new response(false, 403, 'Unauthorized')
          )}else{
            var body = {
              id: req.body.id,
              year: req.body.year,
              month: req.body.month,
              start_date: moment(req.body.start_date).format('YYYY-MM-DD'),
              end_date: moment(req.body.end_date).format('YYYY-MM-DD'),
              publish: req.body.publish
            }
            postMonthly.getById({id : req.body.id}, (errOne, resOne)=> {
              if(utility.issetVal(resOne)){
                postMonthly.checkMonth({year : req.body.year, month : req.body.month}, (errCheck, resCheck) => {
                  console.log({resOne: resOne});
                  console.log({resOne : resOne.id});
                  if(!utility.issetVal(resCheck)){
                    if(req.body.id == resOne.id){
                      postMonthly.updateData(body, function(errData, resData){
                          if(errData){
                            res.status(200).send(
                              new response(false, 400, 'Update failed')
                            )
                          }else{
                            at_postMonthly.deleteByMonthly({id: body.id}, function(errDel, resDel){
                              if(!errDel){
                                at_postMonthly.addMultiple({id: body.id, post: req.body.post}, function(errDataAT, resDataAT){
                                  if(errDataAT){
                                    res.status(200).send(
                                      new response(true, 200, 'Update success without multiple post')
                                    )
                                  }else{
                                    res.status(200).send(
                                      new response(true, 200, 'Update success')
                                    )
                                  }
                                })
                              } else {
                                res.status(200).send(
                                  new response(false, 401, 'Update failed')
                                )
                              }
                            })
                          }
                        })
                    } else {
                      res
                      .status(200)
                      .send(new response(false, 403, `Unauthorized`))
                    }
                  } else {
                    const monthNames = ["January", "February", "March", "April", "May", "June",
                                          "July", "August", "September", "October", "November", "December"
                                        ]
                    let numMonth = parseInt(req.body.month) - 1
                    res
                    .status(200)
                    .send(new response(false, 404, `${monthNames[numMonth]} has been Exist`))
                  }
                })
              } else {
                res.status(200).send(
                  new response(false, 404, 'Data Not Exist')
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
  try{
    const middleware = {
      user_id      : 'required|text|'+req.body.user_id,
      auth_code    : 'required|text|'+req.body.auth_code,
      year         : 'required|text|'+req.body.year,
      month        : 'required|text|'+req.body.month,
      start_date   : 'required|date|'+req.body.start_date,
      end_date     : 'required|date|'+req.body.end_date,
      publish      : 'required|number|'+req.body.publish,
      post         : 'required|json|'+req.body.post
    }
    if(utility.validateRequest(middleware)){
      const result = await admin.getAuth(req.body, function(errAuth, resAuth){
        if(!errAuth){
          if(!utility.issetVal(resAuth)){
            res.status(200).send(
            new response(false, 403, 'Unauthorized')
          )}else{
            postMonthly.checkMonth({year : req.body.year, month : req.body.month}, function (errCheck, resCheck){
              if(!errCheck){
                if(!utility.issetVal(resCheck)){
                  var body = {
                      id: utility.generateHash(32),
                      year: req.body.year,
                      month: req.body.month,
                      start_date: moment(req.body.start_date).format('YYYY-MM-DD'),
                      end_date: moment(req.body.end_date).format('YYYY-MM-DD'),
                      publish: req.body.publish,
                      create_date: moment(Date.now()).format('YYYY-MM-DD HH:mm:ss')
                    }
                  postMonthly.addData(body, function(errData, resData){
                    console.log({ error : errData});
                    if(errData){
                      res.status(200).send(
                        new response(false, 400, 'Insert failed')
                      )
                    }else{
                      at_postMonthly.addMultiple({id: body.id, post: req.body.post}, function(errDataAT, resDataAT){
                        if(errDataAT){
                          res.status(200).send(
                            new response(true, 200, 'Insert success without multiple post')
                          )
                        }else{
                          res.status(200).send(
                            new response(true, 200, 'Insert success')
                          )
                        }
                      })
                    }
                  })
                }else {
                  const monthNames = ["January", "February", "March", "April", "May", "June",
                                      "July", "August", "September", "October", "November", "December"
                                     ]
                  let numMonth = parseInt(req.body.month) - 1
                  res
                  .status(200)
                  .send(new response(false, 404, `${monthNames[numMonth]} has been Exist`))
                }
              } else {
                res.status(200).send(
                  new response(false, 400, 'Insert failed')
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

exports.deletePost = async(req, res)=>{
  console.log('DELETE Post by monthly');
  try{
    const middleware = {
      user_id      : 'required|text|'+req.query.user_id,
      auth_code    : 'required|text|'+req.query.auth_code,
      post_id      : 'required|text|'+req.query.post_id,
      month        : 'required|text|'+req.query.month,
      year         : 'required|text|'+req.query.year,
    }
    if(utility.validateRequest(middleware)){
      const result = await admin.getAuth(req.query, function(errAuth, resAuth){
        if(!errAuth){
          if(!utility.issetVal(resAuth)){
            res.status(200).send(
            new response(false, 403, 'Unauthorized')
          )}else{
            let bodyPostMonth = {
              month : req.query.month,
              year  : req.query.year
            }
            postMonthly.findOne(bodyPostMonth, function (errFind, resFind){
              if(utility.issetVal(resFind)){
                let bodyDeletePost = {
                  postmonthly_id : resFind.id,
                  post_id   : req.query.post_id
                }
                console.log(bodyDeletePost);
                at_postMonthly.deleteData(bodyDeletePost, function(errDel, resDel){
                  if(utility.issetVal(resDel)){
                    res.status(200)
                       .send(new response(true, 200, 'Delete Succes'))
                  } else {
                    res.status(200)
                       .send(new response(false,401, 'Delete Failed'))
                  }
                })
              } else {
                res.status(200)
                   .send(new response(false, 404, 'Data not exist'))
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

exports.deleteMonthly = async(req, res)=>{
  console.log('DELETE MONTHLY');
  // console.log(req.query);
  try{
    const middleware = {
      user_id      : 'required|text|'+req.query.user_id,
      auth_code    : 'required|text|'+req.query.auth_code,
      month        : 'required|text|'+req.query.month,
      year         : 'required|text|'+req.query.year,
    }
    if(utility.validateRequest(middleware)){
      const result = await admin.getAuth(req.query, function(errAuth, resAuth){
        if(!errAuth){
          if(!utility.issetVal(resAuth)){
            res.status(200).send(
            new response(false, 403, 'Unauthorized')
          )}else{
            let bodyPostMonth = {
              month : req.query.month,
              year  : req.query.year
            }
            postMonthly.findOne(bodyPostMonth, function (errFind, resFind){
              // console.log({errFind : errFind});
              // console.log({resFind : resFind});
              if(utility.issetVal(resFind)){
                postMonthly.deleteData({id: resFind.id}, function(errDelT, resDelT){
                  // console.log({errDelT : errDelT});
                  // console.log({resDelT : resDelT});
                  if(resDelT == 0){
                    res.status(200).send(
                      new response(false, 401, 'Delete failed')
                    )
                  }else{
                    at_postMonthly.deleteByMonthly({id: resFind.id}, (errDelAt, resDelAt) => {
                      // console.log({errDelAt : errDelAt});
                      // console.log({resDelAt : resDelAt});
                      if(!errDelAt){
                        res.status(200)
                           .send(new response(true, 200, 'Delete Succes'))
                      }else {
                        res.status(200)
                           .send(new response(false, 401, 'Delete failed'))
                      }
                    })
                  }
                })
              } else {
                res.status(200)
                   .send(new response(false, 404, 'Data not exist'))
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

exports.addMonthly = async(req,res)=>{
  try {
    const{user_id, auth_code, year, month, start_date, end_date, post_id}= req.body
    const middleware = {
      user_id      : 'required|text|'+user_id,
      auth_code    : 'required|text|'+auth_code,
      year         : 'required|text|'+year,
      month        : 'required|text|'+month,
      start_date   : 'required|date|'+start_date,
      end_date     : 'required|date|'+end_date,
      post_id      : 'required|text|'+post_id
    }
    if(utility.validateRequest(middleware)){
      await admin.getAuth(req.body, function(errAuth, resAuth){
        if(utility.issetVal(resAuth)){
          if(resAuth.auth_code == auth_code){
              let bodyAdd = {
              id            : utility.generateHash(32),
              year          : year,
              month         : month,
              start_date    : moment(req.body.start_date).format('YYYY-MM-DD'),
              end_date      : moment(req.body.end_date).format('YYYY-MM-DD'),
              publish       : 1,
              create_date   : moment(Date.now()).format('YYYY-MM-DD HH:mm:ss')
            }
            postMonthly.findOne({month : bodyAdd.month, year : bodyAdd.year}, (err, resData)=>{
              if(!utility.issetVal(err)){
                console.log(resData)
                  if(utility.issetVal(resData)){
                    bodyAdd.id = resData.id
                  } else {
                    postMonthly.addData(bodyAdd, function(errAdd, resAdd){
                      // console.log(errAdd)
                      if(utility.issetVal(errAdd)){
                        res
                        .status(200)
                        .send(new response(false, 401, 'Insert failed2'))
                      }
                    })
                    
                  }

                  at_postMonthly.addSingle({id : bodyAdd.id, post : post_id}, function(errAdd2, resAdd2){
                    if(!utility.issetVal(errAdd2)){
                      res
                      .status(200)
                      .send(new response(true, 200, 'Insert success'))
                    } else {
                      res
                      .status(200)
                      .send(new response(false, 400, 'Insert failed'))    
                    }
                  })
              } else {
                res
                .status(200)
                .send(new response(false, 401, 'Insert failed2'))
              }
            })
          } else {
            res
            .status(200)
            .send(new response(false, 403, 'Unauthorized'))
          }
        }else {
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
  } catch(error){
    console.log(error);
    res
    .status(500)
    .send(new response(false, 500, 'Something went wrong'))
  }
}