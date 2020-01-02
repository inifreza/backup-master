var interest = require('../models/interest')
var admin = require('../models/admin')
const Room = require('../models/room')
let response = require('../../helpers/response')
const utility = require('../../helpers/utility')
const nodemailer = require('../../helpers/mail_adapter');
let moment = require('moment')
const formidable = require('formidable')
const path = require('path');
const fs = require('fs');
let appDir = path.dirname(require.main.filename);
let pathDir = appDir + '/uploads/interest/'

exports.insert = async (req, res) => {
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
        if(utility.checkImageExtension(file.name)){
          let fileType = file.type.split('/').pop();
          file.name = utility.generateHash(16)+ '.' + fileType;
          file.path = appDir + '/uploads/interest/' + file.name;
        }
      })
      .on('aborted', () => {
        console.error('Request aborted by the user')
      })
      .on('error', (err) => {
        console.error('Error', err)
        throw err
      })
      .on('end', () => {
        let temp = '{'+formData.toString() +'}'
        let formJSON = JSON.parse(temp)
  
        const middleware = {
            user_id         : 'required|text|'+formJSON.user_id,
            auth_code       : 'required|text|'+formJSON.auth_code,
            parent_id       : 'required|text|'+formJSON.parent_id,
            title           : 'required|text|'+formJSON.title,
            sort            : 'no|number|'+formJSON.sort,
            icon            : 'no|images|'+formJSON.icon,
            publish         : 'required|number|'+formJSON.publish,
        }
        if(utility.validateRequest(middleware)){
          const result = admin.getAuth(formJSON,function(errAuth,resAuth){
            if(!errAuth){
                if(!utility.issetVal(resAuth)){
                    res.status(200).send(
                        new response(false, 403, 'Unauthorized')
                    )
                }else{
                    if(resAuth.auth_code == formJSON.auth_code){
                    
                        //here goes the function
                        const body = {
                            id          :  utility.generateHash(32),
                            parent_id   : formJSON.parent_id,
                            title       : utility.unescapeHtml(formJSON.title),
                            publish     : formJSON.publish,
                            sort        : formJSON.sort,
                            img         : formJSON.icon,
                            create_date :  moment(Date.now()).format('YYYY-MM-DD HH:mm:ss')
                        }
                        if(body.img==undefined){
                            body.img = '';
                        }
                        const result = interest.addData(body, function(err,resData) {
                            console.log('er', err);
                            if (!err) {
                                if(body.parent_id != "root"){
                                  let bodyRoom = {
                                    title         : body.title
                                    , type        : 'interest'
                                    , creator_id  : body.id
                                    , creator_type: 'admin'
                                    , img         :  body.icon
                                    , create_date : moment(Date.now()).format('YYYY-MM-DD HH:mm:ss')  
                                  }
                                  Room.addData(bodyRoom, function(err, resAdd){
                                    console.log('roomErr', err)
                                    console.log('room_add', resAdd)
                                  })
                                }
                              
                                res.status(200).send(
                                    new response(true, 200, 'Create Data success', resData)
                                )
                            } else {
                                res.status(200).send(
                                    new response(false, 401, 'Create Data failed1', err)
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
        page        : 'required|text|'+req.body.page,
        item        : 'no|text|'+req.body.item,
        keyword     : 'no|text|'+req.body.keyword,
        create_date : 'no|text|'+req.body.create_date
      }
      if(utility.validateRequest(middleware)){
        const result = await admin.getAuth(req.body,function(errAuth,resAuth){
          if(!errAuth){
            if(!utility.issetVal(resAuth)){
              res.status(200).send(
              new response(false, 403, 'Unauthorized')
            )}else{
              if(resAuth.auth_code == req.body.auth_code){
                const bodyCount = {
                  keyword : req.body.keyword,
                  create_date : req.body.create_date
                }
                interest.getCountData(bodyCount,function(errResCount,rowsResCount) {
                  console.log({errResCount});
                  console.log(rowsResCount);
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
                            keyword : req.body.keyword,
                            create_date : req.body.create_date
                        }
                        interest.getAll(PreparedData,function(errRes,rowsRes) {
                          // console.log({rowsRes});
                          console.log({errRes});
                          if (!errRes) {
                            if (rowsRes !='') {
                                let parentArray = new Array()
                                let childArray = new Array()
                                let resultArray = new Array()
                                
                                for(let obj in rowsRes){
                                  // console.log(rowsRes[obj].parent_id)
                                  if(!utility.issetVal(rowsRes[obj].parent_id) || rowsRes[obj].parent_id =='root'){
                                    parentArray.push(rowsRes[obj])
                                  }else{
                                    childArray.push(rowsRes[obj])
                                  }
                                }

                                for(let parent in parentArray){
                                  let temp = {
                                    id: parentArray[parent].id,
                                    title: parentArray[parent].title,
                                    img: parentArray[parent].img,
                                    publish: parentArray[parent].publish,
                                    sort: parentArray[parent].sort,
                                    parent_id: 'root',
                                    create_date: parentArray[parent].create_date,
                                    modify_date: parentArray[parent].modify_date,
                                    child: []
                                  }
                                  // console.log({childArray : childArray});
                                  for(let child in childArray){
                                    if(childArray[child].parent_id == parentArray[parent].id){
                                      // console.log(childArray[child]);
                                      childArray[child].parent_name = parentArray[parent].title;
                                      temp.child.push(childArray[child])
                                      // temp.child.namaa = "anuu"
                                    }
                                  }
                                  resultArray.push(temp)
                                }
                                // console.log({resultArray})

                                const totalInfo = {
                                  total_page : total_page,
                                  total_data_all : total_data,
                                  total_data : rowsRes.length
                                }

                                let  finalResult = {
                                  data : rowsRes,
                                  total : totalInfo
                                }

                                if(resultArray.length != 0){
                                  finalResult.data = resultArray
                                  totalInfo.total_data = resultArray.length
                                }
                                console.log({'final result'  : finalResult.data});
                                res.status(200).send(new response(true, 200, 'Fetch Success', finalResult))
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
                            new response(false, 401, 'Fetch Failed3')
                        )
                    }
                  } else {
                      res.status(200).send(
                          new response(false, 401, 'Fetch Failed4')
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
    } catch (e) {
      console.log(e);
      res.status(500).send(
        new response(false, 500, 'Something went wrong')
      )
    }
}

exports.getParent = async (req, res) => {
  try{
    const middleware = {
      user_id        : 'required|text|'+req.body.user_id,
      auth_code      : 'required|text|'+req.body.auth_code,
    }
    if(utility.validateRequest(middleware)){
      const result = await admin.getAuth(req.body,function(errAuth,resAuth){
        console.log(errAuth)
        if(!errAuth){
          if(!utility.issetVal(resAuth)){
            res.status(200).send(
            new response(false, 403, 'Unauthorized')
          )}else{
            if(resAuth.auth_code == req.body.auth_code){
              interest.getParent(null,function(errRes,rowsRes) {
                console.log(errRes);
                if (!errRes) {
                  if(utility.issetVal(rowsRes)){
                      res.status(200).send(new response(true, 200, 'Fetch Success', rowsRes))
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

exports.getChild = async (req, res) => {
  try{
    const middleware = {
      user_id        : 'required|text|'+req.body.user_id,
      auth_code      : 'required|text|'+req.body.auth_code,
      parent_id      : 'no|text|'+req.body.parent_id,
    }
    if(utility.validateRequest(middleware)){
      const result = await admin.getAuth(req.body,function(errAuth,resAuth){
        console.log(errAuth)
        if(!errAuth){
          if(!utility.issetVal(resAuth)){
            res.status(200).send(
            new response(false, 403, 'Unauthorized')
          )}else{
            if(resAuth.auth_code == req.body.auth_code){
              let param = {};
              utility.issetVal(req.body.parent_id) ? param.parent_id = req.body.parent_id  : {};
              console.log('paran', param)
              interest.getChild(param,function(errRes,rowsRes) {
                console.log(errRes);
                if (!errRes) {
                  if(utility.issetVal(rowsRes)){
                      res.status(200).send(new response(true, 200, 'Fetch Success', rowsRes))
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

exports.getChildWithUser = async (req, res) => {
  try{
    const middleware = {
      user_id        : 'required|text|'+req.body.user_id,
      auth_code      : 'required|text|'+req.body.auth_code,
      parent_id      : 'no|text|'+req.body.parent_id,
    }
    if(utility.validateRequest(middleware)){
      const result = await admin.getAuth(req.body,function(errAuth,resAuth){
        console.log(errAuth)
        if(!errAuth){
          if(!utility.issetVal(resAuth)){
            res.status(200).send(
            new response(false, 403, 'Unauthorized')
          )}else{
            if(resAuth.auth_code == req.body.auth_code){
              let param = {};
              utility.issetVal(req.body.parent_id) ? param.parent_id = req.body.parent_id  : {};
              console.log('paran', param)
              interest.getChildWithUser(param,function(errRes,rowsRes) {
                console.log(errRes);
                if (!errRes) {
                  if(utility.issetVal(rowsRes)){
                      res.status(200).send(new response(true, 200, 'Fetch Success', rowsRes))
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
              interest.getById(body, function(errGet,resGet) {
                console.log(errGet);

                if (!errGet) {
                    if(!utility.issetVal(resGet)){
                        res.status(200).send(
                            new response(false, 404, 'Data not exist')
                        )
                    }else{
                        interest.deleteData(body, function(err,resData) {
                        // caches
                            if (!err) {
                              Room.deleteDataByInterest({creator_id : body.id}, function(err, resAdd){
                                console.log('roomErr', err)
                                console.log('room_add', resAdd)
                              })
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
      let formData = new Array();
      new formidable.IncomingForm().parse(req)
      .on('field', (name, field) => {
        formData.push('"' +name+ '"'+ ':'+'"'+utility.escapeHtml(field)+'"')
      })
      .on('file', (name, file) => {
        formData.push('"' +name+ '"'+ ':'+'"'+file.name+'"')
      })
      .on('fileBegin', function (name, file){
        if(utility.checkImageExtension(file.name)){
          let fileType = file.type.split('/').pop();
          file.name = utility.generateHash(16)+ '.' + fileType;
          file.path = pathDir + file.name;
        }
       })
      .on('aborted', () => {
        console.error('Request aborted by the user')
      })
      .on('error', (err) => {
        console.error('Error', err)
        throw err
      })
      .on('end', () => {
        let temp = '{'+formData.toString() +'}'
        let formJSON = JSON.parse(temp)
        
        const middleware = {
            user_id         : 'required|text|'+formJSON.user_id,
            auth_code       : 'required|text|'+formJSON.auth_code,
            id              : 'required|text|'+formJSON.id,
            parent_id       : 'required|text|'+formJSON.parent_id,
            title           : 'required|text|'+formJSON.title,
            sort            : 'no|number|'+formJSON.sort,
            icon            : 'no|images|'+formJSON.icon,
            publish         : 'required|number|'+formJSON.publish,
        }
        if(utility.validateRequest(middleware)){
          const result = admin.getAuth(formJSON,function(errAuth,resAuth){
            if(!errAuth){
                if(!utility.issetVal(resAuth)){
                    utility.cleanImage(formJSON.img,pathDir)
                    res.status(200).send(
                        new response(false, 403, 'Unauthorized')
                    )
                }else{
                  //here goes the function
                    const body = {
                        id          :  formJSON.id,
                        parent_id   : formJSON.parent_id,
                        title       : utility.unescapeHtml(formJSON.title),
                        publish     : formJSON.publish,
                        sort        : formJSON.sort,
                        img         : formJSON.icon,
                        create_date :  moment(Date.now()).format('YYYY-MM-DD HH:mm:ss')
                    }

                    interest.getById(body, function(errById, resById){
                        
                        if(!errById){
                            if(utility.issetVal(resById)){
                                if(utility.cleanJSON(body).img != null || utility.cleanJSON(body).img != undefined){
                                    if(utility.issetVal(resById.img)){
                                        fs.unlinkSync(pathDir + resById.img)
                                    }
                                }
                                interest.updateData(utility.cleanJSON(body), function(err,resData) {
                                  console.log('err', err)
                                    if (!err) {
                                        if(!utility.issetVal(resData)){
                                            utility.cleanImage(formJSON.img,pathDir)
                                            res.status(200).send(new response(false, 401, 'Update failed'))
                                        }else{
                                            let bodyRoom = {
                                              title         : body.title
                                              , type        : 'interest'
                                              , creator_id  : body.id
                                              , creator_type: 'admin'
                                              , img         :  body.icon
                                              , create_date : moment(Date.now()).format('YYYY-MM-DD HH:mm:ss')  
                                            }
                                            Room.updateDataByInterest({creator_id : body.id}, bodyRoom, function(err, resAdd){
                                              console.log('roomErr', err)
                                              console.log('room_add', resAdd)
                                            })
                                            res.status(200).send(new response(true, 200, 'Update success', resData))
                                        }
                                    } else {
                                        utility.cleanImage(formJSON.img,pathDir)
                                        res.status(200).send(new response(false, 401, 'Update failed'))
                                    }
                                })
                            } else {
                                console.log(errById);
                                utility.cleanImage(formJSON.img,pathDir)
                                res.status(200).send(
                                new response(false, 404, 'Data not exist2'))
                            }
                        }else{
                            console.log(errById);
                            utility.cleanImage(formJSON.img,pathDir)
                            res.status(200).send(
                            new response(false, 404, 'Data not exist2'))
                        }
                    })
                }
            }else{
                utility.cleanImage(formJSON.img,pathDir)
                res.status(200).send(
                    new response(false, 403, 'Unauthorized')
                )
            }
          })
        }else{
            utility.cleanImage(formJSON.img,pathDir)
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

                            interest.getById(body,function(errRes,resData) {
                                // console.log(resData);
                                if (!errRes) {
                                    if (utility.issetVal(resData)) {
                                        res.status(200).send(new response(true, 200, 'Fetch success', resData))
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

