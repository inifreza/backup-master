let table = 'AT_FormAnswer';
const exec = require('../../helpers/mssql_adapter') 
var stringInject = require('stringinject')
const utility = require('../../helpers/utility')
let moment = require('moment')

module.exports = {
    deleteByCode: function(req, callback){
        return exec.knex(table).where('form_code', req.code).del()
            .then(datas => {
                callback(null, datas)
            }).catch(function(error){ 
                callback(error, null)
            });
    },

    addMultiple: function(req, callback){
        var datas = []
        var array_data = JSON.parse(req.answers)
        array_data.forEach(function(data) {
            if(data.type != 'checkbox'){
                datas.push({
                    id: utility.generateHash(32),
                    form_code: req.id,
                    form_id: req.form_id,
                    question_id: data.question,
                    answer: data.answer,
                    create_date: moment(Date.now()).format('YYYY-MM-DD HH:mm:ss')
                })
            }else{
                var answer = data.answer
                var answers = answer.split(';')
                answers.forEach(function(data_answer) {
                    datas.push({
                        id: utility.generateHash(32),
                        form_code: req.id,
                        form_id: req.form_id,
                        question_id: data.question,
                        answer: data_answer,
                        create_date: moment(Date.now()).format('YYYY-MM-DD HH:mm:ss')
                    })
                })
            }
        })
        return exec.save(datas, table, callback);
    }
}