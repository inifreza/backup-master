var post = require('../models/post')
var postPolling = require('../models/postPolling')
var postResponse = require('../models/mPollingResponse')
var postLikes = require('../models/postLikes')
var postComments = require('../models/postComments')
const postImages = require('../models/postImages')
var user = require('../models/user')

var admin = require('../models/admin')
let response = require('../../helpers/response')
const utility = require('../../helpers/utility')
const nodemailer = require('../../helpers/mail_adapter');
let moment = require('moment')
const formidable = require('formidable')
const path = require('path');
const fs = require('fs');
let _ = require('lodash');

let appDir = path.dirname(require.main.filename);
let pathDir = appDir + '/uploads/post/'

// model 
const postInterest = require('../models/postInterest')
const postReport = require('../models/postReport')
const postRemoved = require('../models/postRemoved')
const alumniInterest  = require('../models/AT_AlumniInterest')
const notification    = require('../models/notification')
const device          = require('../models/device')

//setting fcm
const globals = require('../../configs/global')
const { config } = require('../../default')
let {firebase} = globals[config.environment];

exports.insert = async (req, res) => {
    try {
      let IdInterests = JSON.parse(req.body.interest_list).map(({interest_id}) => interest_id)
      console.log({IdInterests});
        const middleware = {
            user_id         : 'required|text|'+req.body.user_id,
            auth_code       : 'required|text|'+req.body.auth_code,
            content         : 'required|text|'+req.body.content,
            type            : 'required|text|'+req.body.type,
            notes           : 'no|text|'+req.body.notes,
            featured        : 'required|number|'+req.body.featured,
            publish         : 'required|number|'+req.body.publish,
            youtube         : 'no|number|'+req.body.youtube,
            publish_date    : 'no|text|'+req.body.publish_date,
            end_date        : 'no|text|'+req.body.end_date
        }
        if(utility.validateRequest(middleware)){
            const middlewarePolling = {
                polling_list         : 'required|text|'+req.body.polling_list,
            }
            if(req.body.type == "polling"){
                if(!utility.validateRequest(middlewarePolling)){
                    res.status(200).send(
                        new response(false, 400, 'Invalid input format', middlewarePolling)
                    )
                    return false;
                }
            } 
            const result = await admin.getAuth(req.body,function(errAuth,resAuth){
                if(!errAuth){
                    if(!utility.issetVal(resAuth)){
                        res.status(200).send(
                        new response(false, 403, 'Unauthorized')
                        )
                    }else{
                        if(resAuth.auth_code == req.body.auth_code){
                            //here goes the function
                            post.checkFeatured({type : req.body.type, featured: '1'}, function(err,resData) {
                                // console.log(resData);
                                let rrFeatured;
                                if(req.body.featured ==  '1'){
                                    if(resData >= 3){
                                        rrFeatured = false;
                                    } else {
                                        rrFeatured = true;
                                    }
                                } else {
                                    rrFeatured = true;
                                }
                                if(!rrFeatured){
                                    res.status(200).send(
                                        new response(false, 402, 'Featured Post maximal 3 Data')
                                    )
                                } else {
                                    const body = {
                                        id              : utility.generateHash(32),
                                        content         : req.body.content,
                                        user_id         : req.body.user_id,
                                        type            : req.body.type,
                                        notes           : utility.issetVal(req.body.notes) ?  req.body.notes : '',
                                        featured        : req.body.featured,
                                        publish         : req.body.publish,
                                        youtube         : utility.issetVal(req.body.youtube) ?  req.body.youtube : '',
                                        user_type       : 'admin',
                                        create_date     : moment(Date.now()).format('YYYY-MM-DD HH:mm:ss')
                                    }
                                    if(utility.issetVal(req.body.publish_date)){
                                        body.publish_date  = moment(req.body.publish_date).format('YYYY-MM-DD HH:mm:ss');
                                    }else {
                                        body.publish_date  = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');
                                    }
                                    if(body.type == 'polling'){
                                      body.end_date = moment(req.body.end_date).format('YYYY-MM-DD HH:mm:ss');
                                    }
        
                                    post.addData(body, function(err,resData) {
                                        // console.log(err)
                                        if (!err) {
                                            if(body.type == 'polling'){
                                                let datPolling = JSON.parse(req.body.polling_list);
                                                // console.log(datPolling.length);

                                                for(let idx = 0; idx <  datPolling.length; idx++) {
                                                    let object =  datPolling[idx];
                                                    // console.log({idx : object});

                                                    const bodyPolling = {
                                                        id          : utility.generateHash(32),
                                                        post_id     : body.id,
                                                        title       : object.title,
                                                        sort        : object.sort,
                                                        create_date : moment(Date.now()).format('YYYY-MM-DD HH:mm:ss')
                                                    }
                                                    
                                                    postPolling.addData(bodyPolling, function(err,resData){
                                                        // console.log({idx : resData });
                                                    }) 
                                                }
                                            }

                                            if(utility.issetVal(req.body.interest_list)){
                                                let datInterest = JSON.parse(req.body.interest_list);
                                                for(let idx = 0; idx <  datInterest.length; idx++) {
                                                    let object =  datInterest[idx];
                                                    console.log({idx : object});

                                                    const bodyInterest = {
                                                        post_id     : body.id,
                                                        interest_id : object.interest_id,
                                                        create_date : moment(Date.now()).format('YYYY-MM-DD HH:mm:ss')
                                                    }
                                                    console.log({bodyInterest});
                                                    postInterest.addData(bodyInterest, function(err,resData){
                                                      console.log({'postInterest Error' : err});
                                                        // console.log({idx : resData });
                                                    })  
                                                }
                                            }
                                            // setting push notif
                                            alumniInterest.getAllId(IdInterests, function(errInter, userData){
                                              console.log({errInter});
                                              console.log({userData});
                                              if(utility.issetVal(userData)){
                                                  let tNotif = userData.map(id =>{
                                                      let bodyNotif = {
                                                          id              : utility.generateHash(32),
                                                          sender_id       : null,
                                                          recipient_id    : id,
                                                          predicate       : 'create',
                                                          type_id         : body.id,
                                                          type            : 'post',
                                                          seen            : 0,
                                                          create_date     : moment(new Date()).format("YYYY-MM-DD hh:mm:ss"),
                                                          redirect        : 1
                                                      }
                                                      notification.addData(bodyNotif, function(errNotif, resNotif){
                                                      
                                                      }) 
                                                  })
                                                  const content = {
                                                      headline      : 'New Post',
                                                      sub_headline  : utility.htmlConvertString(req.body.content),
                                                      type          : 'post',
                                                      redirect      : true,
                                                      id            : body.id
                                                  }
                                                  const getDevice = new Promise((resolve, reject)=>{
                                                      device.getSpesificUser(userData, function(errRes, tokens){
                                                          console.log(tokens);
                                                          utility.issetVal(tokens) ? resolve(tokens) : resolve(tokens);
                                                      })
                                                  })
                                                  Promise.all([getDevice])
                                                  .then(arr=>{
                                                      console.log(arr[0]);
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
                                                  })
                                              }
                                            })

                                            res
                                            .status(200)
                                            .send(new response(true, 200, 'Insert Data Success', {post_id : body.id}))
                                        } else {
                                            res.status(200).send(
                                                new response(false, 400, 'Insert Data failed')
                                            )
                                        }
                                    })

                                }
                            });
                            
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

exports.getAll = async (req, res) => {
    try{
      const middleware = {
        user_id              : 'required|text|'+req.body.user_id,
        auth_code            : 'required|text|'+req.body.auth_code,
        type                 : 'required|text|'+req.body.type,
        post      : 'no|text|'+req.body.post,
        posted_by       : 'no|text|'+req.body.posted_by,
        create_date          : 'no|text|'+req.body.create_date,
        sort                 : 'no|number|'+req.body.sort
      }
      console.log(req.body);
      if(utility.validateRequest(middleware)){
       
        const result = await admin.getAuth(req.body,function(errAuth,resAuth){
            // console.log(errAuth);
          if(!errAuth){
            if(!utility.issetVal(resAuth)){
                res.status(200).send(
                    new response(false, 403, 'Unauthorized')
                )
            }else{
                if(resAuth.auth_code == req.body.auth_code){
                    //here goes the function
                    let arrayDatas = [];
                    let arrayData = {};
                

                    let promiseList = new Promise(function(resolve, reject) {
                      let bodyCount = {
                        type                 : req.body.type,
                        removed              : 0,
                        post                 : req.body.post,
                        posted_by            : req.body.posted_by,
                        create_date          : req.body.create_date,
                        sort                 : req.body.sort
                      }
                        post.getCountData(bodyCount,function(errResCount,rowsResCount) {
                          // console.log(rowsResCount);
                          if (!errResCount) {
                              if (utility.issetVal(rowsResCount)) {
                                  let itemPerRequest = utility.issetVal(req.body.item)?  parseInt(req.body.item) : 15;
                                  let page = req.body.page;
                                  let total_data =  rowsResCount;
                                  let total_page = Math.ceil(total_data / itemPerRequest);
              
                                  let limitBefore = page <= 1 || page == null ? 0 : (page-1) * itemPerRequest;
              
                                  const PreparedData = {
                                      start                : limitBefore,
                                      limit                : itemPerRequest,
                                      type                 : req.body.type,
                                      removed              : 0,
                                      post                 : req.body.post,
                                      posted_by            : req.body.posted_by,
                                      create_date          : req.body.create_date,
                                      sort                 : req.body.sort
                                  }

                                  post.getAll(PreparedData,function(errRes,rowsRes) {
                                      // console.log(rowsRes);
                                      if (!errRes) {
                                      const totalInfo = {
                                          total_page : total_page,
                                          total_data_all : total_data,
                                          total_data : rowsRes.length
                                      }
                                        if (rowsRes !='') {
                                            const arrayRows = {
                                                data :rowsRes,
                                                total: totalInfo
                                            }
                                            resolve(arrayRows);
                                            
                                        } else {
                                          resolve();
                                        }
                                      }else {
                                        resolve();
                                      }
                                  })
                              } else {
                                resolve();
                              }
                          } else {
                            resolve();
                          }
                        })
                    });

                    let promiseComments = new Promise(function(resolve, reject) {
                        postComments.getAllByPost({post_id :  null}, (errRes,resData) => {
                            if(!errRes){
                                if(utility.issetVal(resData)){
                                    resolve(resData);
                                } else {
                                  resolve();
                                }
                            } else {
                              resolve();
                            }
                        });
                    });
                    
                    
                    let promiseLikes = new Promise(function(resolve, reject) {
                        postLikes.getAllByPost({post_id :  null}, (errRes,resData) => {
                            if(!errRes){
                                if(utility.issetVal(resData)){
                                    resolve(resData);
                                } else {
                                    resolve();
                                }
                            } else {
                                resolve();
                            }
                        });
                    });

                    let promiseUser = new Promise(function(resolve, reject) {
                        user.getData(null, (errRes,resData) => {
                            if(!errRes){
                                if(utility.issetVal(resData)){
                                    resolve(resData);
                                } else {
                                    resolve();
                                }
                            } else {
                                resolve();
                            }
                        });
                    });

                    let promiseAdmin = new Promise(function(resolve, reject) {
                         admin.getData(null, (errRes,resData) => {
                            if(!errRes){
                                if(utility.issetVal(resData)){
                                    resolve(resData);
                                } else {
                                    resolve();
                                }
                            } else {
                                resolve();
                            }
                        });
                    });

                    Promise.all([promiseList, promiseComments, promiseLikes, promiseAdmin, promiseUser]).then(arr => {
                        if(utility.issetVal(arr[0])){
                            
                            arrayPost      = arr[0];
                            // console.log(arrayPost);
                            arrayComments   = arr[1];
                            // console.log(arrayComments);
                            arrayLike       = arr[2];
                            // console.log(arrayLike);
                            arrayUser       = arr[3];
                            // console.log(arrayUser);
                            arrayAdmin      = arr[4];
                            // console.log(arrayAdmin);
                            arrayData.data  = []
                            dataHashtag     = [];
                            for (var i = 0; i < arrayPost.data.length; i++) {
                        
                                if(utility.issetVal(arrayComments)){
                                    let arg = _.map(arrayComments, function(o) {
                                        if (o.post_id == arrayPost.data[i].id) return o;
                                    });
                                    
                                    // Remove undefines from the array
                                    arg = _.without(arg, undefined)
                                    arrayPost.data[i].comment = arg.length;
                                }
        
                                if(utility.issetVal(arrayLike)){
                                    let arg = _.map(arrayLike, function(o) {
                                        if (o.post_id == arrayPost.data[i].id) return o;
                                    });
                                    
                                    // Remove undefines from the array
                                    arg = _.without(arg, undefined)
                                    arrayPost.data[i].like = arg.length;
                                }


                                arrayPost.data[i].username = null;
                                if(arrayPost.data[i].user_type = 'admin'){
                                    var arg = _.find(arrayAdmin, ['id', arrayPost.data[i].user_id]);
                                    let username = '';
                                    let img = '';
                                    if(_.isObject(arg)){
                                        arrayPost.data[i].username = arg.name
                                    }
                                }

                                if(arrayPost.data[i].user_type = 'user'){
                                    var arg = _.find(arrayUser, ['id', arrayPost.data[i].user_id]);
                                    let username = '';
                                    let img = '';
                                    if(_.isObject(arg)){
                                        arrayPost.data[i].username = arg.name
                                    }
                                }
                            }
                            switch (req.body.sort) {
                              case '1':
                                arrayPost.data = _.orderBy(arrayPost.data, [
                                  function (item) { return item.featured; },
                                  function (item) { return item.comment; }
                                ], ["desc", "asc"])
                                break;
                              case '2':
                                arrayPost.data = _.orderBy(arrayPost.data, [
                                  function (item) { return item.featured; },
                                  function (item) { return item.comment; }
                                ], ["desc", "desc"])
                                break;  
                              case '3':
                                arrayPost.data = _.orderBy(arrayPost.data,  [
                                  function (item) { return item.featured; },
                                  function (item) { return item.like; }
                                ], ["desc", "asc"])
                                break;
                              case '4':
                                arrayPost.data = _.orderBy(arrayPost.data,  [
                                  function (item) { return item.featured; },
                                  function (item) { return item.like; }
                                ], ["desc", "desc"])
                                break;
                              default:
                                arrayPost.data = _.orderBy(arrayPost.data, [
                                  function (item) { return item.featured; },
                                  function (item) { return item.create_date; }
                                ], ["desc", "desc"])
                                break;

                            }

                            arrayData.data  = arrayPost.data;
                            arrayData.total = arrayPost.total;
                            // arrayData.post.push(arrayPost);
                            res.status(200).send(new response(true, 200, 'Fetch Success',arrayData))
                        } else {
                          res.status(200).send(
                            new response(false, 401, 'Fetch Failed')
                          )
                        }
                       
                    }).catch( err => {
                        console.log(err);
                        res.status(200).send(
                            new response(false, 401, 'Fetch Failed', err)
                        )
                    } );
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

exports.getOption = async (req, res) => {
    try{
      const middleware = {
        user_id      : 'required|text|'+req.body.user_id,
        auth_code    : 'required|text|'+req.body.auth_code,
      }
      // console.log(middleware);
      if(utility.validateRequest(middleware)){
       
        const result = await admin.getAuth(req.body,function(errAuth,resAuth){
            // console.log(errAuth);
          if(!errAuth){
            if(!utility.issetVal(resAuth)){
                res.status(200).send(
                    new response(false, 403, 'Unauthorized')
                )
            }else{
                if(resAuth.auth_code == req.body.auth_code){
                    post.getData({type : 'post', removed : 0}, (errRes,resData) => {
                        // console.log(errRes)
                        if (!errRes) {
                            if(utility.issetVal(resData)){
                                res.status(200).send(new response(true, 200, 'Fetch Success', resData))
                            } else {
                                res.status(200).send(
                                    new response(false, 401, 'Fetch Failed2')
                                )
                            }
                        }else {
                            res.status(200).send(
                                new response(false, 401, 'Fetch Failed1')
                            )
                        }
                    });
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

exports.deleteSoft = async (req, res) => {
  try {
    const middleware = {
      user_id      : 'required|text|'+req.body.user_id,
      auth_code    : 'required|text|'+req.body.auth_code,
      id           : 'required|text|'+req.body.id,
      type         : 'required|text|'+req.body.type,
      reason       : 'no|text|'+req.body.reason,
    }
    if(utility.validateRequest(middleware)){
      const result = await admin.getAuth(req.body,function(errAuth,resAuth){
        // console.log(errAuth);
        if(!errAuth){
          if(!utility.issetVal(resAuth)){
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
              

                post.getById(body, function(errGet,resGet) {
                    // console.log(errGet);

                    if (!errGet) {
                        if(!utility.issetVal(resGet)){
                            res.status(200).send(
                                new response(false, 404, 'Data not exist')
                            )
                        }else{
                            let removed = {
                              post_id : req.body.id,
                              user_id : req.body.user_id,
                              reason  : req.body.reason,
                              type    : req.body.type,
                            }
                            postRemoved.addData(removed, function(errAdd, resAdd){
                              if(!utility.issetVal(errAdd)){
                                post.deleteData(body, function(err,resData) {
                                  // caches
                                  if (!err) {
                                      // postPolling.getByPostId(body, function(errSub,resDataSub) {
                                      //     if(!errSub){
                                      //         if(utility.issetVal(resDataSub)){
                                      //             postPolling.deleteByPostId(body, function(err,resData) {
                                      //                 console.log(resData);
                                      //             });
                                      //         }
                                      //     }
                                          
                                      // });

                                      notification.deleteByTypeId({id : req.body.id}, (err,resData) => {
                                        console.log('err', err);
                                        console.log('resData', resData);
                                      });

                                      res.status(200).send(new response(true, 200, 'Delete success'))
                                  } else {
                                      res.status(200).send(
                                          new response(false, 401, 'Delete failed')
                                      )
                                  }
                                })
                              } else {
                                // error, id post/ user harus unique
                                res
                                .status(200)
                                .send(new response(false, 401, 'Delete Failed'))
                              }
                            })
                          
                          
                        }
                    } else {
                    res.status(200).send(
                        new response(false, 404, 'Data not exist')
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
            new response(false, 403, 'Unauthorized1')
          )
        }
      })
    }else{
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

exports.deletePermanent = async (req, res) => {
  try {
    const middleware = {
      user_id      : 'required|text|'+req.query.user_id,
      auth_code    : 'required|text|'+req.query.auth_code,
      id           : 'required|text|'+req.query.id,
    }
    if(utility.validateRequest(middleware)){
      const result = await admin.getAuth(req.query,function(errAuth,resAuth){
        console.log(errAuth);
        if(!errAuth){
          if(!utility.issetVal(resAuth)){
            res.status(200).send(
            new response(false, 403, 'Unauthorized')
          )}else{
            if(resAuth.auth_code == req.query.auth_code){
                //here goes the function
                const body = {
                    user_id : req.query.user_id,
                    auth_code : req.query.auth_code,
                    id : req.query.id
                }
              

                postRemoved.getById(body, function(errGet,resGet) {
                    console.log(resGet);

                    if (!errGet) {
                        if(!utility.issetVal(resGet)){
                            res.status(200).send(
                                new response(false, 404, 'Data not exist')
                            )
                        }else{
                            let removed = {
                              id : req.query.id,
                            }
                            postRemoved.deleteData(removed, function(errAdd, resAdd){
                              if(!utility.issetVal(errAdd)){
                                let postBody = {
                                  id : resGet.post_id
                                }
                                post.deletePermanent(postBody, function(err,resData) {
                                  // caches
                                  if (!err) {
                                      postPolling.getByPostId(postBody, function(errSub,resDataSub) {
                                          if(!errSub){
                                              if(utility.issetVal(resDataSub)){
                                                  postPolling.deleteByPostId(postBody, function(err,resData) {
                                                      console.log(resData);
                                                  });
                                              }
                                          }
                                          
                                      });

                                      res.status(200).send(new response(true, 200, 'Delete success'))
                                  } else {
                                      res.status(200).send(
                                          new response(false, 401, 'Delete failed')
                                      )
                                  }
                                })
                              } else {
                                // error, id post/ user harus unique
                                res
                                .status(200)
                                .send(new response(false, 401, 'Delete Failed'))
                              }
                            })
                          
                          
                        }
                    } else {
                    res.status(200).send(
                        new response(false, 404, 'Data not exist')
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
            new response(false, 403, 'Unauthorized1')
          )
        }
      })
    }else{
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

exports.update = async (req, res) => {
    try {
        const middleware = {
            user_id         : 'required|text|'+req.body.user_id,
            auth_code       : 'required|text|'+req.body.auth_code,
            id              : 'required|text|'+req.body.id,
            content         : 'required|text|'+req.body.content,
            type            : 'required|text|'+req.body.type,
            notes           : 'no|text|'+req.body.notes,
            featured        : 'required|number|'+req.body.featured,
            publish         : 'required|number|'+req.body.publish,
            publish_date    : 'no|text|'+req.body.publish_date,
            end_date        : 'no|text|'+req.body.end_date,
            youtube         : 'no|text|'+req.body.youtube
        }
        if(utility.validateRequest(middleware)){
            const middlewarePolling = {
                polling_list         : 'required|text|'+req.body.polling_list,
            }
            if(req.body.type == "polling"){
                if(!utility.validateRequest(middlewarePolling)){
                    res.status(200).send(
                        new response(false, 400, 'Invalid input format', middlewarePolling)
                    )
                    return false;
                }
            } 
            const result = await admin.getAuth(req.body,function(errAuth,resAuth){
                if(!errAuth){
                     if(!utility.issetVal(resAuth)){
                        res.status(200).send(
                        new response(false, 403, 'Unauthorized')
                        )
                    }else{
                        if(resAuth.auth_code == req.body.auth_code){
                            //here goes the function
                            post.getById(req.body, (err, resPost) => {
                              console.log(resPost)
                              if (resPost.featured == '1') {
                                
                                const body = {
                                  id              : req.body.id,
                                  content         : req.body.content,
                                  interest_id     : req.body.interest_id,
                                  type            : req.body.type,
                                  notes           : utility.issetVal(req.body.notes) ?  req.body.notes : '',
                                  youtube         : utility.issetVal(req.body.youtube) ?  req.body.youtube : '',
                                  featured        : req.body.featured,
                                  publish         : req.body.publish
                              }
                              if(body.type == 'polling'){
                                body.end_date = moment(req.body.end_date).format('YYYY-MM-DD HH:mm:ss');
                              }

                              if(utility.issetVal(req.body.publish_date)){
                                  body.publish_date  = moment(req.body.publish_date).format('YYYY-MM-DD HH:mm:ss');
                              }
  
                              post.updateData(body, function(err,resData) {
                                  // console.log(err)
                                  if (!err) {
                                      if(body.type == 'polling'){
                                          let datPolling = JSON.parse(req.body.polling_list);
                                          // console.log(datPolling.length);

                                          for(let idx = 0; idx <  datPolling.length; idx++) {
                                              let object =  datPolling[idx];
                                              if(!utility.issetVal(object.id)){
                                                  const iBodyPolling = {
                                                      id          : utility.generateHash(32),
                                                      post_id     : body.id,
                                                      title       : object.title,
                                                      sort        : object.sort,
                                                      create_date : moment(Date.now()).format('YYYY-MM-DD HH:mm:ss')
                                                  }
                                                  
                                                  postPolling.addData(iBodyPolling, function(err,resData){
                                                      // console.log({indexInsert : resData });
                                                  }) 
                                                  // console.log('indexInsert')
                                              } else {
                                                  // console.log('indexUpdate')
                                                  const uBodyPolling = {
                                                      id          : object.id,
                                                      post_id     : body.id,
                                                      title       : object.title,
                                                      sort        : object.sort
                                                  }
                                                  
                                                  postPolling.updateData(uBodyPolling, function(err,resData){
                                                      // console.log({indexUpdate : resData });
                                                  }) 

                                              }
                                          }
                                      }

                                      

                                      if(utility.issetVal(req.body.interest_list)){
                                          let datInterest = JSON.parse(req.body.interest_list);
                                          postInterest.deleteByPostId({id :body.id}, function(err,resData){
                                          }) 
                                          for(let idx = 0; idx <  datInterest.length; idx++) {
                                              let object =  datInterest[idx];
                                              // console.log({hahah : object});

                                              const bodyInterest = {
                                                  post_id     : body.id,
                                                  interest_id : object.interest_id,
                                                  create_date : moment(Date.now()).format('YYYY-MM-DD HH:mm:ss')
                                              }
                                              
                                              postInterest.addData(bodyInterest, function(err,resData){
                                                  // console.log({idx : resData });
                                              }) 
                                          }
                                      }
                                      res.status(200).send(new response(true, 200, 'Update Data success'))
                                  } else {
                                      res.status(200).send(
                                          new response(false, 400, 'Update Data failed')
                                      )
                                  }
                              })

                              } else {
                                post.checkFeatured({type : resPost.type, featured: '1', removed: '0', publish: '1' }, function(err,resData) {
                                  console.log(resData);
                                  let rrFeatured;
                                  if(req.body.featured ==  '1'){
                                      if(resData >= 3){
                                          rrFeatured = false;
                                      } else {
                                          rrFeatured = true;
                                      }
                                  } else {
                                      rrFeatured = true;
                                  }
                                  if(!rrFeatured){
                                      res.status(200).send(
                                          new response(false, 402, 'Featured Post maximal 3 Data')
                                      )
                                  } else {
                                      
                                    const body = {
                                      id              : req.body.id,
                                      content         : req.body.content,
                                      interest_id     : req.body.interest_id,
                                      type            : req.body.type,
                                      notes           : utility.issetVal(req.body.notes) ?  req.body.notes : '',
                                      youtube         : utility.issetVal(req.body.youtube) ?  req.body.youtube : '',
                                      featured        : req.body.featured,
                                      publish         : req.body.publish
                                  }
                                  if(body.type == 'polling'){
                                    body.end_date = moment(req.body.end_date).format('YYYY-MM-DD HH:mm:ss');
                                  }
    
                                  if(utility.issetVal(req.body.publish_date)){
                                      body.publish_date  = moment(req.body.publish_date).format('YYYY-MM-DD HH:mm:ss');
                                  }
      
                                  post.updateData(body, function(err,resData) {
                                      // console.log(err)
                                      if (!err) {
                                          if(body.type == 'polling'){
                                              let datPolling = JSON.parse(req.body.polling_list);
                                              // console.log(datPolling.length);
    
                                              for(let idx = 0; idx <  datPolling.length; idx++) {
                                                  let object =  datPolling[idx];
                                                  if(!utility.issetVal(object.id)){
                                                      const iBodyPolling = {
                                                          id          : utility.generateHash(32),
                                                          post_id     : body.id,
                                                          title       : object.title,
                                                          sort        : object.sort,
                                                          create_date : moment(Date.now()).format('YYYY-MM-DD HH:mm:ss')
                                                      }
                                                      
                                                      postPolling.addData(iBodyPolling, function(err,resData){
                                                          // console.log({indexInsert : resData });
                                                      }) 
                                                      // console.log('indexInsert')
                                                  } else {
                                                      // console.log('indexUpdate')
                                                      const uBodyPolling = {
                                                          id          : object.id,
                                                          post_id     : body.id,
                                                          title       : object.title,
                                                          sort        : object.sort
                                                      }
                                                      
                                                      postPolling.updateData(uBodyPolling, function(err,resData){
                                                          // console.log({indexUpdate : resData });
                                                      }) 
    
                                                  }
                                              }
                                          }
    
                                          
    
                                          if(utility.issetVal(req.body.interest_list)){
                                              let datInterest = JSON.parse(req.body.interest_list);
                                              postInterest.deleteByPostId({id :body.id}, function(err,resData){
                                              }) 
                                              for(let idx = 0; idx <  datInterest.length; idx++) {
                                                  let object =  datInterest[idx];
                                                  // console.log({hahah : object});
    
                                                  const bodyInterest = {
                                                      post_id     : body.id,
                                                      interest_id : object.interest_id,
                                                      create_date : moment(Date.now()).format('YYYY-MM-DD HH:mm:ss')
                                                  }
                                                  
                                                  postInterest.addData(bodyInterest, function(err,resData){
                                                      // console.log({idx : resData });
                                                  }) 
                                              }
                                          }
                                          res.status(200).send(new response(true, 200, 'Update Data success'))
                                      } else {
                                          res.status(200).send(
                                              new response(false, 400, 'Update Data failed')
                                          )
                                      }
                                  })
                                  }
                              });
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

exports.getDetail = async (req, res) => {
    try{
        const middleware = {
            user_id         : 'required|text|'+req.body.user_id,
            auth_code       : 'required|text|'+req.body.auth_code,
            id           : 'required|text|'+req.body.id,
        }
        // console.log(middleware);
        if(utility.validateRequest(middleware)){
            const result = await admin.getAuth(req.body,function(errAuth,resAuth){
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
                                id : req.body.id,
                            }

                            post.getById(body,function(errRes,resData) {
                                if (!errRes) {
                                    if (utility.issetVal(resData)) {
                                        let arrayDatas = [];
                                        let arrayData = {};
                                        arrayData = resData;
                                        // console.log(arrayData);

                                        let promisePolling = new Promise(function(resolve, reject) {
                                            postPolling.getByPostId(body, (errRes,resPolling) => {
                                                if(!errRes){
                                                    if(utility.issetVal(resPolling)){
                                                        resolve(resPolling);
                                                    } else {
                                                      resolve();
                                                    }
                                                } else {
                                                  resolve();
                                                }
                                            });
                                        });
                                        
                                        let promiseInterest = new Promise(function(resolve, reject) {
                                            postInterest.getData({post_id : body.id}, (err, resData) =>{
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

                                        let promiseImages = new Promise(function(resolve, reject) {
                                          postImages.getData({id : body.id}, (err, resData) =>{
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

                                       
                                        
                                        
                                      
                                        
                                        Promise.all([promisePolling, promiseInterest, promiseImages]).then(arr => {
                                            // console.log({'a' : arr[2]})
                                            // arrayData.polling = [];
                                            if(utility.issetVal(arr[0])){
                                                arrayData.polling = arr[0]                                            
                                            } else {
                                                arrayData.polling = null;
                                            } 

                                            if(utility.issetVal(arr[1])){
                                                arrayData.interest = arr[1];
                                            } else {
                                                arrayData.interest = null;
                                            }

                                            if(utility.issetVal(arr[2])){
                                              arrayData.images = arr[2];
                                            } else {
                                              arrayData.images = null;
                                            }
                                            
                                            res.status(200).send(new response(true, 200, 'Fetch success', arrayData))
                                        }).catch( err => {
                                            return err;
                                        } );
                                    } else {
                                        res.status(200).send(
                                            new response(false, 401, 'Fetch Failed')
                                        )
                                    }
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


exports.getAllByHashtag = async (req, res) => {
    try{
      const middleware = {
        user_id      : 'required|text|'+req.body.user_id,
        auth_code    : 'required|text|'+req.body.auth_code,
        hashtag_id   : 'required|text|'+req.body.hashtag_id
      }
      // console.log(middleware);
      if(utility.validateRequest(middleware)){
        const result = await admin.getAuth(req.body,function(errAuth,resAuth){
            console.log(errAuth);
            if(!errAuth){
                if(!utility.issetVal(resAuth)){
                    res.status(200).send(
                        new response(false, 403, 'Unauthorized')
                    )
                }else{
                    if(resAuth.auth_code == req.body.auth_code){
                        //here goes the function
                        const body = {
                            hashtag_id  : req.body.hashtag_id,
                        }
                        post.getCountHashtag(body,function(errResCount,rowsResCount) {
                            console.log(errResCount);
                            if (!errResCount) {
                               if (utility.issetVal(rowsResCount)) {
                                    let itemPerRequest = utility.issetVal(req.body.item)?  parseInt(req.body.item) : 15;
                                    let page = req.body.page;
                                    let total_data =  rowsResCount;
                                    let total_page = Math.ceil(total_data / itemPerRequest);
                
                                    let limitBefore = page <= 1 || page == null ? 0 : (page-1) * itemPerRequest;
                
                                    const PreparedData = {
                                        start       : limitBefore,
                                        limit       : itemPerRequest,
                                        hashtag_id  : req.body.hashtag_id,
                                    }
                
                                    post.getAllHashtag(PreparedData,function(errRes,rowsRes) {
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


// Delete Polling
exports.deleteOption = async (req, res) => {
    try {
      const middleware = {
        user_id      : 'required|text|'+req.query.user_id,
        auth_code    : 'required|text|'+req.query.auth_code,
        polling_id   : 'required|text|'+req.query.polling_id,
        post_id           : 'required|text|'+req.query.post_id,
      }
      if(utility.validateRequest(middleware)){
        const result = await admin.getAuth(req.query,function(errAuth,resAuth){
          if(!errAuth){
            if(!utility.issetVal(resAuth)){
              res.status(200).send(
              new response(false, 403, 'Unauthorized')
            )}else{
              if(resAuth.auth_code == req.query.auth_code){
                const body = {
                    id : req.query.post_id
                }
                post.getById(body, function(errGet,resGet) {
                    console.log(errGet);

                    if (!errGet) {
                        if(!utility.issetVal(resGet)){
                            res.status(200).send(
                                new response(false, 404, 'Data not exist')
                            )
                        }else{
                            //here goes the function
                            const body = {
                                id : req.query.polling_id
                            }
             
                            postPolling.deleteData(body, function(err,resData) {
                            // caches
                                if (!err) {
                                    res.status(200).send(new response(true, 200, 'Delete success'))
                                } else {
                                    res.status(200).send(
                                        new response(false, 401, 'Delete failed')
                                    )
                                }
                            })
                        }
                    } else {
                        res.status(200).send(
                            new response(false, 401, 'Delete Failed')
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
              new response(false, 403, 'Unauthorized1')
            )
          }
        })
      }else{
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

// Post Comment 
exports.deleteComment = async (req, res) => {
    try {
      const middleware = {
        user_id      : 'required|text|'+req.query.user_id,
        auth_code    : 'required|text|'+req.query.auth_code,
        id           : 'required|text|'+req.query.id,
      }
      if(utility.validateRequest(middleware)){
        const result = await admin.getAuth(req.query,function(errAuth,resAuth){
          if(!errAuth){
            if(!utility.issetVal(resAuth)){
              res.status(200).send(
              new response(false, 403, 'Unauthorized')
            )}else{
              if(resAuth.auth_code == req.query.auth_code){
                  //here goes the function
                  const body = {
                      user_id : req.query.user_id,
                      auth_code : req.query.auth_code,
                      id : req.query.id
                  }
                 
                postComments.deleteData(body, function(err,resData) {
                // caches
                    if (!err) {
                        res.status(200).send(new response(true, 200, 'Delete success'))
                    } else {
                        res.status(200).send(
                            new response(false, 401, 'Delete failed')
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
              new response(false, 403, 'Unauthorized1')
            )
          }
        })
      }else{
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


exports.updateComment = async (req, res) => {
    try {
        const middleware = {
            user_id         : 'required|text|'+req.body.user_id,
            auth_code       : 'required|text|'+req.body.auth_code,
            id              : 'required|text|'+req.body.id,
            comment         : 'required|text|'+req.body.comment,
            publish         : 'required|number|'+req.body.publish
        }
        if(utility.validateRequest(middleware)){
           
         
            const result = await admin.getAuth(req.body,function(errAuth,resAuth){
                if(!errAuth){
                     if(!utility.issetVal(resAuth)){
                        res.status(200).send(
                        new response(false, 403, 'Unauthorized')
                        )
                    }else{
                        if(resAuth.auth_code == req.body.auth_code){
                            
                            const body = {
                                id              : req.body.id,
                                comment         : req.body.comment,
                                publish         : req.body.publish
                            }

                            postComments.updateData(body, function(err,resData) {
                                console.log(err)
                                if (!err) {
                                    res.status(200).send(new response(true, 200, 'Update Data success'))
                                } else {
                                    res.status(200).send(
                                        new response(false, 400, 'Update Data failed')
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

exports.pinnedPost = async (req, res) => {
    try{
        const middleware = {
            user_id         : 'required|text|'+req.query.user_id,
            auth_code       : 'required|text|'+req.query.auth_code,
            id              : 'required|text|'+req.query.id,
            featured        : 'required|text|'+req.query.featured,
        }
        if(utility.validateRequest(middleware)){
            const result = await admin.getAuth(req.query,function(errAuth,resAuth){
                // console.log(errAuth);
                if(!errAuth){
                    if(!utility.issetVal(resAuth)){
                        res.status(200).send(
                            new response(false, 403, 'Unauthorized')
                        )
                    }else{
                        if(resAuth.auth_code == req.query.auth_code){
                            const body = {
                                id              : req.query.id, 
                                featured        : req.query.featured
                            }
                            post.getById(body,function(errRes,resData) {
                                if (!errRes) {
                                    if (utility.issetVal(resData)) {
                                        console.log(resData.type)
                                        post.checkFeatured({type : resData.type, featured: '1', removed: '0', publish: '1'}, function(err,resData) {
                                            console.log({resData});
                                            let rrFeatured;
                                            let rStatus;
                                            if(req.query.featured ==  '1'){

                                                if(resData >= 3){
                                                    rrFeatured = false;
                                                } else {
                                                    rrFeatured = true;
                                                }
                                                rStatus = 'Pinned';
                                            } else {
                                                rrFeatured = true;
                                                rStatus = 'Unpinned';
                                            }
                                            if(!rrFeatured){
                                                res.status(200).send(
                                                    new response(false, 402, 'Featured Post maximal 3 Data')
                                                )
                                            } else {
                                                console.log(["MASUK",body])
                                                post.updateData(body, function(err,resData) {
                                                    console.log(resData)
                                                    if (!err) {
                                                        res.status(200).send(new response(true, 200, rStatus+' Data success'))
                                                    } else {
                                                        res.status(200).send(
                                                            new response(false, 401, rStatus+' Pinned Data failed')
                                                        )
                                                    }
                                                })

                                            }
                                        });
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

exports.getLikes = async (req, res) => {
try{
    const middleware = {
        user_id         : 'required|text|'+req.body.user_id,
        auth_code       : 'required|text|'+req.body.auth_code,
        id              : 'required|text|'+req.body.id,
    }
    if(utility.validateRequest(middleware)){
        const result = await admin.getAuth(req.body,function(errAuth,resAuth){
            // console.log(errAuth);
            if(!errAuth){
                if(!utility.issetVal(resAuth)){
                    res.status(200).send(
                        new response(false, 403, 'Unauthorized')
                    )
                }else{
                    if(resAuth.auth_code == req.body.auth_code){
                        //here goes the function
                        const body = {
                            id : req.body.id,
                        }
                        

                        post.getById(body,function(errRes,resData) {
                            if (!errRes) {
                                if (utility.issetVal(resData)) {
                                    let arrayDatas = [];
                                    let arrayData = {};
                                    // arrayData = resData;
                                    let promiseList = new Promise(function(resolve, reject) {
                                        postLikes.getCountData({post_id : body.id},function(errResCount,rowsResCount) {
                                        // console.log(rowsResCount);
                                        if (!errResCount) {
                                            if (utility.issetVal(rowsResCount)) {
                                                let itemPerRequest = utility.issetVal(req.body.item)?  parseInt(req.body.item) : 15;
                                                let page = req.body.page;
                                                let total_data =  rowsResCount;
                                                let total_page = Math.ceil(total_data / itemPerRequest);
                            
                                                let limitBefore = page <= 1 || page == null ? 0 : (page-1) * itemPerRequest;
                            
                                                const PreparedData = {
                                                    start : limitBefore,
                                                    limit : itemPerRequest,
                                                    post_id : body.id
                                                }
                                                postLikes.getAll(PreparedData,function(errRes,rowsRes) {
                                                    // console.log(rowsRes);
                                                    if (!errRes) {
                                                    const totalInfo = {
                                                        total_page : total_page,
                                                        total_data_all : total_data,
                                                        total_data : rowsRes.length
                                                    }
                                                        if (rowsRes !='') {
                                                            const arrayRows = {
                                                                data :rowsRes,
                                                                total: totalInfo
                                                            }
                                                            resolve(arrayRows);
                                                            
                                                        } else {
                                                        resolve();
                                                        }
                                                    }else {
                                                        resolve();
                                                    }
                                                })
                                            } else {
                                                resolve();
                                            }
                                        } else {
                                            resolve();
                                        }
                                        })
                                    });

                                    let promiseUser = new Promise(function(resolve, reject) {
                                        user.getSelectUser(null, (err, resData) =>{
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

                                    Promise.all([promiseList, promiseUser]).then(arr => {
                                        
                                        if(utility.issetVal(arr[0])){
                                            let resComment = arr[0].data;
                                            let arrayComments = []
                                            arrayData = arr[0];
                                            for (var a = 0; a < resComment.length; a++) {
                                                let arrayComment = {}
                                                var b = _.find(arr[1], ['id', resComment[a].user_id]);
                                                let username = '';
                                                let img = '';
                                                if(_.isObject(b)){
                                                username = b.name;
                                                img = b.img;
                                                }
                                                
                                                // arrayComment = resComment[a];
                                                arrayComment.id =  resComment[a]._id;
                                                arrayComment.post_id    =  resComment[a].post_id;
                                                arrayComment.user_id     =  resComment[a].user_id;
                                                arrayComment.username    =  username;
                                                arrayComment.img         =  img;
                                                arrayComment.comment     =  resComment[a].comment;
                                                arrayComment.create_date =  resComment[a].create_date;
                                                arrayComment.modify_date =  resComment[a].modify_date;
                                                arrayComments.push(arrayComment);
                                            }
                                            arrayData.data = arrayComments;
                                            res.status(200).send(new response(true, 200, 'Fetch success', arrayData))
                                        } else {
                                            res.status(200).send(new response(false, 401, 'Fetch Failed'))
                                        }
                                        }).catch( err => {
                                        res.status(200).send(new response(false, 401, 'Fetch Failed', err))
                                        console.log(err);
                                    } );
                                } else {
                                    res.status(200).send(
                                        new response(false, 401, 'Fetch Failed1')
                                    )
                                }
                            }else {
                                res.status(200).send(
                                    new response(false, 401, 'Fetch Failed2')
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
  
exports.getComment = async (req, res) => {
    try{
        const middleware = {
            user_id         : 'required|text|'+req.body.user_id,
            auth_code       : 'required|text|'+req.body.auth_code,
            id           : 'required|text|'+req.body.id,
        }
        if(utility.validateRequest(middleware)){
            const result = await admin.getAuth(req.body,function(errAuth,resAuth){
                // console.log(errAuth);
                if(!errAuth){
                    if(!utility.issetVal(resAuth)){
                        res.status(200).send(
                            new response(false, 403, 'Unauthorized')
                        )
                    }else{
                        if(resAuth.auth_code == req.body.auth_code){
                            //here goes the function
                            const body = {
                                id : req.body.id,
                            }
                            

                            post.getById(body,function(errRes,resData) {
                                if (!errRes) {
                                    if (utility.issetVal(resData)) {
                                        let arrayDatas = [];
                                        let arrayData = {};
                                        // arrayData = resData;
                                        let promiseList = new Promise(function(resolve, reject) {
                                            postComments.getCountData({post_id : body.id},function(errResCount,rowsResCount) {
                                            // console.log(rowsResCount);
                                            if (!errResCount) {
                                                if (utility.issetVal(rowsResCount)) {
                                                    let itemPerRequest = utility.issetVal(req.body.item)?  parseInt(req.body.item) : 15;
                                                    let page = req.body.page;
                                                    let total_data =  rowsResCount;
                                                    let total_page = Math.ceil(total_data / itemPerRequest);
                                
                                                    let limitBefore = page <= 1 || page == null ? 0 : (page-1) * itemPerRequest;
                                
                                                    const PreparedData = {
                                                        start : limitBefore,
                                                        limit : itemPerRequest,
                                                        post_id : body.id
                                                    }
                                                    postComments.getAll(PreparedData,function(errRes,rowsRes) {
                                                        console.log(PreparedData);
                                                        if (!errRes) {
                                                        const totalInfo = {
                                                            total_page : total_page,
                                                            total_data_all : total_data,
                                                            total_data : rowsRes.length
                                                        }
                                                            if (rowsRes !='') {
                                                                const arrayRows = {
                                                                    data :rowsRes,
                                                                    total: totalInfo
                                                                }
                                                                resolve(arrayRows);
                                                                
                                                            } else {
                                                            resolve();
                                                            }
                                                        }else {
                                                            resolve();
                                                        }
                                                    })
                                                } else {
                                                    resolve();
                                                }
                                            } else {
                                                resolve();
                                            }
                                            })
                                        });

                                        let promiseUser = new Promise(function(resolve, reject) {
                                            user.getSelectUser(null, (err, resData) =>{
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

                                        Promise.all([promiseList, promiseUser]).then(arr => {

                                            if(utility.issetVal(arr[0])){
                                                let resComment = arr[0].data;
                                                let arrayComments = []
                                                arrayData = arr[0];
                                                for (var a = 0; a < resComment.length; a++) {
                                                    // console.log(resComment[0])
                                                    let arrayComment = {}
                                                    var b = _.find(arr[1], ['id', resComment[a].user_id]);
                                                    let username = null;
                                                    let img = null;
                                                    if(_.isObject(b)){
                                                        username = utility.issetVal(b.name) ? b.name : null;
                                                        img = utility.issetVal(b.img) ? b.img : null;
                                                    }
                                                    
                                                    // arrayComment = resComment[a];
                                                    arrayComment.id =  resComment[a]._id;
                                                    arrayComment.post_id    =  resComment[a].post_id;
                                                    arrayComment.user_id     =  resComment[a].user_id;
                                                    arrayComment.username    =  username;
                                                    arrayComment.img         =  img;
                                                    arrayComment.comment     =  resComment[a].comment;
                                                    arrayComment.publish     =  resComment[a].publish;
                                                    arrayComment.create_date =  resComment[a].create_date;
                                                    arrayComment.modify_date =  resComment[a].modify_date;
                                                    arrayComments.push(arrayComment);
                                                }
                                                arrayData.data = arrayComments;
                                                res.status(200).send(new response(true, 200, 'Fetch success', arrayData))
                                            } else {
                                                res.status(200).send(new response(false, 401, 'Fetch Failed'))
                                            }
                                            }).catch( err => {
                                            res.status(200).send(new response(false, 401, 'Fetch Failed', err))
                                            console.log(err);
                                        } );
                                    } else {
                                        res.status(200).send(
                                            new response(false, 401, 'Fetch Failed1')
                                        )
                                    }
                                }else {
                                    res.status(200).send(
                                        new response(false, 401, 'Fetch Failed2')
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


exports.getDetailComment = async (req, res) => {
    try{
        const middleware = {
            user_id         : 'required|text|'+req.body.user_id,
            auth_code       : 'required|text|'+req.body.auth_code,
            id           : 'required|text|'+req.body.id,
        }
        // console.log(middleware);
        if(utility.validateRequest(middleware)){
            const result = await admin.getAuth(req.body,function(errAuth,resAuth){
                console.log(errAuth);
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
                                id : req.body.id,
                            }

                            postComments.getById(body,function(errRes,resData) {
                                // console.log(errRes)
                                if (!errRes) {
                                    if (utility.issetVal(resData)) {
                                        let promiseUser = new Promise(function(resolve, reject) {
                                            user.getById({'id' : resData.user_id}, (err, resData) =>{
                                            // console.log({'s' :resData});
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
                                        Promise.all([promiseUser]).then(arr => {
                                            if(_.isObject(arr[0])){
                                                let arrayComment = {}
                                                let username = utility.issetVal(arr[0].name) ? arr[0].name : null;
                                                let img = utility.issetVal(arr[0].img) ? arr[0].img : null;
                                                arrayComment.id          =  resData._id;
                                                arrayComment.post_id     =  resData.post_id;
                                                arrayComment.user_id     =  resData.user_id;
                                                arrayComment.username    =  username;
                                                arrayComment.img         =  img;
                                                arrayComment.comment     =  resData.comment;
                                                arrayComment.publish     =  resData.publish;
                                                arrayComment.create_date =  resData.create_date;
                                                arrayComment.modify_date =  resData.modify_date;


                                                res.status(200).send(new response(true, 200, 'Fetch success', arrayComment))
                                            }else {
                                                res.status(200).send(new response(false, 401, 'Fetch Failed'))
                                            }
                                            
                                        }).catch( err => {
                                            res.status(200).send(new response(false, 401, 'Fetch Failed', err))
                                            console.log(err);
                                        } );
                                    } else {
                                        res.status(200).send(
                                            new response(false, 401, 'Fetch Failed')
                                        )
                                    }
                                }else {
                                    res.status(200).send(
                                        new response(false, 401, 'Fetch Failed1')
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

exports.replicate = async (req, res) => {
    try{
      const middleware = {
        user_id      : 'required|text|'+req.body.user_id,
        auth_code    : 'required|text|'+req.body.auth_code,
        id           : 'required|text|'+req.body.id
      }
      if(utility.validateRequest(middleware)){
        const result = await admin.getAuth(req.body, function(errAuth, resAuth){
            console.log(errAuth);
          if(!errAuth){
            if(!utility.issetVal(resAuth)){
              res.status(200).send(
              new response(false, 403, 'Unauthorized')
            )}else{
                post.replicate({id: req.body.id}, function(errData, resData) {
                    console.log(errData);
                    console.log(resData);
                    if(!utility.issetVal(errData)){
                        if(utility.issetVal(resData)){
                            console.log(resData)
                            //promise add form
                            
                            const addForm = new Promise((resolve, reject) => {
                                var bodyForm = {
                                    id: resData.id,
                                    content: resData.content,
                                    type: resData.type,
                                    publish: resData.publish,
                                    create_date: resData.create_date,
                                    user_id : req.body.user_id,
                                    user_type : 'admin',
                                    notes : ''
                                }
                                post.addData(bodyForm, function(err, resForm) {
                                    console.log(err)
                                    if(!err){
                                    resolve(true)
                                    }
                                })
                            })
                            //promise add question
                            const addQuestion = new Promise((resolve, reject) => {
                                var bodyQuestion = resData.question
                                postPolling.addMultiple(bodyQuestion, function(errQuestion, resQuestion) {
                                    if(!errQuestion){
                                    resolve(true)
                                    }
                                })
                            })
                            const addInterest = new Promise((resolve, reject) => {
                              let bodyInterest = resData.interest
                              postInterest.addMultiple(bodyInterest,(errInterest, resinterest)=>{
                                if(!errInterest){
                                  resolve(true)
                                } else {
                                  reject(errInterest)
                                }
                              })
                            })
                            //run promise race for insert replicate
                            Promise.race([addForm, addQuestion,addInterest]).then(result => {
                                console.log(result);
                                if(result){
                                    res.status(200).send(
                                    new response(true, 200, 'Replicate form success', {id: resData.id})
                                    )
                                }
                            }).catch(function(error){ 
                               console.log(error);
                            });
                            
                        }else{
                            res.status(200).send(
                            new response(false, 401, 'Replicate form failed')
                            )
                        }
                    }else{
                        res.status(200).send(
                            new response(false, 401, 'Replicate form failed1')
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


exports.getParticipant = async (req, res) => {
    try{
      const middleware = {
        user_id      : 'required|text|'+req.body.user_id,
        auth_code    : 'required|text|'+req.body.auth_code,
        id           : 'required|text|'+req.body.id,
        page         : 'required|text|'+req.body.page
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
                postResponse.getCountData({id: req.body.id}, function(errCount, resCount){
                  if(errCount){
                    res.status(200).send(
                      new response(false, 401, 'Fetch Failed')
                    )
                  }else{
                    //   console.log(resCount);
                    let itemPerPage = utility.issetVal(req.body.item)?  parseInt(req.body.item) : 15;
                    var options = {
                      start : req.body.page <= 1 || req.body.page == null ? 0 : (req.body.page-1) * itemPerPage,
                      limit : itemPerPage,
                      id: req.body.id
                    }
                    postResponse.getAll(options, function(errRes, resData){
                        console.log(errRes)
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
                                    new response(true, 200, 'Fetch Success', datas)
                                )
                            }else{
                                res.status(200).send(
                                    new response(false, 401, 'Fetch Failed2')
                                )
                            }
                        }else{
                            res.status(200).send(
                            new response(false, 401, 'Fetch Failed1')
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


exports.deleteParticipant = async (req, res) => {
    try{
      const middleware = {
        user_id      : 'required|text|'+req.query.user_id,
        auth_code    : 'required|text|'+req.query.auth_code,
        post_id      : 'required|text|'+req.query.post_id
      }
      if(utility.validateRequest(middleware)){
        const result = await admin.getAuth(req.query, function(errAuth, resAuth){
            console.log(errAuth)
            if(!errAuth){
                if(!utility.issetVal(resAuth)){
                res.status(200).send(
                new response(false, 403, 'Unauthorized')
                )}else{
                    postResponse.deleteData({'post_id': req.query.post_id, 'user_id' : req.query.participant_id}, (errData, resData) =>{
                        console.log(resData)
                        if(errData){
                            res.status(200).send(
                                new response(false, 400, 'Delete failed')
                            )
                        }else{
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


exports.analyzeResult = async (req, res) => {
    try{
      const middleware = {
        user_id      : 'required|text|'+req.body.user_id,
        auth_code    : 'required|text|'+req.body.auth_code,
        id           : 'required|text|'+req.body.id
      }
      if(utility.validateRequest(middleware)){
        const result = await admin.getAuth(req.body, function(errAuth, resAuth){
            // console.log(errAuth);
            if(!errAuth){
                if(!utility.issetVal(resAuth)){
                    res.status(200).send(
                    new response(false, 403, 'Unauthorized')
                    )
                }else{
                    post.getAnalyzeResult({id: req.body.id}, function(errData, resData) {
                        console.log('err:', errData)
                        console.log('res:', resData)
                        if(!utility.issetVal(errData)){
                            if(utility.issetVal(resData)){
                                res.status(200).send(
                                new response(true, 200, 'Fetch Success', resData)
                                )
                            }else{
                                res.status(200).send(
                                new response(false, 401, 'Fetch Failed')
                                )
                            }
                        }else{
                            res.status(200).send(
                                new response(false, 401, 'Fetch Failed')
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

exports.individualResult = async (req, res) => {
    try{
      const middleware = {
        user_id      : 'required|text|'+req.body.user_id,
        auth_code    : 'required|text|'+req.body.auth_code,
        id           : 'required|text|'+req.body.id,
        current_id   : 'required|text|'+req.body.current_id
      }
      if(utility.validateRequest(middleware)){
        const result = await admin.getAuth(req.body, function(errAuth, resAuth){
            console.log(errAuth);
            if(!errAuth){
                if(!utility.issetVal(resAuth)){
                res.status(200).send(
                new response(false, 403, 'Unauthorized')
                )}else{
                    post.getIndividualResult({id: req.body.id, user_id: req.body.current_id}, function(errData, resData) {
                        console.log(errData)
                        if(!utility.issetVal(errData)){
                            if(utility.issetVal(resData)){
                                res.status(200).send(
                                new response(true, 200, 'Data exist', resData)
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

exports.getIndividual = async (req, res) => {
    try{
      const middleware = {
        user_id      : 'required|text|'+req.body.user_id,
        auth_code    : 'required|text|'+req.body.auth_code,
        id           : 'required|text|'+req.body.id
      }
      if(utility.validateRequest(middleware)){
        const result = await admin.getAuth(req.body, function(errAuth, resAuth){
          if(!errAuth){
            if(!utility.issetVal(resAuth)){
              res.status(200).send(
              new response(false, 403, 'Unauthorized')
            )}else{
              postResponse.getIndividual({post_id: req.body.id}, function(errIndividual, resIndividual) {
                console.log(resIndividual);
                if(utility.issetVal(errIndividual)){
                  res.status(200).send(
                    new response(false, 401, 'No data')
                  )
                }else{
                    if(utility.issetVal(resIndividual)){
                        var current_id = utility.issetVal(req.body.current_id) ? req.body.current_id : '';
                        postResponse.getCurrentIndividual({post_id: req.body.id, user_id: current_id}, function(errCurrent, resCurrent) {
                            // console.log(errCurrent);
                            if(!utility.issetVal(errCurrent)){
                                if(utility.issetVal(resCurrent)){
                                    res.status(200).send(
                                    new response(true, 200, 'Data exist', {list: resIndividual, current_user: resCurrent})
                                    )
                                }else{
                                    res.status(200).send(
                                    new response(true, 200, 'Data exist without prev/next user1', {list: resIndividual})
                                    )
                                }
                            }else{
                                res.status(200).send(
                                    new response(true, 200, 'Data exist without prev/next user2', {list: resIndividual})
                                )
                            }
                        })
                    } else {
                        res.status(200).send(
                            new response(false, 401, 'Fetch Failed')
                          )
                    }
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

exports.getIndividualDetail = async(req, res) => {
  console.log('GET Individual Detail');
  try {
    const middleware = {
      user_id      : 'required|text|'+req.body.user_id,
      auth_code    : 'required|text|'+req.body.auth_code,
      post_id      : 'required|text|'+req.body.post_id,
    }
    if(utility.validateRequest(middleware)){
      const result = await admin.getAuth(req.body, function(errAuth, resAuth){
        console.log({errAuth});
        // console.log({resAuth});
        if(utility.issetVal(resAuth)){
          if(req.body.auth_code == resAuth.auth_code){
            let body = {
              post_id   : req.body.post_id,
            }
            postResponse.getCountIndividualAnswered(body, (errCount, resCount)=>{
              console.log({resCount});
              let itemPerRequest = utility.issetVal(req.body.item)?  parseInt(req.body.item) : 15;
              let page = req.body.page;
              let total_data =  resCount;
              let total_page = Math.ceil(total_data / itemPerRequest);

              let limitBefore = page <= 1 || page == null ? 0 : (page-1) * itemPerRequest;

              if(utility.issetVal(resCount)){
                let bodyGet = {
                  post_id : req.body.post_id,
                  start   : limitBefore,
                  limit   : itemPerRequest
                }
                postResponse.getIndividualAnswered(bodyGet, function(errIndividual, resIndividual){
                  console.log({errIndividual});
                  console.log({resIndividual});
                  const totalInfo = {
                    total_page : total_page,
                    total_data_all : total_data,
                    total_data : resIndividual.length
                  }
                  if(utility.issetVal(resIndividual)){
                    res
                    .status(200)
                    .send(new response(true, 200, 'Fetch Success', {
                     data: resIndividual,
                     total : totalInfo
                    }))
                  } else {
                    res
                    .status(200)
                    .send(new response(false, 401, 'Fetch Failed'))
                  }
                })
              } else {

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
  } catch (error){
    res
    .status(500)
    .send(new response(false, 500, 'Something went wrong'))
  }
}

exports.autocompletePolling = async (req, res) => {
  try{
    const middleware = {
      user_id      : 'required|text|'+req.body.user_id,
      auth_code    : 'required|text|'+req.body.auth_code,
      keyword      : 'required|text|'+req.body.keyword
    }
    if(utility.validateRequest(middleware)){
      const result = await admin.getAuth(req.body, function(errAuth, resAuth){
        if(!errAuth){
          if(!utility.issetVal(resAuth)){
            res.status(200).send(
            new response(false, 403, 'Unauthorized')
          )}else{
            post.autocomplete({keyword: req.body.keyword, type :'polling'}, function(errData, resData) {
              if(!utility.issetVal(errData)){
                if(utility.issetVal(resData)){
                  res.status(200).send(
                    new response(true, 200, 'Fetch Success', resData)
                  )
                }else{
                  res.status(200).send(
                    new response(false, 401, 'Fetch Failed')
                  )
                }
              }else{
                res.status(200).send(
                  new response(false, 401, 'Fetch Failed')
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

exports.latestPolling = async (req, res) => {
    try{
      const middleware = {
        user_id      : 'required|text|'+req.body.user_id,
        auth_code    : 'required|text|'+req.body.auth_code
      }
      if(utility.validateRequest(middleware)){
        const result = await admin.getAuth(req.body, function(errAuth, resAuth){
          if(!errAuth){
            if(!utility.issetVal(resAuth)){
              res.status(200).send(
              new response(false, 403, 'Unauthorized')
            )}else{
              post.getLatest({type : 'polling'}, function(errData, resData) {
                if(!utility.issetVal(errData)){
                  if(utility.issetVal(resData)){
                    res.status(200).send(
                      new response(true, 200, 'Fetch Success', resData)
                    )
                  }else{
                    res.status(200).send(
                      new response(false, 401, 'Fetch Failed')
                    )
                  }
                }else{
                  res.status(200).send(
                    new response(false, 401, 'Fetch Failed')
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

exports.deleteReport = async (req, res)=>{
    console.log('DELETE REPORT ');
  const {user_id, auth_code, post_id, reason, type} = req.query
  try {
    const middleware = {
      user_id         : 'required|text|'+user_id,
      auth_code       : 'required|text|'+auth_code,
      post_id         : 'required|text|'+post_id,
      reason          : 'no|text|'+reason,
      type            : 'required|text|'+type,
    }
    if(utility.validateRequest(middleware)){
      await admin.getAuth(req.query, function(errAuth, resAuth){
        //   console.log({errAuth : errAuth});
        //   console.log({resAuth : resAuth});
        if(utility.issetVal(resAuth)){
          if(resAuth.auth_code == auth_code){
            let body = {
              post_id : post_id
            }
            postReport.getByPost(body, function (errGet, resGet){
              // console.log({errGet : errGet});
              console.log({resGet : resGet});
              if(utility.issetVal(resGet)){
                let removed = {
                  post_id : post_id,
                  user_id : user_id,
                  reason  : reason,
                  type    : type,
                }
                postReport.deleteById({id : resGet[0]._id}, function(errDel, resDel){
                  console.log({errDel});
                  console.log({resDel});
                  if(!errDel){
                    if(utility.issetVal(resDel)){
                      post.deleteData({id : post_id}, function(errAdd, resAdd){
                        console.log({resAdd});
                        if(!errAdd){
                          postRemoved.addData(removed, function(errPostRe, resPostRe){
                            console.log({resPostRe});
                            if(!errPostRe){
                              res
                              .status(200)
                              .send(new response(true, 200, 'Delete Succes'))
                            } else {
                              res
                              .status(200)
                              .send(new response(false, 401, 'Delete Failed'))
                            }
                          })
                        } else {
                          res
                          .status(200)
                          .send(new response(false, 401, 'Delete Failed'))
                        }
                      })
                    } else {
                      res
                      .status(200)
                      .send(new response(false, 401, 'Delete Failed'))
                    }
                  } else {
                    res
                    .status(200)
                    .send(new response(false, 401, 'Delete Failed'))
                  }
                })
                /*
                  console.log(removed)
                  post.deleteData({id : removed.post_id}, function(errAdd, resAdd){
                    console.log('erpost',errAdd)
                    console.log('respost',resAdd)
                    if(!utility.issetVal(errAdd)){
                      postRemoved.addData(removed, function(errAdd, resAdd){
                        console.log('er',errAdd)
                        console.log('res',resAdd)
                      })
                    }
                  }) 
                */
              } else {
                // error, Data post tidak di temukan
                res
                .status(200)
                .send(new response(false, 404, 'Data not exist'))
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
  } catch(error) {
    console.log(error);
    res
    .status(500)
    .send(new response(false, 500, 'Something went wrong'))
  }
}

exports.updateReport = async (req,res)=>{
  console.log('UPDATE REPORT');
  const {user_id, auth_code, post_id, reason} = req.body
  try {
    const middleware = {
      user_id         : 'required|text|'+user_id,
      auth_code       : 'required|text|'+auth_code,
      post_id         : 'required|text|'+post_id,
      reason          : 'required|text|'+reason
    }
    if(utility.validateRequest(middleware)){
      await admin.getAuth(req.body, function(errAuth, resAuth){
        //   console.log({errAuth : errAuth});
        //   console.log({resAuth : resAuth});
        if(utility.issetVal(resAuth)){
          if(resAuth.auth_code == auth_code){
            let body = {
              post_id : post_id
            }
            postReport.getByPost(body, function (errGet, resGet){
              // console.log({errGet : errGet});
              // console.log({resGet : resGet});
              if(utility.issetVal(resGet)){
                let body = {
                  id      : resGet[0]._id,
                  reason  : reason
                }
                postReport.updateData(body, function(errDel, resDel){
                //   console.log({errDel : errDel});
                //   console.log({resDel : resDel});
                  if(utility.issetVal(resDel)){
                    res
                    .status(200)
                    .send(new response(true, 200, 'Update Succes'))
                  } else {
                    res
                    .status(200)
                    .send(new response(false, 400, 'Update Failed'))
                  }
                })
              } else {
                // error, Data post tidak di temukan
                res
                .status(200)
                .send(new response(false, 404, 'Data not exist'))
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
  } catch(error) {
    console.log(error);
    res
    .status(500)
    .send(new response(false, 500, 'Something went wrong'))
  }
}

exports.getListReport = async(req, res)=>{
  console.log('GET LIST REPORT');
  const {user_id, auth_code, page, type} = req.body
  try {
    const middleware = {
      user_id         : 'required|text|'+user_id,
      auth_code       : 'required|text|'+auth_code,
      page            : 'required|text|'+page,
      type            : 'required|text|'+type,
      post : 'no|text|'+req.body.post,
      posted_by  : 'no|text|'+req.body.posted_by,
      create_date     : 'no|text|'+req.body.create_date,
      sort            : 'no|text|'+req.body.sort
    }
    if(utility.validateRequest(middleware)){
      await admin.getAuth(req.body, function(errAuth, resAuth){
        if(utility.issetVal(resAuth)){
          if(resAuth.auth_code == auth_code){
            const bodyCount = {
              type  : type,
              post : req.body.post,
              posted_by  : req.body.posted_by,
              create_date     : req.body.create_date,
              sort            : req.body.sort,
            }
           postReport.getAll(bodyCount, function(errCount, resCount){
            console.log({errCount : errCount});
            console.log({resCount : resCount});
            if(utility.issetVal(resCount)){
              let itemPerRequest = utility.issetVal(req.body.item)?  parseInt(req.body.item) : 15;
              let page = req.body.page;
              let total_data =  resCount.length  ;
              let total_page = Math.ceil(total_data / itemPerRequest);

              let limitBefore = page <= 1 || page == null ? 0 : (page-1) * itemPerRequest;

              const PreparedData = {
                  start : limitBefore,
                  limit : itemPerRequest,
                  type  : type,
                  post : req.body.post,
                  posted_by  : req.body.posted_by,
                  create_date     : req.body.create_date,
                  sort            : req.body.sort,
              }
               postReport.getAll(PreparedData,function (errGet, resGet){
                //  console.log({errGet : errGet});
                //  console.log({resGet : resGet});

                 const totalInfo = {
                  total_page : total_page,
                  total_data_all : total_data,
                  total_data : resGet.length
                  }
                 if(utility.issetVal(resGet)){
                  res
                  .status(200)
                  .send(new response(true, 200, 'Fetch Succes', {data : resGet, totalInfo}))  
                 } else {
                  res
                  .status(200)
                  .send(new response(false, 401, 'Fetch Failed'))
                 }
                 
               })
            } else {
              res
              .status(200)
              .send(new response(false, 404, 'Data not exist'))  
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
  } catch(error) {
    console.log(error);
    res
    .status(500)
    .send(new response(false, 500, 'Something went wrong'))
  }
}

exports.listRemoved = async (req, res)=>{
  console.log('LIST POST REMOVED');
  try {
    const {user_id, auth_code, page, item, type} = req.body
    const middleware = {
      user_id       : 'required|text|'+user_id,
      auth_code     : 'required|text|'+auth_code, 
      page          : 'required|text|'+page,
      type          : 'required|text|'+type
    }
    if(utility.validateRequest(middleware)){
      await admin.getAuth(req.body, function(errAuuth, resAuth){
        if(utility.issetVal(resAuth)){
          if(resAuth.auth_code == auth_code){
            const bodyCount = {
              type  : type,
              post : req.body.post,
              posted_by  : req.body.posted_by,
              sort  : req.body.sort,
              create_date : req.body.create_date
            }

            postRemoved.getAll(bodyCount,function(errCount, resCount){
              console.log({errCount});
              // console.log({resCount});
              if(utility.issetVal(resCount)){
                let itemPerRequest = utility.issetVal(req.body.item)?  parseInt(req.body.item) : 15;
                let page = req.body.page;
                let total_data =  resCount.length  ;
                let total_page = Math.ceil(total_data / itemPerRequest);

                let limitBefore = page <= 1 || page == null ? 0 : (page-1) * itemPerRequest;

                const PreparedData = {
                    start : limitBefore,
                    limit : itemPerRequest,
                    type  : type,
                    post : req.body.post,
                    posted_by  : req.body.posted_by,
                    sort  : req.body.sort,
                    create_date : req.body.create_date
                }
                postRemoved.getAll(PreparedData, function(errGet, resGet){
                  const totalInfo = {
                    total_page : total_page,
                    total_data_all : total_data,
                    total_data : resGet.length
                    }
                  if(utility.issetVal(resGet)){
                    res
                    .status(200)
                    .send(new response(true, 200, 'Fetch Succes', {data : resGet, total :totalInfo}))  
                  } else {
                    res
                    .status(200)
                    .send(new response(false, 401, 'Fetch Failed'))
                  }
                })
              } else {
                res
                .status(200)
                .send(new response(false, 404, 'Data not exist')) 
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
  } catch(error){
    console.log(error);
    res
    .status(500)
    .send(new response(false, 500, 'Something went wrong'))
  }
}


exports.getAllHashtagByUser = async (req, res)=>{
  console.log('LIST Hashtag By alumni');
  try {
    const {user_id, auth_code, page, item, alumni_id} = req.body
    const middleware = {
      user_id       : 'required|text|'+user_id,
      auth_code     : 'required|text|'+auth_code,
      page          : 'required|text|'+page,
      alumni_id     : 'required|text|'+alumni_id
    }
    if(utility.validateRequest(middleware)){
      await admin.getAuth(req.body, function(errAuuth, resAuth){
        if(utility.issetVal(resAuth)){
          if(resAuth.auth_code == auth_code){
            post.getCountHashtag({user_id : alumni_id},function(errCount, resCount){
              console.log(errCount);
              if(utility.issetVal(resCount)){
                let itemPerRequest = utility.issetVal(req.body.item)?  parseInt(req.body.item) : 15;
                let page = req.body.page;
                let total_data =  resCount  ;
                let total_page = Math.ceil(total_data / itemPerRequest);

                let limitBefore = page <= 1 || page == null ? 0 : (page-1) * itemPerRequest;
                
                const PreparedData = {
                    start : limitBefore,
                    limit : itemPerRequest,
                    user_id  : alumni_id
                }
                post.getAllHashtag(PreparedData, function(errGet, resGet){
                  console.log(errGet);
                  
                  if(utility.issetVal(resGet)){
                    const totalInfo = {
                      total_page : total_page,
                      total_data_all : total_data,
                      total_data : resGet.length
                      }
                    res
                    .status(200)
                    .send(new response(true, 200, 'Fetch Succes', {data : resGet, total :totalInfo}))  
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
  } catch(error){
    console.log(error);
    res
    .status(500)
    .send(new response(false, 500, 'Something went wrong'))
  }
}


exports.getAllByUser = async (req, res)=>{
  console.log('LIST Post By alumni');
  try {
    const {user_id, auth_code, page, item, alumni_id, type} = req.body
    const middleware = {
      user_id       : 'required|text|'+user_id,
      auth_code     : 'required|text|'+auth_code,
      page          : 'required|text|'+page,
      alumni_id     : 'required|text|'+alumni_id,
      type          : 'required|text|'+type
    }
    
    if(utility.validateRequest(middleware)){
      console.log(type)
      if(!utility.validateTypePost(type)){
        res
        .status(200)
        .send(new response(false, 405, 'Undefined Type')) 
      } 

      await admin.getAuth(req.body, function(errAuth, resAuth){
        console.log(errAuth);
        if(utility.issetVal(resAuth)){
          if(resAuth.auth_code == auth_code){
            post.getCountByUser({
              user_id : alumni_id
            , type : type},function(errCount, resCount){
              console.log(resCount);
              if(utility.issetVal(resCount)){
                let itemPerRequest = utility.issetVal(req.body.item)?  parseInt(req.body.item) : 15;
                let page = req.body.page;
                let total_data =  resCount  ;
                let total_page = Math.ceil(total_data / itemPerRequest);

                let limitBefore = page <= 1 || page == null ? 0 : (page-1) * itemPerRequest;
                
                const PreparedData = {
                    start : limitBefore
                    , limit : itemPerRequest
                    , user_id  : alumni_id
                    , type  : type
                }
                post.getAllByUser(PreparedData, function(errGet, resGet){
                  console.log(errGet);
                  
                  if(utility.issetVal(resGet)){
                    const totalInfo = {
                      total_page : total_page,
                      total_data_all : total_data,
                      total_data : resGet.length
                      }
                    res
                    .status(200)
                    .send(new response(true, 200, 'Fetch Succes', {data : resGet, total :totalInfo}))  
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
  } catch(error){
    console.log(error);
    res
    .status(500)
    .send(new response(false, 500, 'Something went wrong'))
  }
}

exports.getCommentByUser = async (req, res)=>{
  console.log('LIST Comment By alumni');
  try {
    const {user_id, auth_code, page, item, alumni_id} = req.body
    const middleware = {
      user_id       : 'required|text|'+user_id,
      auth_code     : 'required|text|'+auth_code,
      page          : 'required|text|'+page,
      alumni_id     : 'required|text|'+alumni_id,
    }
    
    if(utility.validateRequest(middleware)){
     
      await admin.getAuth(req.body, function(errAuth, resAuth){
        console.log(errAuth);
        if(utility.issetVal(resAuth)){
          if(resAuth.auth_code == auth_code){
            postComments.getCountByUser({
              user_id : alumni_id},function(errCount, resCount){
              console.log('err', errCount);
              console.log('data', resCount);
             
              if(utility.issetVal(resCount)){
                let itemPerRequest = utility.issetVal(req.body.item)?  parseInt(req.body.item) : 15;
                let page = req.body.page;
                let total_data =  resCount  ;
                let total_page = Math.ceil(total_data / itemPerRequest);

                let limitBefore = page <= 1 || page == null ? 0 : (page-1) * itemPerRequest;
                
                const PreparedData = {
                    start : limitBefore
                    , limit : itemPerRequest
                    , user_id  : alumni_id
                }
                postComments.getAllByUser(PreparedData, function(errGet, resGet){
                  console.log(errGet);
                  
                  if(utility.issetVal(resGet)){
                    const totalInfo = {
                      total_page : total_page,
                      total_data_all : total_data,
                      total_data : resGet.length
                      }
                    res
                    .status(200)
                    .send(new response(true, 200, 'Fetch Succes', {data : resGet, total :totalInfo}))  
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
  } catch(error){
    console.log(error);
    res
    .status(500)
    .send(new response(false, 500, 'Something went wrong'))
  }
}

exports.getLikeByUser = async (req, res)=>{
  console.log('LIST Like By alumni');
  try {
    const {user_id, auth_code, page, item, alumni_id} = req.body
    const middleware = {
      user_id       : 'required|text|'+user_id,
      auth_code     : 'required|text|'+auth_code,
      page          : 'required|text|'+page,
      alumni_id     : 'required|text|'+alumni_id,
    }
    
    if(utility.validateRequest(middleware)){
     
      await admin.getAuth(req.body, function(errAuth, resAuth){
        console.log(errAuth);
        if(utility.issetVal(resAuth)){
          if(resAuth.auth_code == auth_code){
            postLikes.getCountByUser({
              user_id : alumni_id},function(errCount, resCount){
              console.log('err', errCount);
              console.log('data', resCount);
             
              if(utility.issetVal(resCount)){
                let itemPerRequest = utility.issetVal(req.body.item)?  parseInt(req.body.item) : 15;
                let page = req.body.page;
                let total_data =  resCount  ;
                let total_page = Math.ceil(total_data / itemPerRequest);

                let limitBefore = page <= 1 || page == null ? 0 : (page-1) * itemPerRequest;
                
                const PreparedData = {
                    start : limitBefore
                    , limit : itemPerRequest
                    , user_id  : alumni_id
                }
                postLikes.getAllByUser(PreparedData, function(errGet, resGet){
                  console.log(errGet);
                  
                  if(utility.issetVal(resGet)){
                    const totalInfo = {
                      total_page : total_page,
                      total_data_all : total_data,
                      total_data : resGet.length
                      }
                    res
                    .status(200)
                    .send(new response(true, 200, 'Fetch Succes', {data : resGet, total :totalInfo}))  
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
  } catch(error){
    console.log(error);
    res
    .status(500)
    .send(new response(false, 500, 'Something went wrong'))
  }
}



exports.insertImages = async (req, res) => {
  try {
    let formData = new Array();
    var fields = {}, prepareFile = [];
    new formidable.IncomingForm().parse(req)
    .on('field', (name, value) => {
      if(utility.isJson(value)){
        formData.push('"' +name+ '"'+ ':'+value)
      } else {
        formData.push('"' +name+ '"'+ ':'+'"'+value+'"')
      }
    })
    
    .on('fileBegin', function (name, file){
      if(utility.checkImageExtension(file.name)){
        let fileType = file.type.split('/').pop();
        file.name = utility.generateHash(16)+ '.' + fileType;
        file.path = appDir + '/uploads/post/' + file.name;
        prepareFile.push(file.name);
      }
    })
    .on('file', (name, file) => {
      formData.push('"' +name+ '"'+ ':'+'"'+prepareFile+'"')
    })
    .on('aborted', () => {
      console.error('Request aborted by the post')
    })
    .on('error', (err) => {
      console.error('Error', err)
      throw err
    })
    .on('end', () => {
        let temp = '{'+formData.toString() +'}'
        let formJSON = JSON.parse(temp)
        // console.log(formJSON.img);
        // return false;
        const middleware = {
          id              : 'required|text|'+formJSON.id,
          user_id         : 'required|text|'+formJSON.user_id,
          auth_code       : 'required|text|'+formJSON.auth_code,
          img             : 'required|images|'+formJSON.img,
        }
        // console.log(middleware)
        if(utility.validateRequest(middleware)){
          const result = admin.getAuth(formJSON,function(errAuth,resAuth){
            console.log(errAuth);
            if(!errAuth){
              if(!utility.issetVal(resAuth)){
                res.status(200).send(
                new response(false, 403, 'Unauthorized1')
              )}else{
                if(resAuth.auth_code == formJSON.auth_code){
                  if(utility.issetVal(formJSON.img)){
                    let datImg = formJSON.img.split(',');
                    // for(let idx = 0; idx <  datImg.length; idx++) {
                    //     let object =  datImg[idx];
                    //     // console.log({idx : object});

                    //     const bodyImages = {
                    //         id          : utility.generateHash(32),
                    //         post_id     : formJSON.id,
                    //         img         : object,
                    //         create_date : moment(Date.now()).format('YYYY-MM-DD HH:mm:ss')
                    //     }
                    //     // idx == 0? bodyImages.main  = '1' : bodyImages.main  = '0';
                    //     postImages.getOne(null, (err, res)=>{
                    //       if(utility.issetVal(res)){
                    //         postImages.updateData({
                    //           id          : res.id,
                    //           post_id     : formJSON.id,
                    //           img         : object
                    //         }, (err,resData)=>{
                    //           if(utility.issetVal(err)){
                    //             if(utility.issetVal(res.img)){
                    //               utility.cleanImage(res.img, pathDir)
                    //               console.log('success upload') 
                    //             }
                    //           } else {
                    //             console.log('failed upload') 
                    //           }
                    //         }) 
                    //       } else {
                    //         postImages.addData(bodyImages, function(err,resData){
                    //           !utility.issetVal(err) ? console.log('success insert') : console.log('failed insert') 
                    //           // console.log({idx : resData });
                    //         }) 
                    //       }
                    //     })
                        
                    // }

                    let object =  datImg[0];
                    // console.log({idx : object});

                    const bodyImages = {
                        id          : utility.generateHash(32),
                        post_id     : formJSON.id,
                        img         : object,
                        create_date : moment(Date.now()).format('YYYY-MM-DD HH:mm:ss')
                    }
                    // idx == 0? bodyImages.main  = '1' : bodyImages.main  = '0';
                    postImages.getOne({post_id : bodyImages.post_id}, (err, res)=>{
                      if(utility.issetVal(res)){
                        postImages.updateData({
                          id          : res.id,
                          post_id     : formJSON.id,
                          img         : object
                        }, (err,resData)=>{
                          if(utility.issetVal(err)){
                            if(utility.issetVal(res.img)){
                              utility.cleanImage(res.img, pathDir)
                              console.log('success upload') 
                            }
                          } else {
                            console.log('failed upload') 
                          }
                        }) 
                      } else {
                        postImages.addData(bodyImages, function(err,resData){
                          !utility.issetVal(err) ? console.log('success insert') : console.log('failed insert') 
                          // console.log({idx : resData });
                        }) 
                      }
                    })

                    res.status(200).send(
                      new response(true, 200, 'Insert Data Success')
                    )
                  }
                }else{
                  res.status(200).send(
                  new response(false, 403, 'Unauthorized')
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
    })
  } catch (e) {
    console.log(e);
    res.status(500).send(
      new response(false, 500, 'Something went wrong')
    )
  }
}


exports.insertVideo = async (req, res) => {
  try {
    let formData = new Array();
    let maxSize = 3146000; // 3MB
    let reached = false;
    var fields = {}, prepareFile = [];
    let bytesReceiveds;
    let form = new formidable.IncomingForm()
    
    .parse(req)
    .on('field', (name, value) => {
      if(utility.isJson(value)){
        formData.push('"' +name+ '"'+ ':'+value)
      } else {
        formData.push('"' +name+ '"'+ ':'+'"'+value+'"')
      }
    })
   
    .on('progress', function(bytesReceived, bytesExpected) {
      if(bytesReceived > maxSize ){
        this.emit('error');
        return false;
      }
      
      // console.log(bytesReceiveds)
    })
    .on('fileBegin', function (name, file){
      console.log(file)
      
      if(utility.checkVideoExtension(file.name)){
        let fileType = utility.detectMimeType(file.type);
        file.name = utility.generateHash(16)+ '.' + fileType;
        // detectSize(file)
        file.path = appDir + '/uploads/post/' + file.name;
        prepareFile.push(file.name);
      }
    })
    .on('file', (name, file) => {
      formData.push('"' +name+ '"'+ ':'+'"'+prepareFile+'"')
    })
    .on('aborted', () => {
      console.error('Request aborted by the post')
    })
    .on('error', (err) => {
     
      callback = true;
      formData.push('"maxSize"'+ ':'+'"'+callback+'"')
      return false
    })
    .on('end', () => {
        let temp = '{'+formData.toString() +'}'
        let formJSON = JSON.parse(temp)
        console.log(formJSON)
        if(utility.issetVal(formJSON.maxSize)){
          utility.cleanImage(formJSON.video, pathDir)
          res.status(200).send(
            new response(false, 405, 'Video too large')
          )
        } else {
          const middleware = {
            id              : 'required|text|'+formJSON.id,
            user_id         : 'required|text|'+formJSON.user_id,
            auth_code       : 'required|text|'+formJSON.auth_code,
            video           : 'required|video|'+formJSON.video,
          }
          // console.log(middleware)
          if(utility.validateRequest(middleware)){
            const result = admin.getAuth(formJSON,function(errAuth,resAuth){
              console.log(errAuth);
              if(!errAuth){
                if(!utility.issetVal(resAuth)){
                  res.status(200).send(
                  new response(false, 403, 'Unauthorized1')
                )}else{
                  if(resAuth.auth_code == formJSON.auth_code){
                    if(utility.issetVal(formJSON.video)){
                      let datVideo = formJSON.video.split(',');
                      for(let idx = 0; idx <  datVideo.length; idx++) {
                          let object =  datVideo[idx];
                          // console.log({idx : object});

                          const bodyVideo = {
                              id     : formJSON.id,
                              video         : object
                          }
                          post.getById(bodyVideo, function(err,resData) {
                            if(utility.issetVal(err)){
                              utility.cleanImage(object, pathDir)
                            } else {
                              if(utility.issetVal(resData)){
                                if(utility.issetVal(resData.video)){
                                  utility.cleanImage(resData.video, pathDir)
                                }
                                post.updateData(bodyVideo, function(err,resData) {
                                }) 
                              } else {
                                post.updateData(bodyVideo, function(err,resData) {
                                }) 
                              }
                            }
                          })
                          post.updateData(bodyVideo, function(err,resData) {
                              // console.log({idx : resData });
                          }) 
                      }

                      res.status(200).send(
                        new response(true, 200, 'Insert Data Success')
                      )
                    }
                  }else{
                    res.status(200).send(
                    new response(false, 403, 'Unauthorized')
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
              new response(false, 400, 'Invalid input format', middleware)
            )
          }
        }
    })
  } catch (e) {
    console.log(e);
    res.status(500).send(
      new response(false, 500, 'Something went wrong')
    )
  }
}

exports.setPrimary = async (req, res) => {
  try {
    const middleware = {
      id              : 'required|text|'+req.body.id,
      user_id         : 'required|text|'+req.body.user_id,
      auth_code       : 'required|text|'+req.body.auth_code,
      images_id       : 'required|text|'+req.body.images_id,
    }
  
    if(utility.validateRequest(middleware)){
        const result = admin.getAuth(req.body,function(errAuth,resAuth){
            if(!errAuth){
                if(!utility.issetVal(resAuth)){
                    res.status(200).send(
                        new response(false, 403, 'Unauthorized')
                    )
                }else{
                    //here goes the function
                    const body = {
                      post_id         : req.body.id,
                      id              : req.body.images_id,
                      main            : 1
                    }

                    postImages.getById(body, function(err, resById){
                        if(!err){
                            postImages.updateData(body, function(err,resData) {
                                if (!err) {
                                    if(!utility.issetVal(resData)){
                                        res.status(200).send(new response(false, 404, 'Data not exist1'))
                                    }else{
                                      postImages.unPrimary(body, function(err,resData) {
                                        console.log(err)
                                      })
                                      res.status(200).send(new response(true, 200, 'Set Primary success', resData))
                                    }
                                } else {
                                    res.status(200).send(new response(false, 401, 'Set Primary failed'))
                                }
                            })
                        }else{
                            console.log(err);
                            res.status(200).send(new response(false, 404, 'Data not exist2'))
                        }
                    })
                }
            }else{
                res.status(200).send(
                    new response(false, 403, 'Unauthorized')
                )
            }
        })
    }else{
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

exports.deleteImages = async (req, res) => {
  try {
    const middleware = {
      user_id      : 'required|text|'+req.query.user_id,
      auth_code    : 'required|text|'+req.query.auth_code,
      img_id       : 'required|text|'+req.query.img_id,
    }
    if(utility.validateRequest(middleware)){
      const result = await admin.getAuth(req.query,function(errAuth,resAuth){
        if(!errAuth){
          if(!utility.issetVal(resAuth)){
            res.status(200).send(
            new response(false, 403, 'Unauthorized')
          )}else{
            if(resAuth.auth_code == req.query.auth_code){
              //here goes the function
              const body = {
                  user_id : req.query.user_id,
                  auth_code : req.query.auth_code,
                  id : req.query.img_id
              }
              postImages.getById(body, function(errGet,resGet) {
                console.log(errGet);

                if (!errGet) {
                  if(!utility.issetVal(resGet)){
                    res.status(200).send(
                      new response(false, 405, 'User not registered1')
                    )
                  }else{
                    postImages.deleteData(body, function(err,resData) {
                      // caches
                        if (!err) {
                          if(utility.issetVal(resGet.img)){
                            let pathUrl = appDir + '/uploads/user/' + resGet.img;
                            utility.cleanImage(resGet.img,pathDir)
                          }
                          
                          res.status(200).send(new response(true, 200, 'Delete success'))
                        } else {
                            res.status(200).send(
                                new response(false, 401, 'Delete failed')
                            )
                        }
                    })
                  }
                } else {
                  res.status(200).send(
                    new response(false, 404, 'Data not exist')
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
            new response(false, 403, 'Unauthorized1')
          )
        }
      })
    }else{
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

exports.deeplink = async (req, res)=>  {
  try {
    const middleware = {
      id : 'required|text|'+req.body.id
    }
    if(utility.validateRequest(middleware)){
      const body = {
        id : req.body.id,
      }

      post.getById(body,function(errRes,resData) {
          if (!errRes) {
              if (utility.issetVal(resData)) {
                  let arrayDatas = [];
                  let arrayData = {};
                  arrayData = resData;
                  // console.log(arrayData);

                  let promisePolling = new Promise(function(resolve, reject) {
                      postPolling.getByPostId(body, (errRes,resPolling) => {
                          if(!errRes){
                              if(utility.issetVal(resPolling)){
                                  resolve(resPolling);
                              } else {
                                resolve();
                              }
                          } else {
                            resolve();
                          }
                      });
                  });
                  
                  let promiseInterest = new Promise(function(resolve, reject) {
                      postInterest.getData({post_id : body.id}, (err, resData) =>{
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

                  let promiseImages = new Promise(function(resolve, reject) {
                    postImages.getData({id : body.id}, (err, resData) =>{
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

                  let promiseUser = new Promise(function(resolve, reject) {
                    user.getData({id : resData.user_id}, (errRes,resData) => {
                        if(!errRes){
                            if(utility.issetVal(resData)){
                                resolve(resData);
                            } else {
                                resolve();
                            }
                        } else {
                            resolve();
                        }
                    });
                  });

                  Promise.all([promisePolling, promiseInterest, promiseImages, promiseUser]).then(arr => {
                      // console.log({'a' : arr[2]})
                      // arrayData.polling = [];
                      if(utility.issetVal(arr[0])){
                          arrayData.polling = arr[0]                                            
                      } else {
                          arrayData.polling = null;
                      } 

                      if(utility.issetVal(arr[1])){
                          arrayData.interest = arr[1];
                      } else {
                          arrayData.interest = null;
                      }

                      if(utility.issetVal(arr[2])){
                        arrayData.images = arr[2];
                      } else {
                        arrayData.images = null;
                      }

                      if(utility.issetVal(arr[3])){
                        arrayData.user_name = arr[3][0].name
                      } else {
                        arrayData.user_name = null
                      }
                      
                      res.status(200).send(new response(true, 200, 'Fetch success', arrayData))
                  }).catch( err => {
                      return err;
                  } );
              } else {
                  res.status(200).send(
                      new response(false, 401, 'Fetch Failed')
                  )
              }
          }else {
              res.status(200).send(
                  new response(false, 401, 'Fetch Failed')
              )
          }
      })
      
    } else {
      res
      .status(200)
      .send(new response(false, 400, 'Invalid input format'))
    }
  } catch(error){
    console.log(error);
    res
    .status(500)
    .send(new response(false, 500, 'Something went wrong'))
  }
}

exports.exportPolling = async(req, res)=> {
  try {
    const body = {
    post        : req.body.post || null,
    posted_by   : req.body.posted_by || null,
    create_date : req.body.create_date || null,
    } 

        const polling = await post.Export(body);
        console.log(polling);
        
              // const title = await JobRecommend.getTitle(body)
              // var titleName = '';
              // const x = title.map(data=>{ titleName = data.title })
              // // console.log(titleName);
              
              
              // if (utility.issetVal(title)) {
              //   let fileName = titleName+'-'+ moment(Date.now()).format('DD-MM-YYYY')+ '.xlsx'
              //   const data = await JobRecommend.getRecommend(body)
              //   if(data){
              //   var workbook = new Excel.Workbook();
              //   var worksheet = workbook.addWorksheet('Sheet');
              //   var fill = {
              //     type: 'pattern',
              //     pattern:'solid',
              //     fgColor:{ argb:'F4B084'}
              //   }
              //   var font = {bold: true}
              //   worksheet.getCell('A1').fill = fill;
              //   worksheet.getCell('A1').font = font;

              //   worksheet.getCell('B1').fill = fill;
              //   worksheet.getCell('B1').font = font;

              //   worksheet.getCell('C1').fill = fill;
              //   worksheet.getCell('C1').font = font;

              //   worksheet.getCell('D1').fill = fill;
              //   worksheet.getCell('D1').font = font;

              //   worksheet.getCell('E1').fill = fill;
              //   worksheet.getCell('E1').font = font;
              //   workbook.views = [
              //       {
              //           x: 0, y: 0, width: 10000, height: 20000,
              //           firstSheet: 0, activeTab: 1, visibility: 'visible'
              //       }
              //   ];
                
                
                          
              //     worksheet.columns = [
              //       {header: '#', key: 'no'},
              //       {header: 'Recommender Name', key: 'name', width: 20},
              //       {header: 'Recommended Email', key: 'email', width: 30}, 
              //       {header: 'Recommended Email', key: 'title', width: 30}, 
              //       {header: 'Recommended Date', key: 'date', width: 20, type: 'date', formulae: [new Date(2019, 0, 1)]}
              //     ];
              //     data.forEach((element,i) => {
              //         element["no"]= i+1
              //         worksheet.addRow(element).commit();
              //         });
              
                  
          
              // res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
              // res.setHeader("Content-Disposition", "attachment; filename=" + fileName);
              // res.set('Set-Cookie', 'fileDownload=true; path=/')
              // workbook.xlsx.write(res)
              //     .then(function (data) {
              //         res.end();
              //         console.log(`Export Feedback Success!`);
              //     });
              // }
                
              // }else{
              //   res.status(200).send(new response(false, 401, "No Data"));
              // }
            // })
  } catch (error){
    console.log(error);
    res
    .status(500)
    .send(new response(false, 500, 'Something went wrong'))
  }
}