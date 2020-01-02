const table = 'AT_SettingInterest'
const exec = require('../../helpers/mssql_adapter')

module.exports = {
  addData : function(req, callback){
    return exec.save(req, table, callback)
  },

  getById  : function(req, callback){
    return exec.findById(req.id, '*', table , callback);
  },

  getOne  : function(req, callback){
    return exec.findOne(req, '*', null, table , callback);
  },

  updateData: function(req, callback){
    return exec.findByIdAndUpdate(req.id, req, table, callback);
  },
  
  deleteData : function(req, callback){
    return exec.findOneAndDelete({'setting_id' :req.setting_id}, table, callback);
  },
}