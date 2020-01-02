


const { config } = require('../default') 
const { mssql } = require('../configs/database') 
const utility = require('./utility')
let database= mssql[config.environment]; // development || production

let knex = require('knex')({
    client: 'mssql',
    connection: {
      host : database.host,
      user : database.user,
      password : database.password,
      database : database.database,
    }
});



module.exports = {
    knex,

    findByIdAndDelete: function(req, table, callback){
        // example use this function
        // deleteById(req.id, 'T_Admin', callback);
        knex(table).where('id', req).del()
        .then(datas=>{
            callback(null, datas)
        }).catch(function(error) { 
            callback(error, null)
        });
    },

    findOneAndDelete: function(req, table, callback){
        // example use this function
        // deleteById(req.id, 'T_Admin', callback);
        let param  = utility.issetVal(req) ? req :  {};
        knex(table).where(param).del()
        .then(datas=>{
            callback(null, datas)
        }).catch(function(error) { 
            callback(error, null)
        });
    },

    findById: function(req, column, table, callback){
        // example use this function
        // findById(req.id, 'T_Admin', callback);
        return knex(table).select(column).where('id', req).first()
        .then(datas=>{
            callback(null, datas)
        }).catch(function(error) { 
            callback(error, null)
        });
    },

    findOne: function(req, column, sort, table, callback){
        // example use this function
        // with param and select field email    =  findOne({'id' : req.id}, 'email', 'T_Admin', callback);
        // without param and select * =  findOne(null, 'T_Admin', '*', callback);        
        let param  = utility.issetVal(req) ? req :  {};
        let orderBy  = utility.issetVal(sort) ? sort : '1' ;
        console.log(table);
        return knex(table).where(param).first().select(column).orderByRaw(orderBy)
        .then(datas=>{
            callback(null, datas)
        }).catch(function(error) { 
            callback(error, null)
        });
    },

    findAll: function(req, column, sort, table, callback){
        // console.log({sort : sort});
        // example use this function
        // with param and select field email    =  findOne({'id' : req.id}, 'email', 'T_Admin', callback);
        // without param and select * =  findOne(null, 'T_Admin', '*', callback);        
        let param  = utility.issetVal(req) ? req :  {};
        let orderBy  = utility.issetVal(sort) ? sort : '1' ;
        // console.log({orderBy});
        return knex(table).where(param).select(column).orderByRaw(orderBy)
        .then(datas=>{
            callback(null, datas)
        }).catch(function(error) { 
            callback(error, null)
        });
    },

    findAllWhereNot: function(req, column, sort, table, callback){
        // example use this function
        // with param and select field email    =  findOne({'id' : req.id}, 'email', 'T_Admin', callback);
        // without param and select * =  findOne(null, 'T_Admin', '*', callback);        
        let param  = utility.issetVal(req) ? req :  {};
        let orderBy  = utility.issetVal(sort) ? sort : '1' ;
        // console.log(column);
        return knex(table).whereNot(param).select(column).orderByRaw(orderBy)
        .then(datas=>{
            callback(null, datas)
        }).catch(function(error) { 
            callback(error, null)
        });
    },


    findByForeignkey: function(req, column, orderBy, table, callback){
        // example use this function
        // with param and select field email    =  findOne({'id' : req.id}, 'email', 'T_Admin', callback);
        // without param and select * =  findOne(null, 'T_Admin', '*', callback);        
        let param  = utility.issetVal(req) ? req :  {};
        // console.log(column);
        return knex(table).where(param).select(column).orderByRaw(orderBy)
        .then(datas=>{
            callback(null, datas)
        }).catch(function(error) { 
            callback(error, null)
        });
    },

    getCountData: function(req, table, callback){
        // example use this function
        // with param    =  getCountData({'id' : req.id}, 'T_Admin', callback);
        // without param =  getCountData(null, 'T_Admin', callback);
        let param  = utility.issetVal(req) ? req :  {};

        return knex(table).count('id as id')
            .where(param)
            .then(datas=>{
                callback(null, datas[0].id)
            }).catch(function(error) { 
                callback(error, null)
            });
    },

    getAll: function(req, column, start, limit, orderBy, table, callback){
        // example use this function
        // with param    =  getAll({'id' : req.id}, 'T_Admin', callback);
        // without param =  getAll(null, 'T_Admin', callback);
        let param  = utility.issetVal(req) ? req :  {};
        
        return knex(table)
        .select(column)
        .orderByRaw(orderBy)
        .where(param)
        .limit(limit)
        .offset(start)
        .then(datas=>{
            callback(null, datas)
        }).catch(function(error) { 
            callback(error, null)
        });
    },
    
    save: function(req, table, callback){
        return knex(table).insert(req).then(res=>{
            callback(null, res)
        }).catch(function(error) { 
            callback(error, null)
        });
    },

    find: function(req, column, table, callback){
        // example use this function
        // with param and select field email    =  find({'id' : req.id}, 'email', 'T_Admin', callback);
        // without param and select * =  find(null, 'T_Admin', '*', callback);      
        let key;
        let operator;
        let value;
        let param;
        if(utility.issetVal(req)){
            // console.log('heheheh')
            let index=0;
            for (let propName in req) {
               key = propName;
               operator = 'LIKE';
               value = "%"+req[propName]+"%";
            }
            param = key,operator,value;
        }else{
            param = {};
        }

        return knex(table)
        .modify(function(queryBuilder) {
            if(utility.issetVal(req)){
                queryBuilder.where(key, operator, value);
            } else {
                queryBuilder.where({})
            }
            // console.log(queryBuilder)
        })
        .select(column)
        .then(datas=>{
            callback(null, datas)
        }).catch(function(error) { 
            callback(error, null)
        });
    },
    
    findNew: function(req, column, table, callback){
        // example use this function
        // with param and select field email    =  find({'id' : req.id}, 'email', 'T_Admin', callback);
        // without param and select * =  find(null, 'T_Admin', '*', callback);      
        let key;
        let operator;
        let value;
        let param;
        
        return knex(table)
        .modify(function(queryBuilder) {
            if(utility.issetVal(req)){
                for (let propName in req) {
                    key = propName;
                    operator = 'LIKE';
                    value = "%"+req[propName]+"%";
                    queryBuilder.where(key, operator, value);
                }
            } else {
                queryBuilder.where({})
            }
            // console.log(queryBuilder)
        })
        .select(column)
        .then(datas=>{
            callback(null, datas)
        }).catch(function(error) { 
            callback(error, null)
        });
    },

    findByIdAndUpdate: function(id, req, table, callback){
        return knex(table).where({id : id}).update(req).then(res=>{
            callback(null, res)
        }).catch(function(error) { 
            callback(error, null)
        });
    },

    finOneAndUpdate: function(req, data, table, callback){
        return knex(table).where(req).update(data).then(res=>{
            callback(null, res)
        }).catch(function(error) { 
            callback(error, null)
        });
    },
    

    findNotIdAndUpdate: function(id, req, table, callback){
        return knex(table).whereNot({id : id})
        .update(req).then(res=>{
            callback(null, res)
        }).catch(function(error) { 
            callback(error, null)
        });
    },
}