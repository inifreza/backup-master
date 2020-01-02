//Model
const admin = require('../models/admin')
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
    pwc_contact_info      : `required|text|${req.body.pwc_contact_info}`,
    email_addresses       : `required|text|${req.body.email_addresses}`,
  }
  let profile = {...req.body}
  delete profile.user_id
  delete profile.auth_code
  profile.email_addresses = JSON.parse(profile.email_addresses)
  // console.log({profile});
  // console.log({'req body' :req.body});
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
      const result =  await admin.getAuth(req.body, (errAuth, resAuth) => {
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