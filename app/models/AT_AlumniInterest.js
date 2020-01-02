const table = 'AT_AlumniInterest';
const exec = require('../../helpers/mssql_adapter') 
var stringInject = require('stringinject')

// utility
const utility = require('../../helpers/utility')
const globals = require('../../configs/global')
const { config } = require('../../default')
let url = globals[config.environment]; // development || production

module.exports = {
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

  getAllByAlumni_id : function (req, callback){
    console.log(req.us);
    return exec
      .knex('T_Interest')
      .select('T_Interest.*')
      .leftJoin('AT_AlumniInterest','AT_AlumniInterest.interest_id', '=', 'T_interest.id')
      .where('user_id', req.user_id)
      .orderBy('title', 'asc')

      .then((datas) =>{
        let result = datas.map(interest =>{
          interest.path = 'upload/interest'
          // if(utility.issetVal(interest.img)){
          //   interest.img = url.url_img+'interest/'+interest.img
          // } else {
          //   interest.img = null
          // }
          return interest
        })
        callback(null, result)
      })
      .catch((error)=>{
        callback(error, null)
      })
  }
}