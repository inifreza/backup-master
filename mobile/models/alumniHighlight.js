
let table = 'T_AlumniHighlight';
const exec = require('../../helpers/mssql_adapter') 
var stringInject = require('stringinject')
const utility = require('../../helpers/utility')

module.exports = {
    deleteData : function(req, callback){
        return exec.findByIdAndDelete(req.id, table, callback);
    },
    
    getById  : function(req, callback){
        // return exec.findById(req.id, '*', table, callback);

        let column = ['alumniHighlight.id'
                , 'user.id as user_id'
                , 'user.name'
                , 'user.email'
                , 'user.phone'
                , 'user.company'
                , 'user.position'
                , 'user.bio'
                , 'user.alumni'
                , 'user.dob'
                , 'user.gender'
                , 'user.img'
                , 'user.eula'
                , 'user.type'
                , 'user.batch'
                , 'user.verified'
                , 'user.publish'
                , 'alumniHighlight.achievement'
                , 'alumniHighlight.month'
                , 'alumniHighlight.year'];
        return exec.knex('T_AlumniHighlight as alumniHighlight')
        .select(column)
        .leftJoin('T_User as user', 'user.id', '=', 'alumniHighlight.user_id')
        .orderBy('alumniHighlight.create_date', 'desc')
        .where('alumniHighlight.id', req.id).first()
        .then(datas=>{
        callback(null, datas)
        }).catch(function(error) { 
        callback(error, null)
        });
    },

    getCountData  : function(req, callback){
        let param = utility.issetVal(req.year) ? {'alumniHiglight.year' : req.year} :  {};
        console.log(param);
        let column = ['user.*','alumniHighlight.month','alumniHighlight.year'];
        
        return exec.knex('T_AlumniHighlight as alumniHiglight')
        .select('*')
        .leftJoin('T_user as user', 'user.id', '=', 'alumniHiglight.user_id')
        .where(param)
        .then(datas=>{
            callback(null, datas.length)
        }).catch(function(error) { 
            callback(error, null)
        });
    },

    getAll  : function(req, callback){
        let param = utility.issetVal(req.year) ? {'alumniHiglight.year' : req.year} :  {};
        console.log(param);
        let column = [
            'alumniHiglight.id'
            , 'user.id as user_id'
            , 'user.name'
            , 'user.email'
            , 'user.phone'
            , 'user.company'
            , 'user.position'
            , 'user.bio'
            , 'user.type'
            , 'user.achievement'
            , 'user.alumni'
            , exec.knex.raw(`CASE WHEN type = 'pwc' AND  alumni = 'yes'
                THEN 'alumni'
                WHEN type = 'pwc' AND  alumni = 'no'
                THEN 'internal'
                ELSE 'external'
                END as type_alumni
            `)
            , exec.knex.raw(`CASE WHEN verified = '2'
                THEN 'Verified'
                WHEN verified = '1'
                THEN 'Unverified'
                WHEN verified = '3'
                THEN 'Reject'
                ELSE 'Invited'
                END as status
            `)
            , 'user.batch'
            , 'user.dob'
            , 'user.gender'
            , 'user.img'
            , 'user.eula'
            , 'user.eula_version'
            , 'user.eula_date'
            , 'user.publish'
            , 'user.join_date'
            , 'user.create_date'
            , 'user.resign_date'
            , 'user.lineservice_id'
            , 'alumniHiglight.month'
            , 'alumniHiglight.year'
        ];
        
        return exec.knex('T_AlumniHighlight as alumniHiglight')
        .select(column)
        .leftJoin('T_user as user', 'user.id', '=', 'alumniHiglight.user_id')
        .where(param)
        .orderBy('alumniHiglight.year', 'asc')
        .orderBy('alumniHiglight.month', 'asc')
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
    
    getHighlight  : function(req, callback){
        let column = [
            'user.id as user_id'
            , 'user.name'
            , 'user.email'
            , 'user.phone'
            , 'user.company'
            , 'user.position'
            , 'user.bio'
            , 'user.type'
            , 'user.achievement'
            , 'user.alumni'
            , 'user.batch'
            , 'user.dob'
            , 'user.gender'
            , 'user.img'
            , 'user.eula'
            , 'user.eula_version'
            , 'user.eula_date'
            , 'user.publish'
            , 'user.join_date'
            , 'user.create_date'
            , 'user.resign_date'
            , 'user.lineservice_id'
            , 'alumniHighlight.id'
            , 'alumniHighlight.month'
            , 'alumniHighlight.year'
            , 'lineservice.title as lineservice_title'];
        return exec.knex('T_AlumniHighlight as alumniHighlight')
        .select(column)
        .leftJoin('T_User as user', 'user.id', '=', 'alumniHighlight.user_id')
        .leftJoin('T_LineOfService as lineservice', 'lineservice.id', '=', 'user.lineservice_id')
        .where(req)
        .then(datas=>{
            callback(null, datas)
        }).catch(function(error) { 
            callback(error, null)
        });
    },
  

    updateData: function(req, callback){
        return exec.findByIdAndUpdate(req.id, req, table, callback);
    }
}