
let response = require('../../helpers/response')
const utility = require('../../helpers/utility')
const nodemailer = require('../../helpers/mail_adapter');
const Excel = require('exceljs')
let moment = require('moment')
const formidable = require('formidable')
const path = require('path');
const fs = require('fs');
let appDir = path.dirname(require.main.filename);
let pathDir = appDir + '/uploads/job/'
let fileDir = appDir + '/uploads/excel/'

// Model
const JobRecommend = require('../models/AT_JobRecommend')
const job          = require('../models/job')
const admin        = require('../models/admin')
const shareJob     = require('../models/shareJob')

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
          file.path = appDir + '/uploads/job/' + file.name;
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
            lineservice_id  : 'required|text|'+formJSON.lineservice_id,
            title           : 'required|text|'+formJSON.title,
            type            : 'required|number|'+formJSON.type,
            position        : 'required|text|'+formJSON.grade,
            description     : 'required|text|'+formJSON.description,
            due_date        : 'required|text|'+formJSON.due_date,
            img             : 'required|images|'+formJSON.img,
            publish         : 'required|number|'+formJSON.publish,
            entity          : 'required|number|' + formJSON.entity,
            url             : 'no|text|' +formJSON.url
        }
        let strEntity = [
          'KAP Tanudiredja, Wibisana, Rintis, & Rekan',
          'PT. Prima Wahana Caraka',
          'PT. PricewaterhouseCoopers Indonesia Advisory',
          'PT. PricewaterhouseCoopers Consulting Indonesia'
        ]
        if(utility.validateRequest(middleware)){
          const result = admin.getAuth(formJSON,function(errAuth,resAuth){
            if(!errAuth){
                if(!utility.issetVal(resAuth)){
                    res.status(200).send(
                        new response(false, 403, 'Unauthorized')
                    )
                }else{
                    if(resAuth.auth_code == formJSON.auth_code){
                        let dateObj = new Date(formJSON.due_date);
                        //here goes the function
                        const body = {
                            id          :  utility.generateHash(32),
                            lineservice_id  : formJSON.lineservice_id,
                            position        : utility.unescapeHtml(formJSON.grade),
                            type            : formJSON.type,
                            title           : utility.unescapeHtml(formJSON.title),
                            description     : utility.unescapeHtml(formJSON.description),
                            url             : formJSON.url,
                            due_date        : moment(formJSON.due_date).format('YYYY-MM-DD HH:mm:ss'),
                            start_date      : moment(Date.now()).format('YYYY-MM-DD HH:mm:ss'),
                            img             : formJSON.img,
                            publish         : formJSON.publish,
                            create_date     :  moment(Date.now()).format('YYYY-MM-DD HH:mm:ss'),
                            company         : '',
                            area            : '',
                            entity          : strEntity[parseInt(formJSON.entity)]
                        }
                        if(body.img==undefined){
                            body.img = '';
                        }
                        console.log(dateObj)
                        const result = job.addData(body, function(err,resData) {
                            if (!err) {
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
        level       : 'no|text|'+req.body.level
      }
      console.log(req.body);
      let IdLineOfService = null
      if(utility.issetVal(req.body.lineOfService_list)){
        let lineOfService_list = JSON.parse(req.body.lineOfService_list)
        IdLineOfService = lineOfService_list.map(({lineOfService_id}) => lineOfService_id)
      }
      console.log({IdLineOfService : IdLineOfService});
      if(utility.validateRequest(middleware)){
        const result = await admin.getAuth(req.body,function(errAuth,resAuth){
          console.log({errAuth});
          if(!errAuth){
            if(!utility.issetVal(resAuth)){
              res.status(200).send(
              new response(false, 403, 'Unauthorized')
            )}else{
              if(resAuth.auth_code == req.body.auth_code){
                const bodyCount = {
                  keyword : req.body.keyword,
                  level   : req.body.level,
                  lineOfService_list : IdLineOfService
                }
                job.getCountData(bodyCount,function(errResCount,rowsResCount) {
                  // console.log(errResCount);
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
                            level   : req.body.level,
                            lineOfService_list : IdLineOfService,
                            sort  : req.body.sort
                        }

                        job.getAll(PreparedData,function(errRes,rowsRes) {
                          console.log(errRes);
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
              job.getById(body, function(errGet,resGet) {
                console.log(errGet);

                if (!errGet) {
                    if(!utility.issetVal(resGet)){
                        res.status(200).send(
                            new response(false, 404, 'Data not exist')
                        )
                    }else{
                        job.deleteData(body, function(err,resData) {
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
          lineservice_id  : 'required|text|'+formJSON.lineservice_id,
          title           : 'required|text|'+formJSON.title,
          type            : 'required|number|'+formJSON.type,
          position        : 'required|text|'+formJSON.grade,
          description     : 'required|text|'+formJSON.description,
          due_date        : 'required|text|'+formJSON.due_date,
          img             : 'no|images|'+formJSON.img,
          publish         : 'required|number|'+formJSON.publish,
          entity          : 'required|number|'+formJSON.entity,
          url             : 'no|text|'+formJSON.url
        }
        let strEntity = [
          'KAP Tanudiredja, Wibisana, Rintis, & Rekan',
          'PT. Prima Wahana Caraka',
          'PT. PricewaterhouseCoopers Indonesia Advisory',
          'PT. PricewaterhouseCoopers Consulting Indonesia'
        ]
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
                    lineservice_id  : formJSON.lineservice_id,
                    position        : formJSON.grade,
                    type            : formJSON.type,
                    title           : utility.unescapeHtml(formJSON.title),
                    description     : utility.unescapeHtml(formJSON.description),
                    due_date        : moment(formJSON.due_date).format('YYYY-MM-DD HH:mm:ss'),
                    start_date      : moment(Date.now()).format('YYYY-MM-DD HH:mm:ss'),
                    img             : formJSON.img,
                    publish         : formJSON.publish,
                    company         : '',
                    area            : '',
                    url             : formJSON.url,
                    entity          : strEntity[parseInt(formJSON.entity)]
                  }


                    job.getById(body, function(errById, resById){
                        if(!errById){
                            if(utility.issetVal(resById)){
                                if(utility.cleanJSON(body).img != null || utility.cleanJSON(body).img != undefined){
                                    if(utility.issetVal(resById.img)){
                                        fs.unlinkSync(pathDir + resById.img)
                                    }
                                }
                                job.updateData(utility.cleanJSON(body), function(err,resData) {
                                    if (!err) {
                                        if(!utility.issetVal(resData)){
                                            utility.cleanImage(formJSON.img,pathDir)
                                            res.status(200).send(new response(false, 401, 'Update failed'))
                                        }else{
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
            id              : 'required|text|'+req.body.id,
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

                            job.getById(body,function(errRes,resData) {
                                console.log(errRes);
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

exports.getRecommendation = async (req, res) =>{
  console.log('=== Get View Recommendation ===');
  console.log(req.body);
  try {
    const {id, user_id, auth_code, page, item} = req.body
    const middleware = {
      id          : 'required|text|'+id,
      user_id     : 'required|text|'+user_id,
      auth_code   : 'required|text|'+auth_code,
      page        : 'required|text|'+page,
      item        : 'no|text|'+item,
    }
    if(utility.validateRequest(middleware)){
      admin.getAuth(req.body, function(errAuth, resAuth){
        if(!errAuth){
          if(utility.issetVal(resAuth)){
            if(resAuth.auth_code == auth_code){
              console.log('=== Auth Code ===');
              JobRecommend.getCountData(req.body, function(errCount, resCount){
                // console.log((errCount))
                if(utility.issetVal(resCount)){
                  let itemPerRequest = utility.issetVal(req.body.item)?  parseInt(req.body.item) : 15;
                  let page = req.body.page;
                  let total_data =  resCount;
                  let total_page = Math.ceil(total_data / itemPerRequest);

                  let limitBefore = page <= 1 || page == null ? 0 : (page-1) * itemPerRequest;

                  const PreparedData = {
                      id    : id,
                      start : limitBefore,
                      limit : itemPerRequest
                  }
                  // console.log(PreparedData);
                  JobRecommend.getViewRecommendaton(PreparedData, function(errData, resData){
                      if(utility.issetVal(resData)){
                        const totalInfo = {
                          total_page : total_page,
                          total_data_all : total_data,
                          total_data : resData.length
                        }
                        res.status(200).send(new response(true, 200, 'Fetch Success', {
                          data : resData,
                          total: totalInfo
                        } ))
                      } else {
                        res
                        .status(200)
                        .send(new response(false, 401, 'Fetch Failed'))
                      }
                  })

                } else { // Error count
                  res
                  .status(200)
                  .send(new response(false, 401, 'Fetch Failed'))
                }
              })
            } else {
              res
              .status(200)
              .send(
              new response(false, 403, 'Unauthorized'))
            }
          } else {
            res
            .status(200)
            .send(
            new response(false, 403, 'Unauthorized'))
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
  } catch {
    res
    .status(500)
    .send(new response(false, 500, 'Something went wrong'))
  }
}

exports.exportRecommendation = async (req,res)=>{
  try{
    const middleware = {
      user_id      : 'required|text|'+req.body.user_id,
      auth_code    : 'required|text|'+req.body.auth_code,
      datas        : 'required|text|'+req.body.datas
    }
    let datas = JSON.parse(req.body.datas)
    if(utility.validateRequest(middleware)){
      const result = admin.getAuth(req.body, (errAuth, resAuth)=> {
        console.log({errAuth : errAuth});
        if(utility.issetVal(resAuth)){
          if(resAuth.auth_code == req.body.auth_code){

            let workbook = new Excel.Workbook()
            let fileName = 'export-job-recommendation-'+ moment(Date.now()).format('DD-MM-YYYY')+ '.xlsx'
            let worksheet = workbook.addWorksheet('Job Recommendation')
            let filePath = path.resolve(fileDir,fileName)

            worksheet.columns = [
              {header: 'No', key: 'no', width: 5},
              {header: 'Recommender Name', key: 'recommendation_name', width: 20},
              {header: 'Recommended Email', key: 'recommendation_email', width: 30}, 
              {header: 'Recommended Date', key: 'create_date', width: 30,},
            ];
            
            worksheet.getRow(1).fill = {
              type: 'pattern',
              pattern:'solid',
              bgColor:{argb:'#FFA500'},
              font:{bold: true, name: 'Comic Sans MS'}
            }

            datas.forEach((element,i) => {
              element["no"]= i+1
              worksheet.addRow(element)
            });

            workbook.xlsx.writeFile(filePath) 
            .then(function () {
              res
              .status(200)
              .send(new response(true, 200, 'excel file created successfully'))
            })
            .catch(error => {
              res
              .status(200)
              .send(new response(false, 401, 'excel file Failed'))
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
  } catch(error){
    console.log(error);
    res
    .status(500)
    .send(new response(false, 500, 'Something went wrong'))
  }
}

exports.getJobShare = async (req, res) => {
  try{
    const middleware = {
      user_id     : 'required|text|'+req.body.user_id,
      auth_code   : 'required|text|'+req.body.auth_code,
      id          : 'required|text|'+req.body.job_id,
      page        : 'required|text|'+req.body.page,
      item        : 'no|text|'+req.body.item,
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
              shareJob.getCountData({job_id :req.body.job_id},function(errResCount,rowsResCount) {
                console.log(errResCount);
                if (!errResCount) {
                  if (utility.issetVal(rowsResCount)) {
                      let itemPerRequest = utility.issetVal(req.body.item)?  parseInt(req.body.item) : 15;
                      let page = req.body.page;
                      let total_data =  rowsResCount;
                      let total_page = Math.ceil(total_data / itemPerRequest);

                      let limitBefore = page <= 1 || page == null ? 0 : (page-1) * itemPerRequest;

                      const PreparedData = {
                          job_id  : req.body.job_id,
                          start   : limitBefore,
                          limit   : itemPerRequest
                      }

                      shareJob.getAll(PreparedData,function(errRes,rowsRes) {
                        console.log(errRes);
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

exports.exportShare = async (req,res) => {
  try {
    const middleware = {
      user_id      : 'required|text|'+req.body.user_id,
      auth_code    : 'required|text|'+req.body.auth_code,
      datas        : 'required|text|'+req.body.datas
    }
    let datas = JSON.parse(req.body.datas)
    if(utility.validateRequest(middleware)){
      const result = admin.getAuth(req.body, (errAuth, resAuth)=> {
        if(utility.issetVal(resAuth)){
          if(resAuth.auth_code == req.body.auth_code){

            let workbook = new Excel.Workbook()
            let fileName = 'export-job-shares-'+ moment(Date.now()).format('DD-MM-YYYY')+ '.xlsx'
            let worksheet = workbook.addWorksheet('Job Shares')
            let filePath = path.resolve(fileDir,fileName)

            worksheet.columns = [
              {header: 'No', key: 'no', width: 5},
              {header: 'Shared By', key: 'user_name', width: 20},
              {header: 'Shared to', key: 'shareTo_name', width: 20}, 
              {header: 'Shared Date', key: 'create_date', width: 30,},
            ];

            datas.forEach((element,i) => {
              element["no"]= i+1
              worksheet.addRow(element)
              
            });

            worksheet.getRow(1).fill = {
              type: 'pattern',
              pattern:'solid',
              bgColor:{argb:'#FFA500'},
              font:{bold: true, name: 'Comic Sans MS'}
            }

            workbook.xlsx.writeFile(filePath) 
            .then(function () {
              res
              .status(200)
              .send(new response(true, 200, 'excel file created successfully'))
            })
            .catch(error => {
              res
              .status(200)
              .send(new response(false, 401, 'excel file Failed'))
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
  } catch(error){
    console.log(error);
    res
    .status(500)
    .send(new response(false, 500, 'Something went wrong'))
  }
}

exports.getShareByUser = async (req, res) => {
  try{
    const middleware = {
      user_id     : 'required|text|'+req.body.user_id,
      auth_code   : 'required|text|'+req.body.auth_code,
      alumni_id   : 'required|text|'+req.body.alumni_id,
      page        : 'required|text|'+req.body.page,
      item        : 'no|text|'+req.body.item,
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
              shareJob.getCountDataUser({user_id :req.body.alumni_id},function(errResCount,rowsResCount) {
                console.log(errResCount);
                if (!errResCount) {
                  if (utility.issetVal(rowsResCount)) {
                      let itemPerRequest = utility.issetVal(req.body.item)?  parseInt(req.body.item) : 15;
                      let page = req.body.page;
                      let total_data =  rowsResCount;
                      let total_page = Math.ceil(total_data / itemPerRequest);

                      let limitBefore = page <= 1 || page == null ? 0 : (page-1) * itemPerRequest;

                      const PreparedData = {
                          user_id  : req.body.alumni_id,
                          start   : limitBefore,
                          limit   : itemPerRequest
                      }

                      shareJob.getAllUser(PreparedData,function(errRes,rowsRes) {
                        console.log(errRes);
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

exports.getRecommendationByUser = async (req, res) => {
  try{
    const middleware = {
      user_id     : 'required|text|'+req.body.user_id,
      auth_code   : 'required|text|'+req.body.auth_code,
      alumni_id   : 'required|text|'+req.body.alumni_id,
      page        : 'required|text|'+req.body.page,
      item        : 'no|text|'+req.body.item,
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
              JobRecommend.getCountDataUser({user_id :req.body.alumni_id},function(errResCount,rowsResCount) {
                console.log(errResCount);
                if (!errResCount) {
                  if (utility.issetVal(rowsResCount)) {
                      let itemPerRequest = utility.issetVal(req.body.item)?  parseInt(req.body.item) : 15;
                      let page = req.body.page;
                      let total_data =  rowsResCount;
                      let total_page = Math.ceil(total_data / itemPerRequest);

                      let limitBefore = page <= 1 || page == null ? 0 : (page-1) * itemPerRequest;

                      const PreparedData = {
                          user_id  : req.body.alumni_id,
                          start   : limitBefore,
                          limit   : itemPerRequest
                      }

                      JobRecommend.getAllUser(PreparedData,function(errRes,rowsRes) {x
                        console.log(errRes);
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

exports.deeplink =  async (req, res)=>{
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

      job.getById(body,function(errRes,resData) {
          console.log(errRes);
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
    } else {
      res.status(200).send(new response(false, 400, 'Invalid input format'))
    }
  } catch(error){
    console.log(error);
    res.status(500).send(new response(false, 500, 'Something went wrong'))
  }
}

exports.exportJobRecommend = async(req, res)=> {
  try {
    const body = {
      id : 'cVILpEUJrHLcpoMvl5FzhZ88YBtnQkDt'
    } 
              const title = await JobRecommend.getTitle(body)
              var titleName = '';
              const x = title.map(data=>{ titleName = data.title })
              // console.log(titleName);
              
              
              if (utility.issetVal(title)) {
                let fileName = titleName+'-'+ moment(Date.now()).format('DD-MM-YYYY')+ '.xlsx'
                const data = await JobRecommend.getRecommend(body)
                if(data){
                var workbook = new Excel.Workbook();
                var worksheet = workbook.addWorksheet('Sheet');
                var fill = {
                  type: 'pattern',
                  pattern:'solid',
                  fgColor:{ argb:'F4B084'}
                }
                var font = {bold: true}
                worksheet.getCell('A1').fill = fill;
                worksheet.getCell('A1').font = font;

                worksheet.getCell('B1').fill = fill;
                worksheet.getCell('B1').font = font;

                worksheet.getCell('C1').fill = fill;
                worksheet.getCell('C1').font = font;

                worksheet.getCell('D1').fill = fill;
                worksheet.getCell('D1').font = font;

                worksheet.getCell('E1').fill = fill;
                worksheet.getCell('E1').font = font;
                workbook.views = [
                    {
                        x: 0, y: 0, width: 10000, height: 20000,
                        firstSheet: 0, activeTab: 1, visibility: 'visible'
                    }
                ];
                
                
                          
                  worksheet.columns = [
                    {header: '#', key: 'no'},
                    {header: 'Recommender Name', key: 'name', width: 20},
                    {header: 'Recommended Email', key: 'email', width: 30}, 
                    {header: 'Recommended Email', key: 'title', width: 30}, 
                    {header: 'Recommended Date', key: 'date', width: 20, type: 'date', formulae: [new Date(2019, 0, 1)]}
                  ];
                  data.forEach((element,i) => {
                      element["no"]= i+1
                      worksheet.addRow(element).commit();
                      });
              
                  
          
              res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
              res.setHeader("Content-Disposition", "attachment; filename=" + fileName);
              res.set('Set-Cookie', 'fileDownload=true; path=/')
              workbook.xlsx.write(res)
                  .then(function (data) {
                      res.end();
                      console.log(`Export Feedback Success!`);
                  });
              }
                
              }else{
                res.status(200).send(new response(false, 401, "No Data"));
              }
            // })
  } catch (error){
    console.log(error);
    res
    .status(500)
    .send(new response(false, 500, 'Something went wrong'))
  }
}