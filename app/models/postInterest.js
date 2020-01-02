
let table = 'AT_PostInterest';
const exec = require('../../helpers/mssql_adapter') 
var stringInject = require('stringinject')
const utility = require('../../helpers/utility')
const moment = require('moment')

module.exports = {
    deleteData : function(req, callback){
        return exec.findByIdAndDelete(req.id, table, callback);
    },

    deleteByPostId : function(req, callback){
        return exec.findOneAndDelete({'post_id' : req.id}, table, callback);
    },
    
    getById  : function(req, callback){
        return exec.findById(req.id, '*', table , callback);
    },

    getByPostId  : function(req, callback){
        return exec.findOne({'post_id' : req.id}, '*', null, table , callback);
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

    getData  : function(req, callback){
        console.log({req : req.post_id});
        return exec.knex('AT_PostInterest as postInterest')
        .select('postInterest.interest_id', 'postInterest.post_id', 'interest.title as interest_title')
        .leftJoin('T_Interest as interest', 'interest.id', '=', 'postInterest.interest_id')
        .where('postInterest.post_id', req.post_id)
        .then(datas=>{
            callback(null, datas)
        }).catch(function(error) { 
            callback(error, null)
        });
    },

    addMultiple: function(req, callback){
        const datas = req.map(data => {
            return {
                post_id: data.post_id,
                interest_id: data.interest_id,
                create_date   : moment(Date.now()).format('YYYY-MM-DD HH:mm:ss')
            };
        });
        return exec.save(datas, table, callback);
    },
 
}