
let table = 'T_Event';
const exec = require('../../helpers/mssql_adapter') 
var stringInject = require('stringinject')
const utility = require('../../helpers/utility')

module.exports = {
    cURL  : function(req, callback){
        return utility.requestGet(req.url, callback);
    },

    addData: function(req, callback){
        return exec.save(req, table, callback);
    },

    deleteData : function(req, callback){
        return exec.findByIdAndDelete(req.id, table, callback);
    },
    
    getById  : function(req, callback){
        return exec.findById(req.id, '*', table , callback);
    },

    getCountData  : function(req, callback){
        // return exec.getCountData(null, table, callback);
        console.log(req);
        const {title, create_date } = req
        
        return exec.knex('T_Event as event')
            .max('event.id as event_id')
            .max('hashtag.id as hashtag_id') 
            .max('hashtag.word as tag') 
            .max('event.title as title')
            .max('event.start_date as start_date')
            .max('event.end_date as end_date')
            .max('event.start_time as start_time')
            .max('event.end_time as end_time')
            .max('event.overview as overview')
            .max('event.address1 as address1')
            .max('event.address2 as address2')
            .max('event.province as province')
            .max('event.city as city')
            .max('event.zip as zip')
            .max('event.location_note as location_note')
            .max('event.publish as publish')
            .max('event.img as img')
            .max('event.create_date as create_date')
            .leftJoin('AT_EventHashtag as eventHashtag', 'event.id','=','eventHashtag.event_id')
            
            .leftJoin('T_Hashtag as hashtag', 'hashtag.id', '=', 'eventHashtag.hashtag_id')
            // .where({'hashtag.publish' : '1'})
            .groupBy('event.id')
            .modify(qb=>{
                if(utility.issetVal(title))
                    qb.andWhere('event.title', 'LIKE', `%${title}%`)

                if(utility.issetVal(create_date)){
                    let date = create_date.split('-').map(x=>{
                        return x.trim()
                    })
                    console.log({date});
                    qb.whereBetween('event.create_date', date)
                }
                if(utility.issetVal(req.hashtag))
                    qb.andWhere('hashtag.word', 'LIKE', `%${req.hashtag}%`)
            })
            .orderByRaw('create_date DESC ')
            .then(datas=>{
                console.log({datas : datas.length});
                callback(null, datas.length)
            }).catch(function(error) { 
                console.log({error});
                callback(error, null)
            });
    },

    getAll  : function(req, callback){
        // return exec.getAll(null, '*', req.start, req.limit, 'create_date DESC ',  table, callback);
        const {start, limit, title, create_date } = req
        console.log({req});
        return exec
        .knex(table)
        .select('*')
        .orderByRaw('create_date DESC ')
        .modify(qb=>{
            if(utility.issetVal(title))
               qb.andWhere('title', 'LIKE', `%${title}%`)

            if(utility.issetVal(create_date)){
                let date = create_date.split('-').map(x=>{
                    return x.trim()
                })
                console.log({date});
                qb.whereBetween('create_date', date)
            }
        })
        .limit(limit)
        .offset(start)
        .then(datas=>{
            callback(null, datas)
        }).catch(function(error) { 
            console.log({error : error});
            callback(error, null)
        });
    },

    newGetAll : function(req, callback){
        console.log(req);
        const {start, limit, title, create_date } = req
        
        return exec.knex('T_Event as event')
            .max('event.id as event_id')
            .max('hashtag.id as hashtag_id') 
            .max('hashtag.word as tag') 
            .max('event.title as title')
            .max('event.start_date as start_date')
            .max('event.end_date as end_date')
            .max('event.start_time as start_time')
            .max('event.end_time as end_time')
            .max('event.overview as overview')
            .max('event.address1 as address1')
            .max('event.address2 as address2')
            .max('event.province as province')
            .max('event.city as city')
            .max('event.zip as zip')
            .max('event.location_note as location_note')
            .max('event.publish as publish')
            .max('event.create_date as create_date')
            .max('event.img as img')
            .leftJoin('AT_EventHashtag as eventHashtag', 'event.id','=','eventHashtag.event_id')
            
            .leftJoin('T_Hashtag as hashtag', 'hashtag.id', '=', 'eventHashtag.hashtag_id')
            // .where({'hashtag.publish' : '1'})
            .groupBy('event.id')
            .modify(qb=>{
                if(utility.issetVal(title))
                    qb.andWhere('event.title', 'LIKE', `%${title}%`)

                if(utility.issetVal(create_date)){
                    let date = create_date.split('-').map(x=>{
                        return x.trim()
                    })
                    console.log({date});
                    qb.whereBetween('event.create_date', date)
                }
                if(utility.issetVal(req.hashtag))
                    qb.andWhere('hashtag.word', 'LIKE', `%${req.hashtag}%`)
            })
            .orderByRaw('create_date DESC ')
            .limit(limit)
            .offset(start)
            .then(datas=>{
                console.log({datas : datas.length});
                callback(null, datas)
            }).catch(function(error) { 
                console.log({error});
                callback(error, null)
            });
    },

    updateData: function(req, callback){
        return exec.findByIdAndUpdate(req.id, req, table, callback);
    },

    findOne: function(req, callback){
        return exec.findOne(null, 'event_timestamp', 'event_timestamp DESC ', table, callback);
    },
}