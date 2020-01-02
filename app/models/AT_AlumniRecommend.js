
let table = 'AT_AlumniRecommend';
const utility = require('../../helpers/utility')
const exec = require('../../helpers/mssql_adapter') 
var stringInject = require('stringinject')

module.exports = {
    deleteData : function(req, callback){
        return exec.findByIdAndDelete(req.id, table, callback);
    },
    
    getById  : function(req, callback){
        return exec.findById(req.id, null, table, callback);
    },

    getCountData  : function(req, callback){
        let column = ['user.id'];
        let param  = {}
        if(req.month){
            param.month = req.month;
        }
        if(req.year){
            param.year = req.year;
        }
        return exec.knex('AT_AlumniRecommend as AlumniRecommend')
        .max('user.id as user_id')
        .max('user.img as img')
        .max('user.name as name')
        .max('user.batch as batch')
        .max('user.publish as publish')
        .max('AlumniRecommend.month as month')
        .max('AlumniRecommend.year as year')
        .max('AlumniRecommend.reason as reason')
        .max('AlumniRecommend.create_date AS create_date') 
        
        .count('AlumniRecommend.recommender_id as count_recommendation')
        .leftJoin('T_User as user', 'user.id', '=', 'AlumniRecommend.user_id')
        .leftJoin('T_User as recommender', 'recommender.id', '=', 'AlumniRecommend.recommender_id')
        .where(param)
        .modify((qb)=>{
            console.log({req});
            if(utility.issetVal(req.keyword))
                qb.andWhere('user.name', 'LIKE', `%${req.keyword}%`)
            if(utility.issetVal(req.batch)){
                qb.andWhere('user.batch', 'LIKE', `%${req.batch}%`)
            }
            if(utility.issetVal(req.create_date)){
                let date = req.create_date.split('-').map(x=>{
                    return x.trim()
                })
                console.log({date});
                qb.whereBetween('AlumniRecommend.create_date', date)
            }
            if(utility.issetVal(req.month))
                qb.andWhere('AlumniRecommend.month','LIKE', `%${parseInt(req.month)}%`)
            if(utility.issetVal(req.year))
                qb.andWhere('AlumniRecommend.year','LIKE', `%${req.year}%`)

            switch (req.sort) {
                case '1':
                    qb.orderBy('create_date', 'asc')
                    break;
                case '2':
                    qb.orderBy('create_date', 'desc')
                    break;
                case '3':
                    qb.orderBy('count_recommendation', 'asc')
                    break;
                case '4':
                    qb.orderBy('count_recommendation', 'desc')
                    break;
                default:
                    qb.orderBy('create_date', 'desc')
                    break;
            }
        })
        .groupBy('AlumniRecommend.user_id')
        .groupBy('AlumniRecommend.month')
        .groupBy('AlumniRecommend.year')
        .limit(req.limit)
        .offset(req.start)
        .then(datas=>{
            callback(null, datas.length)
        }).catch(function(error) { 
            callback(error, null)
        });
    },

    getAll  : function(req, callback){
        let column = ['user.id'];
        let param  = {}
        if(req.month){
            param.month = req.month;
        }
        if(req.year){
            param.year = req.year;
        }
        return exec.knex('AT_AlumniRecommend as AlumniRecommend')
        .max('user.id as user_id')
        .max('user.img as img')
        .max('user.name as name')
        .max('user.batch as batch')
        .max('user.publish as publish')
        .max('AlumniRecommend.month as month')
        .max('AlumniRecommend.year as year')
        .max('AlumniRecommend.reason as reason')
        .max('AlumniRecommend.create_date AS create_date') 
        
        .count('AlumniRecommend.recommender_id as count_recommendation')
        .leftJoin('T_User as user', 'user.id', '=', 'AlumniRecommend.user_id')
        .leftJoin('T_User as recommender', 'recommender.id', '=', 'AlumniRecommend.recommender_id')
        .where(param)
        .modify((qb)=>{
            console.log({req});
            if(utility.issetVal(req.keyword))
                qb.andWhere('user.name', 'LIKE', `%${req.keyword}%`)
            if(utility.issetVal(req.batch)){
                qb.andWhere('user.batch', 'LIKE', `%${req.batch}%`)
            }
            if(utility.issetVal(req.create_date)){
                let date = req.create_date.split('-').map(x=>{
                    return x.trim()
                })
                console.log({date});
                qb.whereBetween('AlumniRecommend.create_date', date)
            }
            if(utility.issetVal(req.month))
                qb.andWhere('AlumniRecommend.month','LIKE', `%${parseInt(req.month)}%`)
            if(utility.issetVal(req.year))
                qb.andWhere('AlumniRecommend.year','LIKE', `%${req.year}%`)

            switch (req.sort) {
                case '1':
                    qb.orderBy('create_date', 'asc')
                    break;
                case '2':
                    qb.orderBy('create_date', 'desc')
                    break;
                case '3':
                    qb.orderBy('count_recommendation', 'asc')
                    break;
                case '4':
                    qb.orderBy('count_recommendation', 'desc')
                    break;
                default:
                    qb.orderBy('create_date', 'desc')
                    break;
            }
        })
        .groupBy('AlumniRecommend.user_id')
        .groupBy('AlumniRecommend.month')
        .groupBy('AlumniRecommend.year')
        .limit(req.limit)
        .offset(req.start)
        .then(datas=>{
            callback(null, datas)
        }).catch(function(error) { 
            callback(error, null)
        });
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

    getSelectUser  : function(req, callback){
        console.log({'Req GetSelectUser' : req});
        let column = ['user.id'];

        return exec.knex('T_User as user')
        // .select(column)
        .max('user.id as id')
        .max('user.img as img')
        .max('user.name as name')
        .max('user.batch as batch')
        .max('user.publish as publish')
        .max('AlumniRecommend.month as month')
        .max('AlumniRecommend.year as year')
        .max('AlumniRecommend.reason as reason')
        .max('AlumniRecommend.create_date AS create_date')
        .select(exec.knex.raw(`(SELECT count(user_id) FROM AT_AlumniRecommend WHERE user_id = max(AlumniRecommend.user_id)  and  month = ${req.month} and  year = ${req.year}) AS count_recommendation`))
        .leftJoin('AT_AlumniRecommend as AlumniRecommend', 'user.id', '=', 'AlumniRecommend.user_id')
        .leftJoin('T_User as recommender', 'recommender.id', '=', 'AlumniRecommend.recommender_id')
        .where('user.verified', '2')
        .groupBy('user.id')
        .orderBy("count_recommendation", 'DESC')
        .orderBy('name', 'ASC')
        .then(datas=>{
            callback(null, datas)
        }).catch(function(error) { 
            callback(error, null)
        });
    },

    getDetail  : function(req, callback){
        let param  = {
            'user_id' : req.id
            , 'month' : req.month
            , 'year' : req.year
        }
        let column = ['AlumniRecommend.*'
                    , 'user.name as username'
                    , 'recommender.name as recommender_name'];
        return exec.knex('AT_AlumniRecommend as AlumniRecommend')
        .select(column)
        .leftJoin('T_User as user', 'user.id', '=', 'AlumniRecommend.user_id')
        .leftJoin('T_User as recommender', 'recommender.id', '=', 'AlumniRecommend.recommender_id')
        .where(param)
        .orderBy('create_date', 'desc')
        .then(datas=>{
            callback(null, datas)
        }).catch(function(error) { 
            callback(error, null)
        });
    },
}