let table = 'T_PostWeekly';
const exec = require('../../helpers/mssql_adapter') 
var stringInject = require('stringinject')
const utility = require('../../helpers/utility')

module.exports = {
    addData: function(req, callback){
        return exec.save(req, table, callback);
    },

    countGetAll: function(req, callback){
        return exec.knex(table + ' as weekly')
            .select('weekly.id', 'weekly.week', 'weekly.start_date', 'weekly.end_date', 'weekly.publish', 'weekly.create_date',
                exec.knex.raw(`
                (
                    SELECT COUNT(atweekly.post_id) 
                    FROM AT_PostWeekly atweekly 
                    LEFT JOIN T_Post post ON post.id=atweekly.post_id
                    WHERE post.id IS NOT NULL
                    AND atweekly.postweekly_id = weekly.id
                ) AS num_post
                `))
            .modify(qb=>{
                if(utility.issetVal(req.keyword))
                    qb.where('weekly.week', '=', req.keyword)
                if(utility.issetVal(req.year))
                    qb.whereRaw('YEAR(start_date) = ?',[req.year])
                if(utility.issetVal(req.month))
                    qb.whereRaw('MONTH(start_date) = ?', [req.month])
                if(utility.issetVal(req.create_date)){
                    let date = req.create_date.split('-').map(x=>{
                        return x.trim()
                    })
                    // console.log({date});
                    qb.whereBetween('weekly.create_date', date)
                }
            })
            .orderBy('weekly.week', 'DESC')
            .then(datas => {
                callback(null, datas.length)
            }).catch(function(error){ 
                callback(error, null)
            });
    },

     getAll: function(req, callback){
        return exec.knex(table + ' as weekly')
            .select('weekly.id', 'weekly.week', 'weekly.start_date', 'weekly.end_date', 'weekly.publish', 'weekly.create_date',
                exec.knex.raw(`
                (
                    SELECT COUNT(atweekly.post_id) 
                    FROM AT_PostWeekly atweekly 
                    LEFT JOIN T_Post post ON post.id=atweekly.post_id
                    WHERE post.id IS NOT NULL
                    AND atweekly.postweekly_id = weekly.id
                ) AS num_post
                `))
            .modify(qb=>{
                if(utility.issetVal(req.keyword))
                    qb.where('weekly.week', '=', req.keyword)
                if(utility.issetVal(req.year))
                    qb.whereRaw('YEAR(start_date) = ?',[req.year])
                if(utility.issetVal(req.month))
                    qb.whereRaw('MONTH(start_date) = ?', [req.month])
                if(utility.issetVal(req.create_date)){
                    let date = req.create_date.split('-').map(x=>{
                        return x.trim()
                    })
                    // console.log({date});
                    qb.whereBetween('weekly.create_date', date)
                }
            })
            .orderBy('weekly.week', 'DESC')
            .limit(req.limit)
            .offset(req.start)
            .then(datas => {
                callback(null, datas)
            }).catch(function(error){ 
                callback(error, null)
            });
    },

    getById: function(req, callback){
        return exec.findById(req.id, '*', table , callback);
    },

    updateData: function(req, callback){
        return exec.findByIdAndUpdate(req.id, req, table, callback);
    },
    
    deleteData : function(req, callback){
        return exec.findByIdAndDelete(req.id, table, callback);
    },

    findData : function(req, callback){
        return exec.find(req,'*',table, callback)
    },

    findOne : function(req, callback){
        return exec.findOne({week : req.week},'*',null,table, callback)
    },

    deleteOne : function(req, callback){
        return exec.findOneAndDelete(req, table, callback)
    }
}