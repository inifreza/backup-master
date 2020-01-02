
let table = 'AT_EventHashtag';
const exec = require('../../helpers/mssql_adapter') 
var stringInject = require('stringinject')
const utility = require('../../helpers/utility')

module.exports = {
    deleteData : function(req, callback){
        return exec.findByIdAndDelete(req.id, table, callback);
    },

    deleteByEventId : function(req, callback){
        return exec.findOneAndDelete(req, table, callback);
    },
    
    getById  : function(req, callback){
        return exec.findById(req.id, '*', table , callback);
    },

    getByEventId  : function(req, callback){
        return exec.findOne({'event_id' : req.id}, '*', null, table , callback);
    },

    getCountData  : function(req, callback){
        return exec.getCountData({}, table, callback);
    },

    getAll  : function(req, callback){
        return exec.getAll(null, '*', req.start, req.limit, 'create_date DESC ',  table, callback);
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

    getAllByEvent  : function(req, callback){
        let column = [
            'eventHashtag.event_id'
            , 'hashtag.id'
            , 'hashtag.word as tag'
            , 'hashtag.publish'
        ]
        return exec.knex('AT_EventHashtag as eventHashtag')
            .select(column)
            .leftJoin('T_Hashtag as hashtag', 'hashtag.id', '=', 'eventHashtag.hashtag_id')
            .where({'hashtag.publish' : '1'})
            .orderBy('hashtag.word', 'asc')
            .then(datas=>{
                callback(null, datas)
            }).catch(function(error) { 
                callback(error, null)
            });
    },
 
    getAllByEventId  : function(req, callback){
        let column = [
            'eventHashtag.event_id'
            , 'hashtag.id'
            , 'hashtag.word as tag'
            , 'hashtag.publish'
        ]
        return exec.knex('AT_EventHashtag as eventHashtag')
            .select(column)
            .leftJoin('T_Hashtag as hashtag', 'hashtag.id', '=', 'eventHashtag.hashtag_id')
            .where({'hashtag.publish' : '1', 'event_id' : req.event_id})
            .orderBy('hashtag.word', 'asc')
            .then(datas=>{
                callback(null, datas)
            }).catch(function(error) { 
                callback(error, null)
            });
    },
 
    
}