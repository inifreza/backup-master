const table = 'AT_AlumniEducation'
const exec = require('../../helpers/mssql_adapter')
const utility = require('../../helpers/utility')

module.exports = {

  addData: function (req, callback) {
    return exec.save(req, table, callback);
  },

  deleteData: function (req, callback) {
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
    utility.issetVal(req.bySearch) ? param.bySearch = req.bySearch : null;
    // console.log(param)
    // return exec.getCountData(param, table, callback);

    return exec.knex(table)
    .select('*')
    .where('user_id', req.user_id)
    .modify(function(queryBuilder){
     
      if(utility.issetVal(req.bySearch)){
        queryBuilder.where(req.column, 'LIKE', `%${req.bySearch}%`)
      }
    })
    .then(datas=>{
        callback(null, datas.length)
    }).catch(function(error) { 
        callback(error, null)
    });
  },

  getByFilter  : function(req, callback){
    return exec.knex(table)
    .select('*')
    .where('user_id','=',req.user_id)
    .modify(function(queryBuilder){
      if(utility.issetVal(req.bySearch)){
        queryBuilder.where(req.column, 'LIKE', `%${req.bySearch}%`)
      }
    })
    .orderBy('present', 'desc')
    .orderBy(req.colOrder, req.orderBy)
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
}
}