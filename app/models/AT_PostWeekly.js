let table = 'AT_PostWeekly';
const exec = require('../../helpers/mssql_adapter') 
var stringInject = require('stringinject')
const utility = require('../../helpers/utility')
let moment = require('moment')

module.exports = {
    getPostByWeekly: function(req, callback){
        return exec.knex(table + ' as atpost')
            .select('post.id as id', 'post.content as content', 'atpost.sort', 'atpost.create_date')
            .leftJoin('T_Post as post', 'post.id', '=', 'atpost.post_id')
            .where({'atpost.postweekly_id': req.weekly_id})
            .orderBy('atpost.sort', 'ASC')
            .orderBy('atpost.create_date', 'desc')
            .then(datas => {
                callback(null, datas)
            }).catch(function(error){ 
                callback(error, null)
            });
    },

    countGetByWeekly: function(req, callback){
        return exec.knex(table+ ' as atpost')
            .count('post_id as id')
            .leftJoin('T_PostWeekly as postWeekly', 'postWeekly.id','=', 'atpost.postweekly_id')
            .leftJoin('T_Post as post', 'post.id','=', 'atpost.post_id')
            .whereNotNull('post.id')
            .where({'week': req.week})
            .then(datas => {
                callback(null, datas[0].id)
            }).catch(function(error){
                callback(error, null)
            });
    },

    getDataByWeekly: function(req, callback){
        // console.log(req)
        return exec.knex(table + ' as atpost')
            .select('post.id as id', 'post.content as content', 'atpost.sort', 'atpost.create_date', 'week', 'T_PostWeekly.id as weekly_id')
            .leftJoin('T_Post as post', 'post.id', '=', 'atpost.post_id')
            .leftJoin('T_PostWeekly', 'T_PostWeekly.id','=', 'atpost.postweekly_id')
            .whereNotNull('post.id')
            .where({'week': req.week})
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
                postweekly_id: req.id,
                post_id: x.post_id,
                sort: x.sort,
                create_date: moment(Date.now()).format('YYYY-MM-DD HH:mm:ss')
            };
        });
        return exec.save(data, table, callback);
    },

    deleteByWeekly: function(req, callback){
        
        return exec.findOneAndDelete(req, table, callback);
    },

    addSingle : function(req, callback){
        let body ={
            postWeekly_id : req.id,
            post_id : req.post,
            sort : 1,
            create_date: moment(Date.now()).format('YYYY-MM-DD HH:mm:ss')
        }
        return exec.save(body, table, callback)
    },
    delete: function(req, callback){
        return exec.findOneAndDelete(req, table, callback);
    }
}