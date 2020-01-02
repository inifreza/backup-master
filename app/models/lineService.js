
let table = 'T_LineOfService';
const exec = require('../../helpers/mssql_adapter') 
const utility = require('../../helpers/utility')
var stringInject = require('stringinject')

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
        .knex('T_LineOfService as lineOfService')
        .max('lineOfService.id as lineOfService_id')
        .max('lineOfService.title as title')
        .max('lineOfService.create_date as create_date')
        .max('lineOfService.modify_date as modify_date')
        .max('lineOfService.publish as publish')
        .modify(qb=>{
            if(utility.issetVal(req.keyword))
                qb.andWhere('lineOfService.title', 'LIKE', `%${req.keyword}%`)
            if(utility.issetVal(req.create_date)){
                let date = req.create_date.split('-').map(x=>{
                    return x.trim()
                })
                // console.log({date});
                qb.whereBetween('lineOfService.create_date', date)
            }
            switch (req.sort) {
                case '1':
                    qb.orderBy('publish', 'asc')
                    break;
                case '2':
                    qb.orderBy('publish', 'desc')
                    break;
                case '3':
                    qb.orderBy('create_date', 'asc')
                    break;
                case '4':
                    qb.orderBy('create_date', 'desc')
                    break;
                default:
                    qb.orderBy('create_date', 'desc')
                    break;
            }
        })
        .groupBy('lineOfService.id')
        .limit(req.limit)
        .offset(req.start)
        .then(datas=>{
            callback(null, datas.length)
        })
        .catch(error=>{
            callback(error, null)
        })
    },

    getList  : function(req, callback){
        // return exec.getAll(null, '*', req.start, req.limit, 'title ASC',  table, callback);
        return exec
        .knex('T_LineOfService as lineOfService')
        .max('lineOfService.id as lineOfService_id')
        .max('lineOfService.title as title')
        .max('lineOfService.create_date as create_date')
        .max('lineOfService.modify_date as modify_date')
        .max('lineOfService.publish as publish')
        .modify(qb=>{
            if(utility.issetVal(req.keyword))
                qb.andWhere('lineOfService.title', 'LIKE', `%${req.keyword}%`)
            if(utility.issetVal(req.create_date)){
                let date = req.create_date.split('-').map(x=>{
                    return x.trim()
                })
                // console.log({date});
                qb.whereBetween('lineOfService.create_date', date)
            }
            switch (req.sort) {
                case '1':
                    qb.orderBy('publish', 'asc')
                    break;
                case '2':
                    qb.orderBy('publish', 'desc')
                    break;
                case '3':
                    qb.orderBy('create_date', 'asc')
                    break;
                case '4':
                    qb.orderBy('create_date', 'desc')
                    break;
                default:
                    qb.orderBy('create_date', 'desc')
                    break;
            }
        })
        .groupBy('lineOfService.id')
        .limit(req.limit)
        .offset(req.start)
        .then(datas=>{
            callback(null, datas)
        })
        .catch(error=>{
            callback(error, null)
        })
    },

    addData: function(req, callback){
        return exec.save(req, table, callback);
    },

    updateData: function(req, callback){
        return exec.findByIdAndUpdate(req.id, req, table, callback);
    },
    
    getAll  : function(req, callback){
        return exec.find(null, '*', table, callback);
    },

    
}