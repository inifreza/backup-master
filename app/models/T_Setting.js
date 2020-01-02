const table = 'T_Setting'
const exec = require('../../helpers/mssql_adapter')
const utility = require('../../helpers/utility')

module.exports = {
  addData : function(req, callback){
    return exec.save(req, table, callback)
  },

  getById  : function(req, callback){
    return exec.findById(req.id, '*', table , callback);
  },

  getOne  : function(req, callback){
    return exec.knex(table)
        .first()
        .select('*')
        .then(datas=>{
          const data = {
            id : datas.id,
            is_comment: utility.intToBooleanParse(datas.show_comment),
            is_message: utility.intToBooleanParse(datas.show_message),
            is_polling: utility.intToBooleanParse(datas.show_polling),
            is_share: utility.intToBooleanParse(datas.show_share),
            is_post: utility.intToBooleanParse(datas.show_post)
          }
          return exec.knex('AT_SettingInterest')
          .select('*')
          .where('setting_id', data.id)
          .then(row => {
            if(utility.issetVal(row)){
              data.blacklist_interest = row;
            }
            return data;
          }).catch(function(error) { 
            return data;
          });
        })
        .then(datas=>{
            callback(null, datas)
        }).catch(function(error) { 
            callback(error, null)
        });
  },

  updateData: function(req, callback){
    return exec.findByIdAndUpdate(req.id, req, table, callback);
  },
}