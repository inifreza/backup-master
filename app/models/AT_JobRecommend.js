const table = 'AT_JobRecommend'
const exec = require('../../helpers/mssql_adapter')
const utility = require('../../helpers/utility')

// Additional Models
var user = require('../models/user')

module.exports = {

  addData: function (req, callback) {
    return exec.save(req, table, callback);
  },

  getCountData  : function(req, callback){
    console.log('=== getCountData ===');
    exec
    .knex('AT_JobRecommend')
    .select(
      'job_id as id',
      'user.id as recommendby_id',
      'user.name as recommendby_username',
      'user.email as recommendby_email',
      'shareto.id as recommendation_id',
      'shareto.name as recommendation_name',
      'shareto.email as recommendation_email',
      'AT_JobRecommend.create_date')
    .leftJoin('T_User as user', 'user.id', '=', 'AT_JobRecommend.user_id')
    .leftJoin('T_User as shareto', 'shareto.id', '=', 'AT_JobRecommend.share_to')
    .where({job_id : req.id})
    .orderBy('AT_JobRecommend.create_date', 'desc')
    .then(datas =>{
      // console.log(datas);
      callback(null, datas.length)
    })
    .catch(error =>{
      // console.log(error);
      callback(error,null)
    })
  },

  getViewRecommendaton :function (req, callback) {
    console.log('=== Moodel Get View Recommend ===');
    console.log({req});
    exec
    .knex('AT_JobRecommend')
    .select(
      'job_id as id',
      'user.id as recommendby_id',
      'user.name as recommendby_username',
      'user.email as recommendby_email',
      'shareto.id as recommendation_id',
      'shareto.name as recommendation_name',
      'shareto.email as recommendation_email',
      'AT_JobRecommend.create_date')
    .leftJoin('T_User as user', 'user.id', '=', 'AT_JobRecommend.user_id')
    .leftJoin('T_User as shareto', 'shareto.id', '=', 'AT_JobRecommend.share_to')
    .where({job_id : req.id})
    .orderBy('AT_JobRecommend.create_date', 'desc')
    .limit(req.limit)
    .offset(req.start)
    .then(datas =>{
      // console.log(datas);
      callback(null, datas)
    })
    .catch(error =>{
      // console.log(error);
      callback(error,null)
    })
  },

  getCountDataUser  : function(req, callback){
    return exec.knex(table).count('job_id as job_id')
        .where(req)
        .then(datas=>{
            callback(null, datas[0].job_id)
        }).catch(function(error) { 
            callback(error, null)
        });
  },

  getAllUser  : function(req, callback){
    let column = [
        'job.id'
        , 'job.title'
        , 'job.start_date'
        , 'job.due_date'
        , exec.knex.raw(`CASE WHEN type = '1'
            THEN 'Graduate'
            ELSE 'Experienced Hires'
            END as type
        `)
        , 'job.img'
        , 'job.publish'
        , 'job.lineservice_id'
        , 'lineservice.title as lineservice_title'
        , 'job.position as grade'
        ,  'jobRecommend.*'
    ];
    return exec.knex(table + ' as jobRecommend')
    .select(column)
    .leftJoin('T_Job as job', 'job.id', '=', 'jobRecommend.job_id')
    .leftJoin('T_LineOfService as lineservice', 'job.lineservice_id', '=', 'lineservice.id')
    .orderByRaw('jobRecommend.create_date DESC')
    .where({'user_id' : req.user_id})
    .limit(req.limit)
    .offset(req.start)
    .then(datas=>{
        Promise.all(datas.map(data => {
            
            let promiseUser = new Promise(function(resolve, reject) {
                const body = {
                    id : data.user_id,
                }
                console.log(body)
                user.getById(body,function(errRes,resData) {
                    // console.log('data',resData);
                    // console.log('err',errRes)
                    if(!errRes){
                        resolve(resData)
                    }
                });
            })

            let promiseShareTo = new Promise(function(resolve, reject) {
                const body = {
                    id : data.share_to,
                }
                user.getById(body,function(errRes,resData) {
                    // console.log('data',resData);
                    // console.log('err',errRes)
                    if(!errRes){
                        resolve(resData)
                    }
                });
            })
           
            return Promise.all([promiseUser, promiseShareTo]).then(arr => {
                console.log('callbacid', arr[0].id)
                data.user_id = arr[0].id;
                data.user_name = arr[0].name;
                data.user_email = arr[0].email;
                data.user_img = arr[0].img;
                data.user_path = '/upload/user/'

                data.shareTo_id = arr[0].id;
                data.shareTo_name = arr[0].name;
                data.shareTo_email = arr[0].email;
                data.shareTo_img = arr[0].img;
                data.shareTo_path = '/upload/user/'
               
                return data
            })
           
        })).then(response => {
            callback(null, response)
        }).catch(function(error){ 
            callback(error, null)
        });
    }).catch(function(error) { 
        callback(error, null)
    });
  },
  
  getRecommend :function (req) {
   
   return exec
    .knex('AT_JobRecommend as AJ')
    .select(
      'AJ.job_id as id',
      'job.title as title',
      'user.name as name',
      'user.email as email',
      'job.start_date as date')
    .leftJoin('T_User as user', 'user.id',  'AJ.user_id')
    .leftJoin('T_Job as job', 'job.id', 'AJ.job_id')
    .where({job_id : req.id})
    .orderBy('AJ.create_date', 'desc')
  },
  getTitle :function (req) {
   return exec
    .knex('T_Job')
    .select(
      'title')
    .where({id : req.id})
  },
  /* deleteData: function (req, callback) {
    return exec.findByIdAndDelete(req.id, table, callback);
  },

  getListBySchool: function (req, callback) {
    let column = [
      '*'
    ]
    return exec.findAll(req,column,'school ASC', table, callback)
  },

  getById : function(req, callback){
    let column = [
      '*'
    ]
    return exec.findById(req.id,column, table, callback)
  },

  getByFilter  : function(req, callback){
    
    return exec.knex(table)
    .select('*')
    .where('school', 'LIKE', `%${req.school}%`)
    .orderBy('school', 'asc')
    .limit(req.limit)
    .offset(req.start)
    .then(datas=>{
        callback(null, datas)
    }).catch(function(error) { 
        callback(error, null)
    });
},
  
  updateData: function(req, callback){
    return exec.findByIdAndUpdate(req.id, req, table, callback);
} */
}