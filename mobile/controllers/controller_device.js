const utility = require('../../helpers/utility')
const response = require('../../helpers/response')
const moment = require('moment')

//model
const device = require('../models/device')

// config
const globals = require('../../configs/global')

//setting fcm
const { config } = require('../../default')
let {firebase} = globals[config.environment];

exports.getSpesificUser = async (req, res)=>{
  try {
    const middleware = {
      user_list         : 'required|text|'+req.body.user_list,
    }
    if(utility.validateRequest(middleware)){
        const getDevice = new Promise((resolve, reject)=>{
            device.getSpesificUser(user_list, function(errRes, tokens){
                utility.issetVal(tokens) ? resolve(tokens) : resolve(tokens);
            })
        })

        Promise.all([getDevice])
        .then(arr=>{
            if(utility.issetVal(arr[0])){
                res.status(200).send(new response(true, 200, 'Fetch Success', arr[0]))
            } else {
                res.status(200).send(new response(false, 401, 'Fetch Failed'))
            }
        })
    } else {
      res.status(200).send(new response(false, 400, 'Invalid input format', middleware))
    }
  } catch {
      res.status(500).send(new response(false, 500, 'Something went wrong'))
  }
}