
let table = 'T_PostPolling';
const exec = require('../../helpers/mssql_adapter') 
var stringInject = require('stringinject')
const utility = require('../../helpers/utility')

module.exports = {
    deleteData : function(req, callback){
        return exec.findByIdAndDelete(req.id, table, callback);
    },

    deleteByPostId : function(req, callback){
        return exec.findOneAndDelete({'post_id' : req.id}, table, callback);
    },
    
    getById  : function(req, callback){
        return exec.findById(req.id, '*', table , callback);
    },

    getByPostId  : function(req, callback){
        return exec.knex(table)
        .where({'post_id' : req.id})
        .select('*')
        .orderBy('sort', 'ASC')
        .orderBy('create_date', 'ASC')
        .then(datas=>{
            callback(null, datas)
        }).catch(function(error) { 
            callback(error, null)
        });
    },

    getCountData  : function(req, callback){
        return exec.getCountData({}, table, callback);
    },

    getAll  : function(req, callback){
        return exec.getAll(null, '*', req.start, req.limit, 'create_date DESC ',  table, callback);
    },

    addData: function(req, callback){
        return exec.save(req, table, callback);
    },

    updateData: function(req, callback){
        return exec.findByIdAndUpdate(req.id, req, table, callback);
    },

    checkFeatured: function(req, callback){
        return exec.getCountData({featured: '1'}, table, callback);
    },


    addMultiple: function(req, callback){
        const datas = req.map(data => {
            return {
                id: utility.generateHash(32),
                post_id: data.post_id,
                title: data.title,
                sort: data.sort,
                create_date: data.create_date
            };
        });
        return exec.save(datas, table, callback);
    },
 
    
}