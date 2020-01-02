const table = 'AT_JobShare'
const exec = require('../../helpers/mssql_adapter')
const utility = require('../../helpers/utility')

// Additional Models
var user = require('../models/user')

module.exports = {

    getById  : function(req, callback){
        return exec.findById(req.id, '*', table , callback);
    },

    getCountData  : function(req, callback){
        return exec.knex(table).count('job_id as job_id')
            .where(req)
            .then(datas=>{
                callback(null, datas[0].job_id)
            }).catch(function(error) { 
                callback(error, null)
            });
    },

    getAll  : function(req, callback){
        return exec.knex(table)
        .select('*')
        .orderByRaw('create_date ASC')
        .where({'job_id' : req.job_id})
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
            ,  'jobShare.*'
        ];
        return exec.knex(table + ' as jobShare')
        .select(column)
        .leftJoin('T_Job as job', 'job.id', '=', 'jobShare.job_id')
        .leftJoin('T_LineOfService as lineservice', 'job.lineservice_id', '=', 'lineservice.id')
        .orderByRaw('jobShare.create_date DESC')
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
}