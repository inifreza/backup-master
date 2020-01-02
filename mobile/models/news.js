
let table = 'T_News';
const newsBookmark = require('../models/NewsBookmarks')
const newsLike     = require('../models/newsLikes')
const exec = require('../../helpers/mssql_adapter') 
var stringInject = require('stringinject')
const utility = require('../../helpers/utility')
let _ = require('lodash')
const globals = require('../../configs/global')
const { config } = require('../../default')
let url = globals[config.environment]; // development || production

module.exports = {
    countGetAll: function(req, callback){
        return exec.knex('T_News as news')
            .count('news.id as id')
            .where({'news.publish': '1'})
            .then(datas => {
                callback(null, datas[0].id)
            }).catch(function(error){
                callback(error, null)
            });
    },

    getAll: function(req, callback){
        return exec.knex('T_News as news')
            .select('news.id', 'news.title', 'news.brief', 'news.create_date', 'url')
            .select(exec.knex.raw(`(SELECT TOP 1 img FROM T_NewsImages photo WHERE photo.news_id = news.id ORDER BY main DESC ) AS img`))
            .where({'news.publish': '1'})
            .orderBy('news.create_date', 'DESC')
            .limit(req.limit)
            .offset(req.start)
            .then(datas => {
                Promise.all(datas.map(news => {
                    // console.log(news.id);
                    let promiseNews = new Promise ((resolve, reject)=>{
                        newsLike.getData({news_id : news.id}, (errGet, resLike)=>{
                            if(utility.issetVal(resLike)){
                                // console.log({resLike});
                                resolve(1)
                            } else {
                                resolve(0)
                            }
                        })
                    })
                    return promiseNews
                    .then(resLikeed=>{
                        news.liked = resLikeed
                        // console.log(resLikeed);
                        return news
                    })
                }))
                .then(news=>{
                    callback(null, news)
                })
                // callback(null, datas)
            }).catch(function(error){ 
                callback(error, null)
            });
    },

    getHome: function(req, callback){
        return exec.knex('T_News as news')
            .select('news.id', 'news.title', 'news.brief', 'news.create_date')
            .select(exec.knex.raw(`(SELECT TOP 1 img FROM T_NewsImages photo WHERE photo.news_id = news.id ORDER BY main DESC ) AS img`))
            .where({'news.publish': '1', 'news.featured': '1'})
            .orderBy('news.create_date', 'DESC')
            .limit(4)
            .offset(0)
            .then(datas => {
                // callback(null, datas)
                Promise.all(datas.map(news => {
                    // console.log(news.id);
                    let promiseNews = new Promise ((resolve, reject)=>{
                        newsBookmark.getData({news_id : news.id}, (errGet, resBookmark)=>{
                            if(utility.issetVal(resBookmark)){
                                // console.log({resBookmark});
                                resolve(1)
                            } else {
                                resolve(0)
                            }
                        })
                    })
                    let promiseLiked = new Promise((resolve, reject)=>{
                        newsLike.getData({news_id : news.id}, (errLiked, resLiked)=>{
                          if(utility.issetVal(resLiked)){
                            resolve(1)
                          } else {
                            resolve(0)
                          }
                         })
                    }) 
                    // return promiseNews
                   return Promise.all([promiseNews, promiseLiked])
                    .then(([resBookmarked, resLiked])=>{
                        news.bookmarked = resBookmarked
                        news.liked = resLiked
                        // console.log(resBookmarked);
                        return news
                    })
                }))
                .then(news=>{
                    callback(null, news)
                })
               
            }).catch(function(error){ 
                callback(error, null)
            });
    },

    getById: function(req, callback){
        // return exec.findById(req.id, '*', table , callback);
        return exec
        .knex('T_News as news')
        .select(
            'news.*',
            'newsInterest.interest_id'
        )
        .leftJoin('AT_NewsInterest as newsInterest', 'newsInterest.news_id', '=', 'news.id')
        .where('news.id', req.id)
        .then(datas => {
            let IdInterests =null
            let result = datas[0]
            if(utility.issetVal(datas[0].interest_id)){
                IdInterests = datas.map(({interest_id}) => interest_id)
                result.interest_id = IdInterests
            }
            
            callback(null,result)
        })
        .catch(error =>{
            callback(error, null)
        })
    },

    getByInterest : function(req, callback){
        console.log({'req getByInterest' : req});
        return exec
        .knex('T_News as news')
       
        .max('news.id as id')
        .max('news.title as title')
        .max('news.description as description')
        .max('news.writter as writter')
        .max('news.publish as publish')
        .max('news.modify_date as modify_date')
        .max('news.create_date as create_date')
        .max('news.featured as featured')
        .max('news.brief as brief')
        .max('news.url as url')
        .max('news.content_type as content_type')
        .select(exec.knex.raw(`(SELECT TOP 1 img FROM T_NewsImages photo WHERE photo.news_id = news.id ORDER BY main DESC ) AS img`))
        .leftJoin('AT_NewsInterest as newsInterest', 'newsInterest.news_id', '=', 'news.id')
        .modify(qb=> {
            if(utility.issetVal(req.interest_id))
                qb.whereIn('newsInterest.interest_id', req.interest_id)
        })
        .groupBy('news.id')
        .limit(5)
        .orderBy('create_date', 'desc')
        .then(datas => {
            datas = datas.map(data => {
                utility.issetVal(data.img) ? data.img = url.url_img + 'news/' + data.img : data.img = null
                return data
            })
            callback(null,datas)
        })
        .catch(error =>{
            console.log('bhahah')
            callback(error, null)
        })
    }
}