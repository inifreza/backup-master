let table = 'T_PushNotification';
const exec = require('../../helpers/mssql_adapter') 
var stringInject = require('stringinject')
const utility = require('../../helpers/utility')

module.exports = {
    addData : function (req, callback) {
        return exec.save(req, table ,callback)
    },

  
    getAll  : function(req, callback){
        return exec.knex(table)
        .select('*')
        .modify((qb)=>{
            if(utility.issetVal(req.keyword))
                qb.andWhere('title', 'LIKE', `%${req.keyword}%`)
            if(utility.issetVal(req.status))
                qb.andWhere({status : req.status})
            if(utility.issetVal(req.send_to))
                qb.andWhere({send_type : req.send_to})
            if(utility.issetVal(req.send_to))
                qb.andWhere({send_type : req.send_to})
        })
        .orderByRaw('create_date DESC')
        .limit(req.limit)
        .offset(req.start)
        .then(datas=>{
            Promise.all(datas.map(data => {
                if(data.send_type == 'interest'){
                    return exec.knex('AT_PushNotificationInterest as pusthInterest')
                    .select( 'pusthInterest.interest_id'
                            , 'interest.title')
                    .leftJoin('T_Interest as interest', 'interest.id', '=', 'pusthInterest.interest_id')
                    .where('pusthInterest.pushnotification_id', data.id)
                    .then(datas=>{
                        data.interest_list = datas;
                        return data;
                    }).catch(function(error) { 
                        console.log(error);
                    });
                } else {
                    return data
                }
                
               
            })).then(response => {
                callback(null, response)
            }).catch(function(error){ 
                callback(error, null)
            });
        }).catch(function(error) { 
            callback(error, null)
        });
    },

    getCountData  : function(req,callback){
        return exec.knex(table)
        .count('id as count')
        .modify((qb)=>{
            if(utility.issetVal(req.keyword))
                qb.andWhere('title', 'LIKE', `%${req.keyword}%`)
            if(utility.issetVal(req.status))
                qb.andWhere({status : req.status})
            if(utility.issetVal(req.send_to))
                qb.andWhere({send_type : req.send_to})
            if(utility.issetVal(req.send_to))
                qb.andWhere({send_type : req.send_to})
        })
        .then(datas => {
            callback(null, datas[0].count)
        }).catch(function(error){ 
            callback(error, null)
        });
        
      },
    getById : function(req, callback){
        let column = [
          '*'
        ]
        return exec.findById(req.id,column, table, callback)
    },
    deleteData: function (req, callback) {
      return exec.findByIdAndDelete(req.id, table, callback);
    },
}