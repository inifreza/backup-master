
const table = 'T_Notification';
const exec = require('../../helpers/mssql_adapter') 
var stringInject = require('stringinject')
const utility = require('../../helpers/utility')

module.exports = {
    addData: function(req, callback){
        return exec.save(req, table, callback);
    },

    deleteByTypeId : function(req, callback){
        return exec.findOneAndDelete({'type_id' :req.id}, table, callback);
    },
}