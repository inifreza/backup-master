const utility = require('../../helpers/utility')
const response = require('../../helpers/response')
const moment = require('moment')

//model
const alumniInterest = require('../models/AT_AlumniInterest')
const post = require('../models/post')
const postLike = require('../models/postLikes')
const user = require('../models/user')
const postComment = require('../models/postComments')
const postPolling = require('../models/postPolling')
const postHashtag = require('../models/postHashtag')
const postInterest = require('../models/postInterest')
const commentLike = require('../models/postcommentLikes')
const postResponse = require('../models/mPollingResponse')
const postReport = require('../models/postReport')
const notification  = require('../models/notification')
const device = require('../models/device')
const postComments = require('../models/postComments')
const postImages = require('../models/postImages')
const postRemoved = require('../models/postRemoved')
const hashtag = require('../models/hashtag')
const search = require('../models/search')

const formidable = require('formidable')
const path = require('path');
const fs = require('fs');
let appDir = path.dirname(require.main.filename);
let pathDir = appDir + '/uploads/post/'
let _ = require('lodash');
const globals = require('../../configs/global')

//setting fcm
const { config } = require('../../default')
let {firebase} = globals[config.environment];

exports.submitLikePost = async (req, res)=>{
  console.log('Submit Like');
  try {
    const middleware = {
      user_id         : 'required|text|'+req.body.user_id,
      auth_code       : 'required|text|'+req.body.auth_code,
      post_id         : 'required|text|'+req.body.post_id,
      status          : 'required|number|'+req.body.status
    }
    if(utility.validateRequest(middleware)){
      await user.getAuth(req.body, function(errAuth, resAuth){
        if(resAuth.auth_code == req.body.auth_code){
          if(req.body.status  == '1'){
          const body = {
            post_id  : req.body.post_id,
            user_id  : req.body.user_id,
            create_date     : moment(Date.now()).format('YYYY-MM-DD HH:mm:ss')
          }
            /* LIKE */
            postLike.addData(body, function(errAdd, resAdd){
              if(!errAdd){
                res
                .status(200)
                .send(new response(true, 200, 'Submit Like Success'))
                
                // Execute Push Notif
                post.getById({id : req.body.post_id},function(errPost, getPost){
                  // console.log({getPost});
                  if(getPost.user_id != req.body.user_id){
                    let bodyNotif = {
                      id                : utility.generateHash(32),
                      sender_id         : req.body.user_id,
                      recipient_id      : getPost.user_id,
                      predicate         : 'likes',
                      type_id           : req.body.post_id,
                      type              : 'post',
                      seen              : 0,
                      create_date       : moment(new Date()).format("YYYY-MM-DD hh:mm:ss"),
                      redirect          : 1
                    }
                    notification.addData(bodyNotif, function(errNotif, resNotif){
                      if(!errNotif){
                        const content = {
                          headline       : resAuth.name, 
                          sub_headline   : 'Liked your Post',
                          type           : "post_likes",
                          redirect       : true,
                          id             : req.body.post_id
                        }   
                        const getDevice = new Promise((resolve, reject)=>{
                            device.getSpesificUser([getPost.user_id], function(errRes, tokens){
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
                                 
                             }
                             if(utility.issetVal(arr[0]['ios'])){
                                 requests = utility.requestFCM("ios"
                                         , firebase.base_url
                                         , firebase.server_key
                                         , arr[0]['ios']
                                         , content);
                             }
                         }

                        
                        })
                      }
                    })
                  } 
                })
              } else {
                res.status(200).send(new response(false, 401, 'Submit Like failed'))
              }
            })
          }else {
            /* UNLIKE */
            const body = {
              post_id : req.body.post_id,
              user_id : req.body.user_id
            }
            postLike.getData(body, function(errData, resData){
              // console.log({errData});
              // console.log({resData});
              if(utility.issetVal(resData)){
                const body = {
                  id : resData[0]._id
                }
                postLike.deleteData(body, function(errDel, resDel){
                  if(resDel){
                    res.status(200).send(new response(true, 200, 'Submit Unlike Succes'))
                  } else {
                    res.status(200).send(new response(false, 401, 'Submit Unlike failed'))
                  }
                })
              } else {
                res
                .status(200)
                .send(new response(false, 403, 'Unauthorized2'))
              }
            })
          }
        }else {
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

exports.submitLikeComment = async (req, res) =>{
  console.log('Submit Post Like Comment');
  try {
    console.log(req.body);
    const middleware = {
      user_id         : 'required|text|'+req.body.user_id,
      auth_code       : 'required|text|'+req.body.auth_code,
      post_id         : 'required|text|'+req.body.post_id,
      status          : 'required|number|'+req.body.status,
      comment_id      : 'required|text|'+req.body.comment_id,
    }
    if(utility.validateRequest(middleware)){
      await user.getAuth(req.body, function(errAuth, resAuth){
        if(resAuth.auth_code == req.body.auth_code){
          const body = {
            id : req.body.post_id
          }
          post.getById(body, function(errGet, resGet){
            if(utility.issetVal(resGet)){
              const body = {
                  id : req.body.comment_id
              }
              postComment.getById(body, function(errGet, resGet){
                if(utility.issetVal(resGet)){
                  let status = req.body.status
                  if(status == '1'){
                    /* LIKE */
                    let body = {
                      post_id:  req.body.post_id,
                      user_id:  req.body.user_id,
                      comment_id : req.body.comment_id,
                    }
                    commentLike.addData(body, function(errAdd, resAdd){
                      if(!errAdd){
                        res
                        .status(200)
                        .send(new response(true, 200, 'Submit Comment Like Succes'))

                       
                        post.getById({id : req.body.post_id}, function(errPost, resPost){
                          if(resPost.user_id != req.body.user_id){
                            let bodyPostComment = {
                              body : {
                                id : req.body.comment_id
                              }
                            }
                            postComment.getById(bodyPostComment, function(errComent, resComent){
                              if(utility.issetVal(resComent)){
                                // res
                                // .status(200)
                                // .send(new response(true, 200, 'Submit Like Comment Success'))
                                if(resComent.user_id != req.body.user_id){
                                  let bodyNotif = {
                                    id                : utility.generateHash(32),
                                    sender_id         : req.body.user_id,
                                    recipient_id      : resComent.user_id,
                                    predicate         : 'commentLike',
                                    type_id           : req.body.post_id,
                                    type              : 'post',
                                    seen              : 0,
                                    create_date       : moment(new Date()).format("YYYY-MM-DD hh:mm:ss"),
                                    redirect          : 1,
                                    object            : req.body.comment_id
                                  }
                                   // Execute Push Notif
                                  notification.addData(bodyNotif, function(errNotif, resNotif){
                                    if(!errNotif){
                                      const content = {
                                        headline        : resAuth.name,
                                        sub_headline    : 'Liked your Comment',
                                        type            : 'post_comment_like',
                                        redirect        : true,
                                        id              : req.body.comment_id
                                      }
                                      const getDevice = new Promise((resolve,reject)=>{
                                        device.getSpesificUser([resComent.user_id], function(errRes, tokens){
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
                              } else {
                                // Nothing
                              }
                            })
                          } else {
                            res
                            .status(200)
                            .send(new response(false, 401, 'Submit Comment Like failed1'))
                          }
                        })
                      } else {
                        res
                        .status(200)
                        .send(new response(false, 401, 'Submit Comment Like failed2'))
                      }
                    })
                  } else {
                    /* UNLIKE */
                    const body = {
                      post_id : req.body.post_id,
                      user_id : req.body.user_id,
                      comment_id : req.body.comment_id
                    }
                    commentLike.getData(body, function(errData, resData){
                      if(utility.issetVal(resData)){
                        const body = {
                          id : resData[0]._id
                        }
                        commentLike.deleteData(body, function(errDel, resDel){
                          if(utility.issetVal(resDel)){
                            res.status(200).send(new response(true, 200, 'Submit Unlike Succes'))
                          } else {
                            res.status(200).send(new response(false, 401, 'Submit Unlike failed'))
                          }
                        })
                      } else {
                        res.status(200).send(new response(false, 405, 'No Data'))
                      }
                    })
                  }
                } else {
                  // Error tidak ada comment yang di temukan 
                  res.status(200).send(new response(false, 405, 'No Data2'))
                }
              })
            } else {
              // Error Tidak ada Post yang di temukan
              res.status(200).send(new response(false, 405, 'No Data1'))
            }
          })
        } else {
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

exports.addComment = async (req, res)=>{
  const {user_id
  , auth_code
  , content
  , post_id
  , mentioned_list} = req.body

try {
  const middleware = {
    user_id         : 'required|text|'+user_id,
    auth_code       : 'required|text|'+auth_code,
    post_id         : 'required|text|'+post_id,
    content         : 'required|text|'+content,
  }
  if(utility.validateRequest(middleware)){
    await user.getAuth(req.body, function(errAuth, resAuth){
      // console.log({resAuth});
      if(utility.issetVal(resAuth)){
        if(resAuth.auth_code == auth_code){
          let body = {
            id : post_id
          }
          post.getById(body, function(errGet, resGet){
            if(utility.issetVal(resGet)){
              let body = {
                post_id:  post_id,
                user_id:  user_id,
                comment:  content,
                comment_type:  'post',
                publish:  1,
                create_date : moment(Date.now()).format('YYYY-MM-DD HH:mm:ss')
              }
              postComment.addData(body, function(errAdd, resAdd){
                console.log('a', resAdd);
                if(resAdd){
                  res.status(200)
                  .send(new response(true, 200, 'Submit Comment Success'))
                  // Execute push notif
                  let bodyGetOne ={
                    id : post_id
                  }
                  post.getById(bodyGetOne, function(errGet, getUser){
                    // console.log({errGet});
                    // console.log({getUser});
                    if(utility.issetVal(getUser)){
                      if(user_id != getUser.user_id){
                        let bodyNotif = {
                          id              : utility.generateHash(32),
                          sender_id       : user_id,
                          recipient_id    : getUser.user_id,
                          object          : resAdd._id,
                          predicate       : 'comment',
                          type_id         : post_id,
                          type            : 'post',
                          seen            : 0,
                          create_date     : moment(new Date()).format("YYYY-MM-DD hh:mm:ss"),
                          redirect        : 1
                        }
                        console.log(bodyNotif);
                        notification.addData(bodyNotif, function(errNotif, resNotif){
                          if(!errNotif){
                            const content = {
                              headline      : resAuth.name,
                              sub_headline  : 'comment : "'+utility.htmlConvertString(content)+'" on your post',
                              type          : 'post_comment',
                              redirect      : true,
                              id            : post_id
                            }
                            const getDevice = new Promise((resolve, reject)=>{
                              device.getSpesificUser([getUser.user_id], function(errRes, tokens){
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
                    } 

                  })
                  let mentioned = null;
                  if(utility.issetVal(mentioned_list)){
                    mentioned = JSON.parse(mentioned_list).map(el => {
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
                          type_id         : body.id,
                          object          : resAdd._id,
                          type            : 'post',
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
                        sub_headline  : 'in a comment : "'+utility.htmlConvertString(content)+'"',
                        type          : 'post_comment_mention',
                        redirect      : true,
                        id            : resAdd._id
                    }
                    console.log(bodyContent)

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
                  
                } else {
                  res
                  .status(200)
                  .send(new response(false, 401, 'Submit Comment failed'))
                }
              })
            } else {
              //tidak ada post yang di cari
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

exports.getLikes = async (req, res) =>{
  console.log('Get Likes Post');
  try {
    const middleware = {
      user_id         : 'required|text|'+req.body.user_id,
      auth_code       : 'required|text|'+req.body.auth_code,
      post_id         : 'required|text|'+req.body.post_id,
      page            : 'required|number|'+req.body.page,
      item            : 'no|number|'+req.body.item
    }
    if(utility.validateRequest(middleware)){
      await user.getAuth(req.body, function(errAuth, resAuth){
        console.log({errAuth : errAuth});
        console.log({resAuth : resAuth});
        if(utility.issetVal(resAuth)){
          if(resAuth.auth_code == req.body.auth_code){
            let body = {
              id : req.body.post_id
            }
            post.getById(body, function(errGet, resGet){
              // console.log({errGet : errGet});
              // console.log({resGet : resGet});
              if(utility.issetVal(resGet)){
                let body = {
                  post_id : req.body.post_id
                }
                postLike.getCountData(body,function (errCount, resCount){
                  // console.log({errCount : errCount})
                  // console.log({resCount : resCount});
                  if(utility.issetVal(resCount)){
                    let itemPerRequest = utility.issetVal(req.body.item)?  parseInt(req.body.item) : 15;
                    let page = req.body.page;
                    let total_data =  resCount;
                    let total_page = Math.ceil(total_data / itemPerRequest);
      
                    let limitBefore = page <= 1 || page == null ? 0 : (page-1) * itemPerRequest;

                    let body = {
                      post_id : req.body.post_id,
                      start   : limitBefore,
                      limit   : itemPerRequest,
                    }
                    post.getLikes(body, function(errGet, resGet){
                      // console.log({errGet : errGet});
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
                        res.status(200).send(new response(false, 401, 'Fetch Failed'))
                      }
                    })
                  } else {
                    // Count data ERROR
                    res.status(200).send(new response(false, 401, 'Fetch Failed'))
                  }
                })
              } else {
                //tidak ada post yang di cari
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

exports.submitResponse = async (req, res) =>{
  console.log('Submit Response');
  try {
    console.log(req.body);
   const middleware = {
      user_id         : 'required|text|'+req.body.user_id,
      auth_code       : 'required|text|'+req.body.auth_code,
      post_id         : 'required|text|'+req.body.post_id,
    polling_id      : 'required|text|'+req.body.polling_id,
    }
    if(utility.validateRequest(middleware)){
      await user.getAuth(req.body, function(errAuth, resAuth){
        if(resAuth.auth_code == req.body.auth_code){
          const getPost = new Promise((resolve, reject) => {
            const body = {
              id : req.body.post_id
            }
            post.getById(body, function(errGet, resGet){
              console.log({'he' : resGet});
              if(!errGet){
                resolve(resGet)
              }
            })
          })
          const getPolling = new Promise((resolve, reject) => {
            const body = {
              id : req.body.polling_id
            }
            postPolling.getById(body, function(errGet, resGet){
              if(!errGet){
                resolve(resGet)
              }
            })
          })

          const getPollingResponse = new Promise((resolve, reject) => {
            const body = {
              post_id : req.body.post_id,
              user_id : req.body.user_id
            }
            postResponse.getOne(body, function(errGet, resGet){
              if(!errGet){
                resolve(resGet)
              }
            })
          })

          Promise.all([getPost, getPolling, getPollingResponse]).then(result => {
            // console.log(result[0]);
            if(!utility.issetVal(result[0])){
              res.status(200).send(
                new response(false, 404, 'Post Not Found')
              )
            } else if(!utility.issetVal(result[1])){
              res.status(200).send(
                new response(false, 405, 'Option Polling Not Found')
              )
            } else if(utility.issetVal(result[2])){
              res.status(200).send(
                new response(false, 402, 'Already Submit')
              )
            } else {
              
              const body = {
                post_id : req.body.post_id,
                polling_id : req.body.polling_id,
                user_id : req.body.user_id,
              }
              postResponse.addData(body, function(errAdd, resAdd){
                if(!errAdd){
                  res.status(200).send(new response(true, 200, 'Submit Response Success'))
                } else {
                  res.status(200).send(new response(false, 401, 'Submit Response failed'))
                }
              })
              // console.log("hello");
            }
          }).catch( err => {
            console.log(err)
            res.status(200).send(new response(false, 401, 'Submit Post Polling Failed'))
          });
         
         
        } else {
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

exports.getDetail = async (req, res) => {
  try{
      const middleware = {
          user_id         : 'required|text|'+req.body.user_id,
          auth_code       : 'required|text|'+req.body.auth_code,
          id           : 'required|text|'+req.body.id,
      }
      // console.log(middleware);
      if(utility.validateRequest(middleware)){
          const result = await user.getAuth(req.body,function(errAuth,resAuth){
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
                              user_id : req.body.user_id
                          }

                          post.getById(body,function(errRes,resData) {
                            console.log(errRes)
                              if (!errRes) {
                                  if (utility.issetVal(resData)) {
                                     
                                      res.status(200).send(
                                        new response(true, 200, 'Fetch Success', resData)
                                      )
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

exports.getComment = async (req, res)=>{
  console.log('=== Get List Comment ===');
  try {
    const middleware = {
      user_id         : 'required|text|'+req.body.user_id,
      auth_code       : 'required|text|'+req.body.auth_code,
      post_id         : 'required|text|'+req.body.post_id,
      page            : 'required|number|'+req.body.page,
      item            : 'required|number|'+req.body.item
    }
    if(utility.validateRequest(middleware)){
      await user.getAuth(req.body, function(errAuth, resAuth){
        // console.log({errAuth : errAuth});
        // console.log({resAuth : resAuth});
        if(utility.issetVal(resAuth)){
          if(resAuth.auth_code == req.body.auth_code){
            let body = {
              id : req.body.post_id
            }
            console.log(body);
            post.getById(body, function(errGet, resGet){
              // console.log({errGet : errGet});
              // console.log({resGet : resGet});
              // console.log([resGet].length);

              if(utility.issetVal(resGet)){
                let body = {
                  post_id : req.body.post_id
                }
                postComment.getCountData(body,function (errCount, resCount){
                  console.log({errCount : errCount})
                  console.log({resCount : resCount});
                  if(utility.issetVal(resCount)){
                    let itemPerRequest = utility.issetVal(req.body.item)?  parseInt(req.body.item) : 15;
                    let page = req.body.page;
                    let total_data =  resCount;
                    let total_page = Math.ceil(total_data / itemPerRequest);
      
                    let limitBefore = page <= 1 || page == null ? 0 : (page-1) * itemPerRequest;

                    let body = {
                      user_id : req.body.user_id,
                      post_id : req.body.post_id,
                      start   : limitBefore,
                      limit   : itemPerRequest,
                    }
                    postComment.getCommentByPost(body, function(errGet, resGet){
                      // console.log({errGet : errGet});
                      // console.log({resGet : resGet});
                      if(utility.issetVal(resGet)){
                        const totalInfo = {
                          total_page : total_page,
                          total_data_all : total_data,
                          total_data : resGet.length
                        }
                        res
                        .status(200)
                        .send(new response(true, 200,'Fetch Succes', {
                          data : resGet,
                          total: totalInfo
                        } ))
                      } else {
                        console.log(errGet);
                        console.log('Error getLikes');
                        res.status(200).send(new response(false, 401, 'Fetch Failed'))
                      }
                    })
                  } else {
                    // Count data ERROR
                    res.status(200).send(new response(false, 401, 'No Count'))
                  }
                })
              } else {
                //tidak ada post yang di cari
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

exports.getCommentLike = async (req, res) => {
  try {
    const middleware = {
      user_id         : 'required|text|'+req.body.user_id,
      auth_code       : 'required|text|'+req.body.auth_code,
      comment_id      : 'required|text|'+req.body.comment_id,
      page            : 'required|number|'+req.body.page,
      item            : 'no|number|'+req.body.item
    }
    if(utility.validateRequest(middleware)){
      await user.getAuth(req.body, (errAuth, resAuth) => {
        console.log({errAuth});
        if(utility.issetVal(resAuth)){
          if(resAuth.auth_code == req.body.auth_code){
            postComments.getById({id : req.body.comment_id}, (errComment, resCommnet)=>{
              let bodyCount = {
                comment_id : req.body.comment_id
              }
              if(utility.issetVal(resCommnet)){
                commentLike.getCountData(bodyCount, (errCount, resCount)=> {
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
                    console.log('Sudah masuk sini ya ');
                    commentLike.getByComment(body, (errLike, resLike) => {
                      console.log({resLike});
                      if(utility.issetVal(resLike)){
                        const totalInfo = {
                          total_page : total_page,
                          total_data_all : total_data,
                          total_data : resLike.length
                        }
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
          } else {
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
  } catch (error){
    res
    .status(500)
    .send(new response(false, 500, 'Something went wrong'))
  }
}

exports.createPost = async (req, res) =>{
  console.log('=== CREATE POST ===');
  const {user_id
    , auth_code
    , content
    , interest_list
    , hashtag_list
    , font_style
    , polling_list
    , type
    , publish_date
    , end_date
    , mentioned_list} = req.body
  try {
    
      
      let IdInterests = null
      let mentioned = null
      if(utility.issetVal(req.body.interest_list)){
        IdInterests = JSON.parse(req.body.interest_list).map(({interest_id}) => interest_id)
      }

      if(utility.issetVal(mentioned_list)){
        mentioned = JSON.parse(mentioned_list).map(el => {
          return el;
        })
      }
      
      console.log({IdInterests});
      const middleware = {
        user_id         : 'required|text|'+user_id,
        auth_code       : 'required|text|'+auth_code,
        content         : 'no|text|'+content,
        interest_list   : 'no|text|'+interest_list,
        hashtag_list    : 'no|text|'+hashtag_list,
        font_style      : 'no|text|'+font_style,
        type            : 'required|text|'+type,
        end_date        : 'no|text|'+end_date
      }
      if(req.body.imageExist == 'false'){ 
        middleware.content = 'required|text|'+content;
      }

      if(type == 'polling'){
        middleware['polling_list'] = 'required|text|'+polling_list
      } 
    // console.log(middleware);
      if(utility.validateRequest(middleware)){
          await user.getAuth(req.body, function(errAuth, resAuth){
            console.log({errAuth : errAuth});
            if(utility.issetVal(resAuth)){
              if(resAuth.auth_code == auth_code){
                let body = {
                  notes       : utility.issetVal(req.body.notes) ?  req.body.notes : '',
                  user_id     : user_id,
                  id          : utility.generateHash(32),
                  content     : (req.body.imageExist) ? req.body.content : '',
                  type        : type,
                  user_type   : 'user',
                  font_style  : font_style,
                  publish     : 1,
                  create_date : moment(Date.now()).format('YYYY-MM-DD HH:mm:ss'),
                  publish_date: moment(Date.now()).format('YYYY-MM-DD HH:mm:ss'),
                  end_date  : moment(end_date).format('YYYY-MM-DD HH:mm:ss')
                }
                post.checkWord(body.content,(errCheck, resCheck)=>{
                  if(resCheck){
                    post.addData(body, function(errAdd, resAdd){
                      console.log({errAdd : errAdd});
                      console.log({resAdd : resAdd});
                      if(!errAdd){
                    
                        // Polling List
                        if(type == 'polling'){
                          let datPolling = JSON.parse(polling_list);
                          console.log(datPolling.length);
          
                          for(let idx = 0; idx <  datPolling.length; idx++) {
                              let object =  datPolling[idx];
                              console.log({idx : object});
          
                              const bodyPolling = {
                                  id          : utility.generateHash(32),
                                  post_id     : body.id,
                                  title       : object.title,
                                  sort        : object.sort,
                                  create_date : moment(Date.now()).format('YYYY-MM-DD HH:mm:ss')
                              }
                              
                              postPolling.addData(bodyPolling, function(err,resData){
                                  console.log({idx : resData });
                              }) 
                          }
                        }
                    
                        // postInterest
                        if(utility.issetVal(req.body.interest_list)){
                        
                          let datInterest = JSON.parse(req.body.interest_list);
                          console.log(datInterest);
                          for(let idx = 0; idx <  datInterest.length; idx++) {
                              let object =  datInterest[idx];
                              console.log({idx : object});
                      
                              let prepareInter = {
                                  post_id     : body.id,
                                  interest_id : object.interest_id,
                                  create_date : moment(Date.now()).format('YYYY-MM-DD HH:mm:ss')
                              }
                              
                              postInterest.addData(prepareInter, function(errAddInter,resAddInter){
                                  // console.log({resAddInter : resAddInter});
                                  // console.log({idx : resAddInter });
                                  if(!errAddInter){
                                    console.log('Insert Interest List Succes');
                                  } else {
                                    console.log('Insert interest List failed');
                                  }
                              }) 
                          }
                        }
                    
                        // Hashtag List
                        if(utility.issetVal(hashtag_list)){
                        
                          let dataHashtag = JSON.parse(hashtag_list);
                          console.log(dataHashtag.length);
                          for(let idx = 0; idx <  dataHashtag.length; idx++) {
                              let object =  dataHashtag[idx].substring(1);
                              console.log({'hasdh' : object});
                              
                              hashtag.getOne({'word' : object}, function(err,ress){
                                console.log('hashtag err', err)
                                console.log('hashtag ress', ress)
                                if(utility.issetVal(ress)){
                                  const bodyhashtag = {
                                    post_id     : body.id,
                                    hashtag_id  : ress.id,
                                    create_date : moment(Date.now()).format('YYYY-MM-DD HH:mm:ss')
                                  }
                                  postHashtag.addData(bodyhashtag, function(err,resAddHash){
                                    console.log({idx : resAddHash });
                                    if(!err){

                       
                                      console.log('Insert Hashtag List Succes');
                                    } else {
                                      console.log('Insert Hashtag List failed');
                                    }
                                  }) 
                                } else {
                                  console.log("hashtag baru", object)
                                  const bodyHashtag = {
                                    id :  utility.generateHash(32),
                                    word : object,
                                    publish  : 1,
                                    create_date :  moment(Date.now()).format('YYYY-MM-DD HH:mm:ss')
                                  }
                                  hashtag.addData(bodyHashtag, function(err,ress){
                                    if(!utility.issetVal(err)){
                                      const bodySearch = {
                                        type_id : bodyHashtag.id
                                        , type  : 'hashtag'
                                        , title : bodyHashtag.word
                                        , description : null
                                        , img : null
                                      }

                                      search.updateData(bodySearch, (errCount, resCount)=>{
                                        console.log('errCount', errCount)
                                        console.log('resCount', resCount)
                                      });

                                      const bodyPHashtag = {
                                        post_id     : body.id,
                                        hashtag_id  : bodyHashtag.id,
                                        create_date : moment(Date.now()).format('YYYY-MM-DD HH:mm:ss')
                                      }
                                      postHashtag.addData(bodyPHashtag, function(err,resAddHash){
                                        console.log({idx : resAddHash });
                                        if(!err){
                                          console.log('Insert Hashtag List Succes');
                                        } else {
                                          console.log('Insert Hashtag List failed');
                                        }
                                      }) 
                                    }
                                  });
                                }
                              })
                            
                          }
                            
                        }

                        alumniInterest.getAllId(IdInterests, function(errInter, userData){
                          // console.log({errInter});
                          // console.log({userData});
                          if(utility.issetVal(userData)){
                              let tNotif = userData.map(id =>{
                                  let bodyNotif = {
                                      id              : utility.generateHash(32),
                                      sender_id       : body.user_id,
                                      recipient_id    : id,
                                      predicate       : 'create',
                                      type_id         : body.id,
                                      type            : 'post',
                                      seen            : 0,
                                      create_date     : moment(new Date()).format("YYYY-MM-DD hh:mm:ss"),
                                      redirect        : 1
                                  }
                                  notification.addData(bodyNotif, function(errNotif, resNotif){
                                    // console.log('erNotif', errNotif,bodyNotif)
                                    // console.log('resNotif', resNotif, bodyNotif)
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
                        if(utility.issetVal(mentioned)){

                          let tNotif = mentioned.map(id =>{
                            let bodyNotif = {
                                id              : utility.generateHash(32),
                                sender_id       : body.user_id,
                                recipient_id    : id,
                                predicate       : 'mention',
                                type_id         : body.id,
                                type            : 'post',
                                seen            : 0,
                                create_date     : moment(new Date()).format("YYYY-MM-DD hh:mm:ss"),
                                redirect        : 1
                            }
                            notification.addData(bodyNotif, function(errNotif, resNotif){
                              console.log('erNotif Mention', errNotif)
                              console.log('resNotif Mention', bodyNotif)
                            }) 
                          })
                          const content = {
                              headline      : resAuth.name+' mentioned you',
                              sub_headline  : 'in a post : "'+utility.htmlConvertString(req.body.content)+'"',
                              type          : 'post_mention',
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

                        const bodySearch = {
                          type_id : body.id
                          , type  : 'post'
                          , title : body.content
                          , description : null
                          , img : null
                        }

                        search.updateData(bodySearch, (errCount, resCount)=>{
                          console.log('errCount', errCount)
                          console.log('resCount', resCount)
                        });
                    
                        res
                        .status(200)
                        .send(new response(true, 200, 'Insert Data success', {post_id : body.id}))
                      } else {
                        res
                        .status(200)
                        .send(new response(false, 410, 'Insert Data failed'))
                      }
                    })
                  } else {
                    res
                    .status(200)
                    .send(new response(false, 407, 'Your Post Contains Inappropriate Word'))
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
  } catch (error) {
    console.log(error);
    res
    .status(500)
    .send(new response(false, 500, 'Something went wrong'))
  }

}

exports.submitReport= async (req, res)=>{
  console.log('SUBMIT REPORT');
  const {user_id, auth_code, post_id, reason, type} = req.body
  try {
    const middleware = {
      user_id         : 'required|text|'+user_id,
      auth_code       : 'required|text|'+auth_code,
      post_id         : 'required|text|'+post_id,
      reason          : 'required|text|'+reason,
      type            : 'required|text|'+type,
    }
    if(utility.validateRequest(middleware)){
      await user.getAuth(req.body, function(errAuth, resAuth){
        if(utility.issetVal(resAuth)){
          if(resAuth.auth_code == auth_code){
            let body = {
              id : post_id
            }
            post.getById(body, function (errGet, resGet){
              console.log({errGet : errGet});
              console.log({resGet : resGet});
              if(utility.issetVal(resGet)){
                let body = {
                  post_id : post_id,
                  user_id : user_id,
                  reason  : reason,
                  type    : type
                }
                postReport.addData(body, function(errAdd, resAdd){
                  if(utility.issetVal(resAdd)){
                    res
                    .status(200)
                    .send(new response(true, 200, 'Insert Succes'))
                  } else {
                    // error, id post/ user harus unique
                    res
                    .status(200)
                    .send(new response(false, 400, 'Insert Failed'))
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

exports.deleteReport = async(req, res)=>{
  console.log('SUBMIT REPORT');
  const {user_id, auth_code, post_id, reason} = req.body
  try {
    const middleware = {
      user_id         : 'required|text|'+user_id,
      auth_code       : 'required|text|'+auth_code,
      post_id         : 'required|text|'+post_id,
    }
    if(utility.validateRequest(middleware)){
      await user.getAuth(req.body, function(errAuth, resAuth){
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
                  id : resGet[0]._id,
                }
                postReport.deleteData(body, function(errDel, resDel){
                  console.log({errDel : errDel});
                  console.log({resDel : resDel});
                  if(utility.issetVal(resDel)){
                    res
                    .status(200)
                    .send(new response(true, 200, 'Delete Succes'))
                  } else {
                    res
                    .status(200)
                    .send(new response(false, 400, 'Delete Failed'))
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

exports.getListByAlumni = async(req, res)=>{
  try {
    const middleware = {
      user_id  : 'required|text|' + req.body.user_id,
      auth_code: 'required|text|' + req.body.auth_code,
      alumni_id: 'required|text|' + req.body.alumni_id,
      page     : 'required|number|' + req.body.page
    }

    if (utility.validateRequest(middleware)) {

    await user.getAuth(req.body, function (errAuth, resAuth) {
        if (!errAuth) {

          if (!utility.issetVal(resAuth)) {
              res.status(200).send(
              new response(false, 403, 'Unauthorized')

              )
          } else {
              // proses di mulai dari sini
              if(resAuth.auth_code === req.body.auth_code){
                let promisePost = new Promise(function(resolve, reject) {
                  let param = {
                    user_id : req.body.alumni_id
                    ,  removed : 0
                  }
                  utility.issetVal(req.body.search) ? param.content = req.body.search : null;
                  post.getCountByAlumni(param, function(errResCount,rowsResCount) {
                    console.log(errResCount);
                    if (!errResCount) {
                      if (utility.issetVal(rowsResCount)) {
                            let itemPerRequest = utility.issetVal(req.body.item)?  parseInt(req.body.item) : 15;
                            let page = req.body.page;
                            let total_data =  rowsResCount;
                            let total_page = Math.ceil(total_data / itemPerRequest);
        
                            let limitBefore = page <= 1 || page == null ? 0 : (page-1) * itemPerRequest;
        
                            const PreparedData = {
                                start   : limitBefore,
                                limit   : itemPerRequest,
                                removed : 0,
                                user_id : req.body.user_id,
                                month   : moment(Date.now()).format('MM'),
                                week    : moment(Date.now()).format('WW'),
                                year    : moment(Date.now()).format('YYYY'),
                                sort    : req.body.sort,
                                alumni_id : req.body.alumni_id
                            }

                            utility.issetVal(req.body.search) ? PreparedData.content = req.body.search : null;
        
                            post.getAllByAlumni(PreparedData,function(errRes,rowsRes) {
                                console.log(errRes);
                                if (!utility.issetVal(errRes)) {
                                  const totalInfo = {
                                      total_page : total_page,
                                      total_data_all : total_data,
                                      total_data : rowsRes.length
                                  }
                                  if (utility.issetVal(rowsRes)) {
                                      const arrayRows = {
                                          data :rowsRes,
                                          total: totalInfo
                                      }
                                      resolve(arrayRows);
                                      
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
                          console.log('ba')
                          resolve();
                        }
                    } else {
                      console.log('ca')
                      resolve();
                    }
                  })
                })
                Promise.all([promisePost])
                .then(([post])=>{
                  if(utility.issetVal(post) ){
                    res.status(200).send(
                      new response(true, 200, 'Fetch Success', post)
                    )
                  } else {
                    res.status(200).send(
                      new response(false, 401, 'Fetch Failed2')
                    )
                  }
                
                })
                .catch( err => {
                  // console.log(err);
                  res.status(200).send(
                    new response(false, 401, 'Fetch Failed3', err)
                  )
                });
              } else {

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
        new response(false, 400, 'Invalid input format', middleware)
    )
    }
} catch (e) {
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
     
      await user.getAuth(req.body, function(errAuth, resAuth){
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
     
      await user.getAuth(req.body, function(errAuth, resAuth){
        console.log(errAuth);
        if(utility.issetVal(resAuth)){
          if(resAuth.auth_code == auth_code){
            postLike.getCountByUser({
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
                postLike.getAllByUser(PreparedData, function(errGet, resGet){
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
          const result = user.getAuth(formJSON,function(errAuth,resAuth){
            console.log(errAuth);
            if(!errAuth){
              if(!utility.issetVal(resAuth)){
                res.status(200).send(
                new response(false, 403, 'Unauthorized1')
              )}else{
                if(resAuth.auth_code == formJSON.auth_code){
                  if(utility.issetVal(formJSON.img)){
                    let datImg = formJSON.img.split(',');
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
                    // for(let idx = 0; idx <  datImg.length; idx++) {
                    //     let object =  datImg[idx];
                    //     // console.log({idx : object});
                    //     const bodyImages = {
                    //       id          : utility.generateHash(32),
                    //       post_id     : formJSON.id,
                    //       img         : object,
                    //       create_date : moment(Date.now()).format('YYYY-MM-DD HH:mm:ss')
                    //     }
                    //     // idx == 0? bodyImages.main  = '1' : bodyImages.main  = '0';
                    //     postImages.getOne({post_id : bodyImages.post_id}, (err, res)=>{
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
                    //   }

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
        const result = user.getAuth(req.body,function(errAuth,resAuth){
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
      const result = await user.getAuth(req.query,function(errAuth,resAuth){
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

exports.deleteData = async (req, res) => {
  try {
    const middleware = {
      user_id      : 'required|text|'+req.query.user_id,
      auth_code    : 'required|text|'+req.query.auth_code,
      id           : 'required|text|'+req.query.id,
    }
    if(utility.validateRequest(middleware)){
      const result = await user.getAuth(req.query,function(errAuth,resAuth){
        // console.log(errAuth);
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
              

                post.getById(body, function(errGet,resGet) {
                    console.log(errGet);

                    if (!errGet) {
                        if(!utility.issetVal(resGet)){
                            res.status(200).send(
                                new response(false, 404, 'Data not exist')
                            )
                        }else{
                          if(resGet.user_id == req.query.user_id){
                            let removed = {
                              post_id : req.query.id,
                              user_id : req.query.user_id,
                              type    : resGet.type
                            }
                            postRemoved.addData(removed, function(errAdd, resAdd){
                              if(!utility.issetVal(errAdd)){
                                post.deleteData(body, function(err,resData) {
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
                              } else {
                                res
                                .status(200)
                                .send(new response(false, 401, 'Delete Failed'))
                              }
                            })
                          } else {
                            res
                            .status(200)
                            .send(new response(false, 405, 'You are not own of this post'))
                          }
                        }
                    } else {
                    res.status(200).send(
                        new response(false, 404, 'Data not exist1')
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

exports.deleteComment = async (req, res) => {
  try {
    const middleware = {
      user_id      : 'required|text|'+req.query.user_id,
      auth_code    : 'required|text|'+req.query.auth_code,
      post_id      : 'required|text|'+req.query.post_id,
      comment_id   : 'required|text|'+req.query.comment_id,
    }
    if(utility.validateRequest(middleware)){
      const result = await user.getAuth(req.query,function(errAuth,resAuth){
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
                    user_id : req.query.user_id,
                    auth_code : req.query.auth_code,
                    id : req.query.post_id,
                    comment_id : req.query.comment_id
                }
              

                postComment.getById({id : body.comment_id}, function(errGet,resComment) {
                  if (!errGet) {
                    if(!utility.issetVal(resComment)){
                        res.status(200).send(
                            new response(false, 404, 'Data not exist2')
                        )
                    }else{
                      if(resComment.user_id == req.query.user_id){
                        postComment.deleteData({id : req.query.comment_id}, function(err,resData) {
                          if (!err) {
                              res.status(200).send(new response(true, 200, 'Delete success'))
                          } else {
                              res.status(200).send(
                                  new response(false, 401, 'Delete failed')
                              )
                          }
                        })
                      } else {
                        res
                        .status(200)
                        .send(new response(false, 405, 'You are not own of this comment'))
                      }
                    }
                  } else {
                    res.status(200).send(
                      new response(false, 404, 'Data not exist3')
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
