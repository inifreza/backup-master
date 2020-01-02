
let table = 'T_Quote';
const exec = require('../../helpers/mssql_adapter') 
var stringInject = require('stringinject')
const utility = require('../../helpers/utility')

module.exports = {
    getAll  : function(req, callback){
        return exec
        .knex(table)
        .select('*')
        .then(datas=>{
            callback(null, datas)
        }).catch(function(error) { 
            callback(error, null)
        });
    },

    // deleteData : function(req, callback){
    //     return exec.findByIdAndDelete(req.id, table, callback);
    // },
    
    // getById  : function(req, callback){
    //     return exec.findById(req.id, '*', table , callback);
    // },

    // getCountData  : function(req, callback){
    //     return exec.getCountData(null, table, callback);
    // },


    // addData: function(req, callback){
    //     return exec.save(req, table, callback);
    // },

    // updateData: function(req, callback){
    //     return exec.findByIdAndUpdate(req.id, req, table, callback);
    // },
    
    // unpublish: function(req, callback){
    //     return exec.findNotIdAndUpdate(req.id, {publish : 0}, table, callback);
    // }
    
}