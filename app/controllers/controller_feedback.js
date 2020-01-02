const admin = require('../models/admin')
const user = require('../models/user')
const feedback = require('../models/feedback')
const response = require('../../helpers/response')
const utility = require('../../helpers/utility')
const Excel = require('exceljs')
const nodemailer = require('../../helpers/mail_adapter');
let moment = require('moment')
const formidable = require('formidable')
const path = require('path');
const fs = require('fs');
let appDir = path.dirname(require.main.filename);
let pathDir = appDir + '/uploads/user/'
let fileDir = appDir + '/uploads/excel/'

exports.getFeedback = async (req, res) => {
  try {
    const middleware = {
      user_id      : 'required|text|'+req.body.user_id,
      auth_code    : 'required|text|'+req.body.auth_code,
      page         : 'required|number|'+req.body.page,
    }
    if(utility.validateRequest(middleware)){
      const result = admin.getAuth(req.body, (errAuth, resAuth)=> {
        console.log({errAuth});
        if(utility.issetVal(resAuth)){
          if(resAuth.auth_code == req.body.auth_code){
            let bodyCount = {
              keyword : req.body.keyword,
              create_date : req.body.create_date,
              app_version : req.body.app_version
            }

            feedback.getCount(bodyCount, (errCount, resCount)=> {
              console.log({errCount});
              let itemPerRequest = utility.issetVal(req.body.item)?  parseInt(req.body.item) : 15;
              let page = req.body.page;
              let total_data =  resCount;
              let total_page = Math.ceil(total_data / itemPerRequest);

              let limitBefore = page <= 1 || page == null ? 0 : (page-1) * itemPerRequest;

              if(!errCount){
                console.log({resCount});
                let bodyGet = {
                  start       : limitBefore,
                  limit       : itemPerRequest,                   
                  keyword     : req.body.keyword,
                  create_date : req.body.create_date,
                  app_version : req.body.app_version
                }
                feedback.getAll(bodyGet, (errGet, resGet) => {
                  if(utility.issetVal(resGet)){
                    const totalInfo = {
                      total_page : total_page,
                      total_data_all : total_data,
                      total_data : resGet.length
                    }
                    res.status(200).send(new response(true, 200, 'Fetch Success', {
                      data :resGet,
                      total: totalInfo
                    }))
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
  } catch (error) {
    console.log(error);
    res
    .status(500)
    .send(new response(false, 500, 'Something went wrong'))
  }
}

exports.exportFeedback = async(req, res)=> {
  try {
    const middleware = {
      keyword : req.body.keyword || null,
      create_date : req.body.create_date || null,
      app_version : req.body.app_version|| null
    }
            feedback.getAll(middleware, (errGet, resGet)=> {
              if (utility.issetVal(resGet)) {
                const data = resGet;
                // console.log(data);
                let fileName = 'feedback-'+ moment(Date.now()).format('DD-MM-YYYY')+ '.xlsx'
                var workbook = new Excel.Workbook();
                var worksheet = workbook.addWorksheet('Sheet');
                var fill = {
                  type: 'pattern',
                  pattern:'solid',
                  fgColor:{ argb:'F4B084'}
                }
                var font = {bold: true}
      worksheet.getCell('A1').fill = fill; worksheet.getCell('B1').fill = fill; worksheet.getCell('C1').fill = fill;
      worksheet.getCell('A1').font = font; worksheet.getCell('B1').font = font; worksheet.getCell('C1').font = font;

      worksheet.getCell('D1').fill = fill; worksheet.getCell('E1').fill = fill; worksheet.getCell('F1').fill = fill;
      worksheet.getCell('D1').font = font; worksheet.getCell('E1').font = font; worksheet.getCell('F1').font = font;

      worksheet.getCell('G1').fill = fill; 
      worksheet.getCell('G1').font = font; 
            
                workbook.views = [
                    {
                        x: 0, y: 0, width: 10000, height: 20000,
                        firstSheet: 0, activeTab: 1, visibility: 'visible'
                    }
                ];
                
                if(data){
                          
                  worksheet.columns = [
                    {header: '#', key: 'no'},
                    {header: 'App Version', key: 'app_version', width: 10}, 
                    {header: 'Alumni Name', key: 'alumni_name', width: 30,},
                    {header: 'Alumni Email', key: 'alumni_email', width: 30,},
                    {header: 'Alumni Phone', key: 'alumni_phone', width: 15,},
                    {header: 'Feedback Content', key: 'content', width: 100, height:50,},
                    {header: 'Submit Date', key: 'create_date', width: 15, type: 'date', formulae: [new Date(2019, 0, 1)]}
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
            })
  } catch (error){
    console.log(error);
    res
    .status(500)
    .send(new response(false, 500, 'Something went wrong'))
  }
}