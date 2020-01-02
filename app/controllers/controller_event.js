var event = require('../models/event')
var eventHashtag = require('../models/eventHashtag')
var eventComments = require('../models/eventComments')
var eventLikes = require('../models/eventLikes')
var admin = require('../models/admin')
var user = require('../models/user')
var hashtag = require('../models/hashtag')
var eventImages = require('../models/eventImages')
const device = require('../models/device')
const notification = require('../models/notification')

let response = require('../../helpers/response')
const utility = require('../../helpers/utility')
const nodemailer = require('../../helpers/mail_adapter');
let moment = require('moment')
const formidable = require('formidable')
const path = require('path');
const fs = require('fs');
let appDir = path.dirname(require.main.filename);
let pathDir = appDir + '/uploads/event/'
let _ = require('lodash');
const globals = require('../../configs/global')

//setting fcm
const { config } = require('../../default')
let {firebase} = globals[config.environment];


exports.cronJob = async (req, res) => {
  try{
    const middleware = {
      user_id      : 'required|text|'+req.body.user_id,
      auth_code    : 'required|text|'+req.body.auth_code
    }
    // console.log(globals.endpoint360);
    if(utility.validateRequest(middleware)){
        const body = {
          page    : "all",
          event_timestamp : ""
          
        }
        event.findOne(null,function(errRes,resData) {
          if(!utility.issetVal(errRes)){
            if(utility.issetVal(resData)){
              body.event_timestamp = moment(resData.event_timestamp).format('YYYY-MM-DD HH:mm:ss');
            }


            body.url = globals.endpoint360+"/api/api_event_developer.php?action=event_alumni&page="+body.page+"&event_timestamp="+body.event_timestamp;
            event.cURL(body,function(errRes,resData) {
              // console.log(body);
              if(!utility.issetVal(errRes)){
                if(utility.issetVal(resData)){
                  data = resData.data
                  if(utility.issetVal(data)){
                  
                    for(let idx = 0; idx <  data.length; idx++) {
                        let object =  data[idx];

                      
                        const bodyEvent = {
                            id              : utility.generateHash(32),
                            title           : object.title,     
                            start_date      : object.start_date,
                            end_date        : object.end_date,
                            start_time      : object.start_time,
                            end_time        : object.end_time,
                            city            : object.city,
                            province        : '',
                            zip             : '',
                            address1        : '',
                            address2        : '',
                            overview        : object.overview,
                            location_note   : '',
                            img             : '',
                            publish         : '1',
                            event_timestamp : object.event_timestamp,
                            create_date     : moment(Date.now()).format('YYYY-MM-DD HH:mm:ss')
                        }
                        if(utility.issetVal(object.img)){
                          let extenstion = path.extname(object.img);
                          let renameImages = utility.generateHash(16);
                          let newImages = renameImages+extenstion;
                          bodyEvent.img = newImages;  

                          // const bodyImages = {
                          //   id          : utility.generateHash(32),
                          //   event_id     : bodyEvent.id,
                          //   img         : newImages,
                          //   main        : 1,
                          //   create_date : moment(Date.now()).format('YYYY-MM-DD HH:mm:ss')
                          // }
                          
                          // eventImages.addData(bodyImages, function(err,resData){
                          //     // console.log({idx : resData });
                          // }) 

                          utility.processImagesAsync(object.img, renameImages, extenstion, appDir + '/uploads/event/');
                        } 
                        

                        // function to download img by curlObject
                        event.addData(bodyEvent, function(err,resData){
                            if(moment(body.start_date).format('YYYY-MM-DD HH:mm:ss') >= moment(Date.now()).format('YYYY-MM-DD HH:mm:ss')){
                              if(!utility.issetVal(err)){
                                const content = {
                                  headline : "New Event",
                                  sub_headline : utility.htmlConvertString(bodyEvent.title),
                                  type : 'event',
                                  id : bodyEvent.id,
                                  redirect  : true
                                }
                                
                  
                                let userData;
                                let promiseUser = new Promise(function(resolve, reject) {
                                  user.getAllVerified(null, (err, res)=>{
                                    if(!utility.issetVal(err)){
                                      resolve(res)
                                    
                                      userData = res
                                      return userData;
                                    }
                                  })
                                });
                                setTimeout(function(){
                                  const getDevice = new Promise((resolve, reject) => {
                                    const subject = userData
                                    device.getSpesificUser(subject,function(errRes,tokens) {
                                      console.log(errRes);
                                      if(!utility.issetVal(errRes)){
                                        if(utility.issetVal(tokens)){
                                          console.log('subject', tokens)
                                              resolve(tokens)
                                          } else {
                                              resolve()
                                          }
                                        }else {
                                            resolve()
                                        }
                                    })   
                                  })
                  
                                  Promise.all([promiseUser, getDevice]).then(arr => {
                                    console.log(arr[0])
                                    if(utility.issetVal(arr[1])){
                                        if(utility.issetVal(arr[1]['android'])){
                                            utility.requestFCM("android"
                                                    , firebase.base_url
                                                    , firebase.server_key
                                                    , arr[1]['android']
                                                    , content);
                                            // console.log('android', request)
                                            
                                        }
                                        if(utility.issetVal(arr[1]['ios'])){
                                            utility.requestFCM("ios"
                                                    , firebase.base_url
                                                    , firebase.server_key
                                                    , arr[1]['ios']
                                                    , content);
                                            // console.log('android', request)
                                        }
                                    }
                                    
                                    // Array Mapping data user
                                    _.map(arr[0], (o) => {
                                      const arrayNotification = {
                                        id              : utility.generateHash(32),
                                        sender_id       : null,
                                        recipient_id    : o,
                                        create_date     : moment(Date.now()).format('YYYY-MM-DD HH:mm:ss'),
                                        predicate       : 'create',
                                        redirect        : 1,
                                        type_id         : bodyEvent.id,
                                        type            : 'event',
                                        seen            : 0,
                                      }
                                      notification.addData(arrayNotification, (err, res)=>{
                                        utility.issetVal(err)? console.log(`submit data ${o}`, err) : null;
                                      })
                                      
                                    });
                                  }).then(arr => {
                                    // Nothing
                                    // res.status(200).send(
                                    //   new response(true, 200, 'Fetch Success', arr)
                                    // )
                                  }).catch( err => {
                                    console.log(err);
                                  } );
                                }, 1000); // assume the fetch calls finish in 1s
                  
                              }
                            }
                        }) 
                    }
                    res.status(200).send(new response(true, 200, 'cURL Success'))
                  } else {
                    res.status(200).send(
                      new response(false, 405, 'No Data Available')
                    )
                  }
                } else {
                  res.status(200).send(
                    new response(false, 405, 'No Data Available')
                  )
                }
              }else {
                res.status(200).send(
                    new response(false, 401, 'Fetch Failed3')
                )
              }
            })
          }else {
              res.status(200).send(
                  new response(false, 401, 'Fetch Failed3', errRes)
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
        user_id     : 'required|text|'+req.body.user_id,
        auth_code   : 'required|text|'+req.body.auth_code,
        page        : 'required|text|'+req.body.page,
        item        : 'no|text|'+req.body.item,
        date        : 'no|text|'+req.body.date,
        title       : 'no|text|'+req.body.title,
        hashtag     : 'no|text|'+req.body.hashtag,
        sort        : 'no|text|'+req.body.sort,        
      }
      if(utility.validateRequest(middleware)){
        const result = await admin.getAuth(req.body,function(errAuth,resAuth){
          if(!errAuth){
            if(!utility.issetVal(resAuth)){
              res.status(200).send(
              new response(false, 403, 'Unauthorized')
            )}else{
              if(resAuth.auth_code == req.body.auth_code){
                let arrayDatas = [];
                let arrayData = {};
                
                const bodyCount = {
                  sort        : req.body.sort || null,
                  title       : req.body.title || null,
                  create_date : req.body.date ||null,
                  hashtag     : req.body.hashtag || null
              }

                let promiseList = new Promise(function(resolve, reject) {
                  event.getCountData(bodyCount,function(errResCount,rowsResCount) {
                    console.log({errResCount});
                    // console.log({rowsResCount});
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
                                sort        : req.body.sort || null,
                                title       : req.body.title || null,
                                create_date : req.body.date ||null,
                                hashtag     : req.body.hashtag || null
                            }
        
                            event.newGetAll(PreparedData,function(errRes,rowsRes) {
                                // console.log('he', rowsRes)
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

                let promiseHashtag = new Promise(function(resolve, reject) {
                  eventHashtag.getAllByEvent(null, (errRes,resData) => {
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

              let promiseComments = new Promise(function(resolve, reject) {
                  eventComments.getAllByEvent({event_id :  null}, (errRes,resData) => {
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
                  eventLikes.getAllByEvent({event_id :  null}, (errRes,resData) => {
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

                Promise.all([promiseList, promiseHashtag, promiseComments, promiseLikes]).then(arr => {
                  // console.log(arr[0]);
                  if(utility.issetVal(arr[0])){
                      
                    arrayEvent      = arr[0];
                    // console.log(arrayEvent);
                    arrayHashtag    = arr[1];
                   // console.log(arrayHashtag);
                    arrayComments   = arr[2];
                    // console.log(arrayComments);
                    arrayLike       = arr[3];
                    // console.log(arrayLike);
                    arrayData.data  = []
                    dataHashtag     = [];
                    for (var i = 0; i < arrayEvent.data.length; i++) {
                     
                      if(utility.issetVal(arrayHashtag)){
                        arrayEvent.data[i].hashtag = null;
                        let arg = _.map(arrayHashtag, function(o) {
                            if (o.event_id == arrayEvent.data[i].event_id) return o;
                        });
                        // Remove undefines from the array
                        arg = _.without(arg, undefined)
                        if(utility.issetVal(arg)){
                          arrayEvent.data[i].hashtag = arg;
                        }
                      }
                      
                      if(utility.issetVal(arrayComments)){
                        let arg = _.map(arrayComments, function(o) {
                            if (o.event_id == arrayEvent.data[i].event_id) return o;
                        });
                        
                        // Remove undefines from the array
                        arg = _.without(arg, undefined)
                        arrayEvent.data[i].comment = arg.length;
                      }

                      if(utility.issetVal(arrayLike)){
                          let arg = _.map(arrayLike, function(o) {
                              if (o.event_id == arrayEvent.data[i].event_id) return o;
                          });
                          
                          // Remove undefines from the array
                          arg = _.without(arg, undefined)
                          arrayEvent.data[i].like = arg.length;
                      }
                    }
                    switch (req.body.sort) {
                      case '1':
                        arrayEvent.data = _.orderBy(arrayEvent.data, ['comment'],['asc'])
                        break;
                      case '2':
                        arrayEvent.data = _.orderBy(arrayEvent.data, ['comment'],['desc'])
                        break;  
                      case '3':
                        arrayEvent.data = _.orderBy(arrayEvent.data, ['like'],['asc'])
                        break;
                      case '4':
                        arrayEvent.data = _.orderBy(arrayEvent.data, ['like'],['desc'])
                        break;
                      default:
                        break;
                    }
                    
                    arrayData.data  = arrayEvent;
                    arrayData.total = arrayEvent.total;

                    res.status(200).send(new response(true, 200, 'Fetch Success', arrayEvent))
                  } else {
                    res.status(200).send(
                      new response(false, 401, 'Fetch Failed')
                    )
                  }
                 
                }).catch( err => {
                  console.log({err});
                  res.status(200).send(
                    new response(false, 401, 'Fetch Failed', err)
                  )
                } );
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
                event.getById(body, function(errGet,resGet) {
                  console.log(resGet);
  
                  if (!errGet) {
                      if(!utility.issetVal(resGet)){
                          res.status(200).send(
                              new response(false, 404, 'Data not exist')
                          )
                      }else{
                          event.deleteData(body, function(err,resData) {
                          // caches
                              if (!err) {
                                notification.deleteByTypeId({id : req.query.id}, (err,resData) => {
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
                          id :   req.body.id,
                      }

                      event.getById(body, function(err, resById){
                          if(!err){
                            if(utility.issetVal(req.body.hashtag)){
                              eventHashtag.deleteByEventId({event_id : body.id}, function(err,resData){
                                console.log(err);
                              })
                              let datHashtag = JSON.parse(req.body.hashtag);
                              for(let idx = 0; idx <  datHashtag.length; idx++) {
                                let object =  datHashtag[idx];
                                // console.log({idx : object});
                                hashtag.getByWord({word : object.tag}, (err, resData) => {
                                  const bodyHashtag = {
                                    event_id    : body.id,
                                    create_date : moment(Date.now()).format('YYYY-MM-DD HH:mm:ss')
                                  }
                                  if(utility.issetVal(resData)){
                                      console.log(resData);
                                      bodyHashtag.hashtag_id  = resData.id;
                                  } else {
                                    const insertHashtag = {
                                      id :  utility.generateHash(32),
                                      word :  object.tag,
                                      publish  : 1,
                                      create_date :  moment(Date.now()).format('YYYY-MM-DD HH:mm:ss')
                                    }
        
                                    hashtag.addData(insertHashtag, function(err,resData) {
                                    }) 
                                    bodyHashtag.hashtag_id  = insertHashtag.id;
                                  }
                                  eventHashtag.addData(bodyHashtag, function(err,resData){
                                    // console.log({idx : resData });
                                  }) 
                                })
                                

                              }
                              res.status(200).send(new response(true, 200, 'Update Data Success'))
                            }
                          }else{
                              console.log(req.body.hashtag);
                              res.status(200).send(
                              new response(false, 404, 'Data not exist2'))
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

exports.getDetail = async (req, res) => {
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

                            event.getById(body,function(errRes,resData) {
                                if (!errRes) {
                                    if (utility.issetVal(resData)) {
                                        let arrayDatas = [];
                                        let arrayData = {};
                                        arrayData = resData;
                                        let promiseHashtag = new Promise(function(resolve, reject) {
                                          eventHashtag.getAllByEvent({event_id : body.id}, (errRes,resData) => {
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
                                        let promiseImg = new Promise (function(resolve, reject){
                                          eventImages.getData({id : req.body.id}, (errRes, resData)=>{
                                            if(!errRes){
                                              if(utility.issetVal(resData)){
                                                  resolve(resData);
                                              } else {
                                                resolve();
                                              }
                                            } else {
                                              resolve();
                                            }
                                          })
                                        })
                                        Promise.all([promiseHashtag, promiseImg]).then(arr => {
                                          console.log({Img : arr[1]});
                                            arrayData.hashtag = null;
                                            if(utility.issetVal(arr[0])){
                                              arrayData.hashtag = arr[0];
                                            }
                                            arrayData.img_list = null;
                                            if(utility.issetVal(arr[1])){
                                              arrayData.img_list = arr[1]
                                            }
                                            res.status(200).send(new response(true, 200, 'Fetch success', arrayData))
                                        }).catch( err => {
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

exports.getDetailLike = async (req, res) => {
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
                          

                          event.getById(body,function(errRes,resData) {
                              if (!errRes) {
                                  if (utility.issetVal(resData)) {
                                      let arrayDatas = [];
                                      let arrayData = {};
                                      // arrayData = resData;
                                      let promiseList = new Promise(function(resolve, reject) {
                                        eventLikes.getCountData({event_id : body.id},function(errResCount,rowsResCount) {
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
                                                      event_id : body.id
                                                  }
                                                  eventLikes.getAll(PreparedData,function(errRes,rowsRes) {
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
                                                arrayComment.event_id    =  resComment[a].event_id;
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
                          

                          event.getById(body,function(errRes,resData) {
                              if (!errRes) {
                                  if (utility.issetVal(resData)) {
                                      let arrayDatas = [];
                                      let arrayData = {};
                                      // arrayData = resData;
                                      let promiseList = new Promise(function(resolve, reject) {
                                        eventComments.getCountData({event_id : body.id},function(errResCount,rowsResCount) {
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
                                                      event_id : body.id
                                                  }
                                                  eventComments.getAll(PreparedData,function(errRes,rowsRes) {
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
                                                arrayComment.event_id    =  resComment[a].event_id;
                                                arrayComment.user_id     =  resComment[a].user_id;
                                                arrayComment.username    =  username;
                                                arrayComment.img         =  img;
                                                arrayComment.comment     =  resComment[a].content;
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


exports.gethashtagEvent = async (req, res) => {
  try{
      const middleware = {
          user_id         : 'required|text|'+req.query.user_id,
          auth_code       : 'required|text|'+req.query.auth_code,
          id           : 'required|text|'+req.query.id,
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
                          //here goes the function
                          const body = {
                              id : req.query.id,
                          }

                          event.getById(body,function(errRes,resData) {
                              if (!errRes) {
                                  if (utility.issetVal(resData)) {
                                    eventHashtag.getAllByEventId({event_id : body.id},function(errRes,resData) {
                                      if (!errRes) {
                                          if (utility.issetVal(resData)) {
                                              let array = [];
                                              for(let idx = 0; idx <  resData.length; idx++) {
                                                  array.push(resData[idx].tag);
                                              }
                                              // console.log(array.length);
                                              res.status(200).json(array)
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
               
              eventComments.deleteData(body, function(err,resData) {
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
                              content         : req.body.comment,
                              publish         : req.body.publish
                          }

                          eventComments.updateData(body, function(err,resData) {
                              console.log(resData)
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

                          eventComments.getById(body,function(errRes,resData) {
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
                                         
                                        let arrayComment = {}
                                        let username = utility.issetVal(arr[0]) ? arr[0].name : null;
                                        let img = utility.issetVal(arr[0]) ? arr[0].img : null;
                                        arrayComment.id          =  resData._id;
                                        arrayComment.event_id     =  resData.event_id;
                                        arrayComment.user_id     =  resData.user_id;
                                        arrayComment.username    =  username;
                                        arrayComment.img         =  img;
                                        arrayComment.comment     =  resData.content;
                                        arrayComment.publish     =  resData.publish;
                                        arrayComment.create_date =  resData.create_date;
                                        arrayComment.modify_date =  resData.modify_date;


                                        res.status(200).send(new response(true, 200, 'Fetch success', arrayComment))
                                          
                                          
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
            eventComments.getCountByUser({
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
                eventComments.getAllByUser(PreparedData, function(errGet, resGet){
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

exports.getLikesByUser = async (req, res)=>{
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
            eventLikes.getCountByUser({
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
                eventLikes.getAllByUser(PreparedData, function(errGet, resGet){
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
                    .send(new response(false, 401, 'Fetch Failed2'))
                  }
                })
              } else {
                res
                .status(200)
                .send(new response(false, 401, 'Fetch Failed1')) 
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
        file.path = appDir + '/uploads/event/' + file.name;
        prepareFile.push(file.name);
      }
    })
    .on('file', (name, file) => {
      formData.push('"' +name+ '"'+ ':'+'"'+prepareFile+'"')
    })
    .on('aborted', () => {
      console.error('Request aborted by the event')
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
                    for(let idx = 0; idx <  datImg.length; idx++) {
                        let object =  datImg[idx];
                        // console.log({idx : object});

                        const bodyImages = {
                            id          : utility.generateHash(32),
                            event_id     : formJSON.id,
                            img         : object,
                            create_date : moment(Date.now()).format('YYYY-MM-DD HH:mm:ss')
                        }
                        // idx == 0? bodyImages.main  = '1' : bodyImages.main  = '0';
                        
                        eventImages.addData(bodyImages, function(err,resData){
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
                      event_id         : req.body.id,
                      id              : req.body.images_id,
                      main            : 1
                    }

                    eventImages.getById(body, function(err, resById){
                        if(!err){
                            eventImages.updateData(body, function(err,resData) {
                                if (!err) {
                                    if(!utility.issetVal(resData)){
                                        res.status(200).send(new response(false, 404, 'Data not exist1'))
                                    }else{
                                      eventImages.unPrimary(body, function(err,resData) {
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
              eventImages.getById(body, function(errGet,resGet) {
                console.log(errGet);

                if (!errGet) {
                  if(!utility.issetVal(resGet)){
                    res.status(200).send(
                      new response(false, 405, 'User not registered1')
                    )
                  }else{
                    eventImages.deleteData(body, function(err,resData) {
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

exports.deeplink  = async(req,res) => {
  try{
    const middleware = {
      user_id         : 'no|text|'+req.body.user_id,
      auth_code       : 'no|text|'+req.body.auth_code,
      id              : 'required|text|'+req.body.id,
    }
    if(utility.validateRequest(middleware)){
      const body = {
        id : req.body.id,
      }

      event.getById(body,function(errRes,resData) {
          if (!errRes) {
              if (utility.issetVal(resData)) {
                  let arrayDatas = [];
                  let arrayData = {};
                  arrayData = resData;
                  let promiseHashtag = new Promise(function(resolve, reject) {
                    eventHashtag.getAllByEvent({event_id : body.id}, (errRes,resData) => {
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
                  let promiseImg = new Promise (function(resolve, reject){
                    eventImages.getData({id : req.body.id}, (errRes, resData)=>{
                      if(!errRes){
                        if(utility.issetVal(resData)){
                            resolve(resData);
                        } else {
                          resolve();
                        }
                      } else {
                        resolve();
                      }
                    })
                  })
                  Promise.all([promiseHashtag, promiseImg]).then(arr => {
                    console.log({Img : arr[1]});
                      if(utility.issetVal(arr[0])){
                        arrayData.hashtag = arr[0];
                      }
                      if(utility.issetVal(arr[1])){
                        arrayData.img_list = arr[1]
                      }
                      res.status(200).send(new response(true, 200, 'Fetch success', arrayData))
                  }).catch( err => {
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