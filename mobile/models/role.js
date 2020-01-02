
let table = 'T_Role';
const exec = require('../../helpers/mssql_adapter') 
var stringInject = require('stringinject')

module.exports = {

    getAll  : function(req, callback){
        return exec.find(null, '*', table, callback);
    },
}