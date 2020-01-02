// Knex Setup
var user = require('../models/user');

// Mongo Setup
let mongoose = require('mongoose');
let Schema = mongoose.Schema;
var Model = require('../../data/schema_pollingResponse');

// Utility Setup
const utility = require('../../helpers/utility')


module.exports = {
    addData: function(req, callback){
        let newData = new Model(req);
        newData.save(callback);
    },

    deleteData: function(param, callback){
        console.log(param);
        Model.findOneAndDelete({'post_id' : param.post_id, 'user_id' : param.user_id}, callback);
    },

    updateData: function(param, callback){
        Model.findByIdAndUpdate(param.id, param, callback);
    },

    getAll: function(req, callback){
        Model.find({'post_id' : req.id})
            .select()
            .skip(req.start)
            .limit(req.limit)
            .then(datas => {
                Promise.all(datas.map(data => {
                    var result = {
                        id: data.id,
                        polling_id: data.polling_id,
                        post_id: data.post_id,
                        user_id: data.user_id,
                        create_date: data.create_date
                    }
                    // console.log(result);
                    let promiseUser = new Promise(function(resolve, reject) {
                        user.getById({id : result.user_id},function(errRes,resData) {
                            if(!errRes){
                                resolve(resData)
                                
                            }
                        });
                    })
                    return Promise.all([promiseUser]).then(arr => {
                        result.user_id = arr[0].id;
                        result.user_name = arr[0].name;
                        result.user_email = arr[0].email;
                        result.user_phone = arr[0].phone;
                        return result
                    })
                })).then(response => {
                    callback(null, response)
                }).catch(function(error){ 
                    callback(error, null)
                });
                
            })
    },

    getAllByPost: function(req, callback){
        let param = utility.issetVal(req.post_id) ? {'post_id' : req.post_id} :  {};
       
        Model.find(param)
            .select()
            .exec(callback);
    },

    getCountData: function(req, callback){
        // Model.countDocuments({'post_id' : req.id}, callback);
        Model.find({'post_id' : req.id})
        .select()
        .then(datas => {
            Promise.all(datas.map(data => {
                var result = {
                    id: data.id,
                    polling_id: data.polling_id,
                    post_id: data.post_id,
                    user_id: data.user_id,
                    create_date: data.create_date
                }
                // console.log(result);
                let promiseUser = new Promise(function(resolve, reject) {
                    user.getById({id : result.user_id},function(errRes,resData) {
                        if(!errRes){
                            resolve(resData)   
                        } else {
                            reject();
                        }
                    });
                })
                return Promise.all([promiseUser])
                .then(arr => {
                    if(arr[0]){    
                        result.user_id = arr[0].id;
                        result.user_name = arr[0].name;
                        result.user_email = arr[0].email;
                        result.user_phone = arr[0].phone;
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

    getById: function(req, callback){
        //console.log(req.body.name);
        Model.findById(req.body.id).select().exec(callback);
    },

    getOne: function(req, callback){
        //console.log(req.body.name);
        Model.findOne(req).select().exec(callback);
    },

    getResponse: function(req, callback){
     
        Model.find(req)
            .select()
            .then(datas => {
                Promise.all(datas.map(data => {
                    var result = {
                        id: data.id,
                        polling_id: data.polling_id,
                        post_id: data.post_id,
                        user_id: data.user_id,
                        create_date: data.create_date
                    }
                    // console.log(result);
                    let promiseUser = new Promise(function(resolve, reject) {
                        user.getById({id : result.user_id},function(errRes,resData) {
                            if(!errRes){
                                resolve(resData)  
                            } else {
                                resolve()
                            }
                        });
                    })
                    return Promise.all([promiseUser])
                    .then(arr => {
                        if(arr[0]){    
                            result.user_id = arr[0].id;
                            result.user_name = arr[0].name;
                            result.user_email = arr[0].email;
                            result.user_phone = arr[0].phone;
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
