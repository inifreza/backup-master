
let table = 'T_Admin'; 
const exec = require('../../helpers/mssql_adapter') 
var stringInject = require('stringinject')

module.exports = {
    deleteData : function(req, callback){
        return exec.findByIdAndDelete(req.id, table, callback);
    },
    
    getById  : function(req, callback){
        return exec.findById(req.id, '*', table, callback);
    },

    getCountData  : function(req, callback){
        return exec.getCountData(null, table, callback);
    },

    getAll  : function(req, callback){
        return exec.getAll(null, '*', req.start, req.limit, 'create_date DESC ',  table, callback);
    },
    
    getSalt: function(req, callback){
        return exec.findOne({'email' : req.body.email}, 'salt_hash', null, table, callback);
    },

    getAuth: function(req, callback){
        return exec.findOne({id: req.user_id}, '*', null,  table, callback);
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

    login: function(req, callback){
        let column = ['id','name','email','salt_hash','img','publish','auth_code'];
        return exec.findOne({email: req.email, password: req.password}, column, null, table, callback);
    },
    
}