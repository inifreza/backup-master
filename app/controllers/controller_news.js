var news = require('../models/news')
var newsInterest = require('../models/newsInterest')
var newsImages = require('../models/newsImages')
var admin = require('../models/admin')
let response = require('../../helpers/response')
const utility = require('../../helpers/utility')
const nodemailer = require('../../helpers/mail_adapter');
let moment = require('moment')
const formidable = require('formidable')
const path = require('path');
const fs = require('fs');
let appDir = path.dirname(require.main.filename);
let pathDir = appDir + '/uploads/news/'

//models
const alumniInterest  = require('../models/AT_AlumniInterest')
const notification    = require('../models/notification')
const device          = require('../models/device')

//setting fcm
const globals = require('../../configs/global')
const { config } = require('../../default')
let {firebase} = globals[config.environment];

exports.insert = async (req, res) => {
  try {
    let formData = new Array();
    var fields = {}, prepareFile = [];
    new formidable.IncomingForm().parse(req)
    .on('field', (name, value) => {
      if(utility.isJson(value)){
        formData.push('"' +name+ '"'+ ':'+value);
      } else {
        formData.push('"' +name+ '"'+ ':'+'"'+escape(value)+'"')
      }
    })
    
    .on('fileBegin', function (name, file){
      if(utility.checkImageExtension(file.name)){
        let fileType = file.type.split('/').pop();
        file.name = utility.generateHash(16)+ '.' + fileType;
        file.path = appDir + '/uploads/news/' + file.name;
        prepareFile.push(file.name);
      }
    })
    .on('file', (name, file) => {
      formData.push('"' +name+ '"'+ ':'+'"'+prepareFile+'"')
    })
    .on('aborted', () => {
      console.error('Request aborted by the news')
    })
    .on('error', (err) => {
      console.error('Error', err)
      throw err
    })
    .on('end', () => {
        let temp = '{'+formData.toString() +'}'
        let formJSON = JSON.parse(temp)

        const {interest_list} = formJSON
        const middleware = {
          user_id         : 'required|text|'+formJSON.user_id,
          auth_code       : 'required|text|'+formJSON.auth_code,
          title           : 'required|text|'+formJSON.title,
          brief           : 'no|text|'+formJSON.brief,
          description     : 'no|text|'+formJSON.description,
          featured        : 'required|text|'+formJSON.featured,
          url             : 'no|text|'+formJSON.url,
          content_type    : 'required|number|'+formJSON.content_type,
          img             : 'no|images|'+formJSON.img,
          publish         : 'required|number|'+formJSON.publish,
          interest_list   : 'no|text|'+formJSON.interest_list,
        }
        // console.log(middleware)
        if(utility.validateRequest(middleware)){
          const result = admin.getAuth(formJSON,function(errAuth,resAuth){
            if(!errAuth){
              if(!utility.issetVal(resAuth)){
                res.status(200).send(
                new response(false, 403, 'Unauthorized')
              )}else{
                if(resAuth.auth_code == formJSON.auth_code){
                 
                  const body = {
                      id              : utility.generateHash(32),
                      title           : unescape(formJSON.title),
                      brief           : unescape(formJSON.brief),
                      description     : unescape(formJSON.description),
                      writter         : resAuth.name,
                      featured        : unescape(formJSON.featured),
                      url             : unescape(formJSON.url),
                      content_type    : unescape(formJSON.content_type),
                      publish         : unescape(formJSON.publish),
                      create_date     : moment(Date.now()).format('YYYY-MM-DD HH:mm:ss')
                  }

                  if(body.img==undefined){
                    body.img = '';
                  }
                  
                  const result = news.addData(body, function(err,resData) {
                      console.log(err);
                      if (!err) {
                        if(utility.issetVal(formJSON.interest_list)){
                            let datInterest = formJSON.interest_list;
                            for(let idx = 0; idx <  datInterest.length; idx++) {
                                let object =  datInterest[idx];
                                // console.log({idx : object});

                                const bodyInterest = {
                                    news_id     : body.id,
                                    interest_id : object.interest_id,
                                    create_date : moment(Date.now()).format('YYYY-MM-DD HH:mm:ss')
                                }
                                
                                newsInterest.addData(bodyInterest, function(err,resData){
                                    // console.log({idx : resData });
                                }) 
                            }
                        }


                        if(utility.issetVal(formJSON.img)){
                          let datImg = formJSON.img.split(',');
                          for(let idx = 0; idx <  datImg.length; idx++) {
                              let object =  datImg[idx];
                              // console.log({idx : object});

                              const bodyImages = {
                                  id          : utility.generateHash(32),
                                  news_id     : body.id,
                                  img         : object,
                                  create_date : body.create_date
                              }
                              idx == 0? bodyImages.main  = '1' : bodyImages.main  = '0';
                              
                              newsImages.addData(bodyImages, function(err,resData){
                                  // console.log({idx : resData });
                              }) 
                          }
                        }
                        // Push Notif
                        let IdInterests = interest_list.map(({interest_id}) => interest_id)
                        console.log({IdInterests : IdInterests});
                        alumniInterest.getAllId(IdInterests, function(errInter, user_id){
                          console.log('err AlumniInt', errInter);
                          console.log('AlumniInt', user_id);
                          let tNotif = user_id.map(id =>{
                            let bodyNotif = {
                              id              : utility.generateHash(32),
                              sender_id       : '',
                              recipient_id    : id,
                              predicate       : 'create',
                              type_id         : body.id,
                              type            : 'news',
                              seen            : 0,
                              create_date     : moment(new Date()).format("YYYY-MM-DD hh:mm:ss"),
                              redirect        : 0
                            }
                            console.log(bodyNotif);
                            notification.addData(bodyNotif, function(errNotif, resNotif){
                              console.log('err errNotif', errNotif);
                              console.log('resNotif', resNotif);
                              if(errNotif){
                                // Nothing 
                                // res.status(200).send(new response(false, 401, 'Insert Failed'))
                              }
                            })
                          })

                          const content = {
                            headline      : 'New News',
                            sub_headline  : utility.htmlConvertString(body.title),
                            type          : 'news',
                            redirect      : true,
                            id            : body.id
                          }
                          const getDevice = new Promise((resolve, reject)=>{
                            device.getSpesificUser(user_id, function(errRes, tokens){
                              // console.log(tokens);
                              utility.issetVal(tokens) ? resolve(tokens) : resolve(tokens);
                            })
                          })
                          Promise.all([getDevice])
                            .then(arr=>{
                              // console.log(arr[0]);
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
                        })

                        
                        res.status(200)
                          .send(new response(true, 200, 'Insert Data  Success'))
                       
                      } else {
                          res.status(200).send(
                          new response(false, 401, 'Insert data failed1', err)
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
    })
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
      user_id      : 'required|text|'+req.body.user_id,
      auth_code    : 'required|text|'+req.body.auth_code,
      page         : 'required|text|'+req.body.page,
      item         : 'no|text|'+req.body.item,
      keyword      : 'no|text|'+req.body.keyword,
      interest     : 'no|text|'+req.body.interest
    }
    let interest = null
    let IdInterests = null
    if(utility.issetVal(req.body.interest)){
      interest = JSON.parse(req.body.interest)
      IdInterests = interest.map(({interest_id}) => interest_id)
    }
    console.log('a', IdInterests);
    if(utility.validateRequest(middleware)){
      const result = await admin.getAuth(req.body,function(errAuth,resAuth){
        console.log(errAuth)
        if(!errAuth){
          if(!utility.issetVal(resAuth)){
            res.status(200).send(
            new response(false, 403, 'Unauthorized1')
          )}else{
            console.log(resAuth.auth_code);
            if(resAuth.auth_code == req.body.auth_code){
              //here goes the function
              let bodyCount = {
                keyword : req.body.keyword,
                interest: IdInterests
              }
              news.getCountData(bodyCount,function(errResCount,rowsResCount) {
                console.log({errResCount});
                console.log({rowsResCount});
                if (!errResCount) {
                 if (utility.issetVal(rowsResCount)) {
                      let arrayDatas = {};
                      let arrayData = {};
                      // arrayData = resData;

                        let itemPerRequest = utility.issetVal(req.body.item)?  parseInt(req.body.item) : 15;
                        let page = req.body.page;
                        let total_data =  rowsResCount;
                        let total_page = Math.ceil(total_data / itemPerRequest);
                        let limitBefore = page <= 1 || page == null ? 0 : (page-1) * itemPerRequest;

                        const PreparedData = {
                            start   : limitBefore,
                            limit   : itemPerRequest,
                            keyword : req.body.keyword,
                            interest: IdInterests
                        }
                        
                        news.getAll(PreparedData,function(errRes,rowsRes) {
                          if (!errRes) {
                            if (rowsRes !='') {
                              
                                const totalInfo = {
                                  total_page : total_page,
                                  total_data_all : total_data,
                                  total_data : rowsRes.length
                                }
                                res.status(200).send(new response(true, 200, 'Fetch Success', {
                                    data : rowsRes,
                                    total: totalInfo
                                } ))
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
             
             
              news.getById(body, function(errGet,resGet) {
                console.log(errGet);

                if (!errGet) {
                  if(!utility.issetVal(resGet)){
                    res.status(200).send(
                      new response(false, 405, 'Data not Found')
                    )
                  }else{
                    newsImages.deleteImages(body,(err, resData)=>{
                      console.log({err : err})
                      console.log({resData : resData})
                      if(!err){
                        news.deleteData(body, (err, resData)=>{
                          if(!err){
                            if(utility.issetVal(resData)){
                              notification.deleteByTypeId({id : req.query.id}, (err,resData) => {
                                console.log('err', err);
                                console.log('resData', resData);
                              });
                              res.status(200).send(new response(true, 200, 'Delete success'))
                              
                            } else {
                              res.status(200).send(
                                new response(false, 401, 'Delete failed 4')
                              )
                            }
                          } else {
                            res.status(200).send(
                              new response(false, 401, 'Delete failed 3')
                            )
                          }
                        })
                      } else {
                        res.status(200).send(
                          new response(false, 401, 'Delete failed 1')
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
      id              : 'required|text|'+req.body.id,
      user_id         : 'required|text|'+req.body.user_id,
      auth_code       : 'required|text|'+req.body.auth_code,
      title           : 'required|text|'+req.body.title,
      brief           : 'no|text|'+req.body.brief,
      description     : 'no|text|'+req.body.description,
      url             : 'no|text|'+req.body.url,
      content_type    : 'required|text|'+req.body.content_type,
      featured        : 'required|number|'+req.body.featured,
      publish         : 'required|number|'+req.body.publish,
      interest_list   : 'no|text|'+req.body.interest_list,
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
                      id              : req.body.id,
                      title           : req.body.title,
                      brief           : req.body.brief,
                      description     : req.body.description,
                      writter         : resAuth.name,
                      featured        : req.body.featured,
                      pathUrl         : req.body.pathUrl,
                      content_type    : req.body.content_type,
                      publish         : req.body.publish,
                      url             : req.body.url,
                      create_date     : moment(Date.now()).format('YYYY-MM-DD HH:mm:ss')
                    }
                    // console.log({'req body' : req.body});
                    news.getById(body, function(err, resById){
                        if(utility.issetVal(resById)){
                          // console.log({resById});
                          newsInterest.deleteByNewsId({news_id : body.id}, function(err,resData){
                            if(!err){
                              news.updateData(utility.cleanJSON(body), function(err,resData) {
                                let IdInterests = null
                                let interest_list = JSON.parse(req.body.interest_list)
                                console.log({'interest_list' : interest_list});
                                if(utility.issetVal(req.body.interest_list)){
                                  IdInterests = interest_list.map(({interest_id}) => interest_id)
                                }
                                console.log({IdInterests : IdInterests});
                                let bodyAdd = {
                                  id : body.id,
                                  IdInterests : IdInterests
                                }
                                if(!err){
                                  newsInterest.addMultiple(bodyAdd,(errAdd, resAdd)=>{
                                    console.log({errAdd : errAdd});
                                    console.log({resAdd: resAdd});
                                    if(!errAdd){
                                      res
                                      .status(200)
                                      .send(new response(true, 200, 'Update Data  Success'))
                                    } else {
                                      // Gagal AddMultiple Interest_list
                                      res.status(200).send(
                                        new response(false, 401, 'Insert data failed1', err)
                                      )
                                    }
                                  })
                                } else {
                                  // Gagal Update News
                                  res.status(200).send(
                                    new response(false, 401, 'Insert data failed1', err)
                                  )
                                }
                              })
                            } else {
                              // Gagal Hapus Interest By news_id
                              res.status(200).send(
                                new response(false, 401, 'Insert data failed1', err)
                              )
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
        file.path = appDir + '/uploads/news/' + file.name;
        prepareFile.push(file.name);
      }
    })
    .on('file', (name, file) => {
      formData.push('"' +name+ '"'+ ':'+'"'+prepareFile+'"')
    })
    .on('aborted', () => {
      console.error('Request aborted by the news')
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
                            news_id     : formJSON.id,
                            img         : object,
                            create_date : moment(Date.now()).format('YYYY-MM-DD HH:mm:ss')
                        }
                        // idx == 0? bodyImages.main  = '1' : bodyImages.main  = '0';
                        
                        newsImages.addData(bodyImages, function(err,resData){
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
                      news_id         : req.body.id,
                      id              : req.body.images_id,
                      main            : 1
                    }

                    newsImages.getById(body, function(err, resById){
                        if(!err){
                            newsImages.updateData(body, function(err,resData) {
                                if (!err) {
                                    if(!utility.issetVal(resData)){
                                        res.status(200).send(new response(false, 404, 'Data not exist1'))
                                    }else{
                                      newsImages.unPrimary(body, function(err,resData) {
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

exports.getDetail = async (req, res) => {
  try{
    const middleware = {
        user_id      : 'required|text|'+req.body.user_id,
        auth_code    : 'required|text|'+req.body.auth_code,
        id         : 'required|text|'+req.body.id,
    }
    console.log(middleware);
    if(utility.validateRequest(middleware)){
      const result = await admin.getAuth(req.body,function(errAuth,resAuth){
        console.log(errAuth);
        if(!errAuth){
          if(!utility.issetVal(resAuth)){
            res.status(200).send(
            new response(false, 403, 'Unauthorized')
          )}else{
            console.log(resAuth.auth_code);
            if(resAuth.auth_code == req.body.auth_code){
              //here goes the function
              const body = {
                  id : req.body.id,
              }

              news.getById(body,function(errRes,resData) {
                // console.log(resData);
                // console.log(errRes);
                if (!errRes) {
                  if(utility.issetVal(resData)){
                    let arrayDatas = [];
                    let arrayData = {};
                    arrayData = resData;

                    let promiseNewsImages = new Promise(function(resolve, reject) {
                      newsImages.getData(body, (err, resData) =>{
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
                  
                    let promiseInterest = new Promise(function(resolve, reject) {
                      newsInterest.getData(body, (err, resData) =>{
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

                    Promise.all([promiseNewsImages, promiseInterest]).then(arr => {
                      arrayData.img_list   = null;
                      arrayData.interest_list   = null;
                      if(utility.issetVal(arr[0])){
                        arrayNewsImages      = arr[0];
                        for (var i = 0; i < arrayNewsImages.length; i++) {
                          for (var a = 0; a < arrayNewsImages.length; a++) {
                            if(arrayData.id == arrayNewsImages[a].news_id){
                              arrayData.img_list= [];
                            } 
                          } 
                          for (var a = 0; a < arrayNewsImages.length; a++) {
                            if(arrayData.id == arrayNewsImages[a].news_id){
                              arrayData.img_list.push(arrayNewsImages[a]);
                            } 
                          } 
                        }
                      }
                      if(utility.issetVal(arr[1])){
                        arrayNewsInterest    = arr[1];
                        for (var i = 0; i < arrayNewsInterest.length; i++) {
                          for (var a = 0; a < arrayNewsInterest.length; a++) {
                            if(arrayData.id == arrayNewsInterest[a].news_id){
                              arrayData.interest_list= [];
                            } 
                          } 
                          for (var a = 0; a < arrayNewsInterest.length; a++) {
                            if(arrayData.id == arrayNewsInterest[a].news_id){
                              arrayData.interest_list.push(arrayNewsInterest[a]);
                            } 
                          } 
                        }
                      }
                    
                      
                      arrayDatas.push(arrayData);
                      res.status(200).send(new response(true, 200, 'Fetch success', arrayData))
                    }).catch( err => {
                        return err;
                        console.log(err);
                    } );
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
              newsImages.getById(body, function(errGet,resGet) {
                console.log(errGet);

                if (!errGet) {
                  if(!utility.issetVal(resGet)){
                    res.status(200).send(
                      new response(false, 405, 'User not registered1')
                    )
                  }else{
                    newsImages.deleteData(body, function(err,resData) {
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

exports.deeplink = async(req,res)  => {
  try{
    const middleware = {
      user_id      : 'no|text|'+req.body.user_id,
      auth_code    : 'no|text|'+req.body.auth_code,
      id           : 'required|text|'+req.body.id,
    }
    if(utility.validateRequest(middleware)){
      const body = {
        id : req.body.id,
      }

      news.getById(body,function(errRes,resData) {
        console.log(resData);
        console.log(errRes);
        if (!errRes) {
          if(utility.issetVal(resData)){
            let arrayDatas = [];
            let arrayData = {};
            arrayData = resData;

            let promiseNewsImages = new Promise(function(resolve, reject) {
              newsImages.getData(body, (err, resData) =>{
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
          
            let promiseInterest = new Promise(function(resolve, reject) {
              newsInterest.getData(body, (err, resData) =>{
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

            Promise.all([promiseNewsImages, promiseInterest]).then(arr => {
              arrayData.img_list   = null;
              arrayData.interest_list   = null;
              if(utility.issetVal(arr[0])){
                arrayNewsImages      = arr[0];
                for (var i = 0; i < arrayNewsImages.length; i++) {
                  for (var a = 0; a < arrayNewsImages.length; a++) {
                    if(arrayData.id == arrayNewsImages[a].news_id){
                      arrayData.img_list= [];
                    } 
                  } 
                  for (var a = 0; a < arrayNewsImages.length; a++) {
                    if(arrayData.id == arrayNewsImages[a].news_id){
                      arrayData.img_list.push(arrayNewsImages[a]);
                    } 
                  } 
                }
              }
              if(utility.issetVal(arr[1])){
                arrayNewsInterest    = arr[1];
                for (var i = 0; i < arrayNewsInterest.length; i++) {
                  for (var a = 0; a < arrayNewsInterest.length; a++) {
                    if(arrayData.id == arrayNewsInterest[a].news_id){
                      arrayData.interest_list= [];
                    } 
                  } 
                  for (var a = 0; a < arrayNewsInterest.length; a++) {
                    if(arrayData.id == arrayNewsInterest[a].news_id){
                      arrayData.interest_list.push(arrayNewsInterest[a]);
                    } 
                  } 
                }
              }
            
              
              arrayDatas.push(arrayData);
              res.status(200).send(new response(true, 200, 'Fetch success', arrayData))
            }).catch( err => {
                return err;
                console.log(err);
            } );
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
      res
      .status(200)
      .send(new response(false, 400, 'Invalid input format'))
    }
  } catch (error){
    console.log(error);
    res
    .status(500)
    .send(new response(false, 500, 'Something went wrong'))
  }
}