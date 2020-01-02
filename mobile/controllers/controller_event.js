const event = require('../models/event')
const eventHashtag = require('../models/eventHashtag')
const eventLikes = require('../models/eventLikes')
const eventComments = require('../models/eventComments')
const eventCommentLikes = require('../models/eventCommentLikes')
const eventShare = require('../models/eventShareds')
const eventImages = require('../models/eventImages')

var user = require('../models/user')
let response = require('../../helpers/response')
const utility = require('../../helpers/utility')
const globals = require('../../configs/global')
const { config } = require('../../default')
const path = require('path');
const fs = require('fs');
let moment = require('moment');
let url = globals[config.environment]; // development || production
let appDir = path.dirname(require.main.filename);
let pathDir = appDir + '/uploads/event/'

const eventBookmark = require('../models/EventBookmarks')
const notification  = require('../models/notification')
const device = require('../models/device')

//setting fcm
let {firebase} = globals[config.environment];


exports.getDetail = async (req, res) => {
  try{
      const middleware = {
          user_id      : 'required|text|'+req.body.user_id,
          auth_code    : 'required|text|'+req.body.auth_code,
          id           : 'required|text|'+req.body.id,
      }
      if(utility.validateRequest(middleware)){
          const result = await user.getAuth(req.body,function(errAuth,resAuth){
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
                              id : req.body.id,
                          }

                          event.getById(body,function(errRes,resData) {
                            console.log({resData});
                              if (!errRes) {
                                  if (utility.issetVal(resData)) {
                                      // let arrayDatas = [];
                                      let arrayData = {};
                                     
                                    
                                      arrayData = resData;
                                      if(utility.issetVal(arrayData.img)){
                                        arrayData.img = url.url_img+'event/'+arrayData.img;
                                      }
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

                                      let promiseLikes = new Promise(function(resolve, reject) {

                                        eventLikes.getAllByEvent({event_id : body.id}, (errRes,resLikes) => {
                                            if(!errRes){
                                                if(utility.issetVal(resLikes)){
                                                    resolve(resLikes);
                                                } else {
                                                    resolve();
                                                }
                                            } else {
                                                resolve();
                                            }
                                        });
                                      });
                                      
                                      let promiserelated = new Promise(function(resolve, reject) {
                                        event.relatedQuery({event_id : body.id}, (errRes,resRelated) => {
                                          console.log(errRes);
                                          console.log(resRelated);
                                            if(!errRes){
                                                if(utility.issetVal(resRelated)){
                                                    resolve(resRelated);
                                                } else {
                                                    resolve();
                                                }
                                            } else {
                                                resolve();
                                            }
                                        });
                                        
                                      });

                                      let promiseBookmark = new Promise(function(resolve, reject){
                                        eventBookmark.getData({event_id : req.body.id, user_id : req.body.user_id }, (errBook, resBook)=>{
                                          if(utility.issetVal(resBook)){
                                            resolve(resBook)
                                          } else {
                                            resolve()
                                          }
                                        })
                                      })

                                      let promiseShared = new Promise(function(resolve, reject){
                                        eventShare.getCount({event_id : req.body.id}, (errShare, resShare)=>{
                                          if(!errShare){
                                            resolve(resShare)
                                          } else {
                                            resolve()
                                          }
                                        })
                                      })

                                      let promiseEventImages = new Promise(function(resolve, reject){
                                        eventImages.getData({id : req.body.id}, function(err,res ){       
                                            console.log('err',err); 
                                            console.log('res',err); 
                                            console.log('id',response.id);        
                                            if(!utility.issetVal(err)){
                                                // console.log(req);
                                                if(utility.issetVal(res)){
                                                    resolve(res)
                                                } else {
                                                    resolve()
                                                }
                                                // console.log(resData);
                                            } else {
                                                resolve()
                                            }
                                        })
                                    })

                                      Promise.all([promiseHashtag, promiseLikes, promiserelated,promiseBookmark, promiseShared, promiseEventImages]).then(arr => {
                                        console.log({promiseBookmark : arr[3]});
                                        console.log({promiseShared : arr[4]});
                                        if(utility.issetVal(arr[1])){
                                          if(arr[1][0].user_id == req.body.user_id){
                                            arrayData.liked = 1
                                          } else {
                                            arrayData.liked = 0
                                          }
                                        } else {
                                          arrayData.liked = 0
                                        }
                                        if(utility.issetVal(arr[1])){
                                          arrayData.like = arr[1].length;
                                        } else {
                                          arrayData.like = 0;
                                        }
                                        // arrayData.share = 10;
                                        // arrayData.like  = 10;
                                        arrayRelated  = arr[2];
                                        arrayImages  = arr[5];
                                        
                                        if(utility.issetVal(arr[3])){
                                          arrayData.Bookmark = 1
                                        } else {
                                          arrayData.Bookmark = 0
                                        }
                                        
                                        arrayData.Shared = arr[4]
                                        
                                        if(utility.issetVal(arr[0])){
                                          arrayData.hashtag = arr[0];
                                        }

                                        if(utility.issetVal(arrayRelated)){
                                          arrayData.related = [];
                                          // arrayData.related = arrayRelated;
                                          for (var num = 0; num < arrayRelated.length; num++) {
                                            let newArray = {
                                              id          : arrayRelated[num].id,
                                              img         : url.url_img+'event/'+arrayRelated[num].img,
                                              start_date  : arrayRelated[num].start_date,
                                              end_date    : arrayRelated[num].end_date,
                                              city        : arrayRelated[num].city,
                                              province    : arrayRelated[num].province,
                                              title       : arrayRelated[num].title,
                                            }
                                            arrayData.related.push(newArray);
                                          }
                                        }

                                        if(utility.issetVal(arr[5])){
                                          let eventImg = []
                                          let arrayImg = {}
                                          arrayData.images = [];
                                       
                                          arr[5].map(resImages => {
                                            console.log(resImages)
                                              arrayImg = resImages
                                              arrayImg.img = url.url_img+'event/'+arrayImg.img;
                                              eventImg.push(arrayImg);
                                              arrayData.images = eventImg
                                          })
                                        } else {
                                          arrayData.images = null
                                        }
                                      
                                        // arrayDatas.push(arrayData);
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

exports.getAllUpComing = async (req, res) => {
  try{
    const middleware = {
      user_id      : 'required|text|'+req.body.user_id,
      auth_code    : 'required|text|'+req.body.auth_code,
      page         : 'required|text|'+req.body.page,
    }
    if(utility.validateRequest(middleware)){
      if(Number(req.body.page)){
        const result = await user.getAuth(req.body,function(errAuth, resAuth){
          if(!errAuth){
            if(!utility.issetVal(resAuth)){
              res.status(200).send(
                new response(false, 403, 'Unauthorized')
              )
            }else{
              event.countGetAllUpComing({ now : moment(Date.now()).format('YYYY-MM-DD HH:mm:ss')}, function(errCount, resCount){
                // console.log({errCount});
                // console.log({resCount});
                if(errCount){
                  res.status(200).send(
                    new response(false, 401, 'No data')
                  )
                }else{
                  var itemPerPage = 5
                  var options = {
                    user_id : req.body.user_id,
                    start : req.body.page <= 1 || req.body.page == null ? 0 : (req.body.page-1) * itemPerPage,
                    limit : itemPerPage,
                    now : moment(Date.now()).format('YYYY-MM-DD HH:mm:ss')
                  }
                  event.getAllUpComing(options, function(errRes, resData){
                    // console.log({errRes});
                    // console.log({resData});
                    if(!utility.issetVal(errRes)){
                      if(utility.issetVal(resData)){
                        const totalInfo = {
                          total_page : Math.ceil(resCount / itemPerPage),
                          total_data_all : resCount,
                          total_data : resData.length,
                        }
                        var datas = {
                          data: resData,
                          total :totalInfo
                        }
                        
                        for (var i = 0; i < resData.length; i++) {
                          if(!utility.issetVal(resData[i].img)){
                            datas.data[i].img = null;
                          } else {
                            datas.data[i].img = url.url_img+'event/'+datas.data[i].img;
                          }
                        }

                        res.status(200).send(
                          new response(true, 200, 'Data exist', datas)
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

exports.getAllPast = async (req, res) => {
  try{
    const middleware = {
      user_id      : 'required|text|'+req.body.user_id,
      auth_code    : 'required|text|'+req.body.auth_code,
      page         : 'required|text|'+req.body.page,
    }
    if(utility.validateRequest(middleware)){
      if(Number(req.body.page)){
        const result = await user.getAuth(req.body,function(errAuth, resAuth){
          if(!errAuth){
            if(!utility.issetVal(resAuth)){
              res.status(200).send(
                new response(false, 403, 'Unauthorized')
              )
            }else{
              event.countGetAllPast({ now : moment(Date.now()).format('YYYY-MM-DD HH:mm:ss')}, function(errCount, resCount){
                if(errCount){
                  res.status(200).send(
                    new response(false, 401, 'No data')
                  )
                }else{
                  var itemPerPage = 5
                  var options = {
                    start : req.body.page <= 1 || req.body.page == null ? 0 : (req.body.page-1) * itemPerPage,
                    limit : itemPerPage,
                    now : moment(Date.now()).format('YYYY-MM-DD HH:mm:ss')
                  }
                  event.getAllPast(options, function(errRes, resData){
                    if(!utility.issetVal(errRes)){
                      if(utility.issetVal(resData)){
                        const totalInfo = {
                          total_page : Math.ceil(resCount / itemPerPage),
                          total_data_all : resCount,
                          total_data : resData.length,
                        }
                        var datas = {
                          data: resData,
                          total :totalInfo
                        }
                        
                        for (var i = 0; i < resData.length; i++) {
                          if(!utility.issetVal(resData[i].img)){
                            datas.data[i].img = null;
                          } else {
                            datas.data[i].img = url.url_img+'event/'+datas.data[i].img;
                          }
                        }

                        res.status(200).send(
                          new response(true, 200, 'Data exist', datas)
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

exports.getHome = async (req, res) => {
  try{
    const middleware = {
      user_id      : 'required|text|'+req.body.user_id,
      auth_code    : 'required|text|'+req.body.auth_code
    }
    if(utility.validateRequest(middleware)){
      const result = await user.getAuth(req.body,function(errAuth,resAuth){
          console.log(errAuth);
        if(!errAuth){
          if(!utility.issetVal(resAuth)){
            res.status(200).send(
              new response(false, 403, 'Unauthorized')
            )
          }else{
            let body = {
                user_id : req.body.user_id,
                now : moment(Date.now()).format('YYYY-MM-DD HH:mm:ss')
            }
            event.getHome(body, function(errRes, resData){
                console.log(errRes)
                if(!utility.issetVal(errRes)){
                    if(utility.issetVal(resData)){
                      for(let i = 0; i < resData.length; i++){
                          resData[i].img = url.url_img+'event/'+resData[i].img;
                      }

                      res.status(200).send(
                          new response(true, 200, 'Data exist', resData)
                      )
                    }else{
                      res.status(200).send(
                          new response(false, 401, 'No data2')
                      )
                    }
                }else{
                    res.status(200).send(
                    new response(false, 401, 'No data1')
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

exports.insertComment = async (req, res) => {
  try {
      const middleware = {
        user_id   : 'required|text|'+req.body.user_id,
        auth_code : 'required|text|'+req.body.auth_code,
        content   : 'required|text|'+req.body.content,
        id        : 'required|text|'+req.body.id,
      }
      if(utility.validateRequest(middleware)){
          const result = await user.getAuth(req.body,function(errAuth,resAuth){
            // console.log(errAuth);
            if(!errAuth){
              if(!utility.issetVal(resAuth)){
                res.status(200).send(new response(false, 403, 'Unauthorized'))
              }else{
                if(resAuth.auth_code == req.body.auth_code){
                  const body = {
                    event_id    : req.body.id,
                    user_id     : req.body.user_id,
                    content     : req.body.content,
                    comment_type: 'event',
                    create_date : moment(Date.now()).format('YYYY-MM-DD HH:mm:ss')
                  }
                  
                  eventComments.addData(body, function(err,resData) {
                    if (!err) {
                      let mentioned = null;
                      if(utility.issetVal(req.body.mentioned_list)){
                        mentioned = JSON.parse(req.body.mentioned_list).map(el => {
                          return el;
                        })
                      }
    
                      if(utility.issetVal(mentioned)){
    
                        let tNotif = mentioned.map(id =>{
                          let bodyNotif = {
                              id              : utility.generateHash(32),
                              sender_id       : body.user_id,
                              recipient_id    : id,
                              predicate       : 'commentMention',
                              type_id         : resData.event_id,
                              object          : resData._id,
                              type            : 'event',
                              seen            : 0,
                              create_date     : moment(new Date()).format("YYYY-MM-DD hh:mm:ss"),
                              redirect        : 1
                          }
                          notification.addData(bodyNotif, function(errNotif, resNotif){
                            console.log('erNotif Mention', errNotif)
                            console.log('resNotif Mention', bodyNotif)
                          }) 
                        })
                        const bodyContent = {
                            headline      : resAuth.name+' mentioned you',
                            sub_headline  : 'in a comment : "'+utility.htmlConvertString(req.body.content)+'"',
                            type          : 'event_comment_mention',
                            redirect      : true,
                            id            : body.id
                        }
    
                        const getDevice = new Promise((resolve, reject)=>{
                            device.getSpesificUser(mentioned, function(errRes, tokens){
                              // console.log('err', mentioned);
                              // console.log('tokens', tokens);
                                utility.issetVal(tokens) ? resolve(tokens) : resolve(tokens);
                            })
                        })
    
                        Promise.all([getDevice])
                        .then(arr=>{
                            // console.log(arr[0])
                            let requests = "";
                            if(utility.issetVal(arr[0])){
                                if(utility.issetVal(arr[0]['android'])){
                                    requests = utility.requestFCM("android"
                                            , firebase.base_url
                                            , firebase.server_key
                                            , arr[0]['android']
                                            , bodyContent);
                                    // console.log('android', request)
                                    
                                }
                                if(utility.issetVal(arr[0]['ios'])){
                                    requests = utility.requestFCM("ios"
                                            , firebase.base_url
                                            , firebase.server_key
                                            , arr[0]['ios']
                                            , bodyContent);
                                    // console.log('android', request)
                                }
                            }
                        })
    
                      }
                      res.status(200).send(new response(true, 200, 'Insert Data success', resData));
                    } else {
                      res.status(200).send(new response(false, 400, 'Insert Data failed'));
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

exports.submitLikeComment = async (req, res) => {
  try {
      const middleware = {
        user_id   : 'required|text|'+req.body.user_id,
        auth_code : 'required|text|'+req.body.auth_code,
        event_id  : 'required|text|'+req.body.event_id,
        comment_id: 'required|text|'+req.body.comment_id,
      }
      if(utility.validateRequest(middleware)){
          const result = await user.getAuth(req.body,function(errAuth,resAuth){
            console.log(errAuth);
            if(!errAuth){
              if(!utility.issetVal(resAuth)){
                res.status(200).send(new response(false, 403, 'Unauthorized'))
              }else{
                if(resAuth.auth_code == req.body.auth_code){
                  if(req.body.status  == '1'){
                    /* LIKE */
                    let bodyEventComment = {
                      body : {
                        id : req.body.comment_id 
                      }
                    }
                    eventComments.getById(bodyEventComment, function(errGet, resComment){
                      // console.log({errGet});
                      // console.log({resComment});
                      if(utility.issetVal(resComment)){
                        const body = {
                          event_id  : req.body.id,
                          user_id  : req.body.user_id,
                          comment_id : req.body.comment_id,
                          create_date     : moment(Date.now()).format('YYYY-MM-DD HH:mm:ss')
                        }
                        eventCommentLikes.addData(body, function(errAdd, resAdd){
                          // console.log({errAdd});
                          if(!errAdd){
                            if(resComment.user_id != req.body.user_id){
                              let bodyNotif = {
                                id                : utility.generateHash(32),
                                sender_id         : req.body.user_id,
                                recipient_id      : resComment.user_id,
                                predicate         : 'commentLike',
                                type_id           : req.body.event_id,
                                type              : 'event',
                                seen              : 0,
                                create_date       : moment(new Date()).format("YYYY-MM-DD hh:mm:ss"),
                                redirect          : 1,
                                object            : req.body.comment_id
                              }
                              notification.addData(bodyNotif, function(errNotif, resNotif){
                                if(!errNotif){
                                  const content = {
                                    headline        : resAuth.name,
                                    sub_headline    : 'Liked Your Comment',
                                    type            : 'event_comment_like',
                                    redirect        : true,
                                    id              : req.body.event_id
                                  }
                                  const getDevice = new Promise((resolve,reject)=>{
                                    device.getSpesificUser([resComment.user_id], function(errRes, tokens){
                                      utility.issetVal(tokens) ? resolve(tokens) : resolve(tokens);
                                    })
                                  })
                                  Promise.all([getDevice])
                                  .then(arr=>{
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
                              
                            }
                           
                            res
                              .status(200)
                              .send(new response(true, 200, 'Submit Like Comment Success'))
                          } else {
                            res.status(200).send(new response(false, 401, 'Submit Like failed1'))
                          }
                        })
                      } else {
                        //COmmennt tidak tersedia
                      }
                    })
                  }else {
                    /* UNLIKE */
                    const body = {
                      event_id : req.body.id,
                      user_id : req.body.user_id
                    }
                    eventCommentLikes.getData(body, function(errData, resData){
                      if(utility.issetVal(resData)){
                        const body = {
                          id : resData[0]._id
                        }
                        eventCommentLikes.deleteData(body, function(errDel, resDel){
                          if(!errDel){
                            res.status(200).send(new response(true, 200, 'Submit Unlike Succes'))
                          } else {
                            res.status(200).send(new response(false, 401, 'Submit Unlike failed'))
                          }
                        })
                      } else {
                        res.status(200).send(new response(false, 401, 'Submit Unlike failed'))
                      }
                    })
                  }
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

exports.submitLike = async (req, res) => {
  try {
      const middleware = {
        user_id   : 'required|text|'+req.body.user_id,
        auth_code : 'required|text|'+req.body.auth_code,
        id        : 'required|text|'+req.body.id,
        status    : 'required|number|'+req.body.status
      }
      if(utility.validateRequest(middleware)){
          const result = await user.getAuth(req.body,function(errAuth,resAuth){
            // console.log(errAuth);
            if(!errAuth){
              if(!utility.issetVal(resAuth)){
                res.status(200).send(new response(false, 403, 'Unauthorized'))
              }else{
                if(resAuth.auth_code == req.body.auth_code){
                  if(req.body.status  == '1'){
                    const body = {
                      id          : req.body.id,
                      event_id    : req.body.id,
                      user_id     : req.body.user_id,
                    }
                    /* LIKE */
                    eventLikes.addData(body, function(errAdd, resAdd){
                      if(!errAdd){
                        res.status(200).send(new response(true, 200, 'Submit Like Succes'))
                        
                      } else {
                        res.status(200).send(new response(false, 401, 'Submit Like failed'))
                      }
                    })
                    
                  }else {
                    /* UNLIKE */
                    const body = {
                      event_id : req.body.id,
                      user_id : req.body.user_id
                    }
                    eventLikes.getData(body, function(errData, resData){
                      if(utility.issetVal(resData)){
                        const body = {
                          id : resData[0]._id
                        }
                        eventLikes.deleteData(body, function(errDel, resDel){
                          if(!errDel){
                            res.status(200).send(new response(true, 200, 'Submit Unlike Succes'))
                          } else {
                            res.status(200).send(new response(false, 401, 'Submit Unlike failed'))
                          }
                        })
                      } else {
                        res.status(200).send(new response(false, 401, 'Submit Unlike failed'))
                      }
                    })
                  }
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

exports.getLikes = async (req, res) =>{
  console.log('Get Likes Event');
  try {
    const middleware = {
      user_id         : 'required|text|'+req.body.user_id,
      auth_code       : 'required|text|'+req.body.auth_code,
      id              : 'required|text|'+req.body.id,
      page            : 'required|number|'+req.body.page,
      item            : 'no|number|'+req.body.item
    }
    if(utility.validateRequest(middleware)){
      await user.getAuth(req.body, function(errAuth, resAuth){
        console.log({errAuth : errAuth});
        // console.log({resAuth : resAuth});
        if(utility.issetVal(resAuth)){
          if(resAuth.auth_code == req.body.auth_code){
            let body = {
              id : req.body.id
            }
            event.getById(body, function(errGet, resGet){
              // console.log({errGet : errGet});
              // console.log({resGet : resGet});
              if(utility.issetVal(resGet)){
                let body = {
                  event_id : req.body.id
                }
                eventLikes.getCountData(body,function (errCount, resCount){
                  // console.log({errCount : errCount})
                  console.log({resCount : resCount});
                  if(utility.issetVal(resCount)){
                    let itemPerRequest = utility.issetVal(req.body.item)?  parseInt(req.body.item) : 15;
                    let page = req.body.page;
                    let total_data =  resCount;
                    let total_page = Math.ceil(total_data / itemPerRequest);
      
                    let limitBefore = page <= 1 || page == null ? 0 : (page-1) * itemPerRequest;

                    let body = {
                      event_id : req.body.id,
                      start   : limitBefore,
                      limit   : itemPerRequest,
                    }
                    eventLikes.getLikes(body, function(errGet, resGet){
                      console.log({errGet : errGet});
                      // console.log({resGet : resGet});
                      if(utility.issetVal(resGet)){
                        const totalInfo = {
                          total_page : total_page,
                          total_data_all : total_data,
                          total_data : resGet.length
                        }
                        res
                        .status(200)
                        .send(new response(true, 200, 'Fetch Succes', {
                          data : resGet,
                          total: totalInfo
                        } ))
                      } else {
                        // console.log(errGet);
                        // console.log('Error getLikes');
                        res.status(200).send(new response(false, 401, 'Fetch Failed2'))
                      }
                    })
                  } else {
                    res.status(200).send(new response(false, 401, 'Fetch Failed1'))
                    // Count data ERROR
                  }
                })
              } else {
                //tidak ada event yang di cari
                res.status(200).send(new response(false, 405, 'No Data'))
              }
            }) 
          } else {
            // auth code tidak ditemukan
            res.status(200).send(new response(false, 403, 'Unauthorized'))
          }
        } else {
          // Saat user id tidak di temukan
          res.status(200).send(new response(false, 403, 'Unauthorized'))
        }
      })
    } else {
      res.status(200).send(new response(false, 400, 'Invalid input format', middleware))
    }
  } catch {
    res.status(500).send(new response(false, 500, 'Something went wrong'))
  }
}

exports.getCommentLikes = async(req, res)=> {
  try {
    const middleware = {
      user_id         : 'required|text|'+req.body.user_id,
      auth_code       : 'required|text|'+req.body.auth_code,
      comment_id      : 'required|text|'+req.body.comment_id,
      page            : 'required|number|'+req.body.page,
      item            : 'no|number|'+req.body.item
    }
    if(utility.validateRequest(middleware)){
      await user.getAuth(req.body, (errAuth,  resAuth) => {
        console.log({errAuth});
        if(utility.issetVal(resAuth)){
          if(resAuth.auth_code == req.body.auth_code){
            let param = {
              body : {
                id : req.body.comment_id
              }
            }
            eventComments.getById(param, (errId, resId)=> {
              console.log({errId});
              console.log({resId});
              if(utility.issetVal(resId)){
                eventCommentLikes.getCountData({comment_id : req.body.comment_id}, (errCount, resCount)=> {
                  console.log({resCount});
                  let itemPerRequest = utility.issetVal(req.body.item)?  parseInt(req.body.item) : 15;
                  let page = req.body.page;
                  let total_data =  resCount;
                  let total_page = Math.ceil(total_data / itemPerRequest);
    
                  let limitBefore = page <= 1 || page == null ? 0 : (page-1) * itemPerRequest;

                  let body = {
                    comment_id : req.body.comment_id,
                    start   : limitBefore,
                    limit   : itemPerRequest,
                  }
                  if(utility.issetVal(resCount)){
                    eventCommentLikes.getByComment(body, (errLike, resLike)=> {
                      console.log({resLike});
                      if(utility.issetVal(resLike)){
                        const totalInfo = {
                          total_page : total_page,
                          total_data_all : total_data,
                          total_data : resLike.length
                        }
                        resLike =  resLike.map(data => {
                          data.event_id = resId.event_id
                          return data
                        })
                        res
                        .status(200)
                        .send(new response(true, 200,'Fetch Succes', {
                          data : resLike,
                          total: totalInfo
                        }))
                      } else {
                        res.status(200).send(new response(false, 401, 'Fetch Failed'))
                      }
                    })
                  } else {
                    res.status(200).send(new response(false, 401, 'Fetch Failed'))
                  }
                })
              } else {
                res
                .status(200)
                .send(new response(false, 405, 'No Data'))
              }
            })
          }else {
            res
            .status(200)
            .send(new response(false, 403, 'Unauthorized 2'))
          }
        } else {
          res
          .status(200)
          .send(new response(false, 403, 'Unauthorized 1'))
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

exports.getComment = async (req, res) =>{
  console.log('Get Likes Event');
  try {
    const middleware = {
      user_id         : 'required|text|'+req.body.user_id,
      auth_code       : 'required|text|'+req.body.auth_code,
      id              : 'required|text|'+req.body.id,
      page            : 'required|number|'+req.body.page,
      item            : 'required|number|'+req.body.item
    }
    if(utility.validateRequest(middleware)){
      await user.getAuth(req.body, function(errAuth, resAuth){
        console.log({errAuth : errAuth});
        // console.log({resAuth : resAuth});
        if(utility.issetVal(resAuth)){
          if(resAuth.auth_code == req.body.auth_code){
            let body = {
              id : req.body.id
            }
            event.getById(body, function(errGet, resGet){
              console.log({errGet : errGet});
              console.log({resGet : resGet});
              if(utility.issetVal(resGet)){
                let body = {
                  event_id : req.body.id
                }
                eventComments.getCountData(body,function (errCount, resCount){
                  // console.log({errCount : errCount})
                  console.log({resCount : resCount});
                  if(utility.issetVal(resCount)){
                    let itemPerRequest = utility.issetVal(req.body.item)?  parseInt(req.body.item) : 15;
                    let page = req.body.page;
                    let total_data =  resCount;
                    let total_page = Math.ceil(total_data / itemPerRequest);
      
                    let limitBefore = page <= 1 || page == null ? 0 : (page-1) * itemPerRequest;

                    let body = {
                      event_id : req.body.id,
                      user_id : req.body.user_id,
                      start   : limitBefore,
                      limit   : itemPerRequest,
                    }
                    eventComments.getComment(body, function(errGet, resGet){
                      console.log({errGet : errGet});
                      // console.log({resGet : resGet});
                      if(utility.issetVal(resGet)){
                        const totalInfo = {
                          total_page : total_page,
                          total_data_all : total_data,
                          total_data : resGet.length
                        }
                        res
                        .status(200)
                        .send(new response(true, 200, 'Fetch Succes', {
                          data : resGet,
                          total: totalInfo
                        } ))
                      } else {
                        // console.log(errGet);
                        // console.log('Error getLikes');
                        res.status(200).send(new response(false, 401, 'Fetch Failed2'))
                      }
                    })
                  } else {
                    res.status(200).send(new response(false, 401, 'Fetch Failed1'))
                    // Count data ERROR
                  }
                })
              } else {
                //tidak ada event yang di cari
                res.status(200).send(new response(false, 405, 'No Data'))
              }
            }) 
          } else {
            // auth code tidak ditemukan
            res.status(200).send(new response(false, 403, 'Unauthorized'))
          }
        } else {
          // Saat user id tidak di temukan
          res.status(200).send(new response(false, 403, 'Unauthorized'))
        }
      })
    } else {
      res.status(200).send(new response(false, 400, 'Invalid input format', middleware))
    }
  } catch {
    res.status(500).send(new response(false, 500, 'Something went wrong'))
  }
}

exports.submitBookmark = async(req, res) =>{
  console.log('Event Submit Broomark');
  try{
    const middleware = {
      user_id      : 'required|text|'+req.body.user_id,
      auth_code    : 'required|text|'+req.body.auth_code,
      event_id     : 'required|text|'+req.body.event_id,
      status       : 'required|text|'+req.body.status
    }
    if(utility.validateRequest(middleware)){
      const result = await user.getAuth(req.body,function(errAuth,resAuth){
        console.log({errAuth});
        if(!errAuth){
          if(!utility.issetVal(resAuth)){
            res.status(200).send(
              new response(false, 403, 'Unauthorized')
            )
          }else{
            // console.log({resAuth});
            // console.log(req.body);
            if(resAuth.auth_code == req.body.auth_code){
              if(req.body.status == '1'){
                event.getById({id : req.body.event_id},(errGet, resNews)=>{
                  if(utility.issetVal(resNews)){
                    // console.log(resNews);
                    let bodyBookmark = {
                      event_id     :  req.body.event_id,
                      user_id       :  req.body.user_id,
                      create_date :  moment(Date.now()).format('YYYY-MM-DD HH:mm:ss')
                    }
                    eventBookmark.addData(bodyBookmark, (errAdd, resAdd)=>{
                      console.log(errAdd)
                      if(!errAdd){
                        res.status(200).send(
                          new response(true, 200, 'Insert Succes')
                        )
                      } else {
                        res.status(200).send(
                          new response(false, 401, 'Insert Failed')
                        )
                      }
                    })
                  } else {
                    res.status(200).send(
                      new response(false, 404, 'Data Not Exist')
                    )
                  }
                })
              } else {
                eventBookmark.getData({event_id : req.body.event_id},(errGet, [resBookmark])=>{
                  console.log({resBookmark});
                  if(utility.issetVal(resBookmark)){
                    eventBookmark.deleteData({id : resBookmark.id}, (errDel, resDel)=>{
                      console.log({errDel});
                      console.log({resDel});
                      if(utility.issetVal(resDel)){
                        res.status(200).send(
                          new response(true, 200, 'Delete Succes')
                        )
                      } else {
                        res.status(200).send(
                          new response(false, 401, 'Delete Failed')
                        )
                      }
                    })
                  } else {
                    res.status(200).send(
                      new response(false, 404, 'Data Not Exist')
                    )
                  }
                })
              }
            } else {
              res.status(200).send(
                new response(false, 403, 'Unauthorized3')
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
    res.status(500).send(
      new response(false, 500, 'Something went wrong')
    )
  }
}

exports.submitShare = async(req, res) =>{
  try{
    const middleware = {
      user_id      : 'required|text|'+req.body.user_id,
      auth_code    : 'required|text|'+req.body.auth_code,
      event_id     : 'required|text|'+req.body.event_id,
    }
    if(utility.validateRequest(middleware)){
      const result = await user.getAuth(req.body,function(errAuth,resAuth){
        console.log({errAuth});
        if(!errAuth){
          if(!utility.issetVal(resAuth)){
            res.status(200).send(
              new response(false, 403, 'Unauthorized')
            )
          }else{
            // console.log({resAuth});
            // console.log(req.body);
            if(resAuth.auth_code == req.body.auth_code){
              event.getById({id : req.body.event_id},(errGet, resNews)=>{
                if(utility.issetVal(resNews)){
                  console.log(resNews);
                  let bodyBookmark = {
                    event_id    :  req.body.event_id,
                    user_id     :  req.body.user_id,
                    create_date :  moment(Date.now()).format('YYYY-MM-DD HH:mm:ss')
                  }
                  eventShare.addData(bodyBookmark, (errAdd, resAdd)=>{
                    if(!errAdd){
                      res.status(200).send(
                        new response(true, 200, 'Insert Succes')
                      )
                    } else {
                      res.status(200).send(
                        new response(false, 401, 'Insert Failed')
                      )
                    }
                  })
                } else {
                  res.status(200).send(
                    new response(false, 404, 'Data Not Exist')
                  )
                }
              })  
            } else {
              res.status(200).send(
                new response(false, 403, 'Unauthorized3')
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
    res.status(500).send(
      new response(false, 500, 'Something went wrong')
    )
  }
}