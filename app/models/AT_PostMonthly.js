let table = 'AT_PostMonthly';
const exec = require('../../helpers/mssql_adapter') 
var stringInject = require('stringinject')
const utility = require('../../helpers/utility')
let moment = require('moment')

module.exports = {
    getPostByMonthly: function(req, callback){
        return exec.knex(table + ' as atpost')
            .select('post.id as id', 'post.content as content', 'atpost.sort', 'atpost.create_date')
            .leftJoin('T_Post as post', 'post.id', '=', 'atpost.post_id')
            .where({'atpost.postmonthly_id': req.monthly_id})
            .orderBy('atpost.sort', 'ASC')
            .orderBy('atpost.create_date', 'desc')
            .then(datas => {
                callback(null, datas)
            }).catch(function(error){ 
                callback(error, null)
            });
    },

    countGetByMonthly: function(req, callback){
        
        console.log(req)
        return exec.knex(table + ' as atpost')
            .count('year as id')
            .leftJoin('T_Post as post', 'post.id', '=', 'atpost.post_id')
            .leftJoin('T_PostMonthly', 'T_PostMonthly.id', '=', 'atpost.postmonthly_id')
            .where({'year': req.year, 'month' : req.month})
            
            .then(datas => {
                callback(null, datas[0].id)
            }).catch(function(error){ 
                callback(error, null)
            });
    },

    getDataByMonthly: function(req, callback){
        return exec.knex(table + ' as atpost')
        .select('post.id as id', 'post.content as content', 'atpost.sort', 'atpost.create_date', 'T_PostMonthly.year', 'T_PostMonthly.month', 'T_PostMonthly.id as monthly_id' )
        .leftJoin('T_Post as post', 'post.id', '=', 'atpost.post_id')
        .leftJoin('T_PostMonthly', 'T_PostMonthly.id', '=', 'atpost.postmonthly_id')
        .where({'year': req.year, 'month' : req.month})
        .orderBy('atpost.sort', 'ASC')
        .orderBy('atpost.create_date', 'desc')
        .limit(req.limit)
        .offset(req.start)
        .then(datas => {
            callback(null, datas)
        }).catch(function(error){ 
            callback(error, null)
        });
    },

    addMultiple: function(req, callback){
        var array_data = JSON.parse(req.post);
        const data = array_data.map(x => {
            return {
                postmonthly_id: req.id,
                post_id: x.post_id,
                sort: x.sort,
                create_date: moment(Date.now()).format('YYYY-MM-DD HH:mm:ss')
            };
        });
        return exec.save(data, table, callback);
    },

    addSingle : function(req, callback){
        let body = {
            postmonthly_id  : req.id,
            post_id         : req.post,
            sort            : 1,
            create_date     : moment(Date.now()).format('YYYY-MM-DD HH:mm:ss')
        }    
        return exec.save(body, table, callback)
    },

    deleteByMonthly: function(req, callback){
        return exec.findOneAndDelete({'postmonthly_id' : req.id}, table, callback);
    },

    deleteData : function(req, callback){
        return exec.findOneAndDelete(req, table, callback);
    }
}