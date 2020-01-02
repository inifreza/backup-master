const table = 'AT_JobRecommend'
const exec = require('../../helpers/mssql_adapter')
const utility = require('../../helpers/utility')

module.exports = {

  addData: function (req, callback) {
    return exec.save(req, table, callback);
  },

  /* deleteData: function (req, callback) {
    return exec.findByIdAndDelete(req.id, table, callback);
  },

  getListBySchool: function (req, callback) {
    let column = [
      '*'
    ]
    return exec.findAll(req,column,'school ASC', table, callback)
  },
  getById : function(req, callback){
    let column = [
      '*'
    ]
    return exec.findById(req.id,column, table, callback)
  },

  getCountData  : function(req, callback){
    let param = [];
    // c
    utility.issetVal(req.school) ? param.school = req.school : null;
    // console.log(param)
    // return exec.getCountData(param, table, callback);

    return exec.knex(table)
    .select('*')
    .where('school','LIKE', "%"+req.school+"%")
    .then(datas=>{
        callback(null, datas.length)
    }).catch(function(error) { 
        callback(error, null)
    });
  },

  getByFilter  : function(req, callback){
    
    return exec.knex(table)
    .select('*')
    .where('school', 'LIKE', `%${req.school}%`)
    .orderBy('school', 'asc')
    .limit(req.limit)
    .offset(req.start)
    .then(datas=>{
        callback(null, datas)
    }).catch(function(error) { 
        callback(error, null)
    });
},
  
  updateData: function(req, callback){
    return exec.findByIdAndUpdate(req.id, req, table, callback);
} */
}