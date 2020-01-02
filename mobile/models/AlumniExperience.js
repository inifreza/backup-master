const table = 'AT_AlumniExperience'
const exec = require('../../helpers/mssql_adapter')
const utility = require('../../helpers/utility')

module.exports = {

    addData: function (req, callback) {
        return exec.save(req, table, callback);
    },

    deleteData: function (req, callback) {
        return exec.findByIdAndDelete(req.id, table, callback);
    },

    getCountData  : function(req, callback){
        console.log({req});
        return exec.knex(table)
        .select('*')
        .modify(function(queryBuilder) {
            if(utility.issetVal(req.title)){
                queryBuilder.where('position', 'LIKE', "%"+req.title+"%");
                queryBuilder.orWhere('company', 'LIKE', "%"+req.title+"%")
            } 
            if(utility.issetVal(req.bySearch)){
                queryBuilder.where(req.column, '=', req.bySearch)
            }
        })
        .then(datas=>{
            callback(null, datas.length)
        }).catch(function(error) { 
            callback(error, null)
        });
    },

    getAll  : function(req, callback){
   
        let column = [
            '*'
        ];
        return exec.knex('AT_AlumniExperience')
            .select(column)
            .modify(function(queryBuilder) {
                if(utility.issetVal(req.title)){
                    queryBuilder.where('position', 'LIKE', "%"+req.title+"%");
                    queryBuilder.orWhere('company', 'LIKE', "%"+req.title+"%")
                } 
            })
            .orderBy('create_date', 'desc')
            .limit(req.limit)
            .offset(req.start)
            .then(datas=>{
                callback(null, datas)
            }).catch(function(error) { 
                console.log({error})
                callback(error, null)
            });
    },

    getByAlumni : function(req, callback){
        // console.log({req});
        let column = [
            '*'
        ];
        return exec.knex('AT_AlumniExperience')
            .select(column)
            .modify(function(queryBuilder) {
                if(utility.issetVal(req.title)){
                    queryBuilder.where('position', 'LIKE', "%"+req.title+"%");
                    queryBuilder.orWhere('company', 'LIKE', "%"+req.title+"%")
                } else {
                    queryBuilder.where('user_id', '=', req.alumni_id)
                }
            })
            .orderBy('present', 'desc')
            .limit(req.limit)
            .offset(req.start)
            .then(datas=>{
                callback(null, datas)
            }).catch(function(error) { 
                console.log({error})
                callback(error, null)
            });
    },

    getById : function(req, callback){
        let column = [
        '*'
        ]
        return exec.findById(req.id,column, table, callback)
    },
    
    updateData: function(req, callback){
        console.log(req)
        return exec.findByIdAndUpdate(req.id, req, table, callback);
    }
}