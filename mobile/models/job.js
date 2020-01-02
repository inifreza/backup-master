
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
            , 'job.url'
        ];
       
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

    getByLine : function(req, callback){
        console.log({req : req});
        return exec
        .knex('T_Job as job')
        .select('*')
        .where('job.lineservice_id', req.lineservice_id)
        .whereNot('job.id', req.job_id)
        .limit(5)
        .orderBy('job.id', 'desc')
        .then(datas=>{
            // console.log({datas});
            callback(null,datas)
        })
        .catch(error=>{
            console.log({error});
            callback(error, null)
        })
    },

    getCountData  : function(req, callback){
        let param = [];
        // c
        utility.issetVal(req.type)  ? param.type = req.type : null;
        utility.issetVal(req.title) ? param.title = req.title : null;
        console.log(param)
        // return exec.getCountData(param, table, callback);
        return exec.knex(table)
        .select('*')
        .where('type', req.type)
        .modify(function(queryBuilder) {
            if(utility.issetVal(req.title)){
                queryBuilder.andWhere('title', 'LIKE', "%"+req.title+"%")
                queryBuilder.orWhere('position', 'LIKE', "%"+req.title+"%");
            }
            if(utility.issetVal(req.lineservice_id)){
                queryBuilder.andWhere('lineservice_id','LIKE', `%${req.lineservice_id}%`)
            }
            if(utility.issetVal(req.grade)){
                queryBuilder.andWhere('position', 'LIKE', `%${req.grade}%`)
            }
            
        })
        .then(datas=>{
            callback(null, datas.length)
        }).catch(function(error) { 
            callback(error, null)
        });
    },

    getAll  : function(req, callback){
        let param = {};
        utility.issetVal(req.type)  ? param['job.type'] = req.type : null;
        utility.issetVal(req.title) ? param['job.title']= req.title : null;  
        // console.log(req)
        
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
      
        return exec.knex('T_Job as job')
            .select(column)
            .leftJoin('T_LineOfService as lineservice', 'job.lineservice_id', '=', 'lineservice.id')
            .where('type', req.type)    
            .modify(function(queryBuilder) {
                if(utility.issetVal(req.title)){
                    queryBuilder.andWhere('job.title', 'LIKE', "%"+req.title+"%")
                    queryBuilder.orWhere('job.position', 'LIKE', "%"+req.title+"%");
                }
                if(utility.issetVal(req.lineservice_id)){
                    queryBuilder.andWhere('job.lineservice_id','LIKE', `%${req.lineservice_id}%`)
                }
                if(utility.issetVal(req.grade)){
                    queryBuilder.andWhere('job.position', 'LIKE', `%${req.grade}%`)
                }
            })
            .orderBy('job.create_date', 'desc')
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