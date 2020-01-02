
let table = 'T_Device';
const exec = require('../../helpers/mssql_adapter') 
var stringInject = require('stringinject')
const utility = require('../../helpers/utility')
let _ = require('lodash')


module.exports = {
    
    addData: function(req, callback){
        return exec.save(req, table, callback);
    },

    deleteData : function(req, callback){
        return exec.findOneAndDelete(req, table, callback);
    },

    getAll  : function(req, callback){
        console.log('Device.js --> getAll');
        return exec.knex(table)
        .select('token', 'type')
        .where('user_type', 'user')
        .groupBy('type','token')
        .then(datas => {
            console.log({datas : datas});
            let grouped = _.mapValues(
                            _.groupBy(datas, 'type'),
                            clist => clist.map((data)=> {
                                return data = data['token'];
                            })
                        );
            return grouped;
        })
        .then(datas => {
            console.log({datas : datas});
            callback(null, datas)
        }).catch(function(error){
            callback(error, null)
        });
    },

    getSpesificUser  : function(req, callback){
        console.log('getSpesificUser',req)
        return exec.knex(table)
        .select('token', 'type')
        .max('subject_id')
        .where('user_type', 'user')
        .where(function () {
            this
            .whereIn('subject_id', req)
        })
        .groupBy('type','token')
        .then(datas => {
            let grouped = _.mapValues(
                            _.groupBy(datas, 'type'),
                            clist => clist.map((data)=> {
                                return data = data['token'];
                            })
                        );
            return grouped;
        })
        .then(datas => {
            callback(null, datas)
        }).catch(function(error){
            callback(error, null)
        });
    },
}