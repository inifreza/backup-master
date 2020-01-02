
let table = 'AT_NewsInterest';
const exec = require('../../helpers/mssql_adapter') 
var stringInject = require('stringinject')
const utility = require('../../helpers/utility')
const moment = require('moment')

module.exports = {
    deleteData : function(req, callback){
        return exec.findByIdAndDelete(req.id, table, callback);
    },

    deleteByPostId : function(req, callback){
        return exec.findOneAndDelete({'news_id' : req.id}, table, callback);
    },
    
    getById  : function(req, callback){
        return exec.findById(req.id, '*', table , callback);
    },

    getByPostId  : function(req, callback){
        return exec.findOne({'news_id' : req.id}, '*', null, table , callback);
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

    deleteByNewsId : function(req, callback){
        return exec.findOneAndDelete(req, table, callback);
    },

    updateData: function(req, callback){
        return exec.findByIdAndUpdate(req.id, req, table, callback);
    },

    checkFeatured: function(req, callback){
        return exec.getCountData({featured: '1'}, table, callback);
    },

    getData  : function(req, callback){
        return exec.knex('AT_NewsInterest as newsInterest')
        .select('newsInterest.interest_id', 'newsInterest.news_id', 'interest.title as interest_title')
        .leftJoin('T_Interest as interest', 'interest.id', '=', 'newsInterest.interest_id')
        .then(datas=>{
            callback(null, datas)
        }).catch(function(error) { 
            callback(error, null)
        });
    },

    addMultiple : function(req, callback){
        console.log({'req AddMultiple' : req});
        let datas = []
        req.IdInterests.forEach(interest_id => {
            datas.push({
                news_id     : req.id,
                interest_id : interest_id,
                create_date : moment(Date.now()).format('YYYY-MM-DD HH:mm:ss')
            })
        });
        // console.log({datas : datas});
        return exec.save(datas, table, callback);
    }
    
}