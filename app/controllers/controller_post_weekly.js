var admin = require('../models/admin')
var postWeekly = require('../models/postWeekly')
var at_postWeekly = require('../models/AT_PostWeekly')
let response = require('../../helpers/response')
const utility = require('../../helpers/utility')
let moment = require('moment')

exports.viewPost = async (req, res) => {
  console.log('View Post')
  try{
    const middleware = {
      user_id      : 'required|text|'+req.body.user_id,
      auth_code    : 'required|text|'+req.body.auth_code,
      page         : 'required|text|'+req.body.page,
      item         : 'no|text|'+req.body.item,
      week         : 'required|text|'+req.body.week
    }
    if(utility.validateRequest(middleware)){
      if(Number(req.body.page)){
        const result = await admin.getAuth(req.body, function(errAuth, resAuth){
          console.log(errAuth)
          if(!errAuth){
            if(!utility.issetVal(resAuth)){
              res.status(200).send(
                new response(false, 403, 'Unauthorized')
              )
            }else{
              at_postWeekly.countGetByWeekly({week: req.body.week}, function(errCount, resCount){
                console.log(errCount)
                if(errCount){
                  res.status(200).send(
                    new response(false, 401, 'No data1')
                  )
                }else{
                  var itemPerPage =  utility.issetVal(req.body.item)?  parseInt(req.body.item) : 15;
                  var options = {
                    week  : req.body.week,
                    start : req.body.page <= 1 || req.body.page == null ? 0 : (req.body.page-1) * itemPerPage,
                    limit : itemPerPage
                  }
                  at_postWeekly.getDataByWeekly(options, function(errRes, resData){
                    if(!utility.issetVal(errRes)){
                      if(utility.issetVal(resData)){
                        var datas = {
                          weekly_id: resData[0].weekly_id,
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
                          new response(false, 401, 'No data2')
                        )
                      }
                    }else{
                      res.status(200).send(
                        new response(false, 401, 'No data3')
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
        new response(false, 400, 'Invalid input format', middleware)
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
            postWeekly.getById({id: req.body.id}, function(errRes, resData){
              if(!utility.issetVal(errRes)){
                if(utility.issetVal(resData)){
                  at_postWeekly.getPostByWeekly({weekly_id: req.body.id}, function(errPost, resPost){
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
      keyword      : 'no|text|'+req.body.keyword,
      month        : 'no|number|'+req.body.month,
      year         : 'no|number|'+req.body.year,
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
              let bodyCount = {
                keyword      : req.body.keyword,
                month        : req.body.month,
                year         : req.body.year,
                create_date  : req.body.create_date
              }
              postWeekly.countGetAll(bodyCount, function(errCount, resCount){
                if(errCount){
                  res.status(200).send(
                    new response(false, 401, 'No data')
                  )
                }else{
                  var itemPerPage = req.body.item || 6
                  var options = {
                    start : req.body.page <= 1 || req.body.page == null ? 0 : (req.body.page-1) * itemPerPage,
                    limit : itemPerPage,
                    keyword      : req.body.keyword,
                    month        : req.body.month,
                    year         : req.body.year,
                    create_date  : req.body.create_date
                  }
                  postWeekly.getAll(options, function(errRes, resData){
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
            postWeekly.deleteData({id: req.query.id}, function(errData, resData){
              if(resData == 0){
                res.status(200).send(
                  new response(false, 401, 'Delete failed')
                )
              }else{
                let body = {
                  'postweekly_id' : req.query.id
                }
                at_postWeekly.delete(body, (err, resData) => {
                 
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
      week         : 'required|text|'+req.body.week,
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
              week: req.body.week,
              start_date: moment(new Date(req.body.start_date)).format('YYYY-MM-DD'),
              end_date: moment(new Date(req.body.end_date)).format('YYYY-MM-DD'),
              publish: req.body.publish
            }
            console.log(body)
            postWeekly.updateData(body, function(errData, resData){
              console.log(errData);
              if(errData){
                res.status(200).send(
                  new response(false, 400, 'Update failed1')
                )
              }else{
                at_postWeekly.deleteByWeekly({postweekly_id: body.id},  function(err, res){})
                at_postWeekly.addMultiple({id: body.id, post: req.body.post}, function(errDataAT, resDataAT){
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
      week         : 'required|text|'+req.body.week,
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
              id: utility.generateHash(32),
              week: req.body.week,
              start_date: moment(req.body.start_date).format('YYYY-MM-DD'),
              end_date: moment(req.body.end_date).format('YYYY-MM-DD'),
              publish: req.body.publish,
              create_date: moment(Date.now()).format('YYYY-MM-DD HH:mm:ss')
            }
            postWeekly.addData(body, function(errData, resData){
              console.log(errData);
              if(errData){
                res.status(200).send(
                  new response(false, 401, 'Insert failed')
                )
              }else{
                at_postWeekly.addMultiple({id: body.id, post: req.body.post}, function(errDataAT, resDataAT){
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
    res.status(500).send(
      new response(false, 500, 'Something went wrong')
    )
  }
}

exports.delPostWeek = async(req, res)=>{
  console.log('DELETE POST PER WEEKLY');
  console.log(req.query);
  try{
    const middleware = {
      user_id      : 'required|text|'+req.query.user_id,
      auth_code    : 'required|text|'+req.query.auth_code,
      post_id      : 'required|text|'+req.query.post_id,
      week         : 'required|text|'+req.query.week
    }
    if(utility.validateRequest(middleware)){
      const result = await admin.getAuth(req.query, function(errAuth, resAuth){
        if(!errAuth){
          if(!utility.issetVal(resAuth)){
            res.status(200).send(
            new response(false, 403, 'Unauthorized')
          )}else{
            postWeekly.findData({week : req.query.week}, function(errFind, resFind){
              if(utility.issetVal(resFind)){
                   let body = {
                     postWeekly_id : resFind[0].id,
                     post_id : req.query.post_id
                   }
                   console.log(body);
                at_postWeekly.delete(body, function(errDel, resDel){
                  if(utility.issetVal(resDel)){
                    res.status(200)
                   .send(new response(true, 200, 'Delete Succes'))
                  } else {
                    res.status(200)
                   .send(new response(false, 401, 'Delete failed'))
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

exports.delWeekHigh = async(req, res)=>{
  console.log('DELETE WEEKLY HIHGTLIGHT');
  console.log(req.query);
  try{
    const middleware = {
      user_id      : 'required|text|'+req.query.user_id,
      auth_code    : 'required|text|'+req.query.auth_code,
      week         : 'required|text|'+req.query.week
    }
    if(utility.validateRequest(middleware)){
      const result = await admin.getAuth(req.query, function(errAuth, resAuth){
        if(!errAuth){
          if(!utility.issetVal(resAuth)){
            res.status(200).send(
            new response(false, 403, 'Unauthorized')
          )}else{
            postWeekly.findData({week : req.query.week}, function(errFind, resFind){
              if(utility.issetVal(resFind)){
                postWeekly.deleteOne({week : req.query.week}, function(errDel, resDel){
                  console.log({errDel : errDel});
                  console.log({resDel : resDel});
                  // At_postWeekly
                  if(utility.issetVal(resDel)){
                    res.status(200)
                   .send(new response(true, 200, 'Delete Succes'))
                  } else {
                    res.status(200)
                   .send(new response(false, 401, 'Delete failed'))
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

exports.addWeekly = async (req, res)=>{
  console.log('Add WeekLy');
  try{
    const{user_id, auth_code, post_id, start_date,end_date, week}= req.body
    const middleware = {
      user_id      : 'required|text|'+user_id,
      auth_code    : 'required|text|'+auth_code,
      week         : 'required|text|'+week,
      start_date   : 'required|date|'+start_date,
      end_date     : 'required|date|'+end_date,
      post_id      : 'required|text|'+post_id
    }
    if(utility.validateRequest(middleware)){
      console.log('LOLOS');
      await admin.getAuth(req.body, function(errAuth, resAuth){
        if(utility.issetVal(resAuth)){
          if(resAuth.auth_code == auth_code){
            let bodyAdd = {
              id        : utility.generateHash(32),
              week      : week,
              start_date: moment(start_date).format('YYYY-MM-DD'),
              end_date  : moment(end_date).format('YYYY-MM-DD'),
              publish   : 1,
              create_date: moment(Date.now()).format('YYYY-MM-DD HH:mm:ss')
            }
            postWeekly.findOne(bodyAdd, (err, resData)=>{
              if(!utility.issetVal(err)){
                  if(utility.issetVal(resData)){
                    bodyAdd.id = resData.id
                  } else {
                    postWeekly.addData(bodyAdd, function(errAdd, resAdd){
                      // console.log(errAdd)
                      if(utility.issetVal(errAdd)){
                        res
                        .status(200)
                        .send(new response(false, 401, 'Insert failed2'))
                      }
                    })
                  }

                  at_postWeekly.addSingle({id : bodyAdd.id, post : post_id }, function(errAdd2, resAdd2){
                    // console.log(errAdd2);
                    if(!utility.issetVal(errAdd2)){
                      res
                      .status(200)
                      .send(new response(true, 200, 'Insert success'))
                    } else {
                      res
                      .status(200)
                      .send(new response(false, 401, 'Insert failed1'))    
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