
let table = 'T_News';
const exec = require('../../helpers/mssql_adapter') 
var stringInject = require('stringinject')
const utility = require('../../helpers/utility')

module.exports = {
    
    deleteData : function(req, callback){
        // return exec.findByIdAndDelete(req.id, table, callback);
        console.log({req});
        return exec
        .knex('T_News')
        .where('T_News.id', req.id)
        .del()
        .then(datas=>{
            console.log({datas : datas});
            callback(null,datas)
        })
        .catch(error=>{
            console.log({error : error});
            callback(error, null)
        })
    },
    
    getById  : function(req, callback){
        let column = ['id'
        , 'title'
        , 'description'
        , 'writter'
        , 'publish'
        , 'create_date'
        , 'featured'
        , 'url'
        , 'content_type'
        , 'brief'];
        return exec.findById(req.id, column, table , callback);
    },

    getCountData  : function(req, callback){
        console.log({GetAll : req});
        let column = ['user.id'];
        // let param  = {}
        // if(req.month){
        //     param.month = req.month;
        // }
        // if(req.year){
        //     param.year = req.year;
        // }
        return exec.knex('T_News as news')
        .max('news.id as id')
        .max('news.title  as title')
        .max('news.description as description')
        .max('news.writter as writter')
        .max('news.publish as publish')
        .max('news.create_date as create_date')
        .max('news.featured as featured')
        .max('news.brief as brief')
        .leftJoin('AT_NewsInterest','news.id', '=', 'AT_NewsInterest.news_id')
        .modify(function(qb){
            if(utility.issetVal(req.keyword))
                qb.andWhere('news.title', 'LIKE', `%${req.keyword}%`)
            if(utility.issetVal(req.interest))
                qb.whereIn('AT_NewsInterest.interest_id', req.interest)
        })
        .groupBy('news.id')
        .orderBy('create_date', 'DESC')
        .then(datas=>{
            return Promise.all(datas.map(data => {
                let result = data;
                  
                return exec.knex('AT_NewsInterest as newsInterest')
                .select('newsInterest.interest_id', 'newsInterest.news_id', 'interest.title as interest_title')
                .leftJoin('T_Interest as interest', 'interest.id', '=', 'newsInterest.interest_id')
                .where('newsInterest.news_id', result.id)
                .modify(function(qb){
                    if(utility.issetVal(req.interest))
                        qb.whereIn('newsInterest.interest_id', req.interest)
                })
                .then(datas=>{
                    if(utility.issetVal(datas)){
                        result.interest = datas 
                        return result
                    }else {
                        result.interest = null; 
                        return result
                    }
                    
                    
                }).catch(function(error) { 
                    result.interest = null; 
                    return result
                });
                
            }))
        })
        .then(datas=>{
            // console.log(datas);
            callback(null, datas.length)
        }).catch(function(error) { 
            console.log({error});
            callback(error, null)
        });
    },

    // getAll  : function(req, callback){
    //     return exec.getAll(null, '*', req.start, req.limit, 'featured DESC, create_date ASC',  table, callback);
    // },

    getAll  : function(req, callback){
        console.log({GetAll : req});
        let column = ['user.id'];
        // let param  = {}
        // if(req.month){
        //     param.month = req.month;
        // }
        // if(req.year){
        //     param.year = req.year;
        // }
        return exec.knex('T_News as news')
        .max('news.id as id')
        .max('news.title  as title')
        .max('news.description as description')
        .max('news.writter as writter')
        .max('news.publish as publish')
        .max('news.create_date as create_date')
        .max('news.featured as featured')
        .max('news.brief as brief')
        .max('news.url as url')
        .max('news.content_type as content_type')
        .select(exec.knex.raw(`(SELECT TOP 1 img FROM T_NewsImages photo WHERE photo.news_id = news.id ORDER BY main DESC ) AS img`))
        .leftJoin('AT_NewsInterest','news.id', '=', 'AT_NewsInterest.news_id')
        .modify(function(qb){
            if(utility.issetVal(req.keyword))
                qb.andWhere('news.title', 'LIKE', `%${req.keyword}%`)
            if(utility.issetVal(req.interest))
                qb.whereIn('AT_NewsInterest.interest_id', req.interest)
        })
        .groupBy('news.id')
        .orderBy('create_date', 'DESC')
        .limit(req.limit)
        .offset(req.start)
        .then(datas=>{
            return Promise.all(datas.map(data => {
                let result = data;
                  
                return exec.knex('AT_NewsInterest as newsInterest')
                .select('newsInterest.interest_id', 'newsInterest.news_id', 'interest.title as interest_title')
                .leftJoin('T_Interest as interest', 'interest.id', '=', 'newsInterest.interest_id')
                .where('newsInterest.news_id', result.id)
                .modify(function(qb){
                    if(utility.issetVal(req.interest))
                        qb.whereIn('newsInterest.interest_id', req.interest)
                })
                .then(datas=>{
                    if(utility.issetVal(datas)){
                        result.interest = datas 
                        return result
                    }else {
                        result.interest = null; 
                        return result
                    }
                    
                    
                }).catch(function(error) { 
                    result.interest = null; 
                    return result
                });
                
            }))
        })
        .then(datas=>{
            // console.log(datas);
            callback(null, datas)
        }).catch(function(error) { 
            console.log({error});
            callback(error, null)
        });
    },

    addData: function(req, callback){
        return exec.save(req, table, callback);
    },

    updateData: function(req, callback){
        return exec.findByIdAndUpdate(req.id, req, table, callback);
    },

    checkFeatured: function(req, callback){
        return exec.getCountData({featured: '1'}, table, callback);
    },

 
    
}