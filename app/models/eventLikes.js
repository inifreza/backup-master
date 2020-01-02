let mongoose = require('mongoose');
let Schema = mongoose.Schema;
var Model = require('../../data/schema_eventLikes');

const utility = require('../../helpers/utility')


// Knex Setup 
const exec = require('../../helpers/mssql_adapter') 


module.exports = {
    addData: function(req, callback){
        let newData = new Model(req);
        newData.save(callback);
    },

    deleteData: function(param, callback){
        Model.findByIdAndDelete(param.id, callback);
    },

    updateData: function(param, callback){
        Model.findByIdAndUpdate(param.id, param, callback);
    },

    getAll: function(req, callback){
        Model.find({'event_id' : req.event_id})
            .select()
            .skip(req.start)
            .limit(req.limit)
            .exec(callback);
    },

    getAllByEvent: function(req, callback){
        let param = utility.issetVal(req.event_id) ? {'event_id' : req.event_id} :  {};
        
        Model.find(param)
            .select()
            .exec(callback);
    },

    getCountData: function(req, callback){
        Model.countDocuments(req, callback);
    },

    getById: function(req, callback){
        //console.log(req.body.name);
        Model.findById(req.body.id).select().exec(callback);
    },

    getCountByUser: function(req, callback){
        Model.find({'user_id' : req.user_id})
        .select()
        .then(datas => {
            Promise.all(datas.map(data => {
                var result = {
                    id: data.id,
                    event_id: data.event_id,
                    user_id: data.user_id,
                    create_date: data.create_date
                }


                let promiseEvent = new Promise(function(resolve, reject) {
                    exec.findById(result.event_id, '*', 'T_Event' , (err, resData) =>{
                        console.log('err1', err)
                        console.log('res1', resData)
                        if(!err){
                            resolve(resData)   
                        } else {
                            reject();
                        }
                    });
                })

             
                return Promise.all([promiseEvent])
                .then(([event]) =>{
                    console.log(event)
                    if(utility.issetVal(event)){    
                        result.title = event.title;
                        return result
                    }
                    
                })
            })).then(response => {
                datas = [];
                response.map(data => {
                    if(utility.issetVal(data)){
                        datas.push(data)
                    }
                })
                callback(null, datas.length)
            }).catch(function(error){ 
                callback(error, null)
            });
            
        })
    },

    getAllByUser: function(req, callback){
        Model.find({'user_id' : req.user_id})
        .select()
        .sort({create_date : -1})
        .skip(req.start)
        .limit(req.limit)
        .then(datas => {
            Promise.all(datas.map(data => {
                var result = {
                    id: data.id,
                    event_id: data.event_id,
                    user_id: data.user_id,
                    create_date: data.create_date
                }


                let promiseEvent = new Promise(function(resolve, reject) {
                    exec.findById(result.event_id, '*', 'T_Event' , (err, resData) =>{
                        if(!err){
                            resolve(resData)   
                        } else {
                            reject();
                        }
                    });
                })

                return Promise.all([promiseEvent])
                .then(([event]) =>{
                    // console.log('data', arr[0] )
                    if(utility.issetVal(event)){    
                        result.title = event.title;

                        return result
                    }
                })
            })).then(response => {
                datas = [];
                response.map(data => {
                    if(utility.issetVal(data)){
                        datas.push(data)
                    }
                })
                callback(null, datas)
            }).catch(function(error){ 
                callback(error, null)
            });
            
        })
    },
}
