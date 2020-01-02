
let table = 'T_Event';
const eventBookmark = require('../models/EventBookmarks')
const exec = require('../../helpers/mssql_adapter') 
var stringInject = require('stringinject')
const utility = require('../../helpers/utility')

module.exports = {
    countGetAllUpComing: function(req, callback){
        console.log({req});
        return exec.knex('T_Event as event')
            .count('event.id as id')
            .where({'event.publish': '1'})
            .where('start_date', '>=', req.now)
            .then(datas => {
                callback(null, datas[0].id)
            }).catch(function(error){
                callback(error, null)
            });
    },

    getAllUpComing: function(req, callback){
        return exec.knex('T_Event as event')
            .select('event.id','event.img','event.start_date','event.end_date','event.city','event.province','event.title')
            .where({'event.publish': '1'})
            .where('start_date', '>=', req.now)
            .orderBy('event.create_date', 'desc')
            .then(datas => {
                Promise.all(datas.map(event=>{
                    // console.log({event});
                    return new Promise((resolve, reject)=>{
                        eventBookmark.getData({event_id : event.id, user_id : req.user_id},(errGet, resEventBookmark) =>{
                            if(utility.issetVal(resEventBookmark)){
                                resolve(1)
                            } else {
                                resolve(0)
                            }
                        })
                    })
                    .then(bookmarked=>{
                        event.bookmarked = bookmarked
                        return event
                    })
                }))
                .then(datas=>{
                    callback(null, datas)
                })
                // callback(null, datas)
            }).catch(function(error){ 
                callback(error, null)
            });
    },

    countGetAllPast: function(req, callback){
        return exec.knex('T_Event as event')
            .count('event.id as id')
            .where({'event.publish': '1'})
            .where('start_date', '<', req.now)
            .then(datas => {
                callback(null, datas[0].id)
            }).catch(function(error){
                callback(error, null)
            });
    },

    getAllPast: function(req, callback){
        return exec.knex('T_Event as event')
            .select('event.id'
            , 'event.start_date'
            , 'event.end_date'
            , 'event.city'
            , 'event.province'
            , 'event.title'
            , 'event.img')
            .where({'event.publish': '1'})
            .where('start_date', '<', req.now)
            .orderBy('event.create_date', 'DESC')
            .limit(req.limit)
            .offset(req.start)
            .then(datas => {
                Promise.all(datas.map(event=>{
                    console.log({event});   
                    return new Promise((resolve, reject)=>{
                        eventBookmark.getData({event_id : event.id},(errGet, resEventBookmark) =>{
                            if(utility.issetVal(resEventBookmark)){
                                resolve(1)
                            } else {
                                resolve(0)
                            }
                        })
                    })
                    .then(bookmarked=>{
                        event.bookmarked = bookmarked
                        return event
                    })
                }))
                .then(datas=>{
                    callback(null, datas)
                })
            }).catch(function(error){ 
                callback(error, null)
            });
    },


    getHome: function(req, callback){
        return exec.knex('T_Event as event')
            .select('event.id','event.img','event.start_date','event.end_date','event.city','event.province','event.title')
            .where({'event.publish': '1'})
            .where('start_date', '>=', req.now)
            .orderBy('event.create_date', 'desc')
            .limit(5)
            .offset(0)
            .then(datas => {
                Promise.all(datas.map(event=>{
                    // console.log({event});
                    return new Promise((resolve, reject)=>{
                        eventBookmark.getData({event_id : event.id, user_id : req.user_id},(errGet, resEventBookmark) =>{
                            if(utility.issetVal(resEventBookmark)){
                                resolve(1)
                            } else {
                                resolve(0)
                            }
                        })
                    })
                    .then(bookmarked=>{
                        event.bookmarked = bookmarked
                        return event
                    })
                }))
                .then(datas=>{
                    callback(null, datas)
                })
            }).catch(function(error){ 
                callback(error, null)
            });
    },

    getById: function(req, callback){
        return exec.findById(req.id, '*', table , callback);
    },
    
    relatedQuery : function(req, callback){
        return exec.knex('T_Event as event')
        .max('event.id as id')
        .max('event.img as img')
        .max('event.start_date as start_date')
        .max('event.end_date as end_date')
        .max('event.city as city')
        .max('event.province as province')
        .max('event.title as title')
        .leftJoin('AT_EventHashtag as eventHashtag', 'eventHashtag.event_id', '=', 'event.id')
        .whereIn('eventHashtag.hashtag_id', function () {
             this.select('hashtag_id')
             .from('AT_EventHashtag')
             .where('event_id',req.event_id)
          })
        .where('eventHashtag.event_id','!=',req.event_id)
        .limit(5)
        .groupBy('eventHashtag.event_id')
        .then(datas => {
            callback(null, datas)
        }).catch(function(error){ 
            callback(error, null)
        });
    }
}