
let table = 'T_AppVersion';
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

    getOne  : function(req, callback){
        return exec.findOne(req, '*', null, table , callback);
    },

    getCountData  : function(req, callback){
        return exec
        .knex(table)
        .count('id as count')
        .where({publish : 1})
        .modify((qb)=>{
            if(utility.issetVal(req.platform))
                qb.andWhere({platform : req.platform})
            if(utility.issetVal(req.keyword))
                qb.andWhere('version_name', 'LIKE', `%${req.keyword}%`)
        })
        .then(datas=>{
            callback(null, datas[0].count)
        })
        .catch(error=>{
            callback(error,null)
        })
    },

    getAll  : function(req, callback){
        // return exec.getAll({platform : req.platform}, '*', req.start, req.limit, 'version_name DESC, publish DESC',  table, callback);
        return exec
        .knex(table)
        .select('*')
        .where({publish : 1})
        .modify((qb)=>{
            if(utility.issetVal(req.platform))
                qb.andWhere({platform : req.platform})
            if(utility.issetVal(req.keyword))
                qb.andWhere('version_name', 'LIKE', `%${req.keyword}%`)
        })
        .orderBy('version_name', 'DESC')
        .limit(req.limit)
        .offset(req.start)
        .then(datas=>{
            callback(null, datas)
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
    
    unpublish: function(req, callback){
        return exec.findNotIdAndUpdate(req.id, {publish : 0}, table, callback);
    }
    
}