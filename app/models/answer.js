let table = 'T_Answer';
const exec = require('../../helpers/mssql_adapter') 
var stringInject = require('stringinject')
const utility = require('../../helpers/utility')

module.exports = {
    addMultiple: function(req, callback){
        var datas = []
        req.forEach(function(data) {
            if(!utility.isObjectEmpty(data.answer)){
                data.answer.forEach(function(row) {
                    datas.push({
                        id: utility.generateHash(32),
                        question_id: row.question_id,
                        title: row.title,
                        sort: row.sort,
                        correct: row.correct,
                        publish: row.publish,
                        create_date: row.create_date
                    })
                })
            }
        })
        return exec.save(datas, table, callback);
    },

    deleteData : function(req, callback){
        return exec.findByIdAndDelete(req.id, table, callback);
    },
    
    getById  : function(req, callback){
        return exec.findById(req.id, '*', table , callback);
    },

    getByForeignkeyId  : function(req, callback){
        
        return exec.knex('T_Answer as answer')
            .select('answer.*')
            .where(req)
            .orderBy('answer.create_date', 'desc')
            .orderBy('answer.sort', 'asc')
            .then(datas=>{
                callback(null, datas)
            }).catch(function(error) { 
                callback(error, null)
            });
    },

    getCountData  : function(req, callback){
        return exec.getCountData(null, table, callback);
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
}