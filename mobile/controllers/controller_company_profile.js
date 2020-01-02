//Model
const admin = require('../models/admin')
const user = require('../models/user')
const company = './data/company_profile.json'
let response = require('../../helpers/response')
const utility = require('../../helpers/utility')
let moment = require('moment')
let sha1 = require('sha1')

exports.add = async (req, res) => {
 console.log('Company Profile'); 
 try {
  const middleware = {
    user_id               : `required|text|${req.body.user_id}`,
    auth_code             : `required|text|${req.body.auth_code}`,
    address               : `no|text|${req.body.address}`,
    city                  : `no|text|${req.body.city}`,
    province              : `no|text|${req.body.province}`,
    phone_number          : `no|text|${req.body.phone_number}`,
    phone_number2         : `no|text|${req.body.phone_number2}`,
    zip_code              : `no|text|${req.body.zip_code}`,
    country               : `no|text|${req.body.country}`,
    email_address1        : `no|text|${req.body.email_address1}`,
    email_address2        : `no|text|${req.body.email_address2}`,
    website               : `no|text|${req.body.website}`,
    whatsapp              : `no|text|${req.body.whatsapp}`,
    email_address         : `required|text|${req.body.email_address}`,
  }

  let profile = {...req.body}
  delete profile.user_id
  delete profile.auth_code
  profile.email_address = JSON.parse(profile.email_address)

  if(utility.validateRequest(middleware)){
    const result = await admin.getAuth(req.body, (errAuth, resAuth)=>{
      if(utility.issetVal(resAuth)){
        if(req.body.auth_code == resAuth.auth_code){
          utility.writeJson(JSON.stringify(profile, null, 2), company, 'utf8', (err, data)=>{
            if(!err){
              res
              .status(200)
              .send(new response(true, 200, 'Add success'))
            } else {
              res
              .status(200)
              .send(new response(false, 401, 'Add failed'))
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
    .send(new response(false, 400, 'Invalid input format', middleware))
  }
 } catch (error) {
   console.log(error);
    res
    .status(500)
    .send(new response(false, 500, 'Something went wrong'))
 }
}

exports.getAll = async (req,res)=> {
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
            utility.readJson(company, 'utf8', (err, data)=>{
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