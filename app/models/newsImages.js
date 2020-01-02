
let table = 'T_NewsImages';
const exec = require('../../helpers/mssql_adapter') 
var stringInject = require('stringinject')
const utility = require('../../helpers/utility')

module.exports = {
    deleteData : function(req, callback){
        return exec.findByIdAndDelete(req.id, table, callback);
    },

    deleteImages : function(req, callback){
        return exec.findOneAndDelete({'news_id' :req.id}, 'T_NewsImages', callback);
    },
    
    getById  : function(req, callback){
        return exec.findById(req.id, '*', table , callback);
    },

    getCountData  : function(req, callback){
        return exec.getCountData(null, table, callback);
    },

    getAll  : function(req, callback){
        return exec.getAll(null, '*', req.start, req.limit, 'create_date DESC ',  table, callback);
    },

    addData: function(req, callback){
        return exec.save(req, table, callback);
    },

    updateData: function(req, callback){
        
        return exec.findByIdAndUpdate(req.id, req, table, callback);
        // return exec.findNotIdAndUpdate(req.id, {publish : 0}, table, callback);
    },

    unPrimary: function(req, callback){
        return exec.knex(table)
        .where({news_id : req.news_id})
        .whereNot({id : req.id})
        .update({main : '0'}).then(res=>{
            callback(null, res)
        }).catch(function(error) { 
            callback(error, null)
        });
    },


    getData  : function(req, callback){
        return exec.findAll({news_id : req.id}, '*', null, table, callback);
    },
 
    
}