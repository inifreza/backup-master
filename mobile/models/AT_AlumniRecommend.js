
let table = 'AT_AlumniRecommend';
const exec = require('../../helpers/mssql_adapter') 
var stringInject = require('stringinject')

module.exports = {
    deleteData : function(req, callback){
        return exec.findByIdAndDelete(req.id, table, callback);
    },
    
    getById  : function(req, callback){
        return exec.findById(req.id, null, table, callback);
    },

    getCountData  : function(req, callback){
        return exec.getCountData({month : req.month, year : req.year}, table, callback);
    },

    getAll  : function(req, callback){
        return exec.getAll({month : req.month, year : req.year}, '*', req.start, req.limit, table, callback);
    },
    


    checkEmail: function(req, callback){
        return exec.getCountData({ email: req.email}, table, callback);
    },

    addData: function(req, callback){
        return exec.save(req, table, callback);
    },

    getSearch: function(req, callback){
        return exec.find({'email ' : req.keyword}, '*', table, callback);
    },

    updateData: function(req, callback){
        return exec.findByIdAndUpdate(req.id, req, table, callback);
    },
}