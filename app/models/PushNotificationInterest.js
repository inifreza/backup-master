let table = 'AT_PushNotificationInterest';
const exec = require('../../helpers/mssql_adapter') 
var stringInject = require('stringinject')
const utility = require('../../helpers/utility')

module.exports = {
    addData : function (req, callback) {
        return exec.save(req, table ,callback)
    },

    getAll  : function(req, callback){
        return exec.getAll(null, '*', req.start, req.limit, 'create_date DESC ',  table, callback);
    },
    getCountData  : function(callback){
        return exec.knex(table).count('* as total')
        .then (function (total){
            callback(null, total[0].total)
        })
        .catch(function (error){
            callback(error, null)
        })
      },
    getById : function(req, callback){
        let column = [
          '*'
        ]
        return exec.findById(req.id,column, table, callback)
    },
    deleteData: function (req, callback) {
      return exec.findByIdAndDelete(req.id, table, callback);
    },
}