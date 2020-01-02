let table = 'T_PostMonthly';
const exec = require('../../helpers/mssql_adapter') 
var stringInject = require('stringinject')
const utility = require('../../helpers/utility')

module.exports = {
    addData: function(req, callback){
        return exec.save(req, table, callback);
    },

    countGetAll: function(req, callback){
        // return exec.getCountData(null, table, callback);
        // console.log({req});
        return exec.knex(table + ' as monthly')
            .count('monthly.id as count')
            .modify(qb=>{
                if(utility.issetVal(req.year))
                    qb.andWhere('year', 'LIKE', `${req.year}`)
                if(utility.issetVal(req.month))
                    qb.andWhere('month', 'LIKE', `${req.month}`)
                if(utility.issetVal(req.create_date)){
                    let date = req.create_date.split('-').map(x=>{
                        return x.trim()
                    })
                    // console.log({date});
                    qb.whereBetween('monthly.create_date', date)
                }
            })
            .then(datas => {
                // console.log({datas});
                callback(null, datas[0].count)
            }).catch(function(error){ 
                console.log({error});
                callback(error, null)
            });
    },

    getAll: function(req, callback){
        // console.log({req});
        return exec.knex(table + ' as monthly')
            .select('monthly.id', 'monthly.year', 'monthly.month', 'monthly.start_date', 'monthly.end_date', 'monthly.publish', 'monthly.create_date',
                exec.knex.raw(`(SELECT COUNT(atmonthly.post_id) FROM AT_PostMonthly atmonthly WHERE atmonthly.postmonthly_id = monthly.id) AS num_post`))
            .modify(qb=>{
                if(utility.issetVal(req.year))
                    qb.andWhere('year', 'LIKE', `${req.year}`)
                if(utility.issetVal(req.month))
                    qb.andWhere('month', 'LIKE', `${req.month}`)
                if(utility.issetVal(req.create_date)){
                    let date = req.create_date.split('-').map(x=>{
                        return x.trim()
                    })
                    // console.log({date});
                    qb.whereBetween('monthly.create_date', date)
                }
            })
            .orderBy('monthly.year', 'DESC')
            .orderBy('monthly.month', 'DESC')
            .orderBy('monthly.create_date', 'DESC')
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

    findOne : function(req, callback){
        return exec.findOne(req,null, null, table, callback)
    },

    checkMonth : function(req, callback){
        console.log({'req check' : req});
        return exec
        .knex(table)
        .select('*')
        .modify(qb=>{
            if(utility.issetVal(req.year))
                qb.andWhere('year', '=', `${req.year}`)
            if(utility.issetVal(req.month))
                qb.andWhere('month', '=', `${req.month}`)
        })
        .then(datas=>{
            console.log({datas});
            callback(null, datas)
        })
        .catch(error => {
            callback(error, null)
        })
    }
}