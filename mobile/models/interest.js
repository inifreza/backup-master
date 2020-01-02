
let table = 'T_Interest';
const exec = require('../../helpers/mssql_adapter') 
var stringInject = require('stringinject')
const utility = require('../../helpers/utility')

// setting image
const globals = require('../../configs/global')
const { config } = require('../../default')
let url = globals[config.environment]; // development || production

module.exports = {
    deleteData : function(req, callback){
        return exec.findByIdAndDelete(req.id, table, callback);
    },
    
    getById  : function(req, callback){
        return exec.findById(req.id, '*', table , callback);
    },

    getCountData  : function(req, callback){
        return exec.getCountData({}, table, callback);
    },

    getAll  : function(req, callback){
        // return exec.findNew(req, '*', table, callback);
        return exec.knex(table+ ' as interest')
        .select('interest.*', exec.knex.raw(`(SELECT COUNT(alumniInterest.user_id) FROM AT_AlumniInterest alumniInterest WHERE alumniInterest.interest_id = interest.id AND alumniInterest.user_id = '${req.user_id}' ) AS follow`))
        .modify(function(queryBuilder) {
            if(utility.issetVal(req.title)){
                queryBuilder.where('title', 'LIKE', "%"+req.title+"%");
            }
            if(utility.issetVal(req.parent_id)){
                queryBuilder.where('parent_id', 'LIKE', "%"+req.parent_id+"%");
            }
            // if(utility.issetVal(req.follow)){
            //     queryBuilder.where('follow', 'LIKE', "%"+req.follow+"%");
            // }
        })
        .orderBy('create_date', 'desc')
        .limit(req.limit)
        .offset(req.start)
        .then(datas=>{
            callback(null, datas)
        }).catch(function(error) { 
            callback(error, null)
        });

    },

    getFull  : function(req, callback){
        // return exec.findNew(req, '*', table, callback);
        return exec.knex(table+ ' as interest')
        .max('interest.id as id')
        .max('interest.parent_id as parent_id')
        .max('interest.title as title')
        .max('interest.publish as publish')
        .max('interest.sort as sort')
        .max('interest.img as img')
        .select( exec.knex.raw(`(SELECT COUNT(alumniInterest.user_id) FROM AT_AlumniInterest alumniInterest WHERE alumniInterest.interest_id = interest.id AND alumniInterest.user_id = '${req.user_id}' ) AS follow`))
        .leftJoin(table+ ' as childInterest','childInterest.parent_id', '=', 'interest.id')
        .modify(function(queryBuilder) {
            if(utility.issetVal(req.title)){
                queryBuilder.where('childInterest.title', 'LIKE', "%"+req.title+"%");
            }
            if(utility.issetVal(req.parent_id)){
                queryBuilder.where('interest.parent_id', 'LIKE', "%"+req.parent_id+"%");
            }
            // if(utility.issetVal(req.follow)){
            //     queryBuilder.where('follow', 'LIKE', "%"+req.follow+"%");
            // }
        })
        .groupBy('interest.id')
        .orderBy('title', 'ASC')
        .limit(req.limit)
        .offset(req.start)
        .then(datas=>{
            return Promise.all(datas.map(data => {
                let result = data;
                result.isChecked = false;
                if(utility.issetVal(result.img)){
                    result.img =  url.url_img+'interest/'+ result.img;
                } else {
                    result.img = null;
                }
                return exec.knex(table+ ' as interest')
                .select('interest.*',  exec.knex.raw("'"+result.title+"' as parent"), exec.knex.raw(`(SELECT COUNT(alumniInterest.user_id) FROM AT_AlumniInterest alumniInterest WHERE alumniInterest.interest_id = interest.id AND alumniInterest.user_id = '${req.user_id}' ) AS follow`))
                .where('parent_id', data.id)
                .modify(function(queryBuilder) {
                    if(utility.issetVal(req.title)){
                        queryBuilder.where('interest.title', 'LIKE', "%"+req.title+"%");
                    }
                })
                .then(childs=>{
                    return Promise.all(childs.map(dataChilds => {
                        dataChilds.isChecked = false;
                        if(utility.issetVal(dataChilds.img)){
                            dataChilds.img = url.url_img+'interest/'+dataChilds.img;
                        }else {
                            dataChilds.img = null;
                        }
                        return dataChilds
                    })).then(datas => {
                        datas.parent = result.title;
                        result.child = datas;
                        return result
                    })
                  
                })
                
            }))
        })
        .then(datas=>{
            callback(null, datas)
        }).catch(function(error) { 
            callback(error, null)
        });

    },

    getRecent  : function(req, callback){
        // return exec.findNew(req, '*', table, callback);
        return exec.knex('AT_PostInterest as postInterest')
        .max('interest.id as id')
        .max('interest.title as title')
        .max('interest.sort as sort')
        .max('interest.img as img')
        .max('postInterest.create_date as create_date')
        .leftJoin('T_Post as post', 'post.id', '=', 'postInterest.post_id')
        .leftJoin(table+ ' as interest', 'interest.id', '=', 'postInterest.interest_id')
        .where('post.user_id', req.user_id)
        .whereNotNull('interest.id')
        .groupBy('interest.id')
        .orderBy('create_date', 'desc')
        .limit(5)
        .offset(0)
        .then(datas=>{
            callback(null, datas)
        }).catch(function(error) { 
            callback(error, null)
        });

    },


    addData: function(req, callback){
        return exec.save(req, table, callback);
    },

    updateData: function(req, callback){
        return exec.findByIdAndUpdate(req.id, req, table, callback);
    },

 
    
}