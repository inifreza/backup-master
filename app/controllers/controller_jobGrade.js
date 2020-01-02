var jobGrade = require('../models/jobGrade')
let response = require('../../helpers/response')
const utility = require('../../helpers/utility')
var admin = require('../models/admin')

exports.getAll = async (req, res) => {
  try{
    const middleware = {
      user_id      : 'required|text|'+req.body.user_id,
      auth_code    : 'required|text|'+req.body.auth_code
    }
    // console.log(middleware);
    if(utility.validateRequest(middleware)){
      const result = await admin.getAuth(req.body,function(errAuth,resAuth){
        if(!errAuth){
          if(!utility.issetVal(resAuth)){
            res.status(200).send(
            new response(false, 403, 'Unauthorized')
          )}else{
            if(resAuth.auth_code == req.body.auth_code){
              //here goes the function
              jobGrade.getAll(null,function(errRes,resData) {
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
