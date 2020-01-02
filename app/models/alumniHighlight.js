
let table = 'T_AlumniHighlight';
const utility = require('../../helpers/utility')
const exec = require('../../helpers/mssql_adapter') 
var stringInject = require('stringinject')

module.exports = {
    deleteData : function(req, callback){
        return exec.findByIdAndDelete(req.id, table, callback);
    },
    
    getById  : function(req, callback){
        return exec.findById(req.id, '*', table, callback);
    },

    getCountData  : function(req, callback){
        console.log({req});
        return exec.knex('T_AlumniHighlight as alumniHighlight')
        .count('alumniHighlight.id as count')
        .leftJoin('T_User as user', 'user.id', '=', 'alumniHighlight.user_id')
        .leftOuterJoin('AT_AlumniRecommend as alumniRecommend', function () {
            this
              .on('user.id', 'alumniRecommend.user_id')
              .andOn(function () {
                 this.on('alumniRecommend.month', '=', 'alumniHighlight.month');
                 this.on('alumniRecommend.year', 'alumniHighlight.year');
              });
        })
        .modify((qb)=>{
            console.log({req});
            if(utility.issetVal(req.keyword))
                qb.andWhere('name', 'LIKE', `%${req.keyword}%`)
            if(utility.issetVal(req.batch)){
                qb.andWhere('batch', 'LIKE', `%${req.batch}%`)
            }
            if(utility.issetVal(req.create_date)){
                let date = req.create_date.split('-').map(x=>{
                    return x.trim()
                })
                console.log({date});
                qb.whereBetween('alumniHighlight.create_date', date)
            }
            if(utility.issetVal(req.month))
                qb.andWhere('alumniHighlight.month','=', parseInt(req.month))
            if(utility.issetVal(req.year))
                qb.andWhere('alumniHighlight.year','=', parseInt(req.year))
        })
        .then(datas=>{
            callback(null, datas[0].count)
        }).catch(function(error) { 
            callback(error, null)
        });
    },


    getAll  : function(req, callback){
        return exec.knex('T_AlumniHighlight as alumniHighlight')
        .max('alumniHighlight.id as id')
        .max('user.id as user_id')
        .max('user.img as img')
        .max('user.name as name')
        .max('user.batch as batch')
        .max('user.publish as publish')
        .max('alumniHighlight.month as month')
        .max('alumniHighlight.year as year')
        .max('alumniHighlight.achievement as achievement')
        .max('alumniHighlight.create_date as create_date')
        .count('AlumniRecommend.recommender_id as count_recommendation')
        .leftJoin('T_User as user', 'user.id', '=', 'alumniHighlight.user_id')
        // .leftJoin('AT_AlumniRecommend as alumniRecommend', 'user.id', '=', 'alumniRecommend.user_id')
        .leftOuterJoin('AT_AlumniRecommend as alumniRecommend', function () {
            this
              .on('user.id', 'alumniRecommend.user_id')
              .andOn(function () {
                 this.on('alumniRecommend.month', '=', 'alumniHighlight.month');
                 this.on('alumniRecommend.year', 'alumniHighlight.year');
              });
        })
        .modify((qb)=>{
            console.log({req});
            if(utility.issetVal(req.keyword))
                qb.andWhere('name', 'LIKE', `%${req.keyword}%`)
            if(utility.issetVal(req.batch)){
                qb.andWhere('batch', 'LIKE', `%${req.batch}%`)
            }
            if(utility.issetVal(req.create_date)){
                let date = req.create_date.split('-').map(x=>{
                    return x.trim()
                })
                console.log({date});
                qb.whereBetween('alumniHighlight.create_date', date)
            }
            if(utility.issetVal(req.month))
                qb.andWhere('alumniHighlight.month','=', parseInt(req.month))
            if(utility.issetVal(req.year))
                qb.andWhere('alumniHighlight.year','=', parseInt(req.year))
        })
        .groupBy('alumniHighlight.user_id')
        .groupBy('alumniHighlight.month')
        .groupBy('alumniHighlight.year')
        .orderBy('year', 'desc')
        .orderBy('month', 'desc')
        .limit(req.limit)
        .offset(req.start)
        .then(datas=>{
            callback(null, datas)
        }).catch(function(error) { 
            callback(error, null)
        });
    },

    getHighlight: function(req, callback){
       
        return exec.knex(table).select('*')
            .where({'month': req.month, 'year': req.year})
            .first()
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
    }
}