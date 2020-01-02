
let table = 'T_Admin'; 
const exec = require('../../helpers/mssql_adapter') 
var stringInject = require('stringinject')
const utility = require('../../helpers/utility')

module.exports = {
    deleteData : function(req, callback){
        return exec.findByIdAndDelete(req.id, table, callback);
    },
    
    getById  : function(req, callback){
        return exec.findById(req.id, '*', table, callback);
    },

    getCountData  : function(req, callback){
        console.log({'req Count' : req});
        // return exec.getCountData(null, table, callback);
        return exec.knex(table + ' as admin')
            .select('admin.*', 'role.name as role_name')
            .leftJoin('T_Role as role', 'role.id', '=', 'admin.role_id')
            .modify(qb => {
                if(utility.issetVal(req.keyword))
                    qb.andWhere('admin.name', 'LIKE', `%${req.keyword}%`)
                if(utility.issetVal(req.role))
                    qb.andWhere('role.name', 'LIKE', `%${req.role}%`)
            })
            .then(datas=>{
                callback(null, datas.length)
            }).catch(function(error) { 
                callback(error, null)
            });
    },

    getAll  : function(req, callback){
        console.log({req});
        // return exec.getAll(null, '*', req.start, req.limit, 'create_date DESC ',  table, callback);
        return exec.knex(table + ' as admin')
            .select('admin.*', 'role.name as role_name')
            .leftJoin('T_Role as role', 'role.id', '=', 'admin.role_id')
            .modify(qb => {
                if(utility.issetVal(req.keyword))
                    qb.andWhere('admin.name', 'LIKE', `%${req.keyword}%`)
                if(utility.issetVal(req.role))
                    qb.andWhere('role.name', 'LIKE', `%${req.role}%`)
            })
            .orderBy('admin.create_date', 'desc')
            .limit(req.limit)
            .offset(req.start)
            .then(datas=>{
                console.log({datas});
                callback(null, datas)
            }).catch(function(error) { 
                console.log({error});
                callback(error, null)
            });
    },
    
    getSalt: function(req, callback){
        return exec.findOne({'email' : req.body.email}, 'salt_hash', null, table, callback);
    },

    getAuth: function(req, callback){
        return exec.findOne({id: req.user_id}, '*', null,  table, callback);
    },

    checkEmail: function(req, callback){
        return exec.getCountData({ email: req.email}, table, callback);
    },

    addData: function(req, callback){
        return exec.save(req, table, callback);
    },

    getSearch: function(req, callback){
        return exec.find({'email ' : req.keyword}, '*', table, callback);
    },

    updateData: function(req, callback){
        return exec.findByIdAndUpdate(req.id, req, table, callback);
    },

    login: function(req, callback){
        let column = ['id','name','email','salt_hash','img','publish','auth_code','role_id'];
        return exec.findOne({email: req.email, password: req.password}, column, null, table, callback);
    },
    
    getData  : function(req, callback){
        return exec.findAll(req, '*', null, table, callback);
    },
}