const table = 'T_Feedback'
const exec = require('../../helpers/mssql_adapter') 
const utility = require('../../helpers/utility')

module.exports = {
  getAll : function (req, callback){
    console.log({req});
    return exec
    .knex('T_Feedback as feedback')
    .max('feedback.id as feedback_id')
    .max('feedback.app_version as app_version')
    .max('feedback.content as content')
    .max('feedback.create_date as create_date')
    .max('user.id as user_id')
    .max('user.name as alumni_name')
    .max('user.email as alumni_email')
    .max('user.phone as alumni_phone')
    .leftJoin('T_User as user', 'user.id', '=', 'feedback.user_id')
    .where({})
    .modify(qb=>{
      if(utility.issetVal(req.keyword)){
        qb.andWhere('user.name', 'LIKE', `%${req.keyword}%`)
        qb.andWhere('user.email', 'LIKE', `%${req.keyword}%`)
      }
      if(utility.issetVal(req.app_version)){
        qb.andWhere('feedback.app_version', 'LIKE', `%${req.app_version}%`)
      }
      if(utility.issetVal(req.create_date)){
        let date = req.create_date.split('-').map(x=>{
            return x.trim()
        })
        // console.log({date});
        qb.whereBetween('feedback.create_date', date)
      } 
    })
    .groupBy('feedback.id')
    .orderBy('create_date', 'DESC')
    .limit(req.limit)
    .offset(req.start)
    .then(datas=>{
      callback(null, datas)
    }).catch(function(error) { 
      console.log({error : error});
        callback(error, null)
    });
  },

  getCount : function(req, callback){
    console.log({req});
    return exec
    .knex('T_Feedback as feedback')
    .count('feedback.id as id')
    .leftJoin('T_User as user', 'user.id', '=', 'feedback.user_id')
    .where({})
    .modify(qb=>{
      if(utility.issetVal(req.keyword)){
        qb.andWhere('user.name', 'LIKE', `%${req.keyword}%`)
        qb.andWhere('user.email', 'LIKE', `%${req.keyword}%`)
      }
      if(utility.issetVal(req.app_version)){
        qb.andWhere('feedback.app_version', 'LIKE', `%${req.app_version}%`)
      }
      if(utility.issetVal(req.create_date)){
        let date = req.create_date.split('-').map(x=>{
            return x.trim()
        })
        // console.log({date});
        qb.whereBetween('feedback.create_date', date)
      } 
    })
    .groupBy('feedback.id')
    .then(datas=>{
      callback(null, datas[0].id)
    }).catch(function(error) { 
      console.log({error : error});
        callback(error, null)
    });
  },

  addData: function(req, callback){
    return exec.save(req, table, callback);
  },
}