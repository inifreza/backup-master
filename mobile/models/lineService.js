
let table = 'T_LineOfService';
const exec = require('../../helpers/mssql_adapter') 
var stringInject = require('stringinject')

module.exports = {
    deleteData : function(req, callback){
        return exec.findByIdAndDelete(req.id, table, callback);
    },
    
    getById  : function(req, callback){
        return exec.findById(req.id, '*', table , callback);
    },

    getCountData  : function(req, callback){
        return exec.getCountData(null, table, callback);
    },

    getList  : function(req, callback){
        return exec.getAll(null, '*', req.start, req.limit, 'title ASC',  table, callback);
    },

    addData: function(req, callback){
        return exec.save(req, table, callback);
    },

    updateData: function(req, callback){
        return exec.findByIdAndUpdate(req.id, req, table, callback);
    },
    
    getAll  : function(req, callback){
        return exec.find(null, '*', table, callback);
    },

    
}