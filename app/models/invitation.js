
let table = 'T_Alumni_InvitedBatch';
const exec = require('../../helpers/mssql_adapter') 
var stringInject = require('stringinject')
const utility = require('../../helpers/utility')

module.exports = {

    getCountData  : function(req, callback){
        // return exec.getCountData(null, table, callback);
        return exec
        .knex(table)
        .select('*')
        .modify((qb)=>{
            if(utility.issetVal(req.keyword))
                qb.andWhere('title', 'LIKE', `%${req.keyword}%`)
        })
        .then(datas => {
            callback(null, datas.length)
        })
        .catch(error => {
            console.log({error : error});
            callback(error, null)
        })
    },

    getAll  : function(req, callback){
        // return exec.getAll(null, '*', req.start, req.limit, 'create_date DESC ',  table, callback);
        console.log({'req getAll' : req});
        return exec
        .knex(table)
        .select('*')
        .modify((qb)=>{
            if(utility.issetVal(req.keyword))
                qb.andWhere('title', 'LIKE', `%${req.keyword}%`)
        })
        .orderByRaw('create_date DESC')
        .limit(req.limit)
        .offset(req.start)
        .then(datas => {
            callback(null, datas)
        })
        .catch(error => {
            console.log({error : error});
            callback(error, null)
        })
    },

    addData: function(req, callback){
        return exec.save(req, table, callback);
    },

    getLastData  : function(req, callback){
        // return exec.getAll({platform : req.platform}, '*', req.start, req.limit, 'version_name DESC, publish DESC',  table, callback);
        return exec
        .knex(table)
        .select('*')
        .orderByRaw('create_date DESC')
        .limit(1)
        .then(datas=>{
            callback(null, datas)
        })
        .catch(error=>{
            callback(error,null)
        })
    },
}