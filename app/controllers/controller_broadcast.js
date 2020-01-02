let response = require('../../helpers/response')
let moment = require('moment')
const admin = require('../models/admin')
const user = require('../models/user')
const utility = require('../../helpers/utility')

const device = require('../models/device')
const alumniIterest = require('../models/AT_AlumniInterest')
const notification = require('../models/notification')
const pushNotification = require('../models/T_PushNotification')
const pushNotificationInterest = require('../models/PushNotificationInterest')

//setting fcm
const globals = require('../../configs/global')
const { config } = require('../../default')
let {firebase} = globals[config.environment];

exports.insertBroadcast = async (req, res) => {
    console.log('Insert Broadcast')
    // console.log(req.body)
    try{
        const {user_id, auth_code, type, headline,sub_headline, interest_list} = req.body
        const middleware = {
            user_id         : 'required|text|'+req.body.user_id,
            auth_code       : 'required|text|'+req.body.auth_code,
            type            : 'required|text|'+req.body.type,
            headline        : 'required|text|'+req.body.headline,
            sub_headline    : 'required|text|'+req.body.sub_headline,
        }
        req.body.type == '1' ? '' : middleware.interest_list = 'required|text|'+req.body.interest_list;
        if(utility.validateRequest(middleware)){
            console.log('Validate Request')
            await admin.getAuth(req.body,function(errAuth,resAuth){
                console.log(errAuth);
                if(!errAuth){
                    if(!utility.issetVal(resAuth)){
                        res.status(200).send(
                            new response(false, 403, 'Unauthorized')
                        )
                    }else{
                        // console.log(resAuth.auth_code);
                        if(resAuth.auth_code == req.body.auth_code){
                            console.log('auth_code Berhasil')
                            
                            let type = req.body.type
                            let schedule = req.body.schedule_time
                            let status = null

                            type == '1' ? type = 'all_user' : type = 'interest';
                            
                            if(schedule == '1'){
                                schedule = moment(new Date()).format("YYYY-MM-DD hh:mm:ss")
                                status = 'published'
                            } else {
                                schedule = moment(req.body.schedule_time).format("YYYY-MM-DD hh:mm:ss")
                                status = 'scheduled';
                            }
                        
                            let body = {
                                id : utility.generateHash(32),
                                title : req.body.title,
                                send_type :  type,
                                schedule_time : schedule,
                                headline : req.body.headline,
                                sub_headline : req.body.sub_headline,
                                status : status,
                                create_date : moment(new Date()).format("YYYY-MM-DD hh:mm:ss")
                            }

                            pushNotification.addData(body, function(errRes, resData){
                                console.log(errRes)
                                if(errRes){
                                    res.status(200).send(new response(false, 401, 'Insert Failed'))
                                } else {
                                    res.status(200).send(new response(true, 200, 'Insert Succes'))
                                    //  Execute push notif
                                    if(type == 'all_user'){
                                        user.getAllVerified({}, function(errGet, resAllUser){
                                            let newRes = resAllUser.map(user_id =>{
                                                let bodyNotif = {
                                                    id              : utility.generateHash(32),
                                                    sender_id       : '',
                                                    recipient_id    : user_id,
                                                    predicate       : 'create',
                                                    type_id         : body.id,
                                                    type            : 'broadcast',
                                                    seen            : 0,
                                                    create_date     : moment(new Date()).format("YYYY-MM-DD hh:mm:ss"),
                                                    redirect        : 1
                                                }
                                                notification.addData(bodyNotif, function(errNotif, resnotif){
                                                    if(!errNotif){
                                                        //push notif fcm
                                                    } else {
                                                        res.status(200).send(new response(false, 401, 'Insert Failed'))
                                                    }
                                                })
                                                return bodyNotif
                                            })
                                            console.log(newRes);
                                            const content = {
                                                headline : headline,
                                                sub_headline : sub_headline,
                                                type : "broadcast",
                                                id : body.id,
                                                redirect : 0
                                            }
                                            const getDevice = new Promise((resolve, reject) => {
                                                device.getAll(null,function(errRes,tokens) {
                                                    console.log(errRes);
                                                    if(!utility.issetVal(errRes)){
                                                        if(utility.issetVal(tokens)){
                                                            resolve(tokens)
                                                        } else {
                                                            resolve()
                                                        }
                                                    }else {
                                                        resolve()
                                                    }
                                                })
                                                
                                            })
                                            
                                            Promise.all([getDevice]).then(arr => {
                                                // console.log(arr[0])
                                                let requests = "";
                                                if(utility.issetVal(arr[0])){
                                                    if(utility.issetVal(arr[0]['android'])){
                                                        requests = utility.requestFCM("android"
                                                        , firebase.base_url
                                                        , firebase.server_key
                                                        , arr[0]['android']
                                                        , content);
                                                        // console.log('android', request)
                                                        
                                                    }
                                                    if(utility.issetVal(arr[0]['ios'])){
                                                        requests = utility.requestFCM("ios"
                                                        , firebase.base_url
                                                        , firebase.server_key
                                                        , arr[0]['ios']
                                                        , content);
                                                        // console.log('android', request)
                                                    }
                                                }
                                                // Nothing
                                            })
                                        })
                                    } else {
                                        if(utility.issetVal(req.body.interest_list)){
                                            let datInterest = JSON.parse(req.body.interest_list);
                                            console.log(datInterest)
                                            interestArray = []
    
                                            let interests = [];
    
    
                                            datInterest.map(data => {
                                                const bodyInterest = {
                                                    pushnotification_id : body.id,
                                                    interest_id         : data.interest_id,
                                                    create_date         : moment(Date.now()).format('YYYY-MM-DD HH:mm:ss')
                                                }
                                                interestArray.push(bodyInterest);
                                                interests.push(data.interest_id);
                                                
                                            })
                                            // consol
                                            pushNotificationInterest.addData(interestArray, function(err,resData){
                                                alumniIterest.getAllId(interests, function(errInter, resInter){
                                                    console.log({errInter});
                                                        console.log({resInter});
                                                        if(utility.issetVal(resInter)){
                                                            let newRes = resInter.map(user_id =>{
                                                                let bodyNotif = {
                                                                    id              : utility.generateHash(32),
                                                                    sender_id       : '',
                                                                    recipient_id    : user_id,
                                                                    predicate       : 'create',
                                                                    type_id         : body.id,
                                                                    type            : 'broadcast',
                                                                    seen            : 0,
                                                                    create_date     : moment(new Date()).format("YYYY-MM-DD hh:mm:ss"),
                                                                    redirect        : 1
                                                                }
                                                                notification.addData(bodyNotif, function(errNotif, resnotif){
                                                                    if(!errNotif){
                                                                        //push notif fcm
                                                                    } else {
                                                                        // Nothing
                                                                        // res.status(200).send(new response(false, 401, 'Insert Failed'))
                                                                    }
                                                                })
                                                                // return bodyNotif
                                                            })
                                                            const content = {
                                                                headline       : headline, 
                                                                sub_headline   : sub_headline,
                                                                type           : type,
                                                                id             : body.id
                                                            }   
                                                            const getDevice = new Promise((resolve, reject)=>{
                                                                device.getSpesificUser(resInter, function(errRes, tokens){
                                                                    utility.issetVal(tokens) ? resolve(tokens) : resolve(tokens);
                                                                })
                                                            })

                                                            Promise.all([getDevice])
                                                            .then(arr=>{
                                                            //   console.log(arr[0])
                                                            let requests = "";
                                                            if(utility.issetVal(arr[0])){
                                                                if(utility.issetVal(arr[0]['android'])){
                                                                    requests = utility.requestFCM("android"
                                                                            , firebase.base_url
                                                                            , firebase.server_key
                                                                            , arr[0]['android']
                                                                            , content);
                                                                    console.log('android', requests)
                                                                    
                                                                }
                                                                if(utility.issetVal(arr[0]['ios'])){
                                                                    requests = utility.requestFCM("ios"
                                                                            , firebase.base_url
                                                                            , firebase.server_key
                                                                            , arr[0]['ios']
                                                                            , content);
                                                                    console.log('ios', requests)
                                                                }
                                                            }
                                                            
                                                            // Nothing Return

                                                            // res
                                                            // .status(200)
                                                            // .send(new response(true, 200, 'Fetch Success'))
                                                            })
                                                        } else {
                                                        //    Nothing Return
                                                        // res.status(200).send(new response(false, 401, 'Insert Failed'))
                                                        }
                                                })
                                            }) 
                                        } else {
                                            console.log('Req.body.interest tidak ada');
                                        }
                                    }
                                    
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

exports.getListBroadcast = async(req, res)=>{
    console.log('Get List Broadcast')
    try {
        const middleware = {
            user_id     : 'required|text|' + req.body.user_id,
            auth_code   : 'required|text|' + req.body.auth_code,
            keyword     : 'no|text|'+req.body.keyword,
            status      : 'no|text|'+req.body.status,
            send_to     : 'no|text|'+req.body.send_to
        }
        if(utility.validateRequest(middleware)){
            await admin.getAuth(req.body, function(errAuth, resAuth) {
                if(!errAuth){
                    if (!utility.issetVal(resAuth)) {
                        res.status(200).send(new response(false, 403, 'Unauthorized'))
                      } else {
                        if (resAuth.auth_code == req.body.auth_code) { 
                            // console.log('Masuk sini mas')
                            let bodyCount = {
                                keyword : req.body.keyword,
                                status  : req.body.status,
                                send_to : req.body.send_to
                            }
                            pushNotification.getCountData(bodyCount,function(error, resGetCount){
                                // console.log({error : error})
                                // console.log({resGetCount : resGetCount})

                                let itemPerRequest = utility.issetVal(req.body.item)? parseInt(req.body.item) : 15;
                                let page = req.body.page || 1;
                                let total_data =  resGetCount;
                                let total_page = Math.ceil(total_data / itemPerRequest);
                    
                                let limitBefore = page <= 1 || page == null ? 0 : (page-1) * itemPerRequest;
                    
                                const PreparedData = {
                                    start  : limitBefore,
                                    limit  : itemPerRequest,
                                    keyword: req.body.keyword,
                                    status : req.body.status,
                                    send_to: req.body.send_to
                                }
                                console.log(PreparedData)

                                if(resGetCount){

                                    pushNotification.getAll(PreparedData, function (errRes, resGetAll){
                                        console.log('Get All')
                                        console.log({resGetAll : resGetAll})
                                        console.log({errRes : errRes})

                                        if(utility.issetVal(resGetAll)){
                                            const totalInfo = {
                                            total_page : total_page,
                                            total_data_all : total_data,
                                            total_data : resGetAll.length
                                            }
                                            res.status(200).send(new response(true, 200, 'Fetch Success', {
                                                data :resGetAll,
                                                total: totalInfo
                                            } ))
                                            
                                        } else {
                                            res.status(200).send(new response(false, 401, 'Fetch Failed'))
                                        }

                                    })

                                } else {
                                    res.status(200).send(
                                        new response(false, 401, 'Fetch Failed2')
                                    )
                                }
                            })
                        } else {
                            res.status(200).send(new response(false, 403, 'Unauthorized2'))
                        }
                      }
                } else {
                    res.status(200).send(
                      new response(false, 403, 'Unauthorized1')
                    )
                }
            })
        } else {
            res.status(200).send(
                new response(false, 400, 'Invalid input format')
            )
        }
    } catch (e) {
        console.log({e});
        res.status(500).send(
          new response(false, 500, 'Something went wrong')
        )
    }
}

exports.getDetailBroadcast = async (req, res)=>{
    console.log('Get Detail Broadcast')
    try {
        const middleware = {
            user_id     : 'required|text|' + req.body.user_id,
            auth_code   : 'required|text|' + req.body.auth_code,
            id          : 'required|text|' + req.body.id,
        }
        if(utility.validateRequest(middleware)){
            await admin.getAuth(req.body, function(errAuth, resAuth) {
                if(!errAuth){
                    if (!utility.issetVal(resAuth)) {
                        res.status(200).send(new response(false, 403, 'Unauthorized'))
                      } else {
                        if (resAuth.auth_code == req.body.auth_code) { 
                            console.log('Masuk sini mas')
                            
                            pushNotification.getById(req.body, function (errRes, resData){
                                if (resData) {
                                    res.status(200).send(new response(true, 200, 'Fetch Succes',resData))
                                  } else {
                                    res.status(200).send(new response(false, 401, 'Fetch Failed'))
                                  }
                            })

                        } else {
                            res.status(200).send(new response(false, 403, 'Unauthorized2'))
                        }
                      }
                } else {
                    res.status(200).send(
                      new response(false, 403, 'Unauthorized1')
                    )
                }
            })
        } else {
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

exports.deleteBroadcast = async (req, res) => {
    console.log('Delete Broadcast')
    try {
        const middleware = {
            user_id     : 'required|text|' + req.body.user_id,
            auth_code   : 'required|text|' + req.body.auth_code,
            id          : 'required|text|' + req.body.id,
        }
        if(utility.validateRequest(middleware)){
            await admin.getAuth(req.body, function(errAuth, resAuth) {
                if(!errAuth){
                    if (!utility.issetVal(resAuth)) {
                        res.status(200).send(new response(false, 403, 'Unauthorized'))
                      } else {
                        if (resAuth.auth_code == req.body.auth_code) { 
                            console.log('Masuk sini mas')
                            
                            pushNotification.deleteData(req.body, function (errRes, resData){
                                if (resData) {
                                    res.status(200).send(new response(true, 200, 'Delete Succes',resData))
                                  } else {
                                    res.status(200).send(new response(false, 401, 'Delete Failed'))
                                  }
                            })

                        } else {
                            res.status(200).send(new response(false, 403, 'Unauthorized2'))
                        }
                      }
                } else {
                    res.status(200).send(
                      new response(false, 403, 'Unauthorized1')
                    )
                }
            })
        } else {
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