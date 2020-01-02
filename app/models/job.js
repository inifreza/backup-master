
let table = 'T_Job';
const exec = require('../../helpers/mssql_adapter') 
var stringInject = require('stringinject')
const utility = require('../../helpers/utility')

module.exports = {
    deleteData : function(req, callback){
        return exec.findByIdAndDelete(req.id, table, callback);
    },
    
    getById  : function(req, callback){
        let column = [
            'job.id'
            , 'job.title'
            , 'job.description'
            , 'job.start_date'
            , 'job.due_date'
            , exec.knex.raw(`CASE WHEN type = '1'
                THEN 'Graduate'
                ELSE 'Experienced Hires'
                END as type
            `)
            , 'job.img'
            , 'job.publish'
            , 'job.create_date'
            , 'job.lineservice_id'
            , 'lineservice.title as lineservice_title'
            , 'job.position as grade'
            , 'job.entity'
            , 'job.url'
        ];
        // exec.getAll({verified : req.verified}, column , req.start, req.limit, table, function(err,row) {
        //     console.log(row)
        
        // });
        return exec.knex('T_Job as job')
            .select(column)
            .leftJoin('T_LineOfService as lineservice', 'job.lineservice_id', '=', 'lineservice.id')
            .where({'job.id' : req.id})
            .then(datas=>{
                callback(null, datas[0])
            }).catch(function(error) { 
                callback(error, null)
            });
    },

    getCountData  : function(req, callback){
        return exec.knex('T_Job as job')
            // .select(column)
            .max('job.id as id')
            .max('job.title as job_title')
            .max('job.description as description')
            .max('job.start_date as start_date')
            .max('job.due_date as due_date')
            .max('job.img as img')
            .max('job.publish as publish')
            .max('job.create_date as create_date')
            .max('lineservice.title as lineservice_title')
            .max('job.position as grade')
            .count('jobRecommend.job_id as count_jobRecommend')
            .leftJoin('T_LineOfService as lineservice', 'job.lineservice_id', '=', 'lineservice.id')
            .leftJoin('AT_JobRecommend as jobRecommend', 'jobRecommend.job_id', '=', 'job.id')
            .modify(qb=> {
                if(utility.issetVal(req.keyword))
                    qb.andWhere('job.title', 'LIKE', `%${req.keyword}%`)
                if(utility.issetVal(req.lineOfService_list))
                    qb.whereIn('lineservice.id', req.lineOfService_list)
                if(utility.issetVal(req.level))
                    qb.andWhere('job.position', 'LIKE', `%${req.level}%`)

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
            .groupBy('job.id')
            // .orderBy('create_date', 'desc')
            .then(datas=>{
                callback(null, datas.length)
            }).catch(function(error) { 
                callback(error, null)
            });
    },

   getAll  : function(req, callback){
        let param = utility.issetVal(req.verified) ? {verified : req.verified} :  {};
        console.log({req : req});
        let column = [
            'job.id'
            , 'job.title'
            , 'job.description'
            , 'job.start_date'
            , 'job.due_date'
            , exec.knex.raw(`CASE WHEN type = '1'
                THEN 'Graduate'
                ELSE 'Experienced Hires'
                END as type
            `)
            , 'job.img'
            , 'job.publish'
            , 'job.create_date'
            , 'job.lineservice_id'
            , 'lineservice.title as lineservice_title'
            , 'job.position as grade'
        ];
        // exec.getAll({verified : req.verified}, column , req.start, req.limit, table, function(err,row) {
        //     console.log(row)
        
        // });
        return exec.knex('T_Job as job')
            // .select(column)
            .max('job.id as id')
            .max('job.title as job_title')
            .max('job.description as description')
            .max('job.start_date as start_date')
            .max('job.due_date as due_date')
            .max('job.img as img')
            .max('job.publish as publish')
            .max('job.create_date as create_date')
            .max('lineservice.title as lineservice_title')
            .max('job.position as grade')
            .count('jobRecommend.job_id as count_jobRecommend')
            .count('jobShare.job_id as count_jobShare')
            .leftJoin('T_LineOfService as lineservice', 'job.lineservice_id', '=', 'lineservice.id')
            .leftJoin('AT_JobRecommend as jobRecommend', 'jobRecommend.job_id', '=', 'job.id')
            .leftJoin('AT_JobShare as jobShare', 'jobShare.job_id', '=', 'job.id')
            .where(param).
            modify(qb=> {
                if(utility.issetVal(req.keyword))
                    qb.andWhere('job.title', 'LIKE', `%${req.keyword}%`)
                if(utility.issetVal(req.lineOfService_list))
                    qb.whereIn('lineservice.id', req.lineOfService_list)
                if(utility.issetVal(req.level))
                    qb.andWhere('job.position', 'LIKE', `%${req.level}%`)

                switch (req.sort) {
                    case '1':
                        qb.orderBy('count_jobRecommend', 'asc')
                        break;
                    case '2':
                        qb.orderBy('count_jobRecommend', 'desc')
                        break;
                    case '3':
                        qb.orderBy('count_jobShare', 'asc')
                        break;
                    case '4':
                        qb.orderBy('count_jobShare', 'desc')
                        break;
                    default:
                        qb.orderBy('create_date', 'desc')
                        break;
                }
            })
            .groupBy('job.id')
            // .orderBy('create_date', 'desc')
            .limit(req.limit)
            .offset(req.start)
            .then(datas=>{
                callback(null, datas)
            }).catch(function(error) { 
                callback(error, null)
            });
    },

    addData: function(req, callback){
        return exec.save(req, table, callback);
    },

    updateData: function(req, callback){
        return exec.findByIdAndUpdate(req.id, req, table, callback);
    },
    
    unpublish: function(req, callback){
        return exec.findNotIdAndUpdate(req.id, {publish : 0}, table, callback);
    }
    
}