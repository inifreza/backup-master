
let table = 'T_Quote';
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
        console.log({req});
        return exec
        .knex(table)
        .count('id as count')
        .modify((qb)=>{
            if(utility.issetVal(req.keyword)) {
                qb.orWhere('title', 'LIKE', `%${req.keyword}%`)
                qb.orWhere('writter', 'LIKE', `%${req.keyword}%`)
                qb.orWhere('quote', 'LIKE', `%${req.keyword}%`)
            } else {
                qb.where({})
            }
        })
        .then(datas=>{
            console.log({datas});
            callback(null,datas[0].count)
        })
        .catch(error=>{
            callback(error,null)
        })
    },

    getAll  : function(req, callback){
        // return exec.getAll(null, '*', req.start, req.limit, 'create_date DESC',  table, callback);
        console.log({req});
        return exec
        .knex(table)
        .select('*')
        .modify((qb)=>{
            if(utility.issetVal(req.keyword)){
                qb.orWhere('writter', 'LIKE', `%${req.keyword}%`)
                qb.orWhere('quote', 'LIKE', `%${req.keyword}%`)
                qb.orWhere('title', 'LIKE', `%${req.keyword}%`)
            } else {
                qb.where({})
            }
        })
        .orderByRaw('create_date DESC')
        .limit(req.limit)
        .offset(req.start)
        .then(datas=>{
            console.log({datas});
            callback(null,datas)
        })
        .catch(error=>{
            console.log({error});
            callback(error,null)
        })
    },

    addData: function(req, callback){
        return exec.save(req, table, callback);
    },

    updateData: function(req, callback){
        return exec.findByIdAndUpdate(req.id, req, table, callback);
    },
    
    unpublish: function(req, callback){
        return exec.findNotIdAndUpdate(req.id, {publish : 0}, table, callback);
    }
    
}