const table = 'AT_AlumniInterest'
const exec  = require('../../helpers/mssql_adapter')
const utility = require('../../helpers/utility')

//setting img
const globals = require('../../configs/global')
const { config } = require('../../default')
let url = globals[config.environment]; // development || production

module.exports = {
  addData : function(req, callback){
    return exec.save(req, table, callback)
  },

  getById : function(req, callback){
    return exec.findById(req,id,'*', table, callback)
  },

  getData : function (req, callback){
    return exec.findOne(req,'*', null, table, callback)
  },

  deleteData: function (req, callback) {
    return exec.findOneAndDelete(req, table, callback);
  },

  getAllId : function (interest_list, callback){
    return exec.knex('T_Interest')
      .select('AT_AlumniInterest.user_id')
      .leftJoin('AT_AlumniInterest','AT_AlumniInterest.interest_id', '=', 'T_interest.id')
      .whereIn('interest_id', interest_list)
      .groupBy('AT_AlumniInterest.user_id')
      .then(([...datas]) =>{
        // console.log('a',...datas);
         return Promise.all(datas.map(interest=>{
           interest = interest.user_id
           return interest  
          }))
      })
      .then((datas) =>{
        // console.log(datas)
        callback(null, datas)
      })
      .catch((error)=>{
        callback(error, null)
      })
  },

  getCountByAlumni_id : function(req,callback){
    return exec
    .knex('T_Interest')
    .count('user_id as count')
    .leftJoin('AT_AlumniInterest','AT_AlumniInterest.interest_id', '=', 'T_interest.id')
    .where('user_id', req.user_id)
    .then(datas => {
      console.log(datas);
      callback(null, datas[0].count)
    })
    .catch(error=>{
      callback(error,null)
    })
  },

  getAllByAlumni_id : function (req, callback){
    console.log(req);
    return exec
      .knex('T_Interest')
      .select('*')
      .leftJoin('AT_AlumniInterest','AT_AlumniInterest.interest_id', '=', 'T_interest.id')
      .where('user_id', req.user_id)
      .orderBy('title', 'asc')
      .limit(req.limit)
      .offset(req.start)

      .then((datas) =>{
        let result = datas.map(interest =>{
          if(utility.issetVal(interest.img)){
            interest.img = url.url_img+'interest/'+interest.img
          } else {
            interest.img = null
          }
          return interest
        })
        callback(null, result)
      })
      .catch((error)=>{
        callback(error, null)
      })
  }

}