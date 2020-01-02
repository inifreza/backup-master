// Knex Setup
var user = require('../models/user');
const post = require('../models/post')
const exec = require('../../helpers/mssql_adapter') 


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

    getAllByPost: function(req, callback){
        let param = utility.issetVal(req.post_id) ? {'post_id' : req.post_id} :  {};
       
        Model.find(param)
            .select()
            .exec(callback);
    },

    getCountData: function(req, callback){
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
                callback(null, datas.length)
            }).catch(function(error){ 
                callback(error, null)
            });
            
        })
    },

    getById: function(req, callback){
        //console.log(req.body.name);
        Model.findById(req.body.id).select().exec(callback);
    },


    getResponse: function(req, callback){
     
        Model.find(req)
            .select()
            .then(datas => {
                Promise.all(datas.map(data => {
                    console.log(data)
                    var result = {
                        id: data.id,
                        polling_id: data.polling_id,
                        post_id: data.post_id,
                        user_id: data.user_id,
                        create_date: data.createdAt,
                        modify_date: data.modify_date
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

    getCountIndividualAnswered : function(req, callback){
        Model
        .countDocuments(req, callback)
    },

    getIndividualAnswered : function (req, callback){
        console.log({req});
        Model
        .find({post_id : req.post_id})
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
                    create_date: data.createdAt,
                    modify_date: data.modify_date,
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
                
                let promiseRes = new Promise((resolve, reject)=> {
                    exec.knex('T_PostPolling')
                    .select('id', 'title', 'post_id', 'sort', 'create_date')
                    .where({post_id: result.post_id})
                    .orderBy('sort', 'asc')
                    .then(datas => {
                        resolve(datas)
                    })
                })

                return Promise.all([promiseUser, promiseRes])
                .then(arr => {
                    // console.log({'promiseRes': arr[1]});
                    // console.log({'promiseUser' : arr[0]});
                    if(arr[0]){    
                        result.user_id = arr[0].id;
                        result.user_name = arr[0].name;
                        result.user_email = arr[0].email;
                        result.user_phone = arr[0].phone;
                    }
                    if(utility.issetVal(arr[1])){
                        arr[1].forEach(el => {
                            if(result.post_id == el.post_id && result.polling_id == el.id){
                                result.answer = el.title
                            }
                        });
                    }
                    return result
                })
            }))
            .then(response => {
                datas = [];
                response.map(data => {
                    if(utility.issetVal(data)){
                        datas.push(data)
                    }
                })
                callback(null, datas)
                // resolve(datas)
            })
        })
    },

    getIndividual: function(req, callback){
        const body = {
            post_id : req.post_id
        }; 
        const orderBy = {
            create_date: 1 
        }

        let limit = 0;
        
        if(utility.issetVal(req.param)){
            if(req.param == 'prev'){
                body['create_date'] =  {
                    "$lt": req.create_date
                }
                orderBy.create_date = -1;
            } else {
                body['create_date'] =  {
                    "$gt": req.create_date
                }
                orderBy.create_date = 1;
            }
            limit = 2;
        }
        console.log('jiha',orderBy);
        Model.find(body)
            .select()
            .sort(orderBy)
            .limit(limit)
            .then(datas => {
                Promise.all(datas.map(data => {
                    console.log(data)
                    var result = {
                        id: data.id,
                        polling_id: data.polling_id,
                        post_id: data.post_id,
                        user_id: data.user_id,
                        create_date: data.create_date
                    }
                    // console.log(result);
                    let promiseUser = new Promise(function(resolve, reject) {
                        let users = {};
                        user.getById({id : result.user_id},function(errRes,resData) {
                            // console.log(errRes)
                            if(!errRes){
                                if(utility.issetVal(resData)){

                                    users.id = resData.id;
                                    users.name = resData.name;
                                    users.create_date = result.create_date;
                                    resolve(users)
                                } else {
                                    resolve()
                                }
                            }
                        });
                    })
                    return Promise.all([promiseUser]).then(arr => {
                        if(utility.issetVal(arr[0])){
                            data = arr[0]
                            return data
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


    getCurrentIndividual: function(req, callback){
        var param = {
			'post_id': req.post_id
		}
		if(req.user_id != ''){
			param['user_id'] = req.user_id
		}
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
                                
                            }
                        });
                    })
                    return Promise.all([promiseUser]).then(arr => {
                        user.id = arr[0].id;
                        user.name = arr[0].name;
                        user.email = arr[0].email;
                        user.company = arr[0].company;
                        user.position = arr[0].position;
                        user.gender = arr[0].gender;
                        user.create_date = arr[0].create_date;
                        //promise prev user
                        const prevUser = new Promise((resolve, reject) => {
                            const body = {
                                post_id : req.post_id,
                                create_date : data.create_date,
                                param : 'prev'
                            }
                            this.getIndividual(body,function(errRes,resData) {
                                console.log('dataP',resData);
                                console.log('errP',errRes)
                                if(!errRes){
                                    resolve(resData[0])
                                    
                                }
                            });
                        })
                        //promise next user
                        const nextUser = new Promise((resolve, reject) => {
                            const body = {
                                post_id : req.post_id,
                                create_date : data.create_date,
                                param : 'next'
                            }
                            this.getIndividual(body,function(errRes,resData) {
                                console.log('dataN',resData);
                                console.log('errN',errRes)
                                if(!errRes){
                                    resolve(resData[0])
                                    
                                }
                            });
                        })
                        //run promise all
                        return Promise.all([prevUser, nextUser]).then(resolve => {
                            user.prev_user = utility.issetVal(resolve[0]) ? resolve[0] : {}
                            user.next_user = utility.issetVal(resolve[1]) ? resolve[1] : {}
                            return  user;
                        })
                    })
                })).then(response => {
                    callback(null, response)
                }).catch(function(error){ 
                    callback(error, null)
                });
                
            })
    },

}
