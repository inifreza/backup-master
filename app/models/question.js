let table = 'T_Question';
const exec = require('../../helpers/mssql_adapter') 
var stringInject = require('stringinject')
const utility = require('../../helpers/utility')

module.exports = {
    addMultiple: function(req, callback){
        const datas = req.map(data => {
            return {
                id: data.new_id,
                form_id: data.form_id,
                title: data.title,
                type: data.type,
                key_answer: data.key_answer,
                sort: data.sort,
                required: data.required,
                placeholder: data.placeholder,
                publish: data.publish,
                create_date: data.create_date
            };
        });
        return exec.save(datas, table, callback);
    },

    deleteData : function(req, callback){
        return exec.findByIdAndDelete(req.id, table, callback);
    },
    
    getById  : function(req, callback){
        return exec.findById(req.id, '*', table , callback);
    },

    getByForeignkeyId  : function(req, callback){
        return exec.findByForeignkey({'form_id' : req.id}, '*', 'sort ASC', table , callback);
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