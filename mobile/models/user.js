
let table = 'T_User';
const exec = require('../../helpers/mssql_adapter') 
var stringInject = require('stringinject')
const utility = require('../../helpers/utility')
const eula = require('../models/eula')

// setting image
const globals = require('../../configs/global')
const {
    config
} = require('../../default')
let url = globals[config.environment]; // development || production


// Mongoose
const postCommentLikes = require('../models/postcommentLikes')
const Model = require("../../data/schema_postComment");
let mongoose = require('mongoose');
let Schema = mongoose.Schema;
var ModelUser = require('../../data/schema_users');

module.exports = {
    deleteData : function(req, callback){
        return exec.findByIdAndDelete(req.id, table, callback);
    },
    
    getById  : function(req, callback){
        // console.log(req);
        let column = [
              'id'
            , 'name'
            , 'email'
            , 'phone'
            , 'phone1'
            , 'company'
            , 'position'
            , 'bio'
            , 'achievement'
            , 'type'
            , 'alumni'
            , 'password'
            , 'salt_hash'
            , exec.knex.raw(`CASE WHEN type = 'pwc' AND  alumni = 'yes'
                THEN 'alumni'
                WHEN type = 'pwc' AND  alumni = 'no'
                THEN 'internal'
                ELSE 'external'
                END as type_alumni
            `)
            , exec.knex.raw(`CASE WHEN verified = '2'
                THEN 'Verified'
                WHEN verified = '1'
                THEN 'Unverified'
                WHEN verified = '3'
                THEN 'Reject'
                ELSE 'Invited'
                END as status
            `)
            , exec.knex.raw(`( SELECT COUNT(AT_AlumniEducation.user_id) FROM  AT_AlumniEducation where AT_AlumniEducation.user_id = T_User.id) as count_education
            `)
            , exec.knex.raw(`( SELECT COUNT(AT_AlumniExperience.user_id) FROM  AT_AlumniExperience where AT_AlumniExperience.user_id = T_User.id) as count_experience
            `)
            , exec.knex.raw(`( SELECT COUNT(AT_AlumniInterest.user_id) FROM  AT_AlumniInterest where AT_AlumniInterest.user_id = T_User.id) as count_interest
            `)
            , 'batch'
            , 'dob'
            , 'gender'
            , 'img'
            , 'eula'
            , 'eula_version'
            , 'eula_date'
            , 'publish'
            , 'join_date'
            , 'create_date'
            , 'resign_date'
            , 'lineservice_id'
            , 'facebook'
            , 'whatsapp'
            , 'linkedin'
            , 'instagram'
            , 'twitter'
            
        ];
        return exec.findById(req.id, column, table , callback);
    },

    getCountData  : function(req, callback){
        let param = utility.issetVal(req) ? {verified : req.verified} :  {};
       
        if(req.interest_id){
            param.interest_id = req.interest_id;
        }
        if(req.batch){
            param.batch = req.batch;
        }
        // return exec.getCountData(param, table, callback);
        console.log(param);
        return exec.knex('T_User as user')
        .select('*')
        .leftJoin('T_LineOfService as lineservice', 'user.lineservice_id', '=', 'lineservice.id')
        .leftJoin('AT_AlumniInterest as alumniInterest', 'user.id', '=', 'alumniInterest.user_id')
        .where(param)
        .modify(function(queryBuilder) {
            if(utility.issetVal(req.name)){
                queryBuilder.where('name', 'LIKE', "%"+req.name+"%");
            }
        })
        .orderBy('user.create_date', 'desc')
        .then(datas=>{
            callback(null, datas.length)
        }).catch(function(error) { 
            callback(error, null)
        });
    },

    getAll  : function(req, callback){
        let param = utility.issetVal(req) ? {verified : req.verified} :  {};
       
        if(req.interest_id){
            param.interest_id = req.interest_id;
        }
        if(req.batch){
            param.batch = req.batch;
        }
        console.log({param : param});
        let column = [
            'user.id'
            , 'user.name'
            , 'user.email'
            , 'user.phone'
            , 'user.company'
            , 'user.position'
            , 'user.bio'
            , 'user.type'
            , 'user.achievement'
            , 'user.alumni'
            , exec.knex.raw(`CASE WHEN type = 'pwc' AND  alumni = 'yes'
                THEN 'alumni'
                WHEN type = 'pwc' AND  alumni = 'no'
                THEN 'internal'
                ELSE 'external'
                END as type_alumni
            `)
            , exec.knex.raw(`CASE WHEN verified = '2'
                THEN 'Verified'
                WHEN verified = '1'
                THEN 'Unverified'
                WHEN verified = '3'
                THEN 'Reject'
                ELSE 'Invited'
                END as status
            `)
            , 'user.batch'
            , 'user.dob'
            , 'user.gender'
            , 'user.img'
            , 'user.eula'
            , 'user.eula_version'
            , 'user.eula_date'
            , 'user.publish'
            , 'user.join_date'
            , 'user.create_date'
            , 'user.resign_date'
            , 'user.lineservice_id'
            , 'lineservice.title as lineservice_title'
            , 'alumniInterest.interest_id'
        ];
        
        return exec.knex('T_User as user')
            .select(column)
            .leftJoin('T_LineOfService as lineservice', 'user.lineservice_id', '=', 'lineservice.id')
            .leftJoin('AT_AlumniInterest as alumniInterest', 'user.id', '=', 'alumniInterest.user_id')
            .where(param)
            .modify(function(queryBuilder) {
                if(utility.issetVal(req.name)){
                    queryBuilder.where('name', 'LIKE', "%"+req.name+"%");
                }
            })
            .orderBy('user.create_date', 'desc')
            .limit(req.limit)
            .offset(req.start)
            .then(datas=>{
                callback(null, datas)
            }).catch(function(error) { 
                callback(error, null)
            });
    },

    getMention : function (req, callback ){
        let param = utility.issetVal(req) ? {verified : req.verified} :  {};
        return exec
        .knex(table)
        .select(
            'id',
            'name as value',
            'email',
            'batch',
            'type',
            'img'
        )
        .where(param)
        .orderBy('name')
        .then(datas=>{
            callback(null, datas)
        }).catch(function(error) { 
            callback(error, null)
        });
    },

    getCountDataPublish  : function(req, callback){
        return exec.getCountData({publish : req.publish}, table, callback);
    },

    getAllPublish  : function(req, callback){
        let param  = utility.issetVal(req) ? req :  {};
        
        let column = [
            'user.id'
            , 'user.name'
            , 'user.email'
            , 'user.phone'
            , 'user.company'
            , 'user.position'
            , 'user.bio'
            , 'user.type'
            , 'user.achievement'
            , 'user.alumni'
            , exec.knex.raw(`CASE WHEN type = 'pwc' AND  alumni = 'yes'
                THEN 'alumni'
                WHEN type = 'pwc' AND  alumni = 'no'
                THEN 'internal'
                ELSE 'external'
                END as type_alumni
            `)
            , exec.knex.raw(`CASE WHEN verified = '2'
                THEN 'Verified'
                WHEN verified = '1'
                THEN 'Unverified'
                WHEN verified = '3'
                THEN 'Reject'
                ELSE 'Invited'
                END as status
            `)
            , 'user.batch'
            , 'user.dob'
            , 'user.gender'
            , 'user.img'
            , 'user.eula'
            , 'user.eula_version'
            , 'user.eula_date'
            , 'user.publish'
            , 'user.join_date'
            , 'user.create_date'
            , 'user.resign_date'
            , 'user.lineservice_id'
            , 'lineservice.title as lineservice_title'
        ];
        
        return exec.knex('T_User as user')
            .select(column)
            .leftJoin('T_LineOfService as lineservice', 'user.lineservice_id', '=', 'lineservice.id')
            .where({'user.publish' : req.publish})
            .orderBy('user.create_date', 'desc')
            .limit(req.limit)
            .offset(req.start)
            .then(datas=>{
                callback(null, datas)
            }).catch(function(error) { 
                callback(error, null)
            });
    },
    

    getSalt: function(req, callback){
        return exec.findOne({'email' : req.body.email}, 'salt_hash', null, table, callback);
    },

    getSaltPassword : function(req, callback){
        return exec.findOne(req, 'salt_hash', null, table, callback)
    },

    getOne : function(req, callback){
        return exec.findOne(req,null, null, table, callback)
    },

    getAuth: function(req, callback){
        return exec.findOne({id: req.user_id}, '*', null, table, callback);
    },

    checkEmail: function(req, callback){
        return exec.findOne({ email: req.email}, '*', null, table, callback);
    },
    checkPhone: function(req, callback){
        return exec.findOne({ phone : req.phone}, '*', null, table, callback);
    },

    addData: function(req, callback){
        // return exec.save(req, table, callback);
        exec.knex.transaction(function (t) {
            return exec.knex(table)
                .transacting(t)
                .insert(req)
                .then(function (response) {
                    // console.log(req)
                    return exec.knex('AT_AlumniPrivacy')
                    .transacting(t)
                    .insert({'user_id' : req.id, 'create_date' : req.create_date})
                })
        })
        .then(res => {
            let promiseEula = new Promise(function(resolve, reject) {
                eula.getOne(null,function(errRes,resData) {
                    if(!utility.issetVal(errRes)){
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
            Promise.all([promiseEula]).then(arr => {
                if(utility.issetVal(arr[0])){
                    exec.findByIdAndUpdate(req.id, {'eula_version' : arr[0].version_name}, table, (err, res) => {
                        
                    });
                }
                // if(utility.issetVal(arr))
            })
            return res
        })
        .then(function (res) {
            callback(null, res)
        })
        .catch(function (err) {
            callback(err, null)
        });
    },

    getSearch: function(req, callback){
        return exec.find({'email ' : req.keyword}, '*', table, callback);
    },

    updateData: function(req, callback){
        console.log({req : req})
        return exec.findByIdAndUpdate(req.id, req, table, callback);
    },

    login: function(req, callback){
        return exec.findOne({email: req.email, password: req.password}, '*', null, table, callback);
    },

    checkUser: function(req, callback){
        let column = ['user.*','lineservice.title as lineservice_title'];
        return exec.knex('T_User as user')
        .select(column)
        .leftJoin('T_LineOfService as lineservice', 'lineservice.id', '=', 'user.lineservice_id')
        .where({'user.phone' : req.phone})
        .first()
        .then(datas=>{
            callback(null, datas)
        }).catch(function(error) { 
            callback(error, null)
        });
    },


    validateEmail: function(req, callback){
        let column = ['user.*','lineservice.title as lineservice_title'];
        return exec.knex('T_User as user')
        .select(column)
        .leftJoin('T_LineOfService as lineservice', 'lineservice.id', '=', 'user.lineservice_id')
        .where({'user.email' : req.email})
        .first()
        .then(datas=>{
            callback(null, datas)
        }).catch(function(error) { 
            callback(error, null)
        });
    },

    curlPhone  : function(req, callback){
        return utility.requestGet(req.cURLphone, callback);
    },

    curlEmail  : function(req, callback){
        return utility.requestGet(req.cURLemail, callback);
    },
    

    getCountVerified  : function(req, callback){
        let param = utility.issetVal(req) ? {verified : req.verified} :  {};

        if(req.interest_id){
            param.interest_id = req.interest_id;
        }
        if(req.batch){
            param.batch = req.batch;
        }
        console.log(req);
            return exec.knex('T_User as user')
            // .select(column)
            .max('user.id as id')
            .max('user.name as name')
            .max('user.verified as verified')
            .max('user.email as email')
            .max('user.phone as phone')
            .max('user.company as company')
            .max('user.position as position')
            .max('user.bio as bio')
            .select(exec.knex.raw(`(SELECT count([user].id) as idx WHERE max([user].email) like '%@pwc.com%') AS valid_pwc`))
            .max('user.achievement as achievement')
            .max('user.alumni as alumni')
            .max('user.batch as batch')
            .max('user.dob as dob')
            .max('user.gender as gender')
            .max('user.img as img')
            .max('user.eula as eula')
            .max('user.eula_version as eula_version')
            .max('user.eula_date as eula_date')
            .max('user.publish as publish')
            .max('user.first_login as first_login')
            .max('user.join_date as join_date')
            .max('user.create_date as create_date')
            .max('user.resign_date as resign_date')
            .max('user.lineservice_id as lineservice_id')
            .max('lineservice.title as lineservice_title')
            .max('alumniInterest.interest_id as interest_id')
            .leftJoin('T_LineOfService as lineservice', 'user.lineservice_id', '=', 'lineservice.id')
            .leftJoin('AT_AlumniInterest as alumniInterest', 'user.id', '=', 'alumniInterest.user_id')
            .where(param)
            .modify(function(queryBuilder) {
                if(utility.issetVal(req.keyword)){
                    queryBuilder.whereRaw('([user].name like  ? OR [user].email like  ?  )',[`%${req.keyword}%`,`%${req.keyword}%`])
                }
                if(utility.issetVal(req.batch)){
                    queryBuilder.andWhere('user.batch', 'LIKE', `%${req.batch}%`)
                }
                if(utility.issetVal(req.create_date)){
                    let date = req.create_date.split('-').map(x=>{
                        return x.trim()
                    })
                    console.log({date});
                    queryBuilder.whereBetween('user.create_date', date)
                }
                if(utility.issetVal(req.interest)){
                    queryBuilder.andWhere('interest_id', 'LIKE', `%${req.interest}%`)
                }
                if(utility.issetVal(req.list_interest)){
                    queryBuilder.whereIn('interest_id',req.list_interest)
                }
            })
            .groupBy('user.id')
            .then(datas=>{
                // console.log({datas : datas});
                let result = datas.map(data=>{
                    data.type = data.valid_pwc == 1 ?  'pwc' : 'public';
                    if((data.type == 'pwc') && (data.alumni == 'yes')){
                        data.type_alumni = 'alumni'
                    }

                    else if((data.type == 'pwc') && (data.alumni == 'no')){
                        data.type_alumni = 'internal'
                    }
                    else {
                        data.type_alumni = 'external'
                    }

                    switch (data.verified) {
                        case 0:
                            data.status = 'Invited'
                            break;
                        case 1:
                            data.status = 'Unverified'
                            break;
                        case 2:
                            data.status = 'Verified'
                            break;
                        case 3:
                            data.status = 'Reject'
                            break;
                        default:
                            data.status = 'Invited'
                            break;
                    }
                    // data.eula_version = null
                    // data.eula_date = null
                    return data
                })
                callback(null, result.length)
            }).catch(function(error) {
                console.log({error : error});
                callback(error, null)
            });
    },

    getDataVerified  : function(req, callback){
        let param = utility.issetVal(req) ? {verified : req.verified} :  {};

        if(req.interest_id){
            param.interest_id = req.interest_id;
        }
        if(req.batch){
            param.batch = req.batch;
        }
        console.log({param : param});
            return exec.knex('T_User as user')
            // .select(column)
            .max('user.id as id')
            .max('user.name as name')
            .max('user.verified as verified')
            .max('user.email as email')
            .max('user.phone as phone')
            .max('user.company as company')
            .max('user.position as position')
            .max('user.bio as bio')
            .max('user.achievement as achievement')
            .max('user.alumni as alumni')
            .max('user.batch as batch')
            .max('user.dob as dob')
            .max('user.gender as gender')
            .max('user.img as img')
            .max('user.eula as eula')
            .max('user.eula_version as eula_version')
            .max('user.eula_date as eula_date')
            .max('user.publish as publish')
            .max('user.first_login as first_login')
            .max('user.join_date as join_date')
            .max('user.create_date as create_date')
            .max('user.resign_date as resign_date')
            .max('user.lineservice_id as lineservice_id')
            .max('lineservice.title as lineservice_title')
            .max('alumniInterest.interest_id as interest_id')
            .select(exec.knex.raw(`(SELECT count([user].id) as idx WHERE max([user].email) like '%@pwc.com%') AS valid_pwc`))
            .leftJoin('T_LineOfService as lineservice', 'user.lineservice_id', '=', 'lineservice.id')
            .leftJoin('AT_AlumniInterest as alumniInterest', 'user.id', '=', 'alumniInterest.user_id')
            .where(param)
            .modify(function(queryBuilder) {
                if(utility.issetVal(req.keyword)){
                    queryBuilder.whereRaw('([user].name like  ? OR [user].email like  ? )',[`%${req.keyword}%`,`%${req.keyword}%`])
                }
                if(utility.issetVal(req.batch)){
                    queryBuilder.andWhere('user.batch', 'LIKE', `%${req.batch}%`)
                }
                if(utility.issetVal(req.create_date)){
                    let date = req.create_date.split('-').map(x=>{
                        return x.trim()
                    })
                    console.log({date});
                    queryBuilder.whereBetween('user.create_date', date)
                }
                if(utility.issetVal(req.interest)){
                    queryBuilder.andWhere('interest_id', 'LIKE', `%${req.interest}%`)
                }
                if(utility.issetVal(req.list_interest)){
                    queryBuilder.whereIn('interest_id',req.list_interest)
                }
            })
            .groupBy('user.id')
            .orderBy('name', 'asc')
            .limit(req.limit)
            .offset(req.start)
            .then(datas=>{
                // console.log({datas : datas});
                let result = datas.map(data=>{
                    data.type = data.valid_pwc == 1 ?  'pwc' : 'public';
                    if((data.type == 'pwc') && (data.alumni == 'yes')){
                        data.type_alumni = 'alumni'
                    }

                    else if((data.type == 'pwc') && (data.alumni == 'no')){
                        data.type_alumni = 'internal'
                    }
                    else {
                        data.type_alumni = 'external'
                    }

                    switch (data.verified) {
                        case 0:
                            data.status = 'invited'
                            break;
                        case 1:
                            data.status = 'unverified'
                            break;
                        case 2:
                            data.status = 'verified'
                            break;
                        case 3:
                            data.status = 'reject'
                            break;
                        default:
                            data.status = 'invited'
                            break;
                    }
                    // data.eula_version = null
                    // data.eula_date = null
                    return data
                })
                callback(null, result)
            }).catch(function(error) {
                console.log({error : error});
                callback(error, null)
            });
    },


    
    getCountVerifiedWithoutMe  : function(req, callback){
        let param = utility.issetVal(req) ? {verified : req.verified} :  {};

        if(req.interest_id){
            param.interest_id = req.interest_id;
        }
        if(req.batch){
            param.batch = req.batch;
        }
        console.log(req);
            return exec.knex('T_User as user')
            // .select(column)
            .max('user.id as id')
            .max('user.name as name')
            .max('user.email as email')
            .max('user.phone as phone')
            .max('user.company as company')
            .max('user.position as position')
            .max('user.bio as bio')
            .select(exec.knex.raw(`(SELECT count([user].id) as idx WHERE max([user].email) like '%@pwc.com%') AS valid_pwc`))
            .max('user.achievement as achievement')
            .max('user.alumni as alumni')
            .max('user.batch as batch')
            .max('user.dob as dob')
            .max('user.gender as gender')
            .max('user.img as img')
            .max('user.eula as eula')
            .max('user.eula_version as eula_version')
            .max('user.eula_date as eula_date')
            .max('user.publish as publish')
            .max('user.first_login as first_login')
            .max('user.join_date as join_date')
            .max('user.create_date as create_date')
            .max('user.resign_date as resign_date')
            .max('user.lineservice_id as lineservice_id')
            .max('lineservice.title as lineservice_title')
            .max('alumniInterest.interest_id as interest_id')
            .leftJoin('T_LineOfService as lineservice', 'user.lineservice_id', '=', 'lineservice.id')
            .leftJoin('AT_AlumniInterest as alumniInterest', 'user.id', '=', 'alumniInterest.user_id')
            .where(param)
            .whereNot('user.id', req.user_id)
            .modify(function(queryBuilder) {
                if(utility.issetVal(req.keyword)){
                    queryBuilder.whereRaw('([user].name like  ? OR [user].email like  ? )',[`%${req.keyword}%`,`%${req.keyword}%`])
                }
                if(utility.issetVal(req.batch)){
                    queryBuilder.andWhere('user.batch', 'LIKE', `%${req.batch}%`)
                }
                if(utility.issetVal(req.create_date)){
                    let date = req.create_date.split('-').map(x=>{
                        return x.trim()
                    })
                    console.log({date});
                    queryBuilder.whereBetween('user.create_date', date)
                }
                if(utility.issetVal(req.interest)){
                    queryBuilder.andWhere('interest_id', 'LIKE', `%${req.interest}%`)
                }
                if(utility.issetVal(req.list_interest)){
                    queryBuilder.whereIn('interest_id',req.list_interest)
                }
            })
            .groupBy('user.id')
            .then(datas=>{
                // console.log({datas : datas});
                let result = datas.map(data=>{
                    data.type = data.valid_pwc == 1 ?  'pwc' : 'public';
                    if((data.type == 'pwc') && (data.alumni == 'yes')){
                        data.type_alumni = 'alumni'
                    }

                    else if((data.type == 'pwc') && (data.alumni == 'no')){
                        data.type_alumni = 'internal'
                    }
                    else {
                        data.type_alumni = 'external'
                    }

                    switch (data.verified) {
                        case 0:
                            data.status = 'Invited'
                            break;
                        case 1:
                            data.status = 'Unverified'
                            break;
                        case 2:
                            data.status = 'Verified'
                            break;
                        case 3:
                            data.status = 'Reject'
                            break;
                        default:
                            data.status = 'Invited'
                            break;
                    }
                    // data.eula_version = null
                    // data.eula_date = null
                    return data
                })
                callback(null, result.length)
            }).catch(function(error) {
                console.log({error : error});
                callback(error, null)
            });
    },

    getDataVerifiedWithoutMe  : function(req, callback){
        let param = utility.issetVal(req) ? {verified : req.verified} :  {};

        if(req.interest_id){
            param.interest_id = req.interest_id;
        }
        if(req.batch){
            param.batch = req.batch;
        }
        console.log({param : param});
            return exec.knex('T_User as user')
            // .select(column)
            .max('user.id as id')
            .max('user.name as name')
            .max('user.email as email')
            .max('user.phone as phone')
            .max('user.company as company')
            .max('user.position as position')
            .max('user.bio as bio')
            .select(exec.knex.raw(`(SELECT count([user].id) as idx WHERE max([user].email) like '%@pwc.com%') AS valid_pwc`))
            .max('user.achievement as achievement')
            .max('user.alumni as alumni')
            .max('user.batch as batch')
            .max('user.dob as dob')
            .max('user.gender as gender')
            .max('user.img as img')
            .max('user.eula as eula')
            .max('user.eula_version as eula_version')
            .max('user.eula_date as eula_date')
            .max('user.publish as publish')
            .max('user.first_login as first_login')
            .max('user.join_date as join_date')
            .max('user.create_date as create_date')
            .max('user.resign_date as resign_date')
            .max('user.lineservice_id as lineservice_id')
            .max('lineservice.title as lineservice_title')
            .max('alumniInterest.interest_id as interest_id')
            .leftJoin('T_LineOfService as lineservice', 'user.lineservice_id', '=', 'lineservice.id')
            .leftJoin('AT_AlumniInterest as alumniInterest', 'user.id', '=', 'alumniInterest.user_id')
            .where(param)
            .whereNot('user.id', req.user_id)
            .modify(function(queryBuilder) {
                if(utility.issetVal(req.keyword)){
                    queryBuilder.whereRaw('([user].name like  ? OR [user].email like  ? )',[`%${req.keyword}%`,`%${req.keyword}%`])
                }
                if(utility.issetVal(req.batch)){
                    queryBuilder.andWhere('user.batch', 'LIKE', `%${req.batch}%`)
                }
                if(utility.issetVal(req.create_date)){
                    let date = req.create_date.split('-').map(x=>{
                        return x.trim()
                    })
                    console.log({date});
                    queryBuilder.whereBetween('user.create_date', date)
                }
                if(utility.issetVal(req.interest)){
                    queryBuilder.andWhere('interest_id', 'LIKE', `%${req.interest}%`)
                }
                if(utility.issetVal(req.list_interest)){
                    queryBuilder.whereIn('interest_id',req.list_interest)
                }
            })
            .groupBy('user.id')
            .orderBy('name', 'ASC')
            .limit(req.limit)
            .offset(req.start)
            .then(datas=>{
                // console.log({datas : datas});
                let result = datas.map(data=>{
                    utility.issetVal(data.img) ?
                    data.img = data.img :
                    data.img = null;
                    data.type = data.valid_pwc == 1 ?  'pwc' : 'public';
                    if((data.type == 'pwc') && (data.alumni == 'yes')){
                        data.type_alumni = 'alumni'
                    }

                    else if((data.type == 'pwc') && (data.alumni == 'no')){
                        data.type_alumni = 'internal'
                    }
                    else {
                        data.type_alumni = 'external'
                    }

                    switch (data.verified) {
                        case 0:
                            data.status = 'Invited'
                            break;
                        case 1:
                            data.status = 'Unverified'
                            break;
                        case 2:
                            data.status = 'Verified'
                            break;
                        case 3:
                            data.status = 'Reject'
                            break;
                        default:
                            data.status = 'Invited'
                            break;
                    }
                    // data.eula_version = null
                    // data.eula_date = null
                    return data
                })
                callback(null, result)
            }).catch(function(error) {
                console.log({error : error});
                callback(error, null)
            });
    },

    triggerUpdateUserMongo: function (req, callback) {
        ModelUser.findOneAndUpdate({user_id : req.user_id}, req, {upsert: true}, callback);
    },
   
}