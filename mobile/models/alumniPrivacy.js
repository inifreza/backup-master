
let table = 'AT_AlumniPrivacy';
const exec = require('../../helpers/mssql_adapter') 
var stringInject = require('stringinject')

module.exports = {
    deleteData : function(req, callback){
        return exec.findByIdAndDelete(req.id, table, callback);
    },
    
    getById  : function(req, callback){
        return exec.findById(req.id, null, table, callback);
    },

    getOne  : function(req, callback){
        return exec.findOne(req, null, 'create_date ASC', table, callback);
    },

    getCountData  : function(req, callback){
        return exec.getCountData(req, table, callback);
    },

    getAll  : function(req, callback){
        return exec.getAll(req, '*', req.start, req.limit, table, callback);
    },
    
    addData: function(req, callback){
        return exec.save(req, table, callback);
    },

    updateData: function(req, callback){
        return exec.finOneAndUpdate({'user_id' : req.user_id}, req, table, callback);
    },
}