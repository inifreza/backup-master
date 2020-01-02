let user = require('../models/users')
let company = require('../models/company')
let response = require('../../helpers/response')
const utility = require('../../helpers/utility')
let moment = require('moment')
let sha1 = require('sha1')


exports.insert = async (req, res) => {
  try {
    const middleware = {
      name        : 'required|text|'+req.body.name
    }
    if(utility.validateRequest(middleware)){
      const result = await user.getAuth(req.body,function(errAuth,resAuth){
        if(!errAuth){
          if(resAuth == null || undefined){
            res.status(200).send(
            new response(false, 403, 'Unauthorized')
          )}else{
            if(resAuth.auth_code == req.body.auth_code){
              //here goes the function
              const body = {
                  name : req.body.name,
                  publish  : 1,
                  create_date :  moment(Date.now()).format('YYYY-MM-DD HH:mm:ss')
              }

              company.addData(body, function(err,resData) {
                if (!err) {
                  res.status(200).send(new response(true, 200, 'Register success', resData))
                } else {
                  res.status(200).send(
                    new response(false, 400, 'Register failed')
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

exports.delete = async (req, res) => {
    try {
      const middleware = {
        id        : 'required|text|'+req.body.id
      }
      if(utility.validateRequest(middleware)){
        const result = await user.getAuth(req.body,function(errAuth,resAuth){
          if(!errAuth){
            if(resAuth == null || undefined){
              res.status(200).send(
              new response(false, 403, 'Unauthorized')
            )}else{
              if(resAuth.auth_code == req.body.auth_code){
                //here goes the function
                const body = {
                    user_id : req.body.user_id,
                    auth_code : req.body.auth_code,
                    id : req.body.id
                }
                company.deleteData(body, function(err,resData) {
                    if (!err) {
                      if(resData == null || undefined){
                          res.status(405).send(
                            new response(false, 405, 'Data not exist')
                          )
                        }else{
                          res.status(200).send(new response(true, 200, 'Delete success', resData))
                        }
                    } else {
                        res.status(200).send(
                            new response(false, 400, 'Delete failed')
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

exports.update = async (req, res) => {
    try {
      const middleware = {
        id          : 'required|text|'+req.body.id,
        publish     : 'required|text|'+req.body.publish,
        name        : 'required|text|'+req.body.name
      }
      if(utility.validateRequest(middleware)){
        const result = await user.getAuth(req.body,function(errAuth,resAuth){
          if(!errAuth){
            if(resAuth == null || undefined){
              res.status(200).send(
              new response(false, 403, 'Unauthorized')
            )}else{
              if(resAuth.auth_code == req.body.auth_code){
                //here goes the function
                const body = {
                    id        : req.body.id,
                    publish   : req.body.publish,
                    name      : req.body.name
                }
                company.updateData(body, function(err,resData) {
                    if (!err) {
                      if(resData == null || undefined){
                        res.status(200).send(
                        new response(false, 400, 'Data not exist')
                      )}else{
                        res.status(200).send(new response(true, 200, 'Update success', resData))
                      }
                    } else {
                        res.status(200).send(
                            new response(false, 401, 'Update failed')
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
        page        : 'required|text|'+req.body.page,
        item        : 'no|text|'+req.body.item
      }
      if(utility.validateRequest(middleware)){
        const result = await user.getAuth(req.body,function(errAuth,resAuth){
          if(!errAuth){
            if(resAuth == null || undefined){
              res.status(200).send(
              new response(false, 403, 'Unauthorized')
            )}else{
              if(resAuth.auth_code == req.body.auth_code){
                company.getCountData(function(errResCount,rowsResCount) {
                  if (!errResCount) {
                   if (utility.issetVal(rowsResCount)) {
                        let itemPerRequest = utility.issetRequest(req.body.item)? 15 : parseInt(req.body.item);
                        let page = req.body.page;
                        let total_data =  rowsResCount;
                        let total_page = Math.ceil(total_data / itemPerRequest);

                        let limitBefore = page <= 1 || page == null ? 0 : (page-1) * itemPerRequest;

                        const PreparedData = {
                            start : limitBefore,
                            limit : itemPerRequest
                        }

                        company.getAll(PreparedData,function(errRes,rowsRes) {
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
                                    new response(false, 400, 'Fetch Failed')
                                )
                            }
                          }else {
                            res.status(200).send(
                              new response(false, 400, 'Fetch Failed')
                            )
                          }
                        })
                    } else {
                        res.status(200).send(
                            new response(false, 400, 'Fetch Failed')
                        )
                    }
                  } else {
                      res.status(200).send(
                          new response(false, 400, 'Fetch Failed')
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

  exports.getById = async (req, res) => {
    try {
      const middleware = {
        id        : 'required|text|'+req.body.id
      }
      if(utility.validateRequest(middleware)){
        const result = await user.getAuth(req.body,function(errAuth,resAuth){
          if(!errAuth){
            if(resAuth == null || undefined){
              res.status(200).send(
              new response(false, 403, 'Unauthorized')
            )}else{
              if(resAuth.auth_code == req.body.auth_code){
                company.getById(req, function(err,resData) {
                  if (!err) {
                    if(resData == null || undefined){
                      res.status(200).send(
                      new response(false, 400, 'Data not exist')
                    )}else{
                      res.status(200).send(new response(true, 200, 'Data exist', resData))
                    }
                  } else {
                    res.status(200).send(
                      new response(false, 400, 'Data not exist')
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
