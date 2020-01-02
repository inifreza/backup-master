let invitation = require('../models/invitation')
let user = require('../models/user')
let appVersion = require('../models/appVersion')
let admin = require('../models/admin')

let response = require('../../helpers/response')
const utility = require('../../helpers/utility')
const nodemailer = require('../../helpers/mail_adapter');
let moment = require('moment')
const formidable = require('formidable')
const path = require('path');
const fs = require('fs');
let appDir = path.dirname(require.main.filename);
let pathDir = appDir + '/uploads/user/'
let fileDir = appDir + '/uploads/excel/invitation/'
let Excel = require('exceljs');

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
                    invitation.getCountData(bodyCount,function(errResCount,rowsResCount) {
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
                                    keyword : req.body.keyword
                                }
            
                                invitation.getAll(PreparedData,function(errRes,rowsRes) {
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

exports.importExcel = async (req, res) => {
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
        if(utility.checkExcelExtension(file.name)){
          file.name = 'import-invitatation-'+ moment(Date.now()).format('DD-MM-YYYY')+ '.' + utility.detectMimeType(file.type);
          file.path = appDir + '/uploads/excel/invitation/' + file.name;
          // console.log(file)
        }
      })
      .on('aborted', () => {
        console.error('Request aborted by the user')
      })
      .on('error', (err) => {
        console.error('Error', err)
        throw err
      })
      .on('end',async () => {
        let temp = '{'+formData.toString() +'}'
        let formJSON = JSON.parse(temp)
  
        const middleware = {
          user_id         : 'required|text|'+formJSON.user_id,
          auth_code       : 'required|text|'+formJSON.auth_code,
          files           : 'required|excel|'+formJSON.files,
        }
        console.log({'middleware': middleware})
        if(utility.validateRequest(middleware)){
          const result = await admin.getAuth(formJSON, async (errAuth,resAuth) =>{
            if(!errAuth){
                if(!utility.issetVal(resAuth)){
                    res.status(200).send(
                    new response(false, 403, 'Unauthorized')
                )}else{
                    if(resAuth.auth_code == formJSON.auth_code){
                    let wb = new Excel.Workbook();
                    let path = require('path');
    
                    console.log(fileDir);
                    let filePath = path.resolve(fileDir, formJSON.files);
    
                    await wb.xlsx.readFile(filePath).then(async () =>{
                        let sh = wb.getWorksheet("Sheet1");
    
                        wb.xlsx.writeFile("sample2.xlsx");  
                        let success = 0;
                        let failed = 0;
                        

                        let promiseAndroid = new Promise(function(resolve, reject) {
                            appVersion.getActive({platform : 'android'}, (err, resData) =>{
                                // console.log(resData);
                                if(!utility.issetVal(err)){
                                    if(utility.issetVal(resData)){
                                        resolve(resData);
                                    } else {
                                        resolve();
                                    }
                                } else {
                                    resolve();
                                }
                            })
                        });

                        let promiseIos = new Promise(function(resolve, reject) {
                            appVersion.getActive({platform : 'ios'}, (err, resData) =>{
                              // console.log(resData);
                                if(!utility.issetVal(err)){
                                    if(utility.issetVal(resData)){
                                    resolve(resData);
                                    } else {
                                    resolve();
                                    }
                                } else {
                                    resolve();
                                }
                            })
                        });

                        let promiseLastData = new Promise(function(resolve, reject) {
                            invitation.getLastData(null, (err, resData) =>{
                              console.log('err', err);
                              console.log('resData',resData);
                                if(!utility.issetVal(err)){
                                    if(utility.issetVal(resData)){
                                        resolve(resData);
                                    } else {
                                        resolve();
                                    }
                                } else {
                                    resolve();
                                }
                            })
                        });

                        Promise.all([promiseAndroid, promiseIos, promiseLastData]).then(async arr => {
                            const android   =  arr[0];
                            const ios       = arr[1];
                            const lastData  = arr[2];
                            const splitTitle      = lastData[0].title.split('-');
                            const last = parseInt(splitTitle[2])+1
                            // console.log(last);
                            const bodyInvited = {
                                id : utility.generateHash(32)
                                , title : 'Invited-'+moment(Date.now()).format('DDMMYYYY')+'-'+last
                                , total_email : parseInt(sh.rowCount)-parseInt(1)
                                , create_date : moment(Date.now()).format('YYYY-MM-DD HH:mm:ss')
                            }
                            await invitation.addData(bodyInvited, (err,res) => {
                                console.log('err', err)
                                console.log('res', res)
                            })

                            
                            for (i = 2; i <= sh.rowCount; i++) {
                                let type;
                                const email =  sh.getRow(i).getCell(1).value ? sh.getRow(i).getCell(1).value.text : null;
                                user.checkEmail({email : email}, async (error, resData) => {
                                    console.log('a', resData.id)
                                    if(utility.issetVal(resData)){
                                        const name = resData.name;
                                        const phone = resData.phone;
                                        const email = resData.email;
                                        const bodyUser = {
                                            id : resData.id
                                            , ref_batch_id : bodyInvited.id
                                            , sent_date : moment(Date.now()).format('YYYY-MM-DD HH:mm:ss')
                                        }
                                        await user.updateData(bodyUser, (err,res) => {
                                            console.log('err', err)
                                            console.log('res', res)
                                        })
    
                                        const contentMailer =   '<p><b>You are invited to join in Our Alumni Platform App : OnePlus App.</b></p>' +
                                                                '<p>Please download the app on <a href=' + android[0].url + '>[Play Store]</a> or  <a href=' + ios[0].url + '>[App store]</a></p>' +
                                                                '<p>and do the registration using your following number / email :</p>' +
                                                                '<p>Phone Number : ' + phone + '</p>' +
                                                                '<p>Email : ' + email + '</p>' +
                                                                '<p><i>*Do not reply to this e-mail.</i></p>' +
                                                                '<p>Kind Regards,</p>'+
                                                                '<p>PwC Indonesia</p>';
    
                                        let mailBody = {
                                            receiver : email,
                                            subject  : 'Invitation Oneplus user',
                                            body     : contentMailer
                                        }
                                        const mailer = await nodemailer.mailSend(mailBody,  (err, resData) => {
                                            if(utility.issetVal(resData)){
                                                const bodyUserSecond = {
                                                    id : resData.id
                                                    , sent_invite : 1
                                                }
                                                user.updateData(bodyUserSecond, (err,res) => {
                                                    console.log('err', err)
                                                    console.log('res', res)
                                                })
                                            }
                                        })
                                    }
                                   
                                })
                            }
                            const Return = {
                                'Total Data'  : parseInt(sh.rowCount)-parseInt(1),
                                'Success'     :  success,
                                'Failed'      :  failed,
                            }     
                            res.status(200).send(
                                new response(true, 200, 'Import Data Success'))

                        });
                    }).catch( err => {
                        res.status(200).send(new response(false, 401, 'Sent Invite Failed', err))
                        console.log(err);
                    } );
                        
                    }else{
                        res.status(200).send(
                        new response(false, 403, 'Unauthorized'))
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
      console.log(e);
      res.status(500).send(
        new response(false, 500, 'Something went wrong')
      )
    }
}

exports.resentInvitation = async (req, res) => {
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
                    // execute function
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

exports.create = async (req, res) => {
    try{
      const middleware = {
        user_id      : 'required|text|'+req.body.user_id,
        auth_code    : 'required|text|'+req.body.auth_code,
        user_list    : 'required|text|'+req.body.user_list
      }
      // console.log(middleware);
      if(utility.validateRequest(middleware)){
        const result = await admin.getAuth(req.body, async  (errAuth,resAuth)=>{
            // console.log(errAuth);
          if(!errAuth){
            if(!utility.issetVal(resAuth)){
              res.status(200).send(
              new response(false, 403, 'Unauthorized')
            )}else{
                if(resAuth.auth_code == req.body.auth_code){
                    if(utility.issetVal(req.body.user_list)){
                        let datUser = JSON.parse(req.body.user_list);
                        console.log('a',datUser.length)


                        // return false
                        
                        let promiseAndroid = new Promise(function(resolve, reject) {
                            appVersion.getActive({platform : 'android'}, (err, resData) =>{
                                // console.log(resData);
                                if(!utility.issetVal(err)){
                                    if(utility.issetVal(resData)){
                                        resolve(resData);
                                    } else {
                                        resolve();
                                    }
                                } else {
                                    resolve();
                                }
                            })
                        });

                        let promiseIos = new Promise(function(resolve, reject) {
                            appVersion.getActive({platform : 'ios'}, (err, resData) =>{
                              // console.log(resData);
                                if(!utility.issetVal(err)){
                                    if(utility.issetVal(resData)){
                                    resolve(resData);
                                    } else {
                                    resolve();
                                    }
                                } else {
                                    resolve();
                                }
                            })
                        });

                        let promiseLastData = new Promise(function(resolve, reject) {
                            invitation.getLastData(null, (err, resData) =>{
                              console.log('err', err);
                              console.log('resData',resData);
                                if(!utility.issetVal(err)){
                                    if(utility.issetVal(resData)){
                                        resolve(resData);
                                    } else {
                                        resolve();
                                    }
                                } else {
                                    resolve();
                                }
                            })
                        });

                        Promise.all([promiseAndroid, promiseIos, promiseLastData]).then(async arr => {
                            const android   =  arr[0];
                            const ios       = arr[1];
                            const lastData  = arr[2];
                            const splitTitle      = lastData[0].title.split('-');
                            const last = parseInt(splitTitle[2])+1


                            const bodyInvited = {
                                id : utility.generateHash(32)
                                , title : 'Invited-'+moment(Date.now()).format('DDMMYYYY')+'-'+last
                                , total_email : datUser.length
                                , create_date : moment(Date.now()).format('YYYY-MM-DD HH:mm:ss')
                            }
                            invitation.addData(bodyInvited, (err,res) => {
                                console.log('err', err)
                                console.log('res', res)
                            })

                            console.log('android', android[0].url);
                            console.log('ios', ios[0].url);
                          
                            // return false;
                            
                            datUser.map(async data => {
                                await user.getById({'id' :data.user_id}, async (err, res) =>{
                                    const name = res.name;
                                    const phone = res.phone;
                                    const email = res.email;
                                    const bodyUser = {
                                        id : data.user_id
                                        , ref_batch_id : bodyInvited.id
                                        , sent_date : moment(Date.now()).format('YYYY-MM-DD HH:mm:ss')
                                    }
                                    await user.updateData(bodyUser, (err,res) => {
                                        console.log('err', err)
                                        console.log('res', res)
                                    })

                                    const contentMailer =   '<p><b>You are invited to join in Our Alumni Platform App : OnePlus App.</b></p>' +
                                                            '<p>Please download the app on <a href=' + android[0].url + '>[Play Store]</a> or  <a href=' + ios[0].url + '>[App store]</a></p>' +
                                                            '<p>and do the registration using your following number / email :</p>' +
                                                            '<p>Phone Number : ' + phone + '</p>' +
                                                            '<p>Email : ' + email + '</p>' +
                                                            '<p><i>*Do not reply to this e-mail.</i></p>' +
                                                            '<p>Kind Regards,</p>'+
                                                            '<p>PwC Indonesia</p>';

                                    let mailBody = {
                                        receiver : email,
                                        subject  : 'Invitation Oneplus user',
                                        body     : contentMailer
                                    }
                                    const mailer = await nodemailer.mailSend(mailBody,  (err, resData) => {
                                        if(utility.issetVal(resData)){
                                            const bodyUserSecond = {
                                                id : data.user_id
                                                , sent_invite : 1
                                            }
                                            user.updateData(bodyUserSecond, (err,res) => {
                                                console.log('err', err)
                                                console.log('res', res)
                                            })
                                        }
                                    })
                                   
                                })
                            })
                            res.status(200).send(new response(true, 200, 'Sent Invite Success'))
                        }).catch( err => {
                            res.status(200).send(new response(false, 401, 'Sent Invite Failed', err))
                            console.log(err);
                        } );
                    }
                    // execute function
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
        new response(false, 500, 'Something went wrong', e)
      )
    }
}
