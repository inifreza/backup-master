var notification = require('../models/notification')
let response = require('../../helpers/response')
const utility = require('../../helpers/utility')
var user = require('../../app/models/user')

exports.getAll = async (req, res) => {
  try{
    const middleware = {
      user_id      : 'required|text|'+req.body.user_id,
      auth_code    : 'required|text|'+req.body.auth_code
    }
    // console.log(middleware);
    if(utility.validateRequest(middleware)){
      const result = await user.getAuth(req.body,function(errAuth,resAuth){
        if(!errAuth){
          if(!utility.issetVal(resAuth)){
            res.status(200).send(
            new response(false, 403, 'Unauthorized')
          )}else{
            if(resAuth.auth_code == req.body.auth_code){
              //here goes the function
              notification.getAll(null,function(errRes,resData) {
                console.log(errRes);
                if(!utility.issetVal(errRes)){
                  if(utility.issetVal(resData)){
                    res.status(200).send(
                      new response(true, 200, 'Fetch success', resData)
                    )
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


exports.getUnRead = async (req, res) => {
  try{
      const middleware = {
          user_id         : 'required|text|'+req.body.user_id,
          auth_code       : 'required|text|'+req.body.auth_code,
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
                              user_id : req.body.user_id,
                          }

                          notification.getUnread(body,function(errRes,resData) {
                              // console.log(resData);
                              if (!errRes) {
                                  const data = {
                                    count : resData
                                  }
                                  res.status(200).send(new response(true, 200, 'Fetch success', data))
                                 
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

exports.readSelected =async (req,res)=>{
  console.log('Read Selected');
  try {
    const middleware = {
      user_id         : 'required|text|'+req.body.user_id,
      auth_code       : 'required|text|'+req.body.auth_code,
      notification_id : 'required|text|'+req.body.auth_code
    }
    if(utility.validateRequest(middleware)){
      user.getAuth(req.body, function(errAuth, resAuth){
        if(utility.issetVal(resAuth)){
          if(resAuth.auth_code == req.body.auth_code){
            notification.getById({id : req.body.notification_id}, function(errGet, resNotif){
              if(utility.issetVal(resNotif)){
                let bodyUpdate = {
                  id        : req.body.notification_id,
                  seen      : 1
                }
                notification.updateData(bodyUpdate, function(errUpdate, resUpdate){
                  if(!errUpdate){
                    res
                    .status(200)
                    .send(new response(true, 200, 'Update Succes'))
                  } else {
                    res
                    .status(200)
                    .send(new response(false, 401, 'Update Failed'))
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
      .send(new response(false, 400, 'Invalid input format'))
    }
  } catch (error) {
    console.log(error);
    res
    .status(500)
    .send(new response(false,500, 'Something went wrong'))
  }
},
 exports.readAll = async (req, res)=>{
  console.log('Read All notification');
  try{
    const middleware = {
      user_id      : 'required|text|'+req.body.user_id,
      auth_code    : 'required|text|'+req.body.auth_code
    }
    // console.log(middleware);
    if(utility.validateRequest(middleware)){
      const result = await user.getAuth(req.body,function(errAuth,resAuth){
        if(!errAuth){
          if(!utility.issetVal(resAuth)){
            res.status(200).send(
            new response(false, 403, 'Unauthorized')
          )}else{
            if(resAuth.auth_code == req.body.auth_code){
              //here goes the function
              let bodyRead = {
                recipient_id : req.body.user_id,
                seen         : 1
              }
              notification.getReadAll(bodyRead, function(errRead, resRead){
                console.log({errRead});
                console.log({resRead});
                if(!errRead){
                  res
                  .status(200)
                  .send(new response(true, 200, 'Update Succes'))
                } else {
                  res
                  .status(200)
                  .send(new response(false, 401, 'Update Failed'))
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
},

exports.getList = async (req, res) =>{
  console.log('Get All notification');
  try{
    const middleware = {
      user_id      : 'required|text|'+req.body.user_id,
      auth_code    : 'required|text|'+req.body.auth_code,
      page         : 'required|text|'+req.body.page,
      item         : 'no|text|'+req.body.item,
    }
    // console.log(middleware);
    if(utility.validateRequest(middleware)){
      const result = await user.getAuth(req.body,function(errAuth,resAuth){
        if(!errAuth){
          if(!utility.issetVal(resAuth)){
            res.status(200).send(
            new response(false, 403, 'Unauthorized')
          )}else{
            if(resAuth.auth_code == req.body.auth_code){
              //here goes the function
              notification.getCountData({user_id : req.body.user_id}, function(errCount, rowsResCount){
                console.log({rowsResCount});
                if(utility.issetVal(rowsResCount)){
                  let itemPerRequest = utility.issetVal(req.body.item)?  parseInt(req.body.item) : 15;
                  let page = req.body.page;
                  let total_data =  rowsResCount;
                  let total_page = Math.ceil(total_data / itemPerRequest);

                  let limitBefore = page <= 1 || page == null ? 0 : (page-1) * itemPerRequest;

                  let bodyNotif = {
                    user_id : req.body.user_id,
                    start : limitBefore,
                    limit : itemPerRequest
                  }
                  notification.getList(bodyNotif,function(errGet, dataList){
                    if(!errGet){
                      const totalInfo = {
                        total_page : total_page,
                        total_data_all : total_data,
                        total_data : dataList.length
                      }
                      res.status(200).send(
                        new response(true, 200, 'Fetch success', {
                          data  : dataList,
                          total : totalInfo})
                      )
                    } else {
                      res
                      .status(200)
                      .send(new response(false, 401, 'Fetch Failed'))
                    }
                  })
                } else {
                  res
                  .status(200)
                  .send(new response(false, 401, 'Fetch Failed'))
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