
let table = 'T_ForbiddenWord';
const exec = require('../../helpers/mssql_adapter') 
var stringInject = require('stringinject')
const utility = require('../../helpers/utility')

module.exports = {
    deleteData : function(req, callback){
        return exec.findByIdAndDelete(req.id, table, callback);
    },
    
    getById  : function(req, callback){
        return exec.findById(req.id, '*', table , callback);
    },

    getCountData  : function(req, callback){
        // return exec.getCountData(null, table, callback);
        return exec
        .knex(table)
        .count('id as count')
        .modify((qb)=>{
            if(utility.issetVal(req.keyword))
                qb.andWhere('word', 'LIKE', `%${req.keyword}%`)
        })
        .then(datas=>{
            callback(null,datas[0].count)
        })
        .catch(error=>{
            callback(error,null)
        })
    },

    getAll  : function(req, callback){
        return exec
        .knex(table)
        .select('*')
        .modify((qb)=>{
            if(utility.issetVal(req.keyword))
                qb.andWhere('word', 'LIKE', `%${req.keyword}%`)
        })
        .orderByRaw('create_date ASC')
        .limit(req.limit)
        .offset(req.start)
        .then(datas=>{
            callback(null,datas)
        })
        .catch(error=>{
            callback(error,null)
        })
    },

    addData: function(req, callback){
        return exec.save(req, table, callback);
    },

    updateData: function(req, callback){
        return exec.findByIdAndUpdate(req.id, req, table, callback);
    },
    
}