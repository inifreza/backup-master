let table = 'T_OTP'
const exec = require('../../helpers/mssql_adapter') 
var stringInject = require('stringinject')
const utility = require('../../helpers/utility')
let _ = require('lodash');

module.exports = {
  addData: function(req, callback){
    return exec.save(req, table, callback);
  },

  getOne : function(req, callback){
    return exec.findOne(req,'*', 'create_date DESC', table, callback)
  }
}
