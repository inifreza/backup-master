
let table = 'T_Post';
const exec = require('../../helpers/mssql_adapter') 
var stringInject = require('stringinject')
const utility = require('../../helpers/utility')
let _ = require('lodash');

var Model = require('../../data/schema_postLikes');
var user = require('../models/user')

// setting immage 
const globals = require('../../configs/global')
const {
  config
} = require('../../default')
let url = globals[config.environment];

// Additional Model 
const postLike = require('../models/postLikes')
const postComment = require('../models/postComments')
const postResponse = require('../models/mPollingResponse')
const postPolling = require('../models/postPolling')
const postImages = require('../models/postImages')
const forbiddenWord = require('../models/forbiddenWord')

module.exports = {
    deleteData : function(req, callback){
        console.log(req)
        return exec.findByIdAndUpdate(req.id, {removed : 1}, table, callback);
    },
    
    getById  : function(req, callback){
        return exec.knex(table + ' as post').select('post.*', 'user.name as user_name' ,'user.img')
        .where('post.id', req.id)
        .where('post.removed', '0')
        .first()
        .leftJoin('T_User as user', 'user.id', '=', 'post.user_id')
        .then(response=>{
   
            let promiseComment = new Promise(function( resolve, reject){
                postComment.getCountData({post_id : req.id}, function(errCount, resCount){
                    if(!utility.issetVal(errCount)){
                        resolve(resCount)
                    } else {
                        resolve(resCount)
                    }
                })
            })

            let promiseLike = new Promise(function( resolve, reject){
                postLike.getCountData({post_id : req.id}, function(errCount, resCount){
                    if(!utility.issetVal(errCount)){
                        resolve(resCount)
                    } else {
                        resolve(resCount)
                    }
                })
            })

            let promisePolling = new Promise(function(resolve, reject) {
                postPolling.getByPostId({post_id : req.id}, (errRes,resPolling) => {
                    if(!errRes){
                        if(utility.issetVal(resPolling)){
                            // console.log(resPolling);
                            resolve(resPolling);
                        } else {
                          resolve();
                        }
                    } else {
                      resolve();
                    }
                });
              });

            let promiseParticipant = new Promise(function( resolve, reject){
                postResponse.getCountData({id : req.id}, function(errCount, resCount){
                    if(!utility.issetVal(errCount)){
                        resolve(resCount)
                    } else {
                        resolve(resCount)
                    }
                })
            })


            let promiseUserLike = new Promise(function(resolve, reject){
                postLike.getData({post_id : req.id,  user_id : req.user_id}, function(errLike,resLike ){               
                    if(!utility.issetVal(errLike)){
                        // console.log(req);
                        if(utility.issetVal(resLike)){
                            resolve(1)
                        } else {
                            resolve(0)
                        }
                        // console.log(resData);
                    } else {
                        resolve(0)
                    }
                })
            })
            

              
            let promisePostImages = new Promise(function(resolve, reject){
                postImages.getData({id : req.id}, function(err,res ){       
                    console.log('err',err); 
                    console.log('res',err); 
                    console.log('id',response.id);        
                    if(!utility.issetVal(err)){
                        // console.log(req);
                        if(utility.issetVal(res)){
                            resolve(res)
                        } else {
                            resolve()
                        }
                        // console.log(resData);
                    } else {
                        resolve()
                    }
                })
            })
         
         

            return Promise.all([promiseComment, promiseLike, promisePolling, promiseParticipant, promiseUserLike, promisePostImages])
            .then(([comment, like,  polling, participant, userLike, postImages]) =>{
                response.comment = comment
                response.like = like
                response.liked = userLike;

                if(!utility.issetVal(response.user_id)){
                    response.username = 'Pwc Admin';
                    if(!utility.issetVal(response.img)){
                        response.img = null;
                    }
                } else {
                    response.username = response.username;
                    if(utility.issetVal(response.img)){                        
                        response.img = url.url_img+'user/'+response.img;
                    } else {
                        response.img = null;
                    }
                }

                if(utility.issetVal(postImages)){
                    let postImg = []
                    let arrayImg = {}
                    postImages.map(resImages => {
                        arrayImg = resImages
                        arrayImg.img = url.url_img+'post/'+arrayImg.img;
                    })
                    postImg.push(arrayImg);
                    response.images = postImg
                } else {
                    response.images = null
                }
                
                

                if(response.type == 'polling') {
                    console.log('asd', participant);
                    console.log('user', req.user_id);
                    
                    
                    const filterVoted = _.filter(participant, o => o.user_id === req.user_id);
                    utility.issetVal(filterVoted) ? 
                        response.voted = 1 
                        : response.voted = 0;
                    
                    response.participant = participant.length
                    if(utility.issetVal(polling)){
                        return Promise.all(polling.map(resMap => {
                            resMap.voted = 0;
                            if(utility.issetVal(filterVoted[0])){
                                if(filterVoted[0].polling_id===resMap.id){
                                    resMap.voted = 1;
                                } 
                                
                            }
                            let promiseResponse = new Promise(function(resolve, reject) {
                                const body = {
                                    post_id : resMap.post_id,
                                    polling_id : resMap.id
                                }
                                // console.log(body);
                                postResponse.getResponse(body,function(errRes,resData) {
                                    // console.log(errRes);
                                    if(!errRes){
                                        resolve(resData)
                                    }
                                });
                            })
                            
                            return Promise.all([promiseResponse]).then(arr => {
                                if(utility.issetVal(arr[0])){
                                    resMap.answer = arr[0].length
                                    let persentase = (arr[0].length/participant.length)*100;
                                    resMap.persentase = `${Math.round(persentase)}%`; 
                                } else {
                                    resMap.answer = 0
                                    let persentase = 0;
                                    resMap.persentase = `${Math.round(persentase)}%`; 
                                }
                                return resMap
                            })
                            
                        })).then(resData => {
                            // console.log('ress', resData);
                            response.polling = resData
                            return response; 
                        }).catch(function(error){ 
                            callback(error, null)
                        });
                    }else {
                        return response
                    }

                } else {
                    return response
                }
            })
        }).then(response=>{
            let result = response;
            
            return response;
        }).then(response=>{ 
            return exec.knex('AT_PostInterest as postInterest')
            .select('postInterest.interest_id', 'postInterest.post_id', 'interest.title as interest_title')
            .leftJoin('T_Interest as interest', 'interest.id', '=', 'postInterest.interest_id')
            .where('postInterest.post_id', req.id)
            .then(datas=>{
                if(utility.issetVal(datas)){
                    response.interest = datas 
                }
                return response;
            })
        }).then(response=>{  
            callback(null, response)
        }).catch(function(error) { 
            callback(error, null)
        });
    },

    getCountData  : function(req, callback){

        return exec.knex(table)
        .count('id as id')
        .where({'publish' : '1', 'removed' : 0})
        .modify(function(queryBuilder) {
            if(utility.issetVal(req.content)){
                queryBuilder.where('content', 'LIKE', "%"+req.content+"%")
            }
        })
        .then(datas=>{
            callback(null, datas[0].id)
        }).catch(function(error) { 
            callback(error, null)
        });
    },

    getAll  : function(req, callback){
        let sortArray = [];
        
        if(req.sort == "popular"){
            sortArray.push({'field' :'popular', 'direction': 'ASC'})
        } else if(req.sort == "weekly"){
            sortArray.push({'field' :'weekly', 'direction': 'ASC'})
        } else if(req.sort == "monthly"){
            sortArray.push({'field' :'monthly', 'direction': 'ASC'})
        } else {
            sortArray.push({'field' :'post.create_date', 'direction': 'DESC'})
        }

        let column = [
                'post.*'
                , 'user.name as username'
                , 'user.img as img'
            ];
        return exec.knex('T_Post as post')
        .select(column)
        .select(exec.knex.raw(`
                (SELECT 
                    COUNT(at_postmonthly.postmonthly_id) 
                FROM AT_PostMonthly at_postmonthly 
                LEFT JOIN T_PostMonthly postMonthly on postMonthly.id = at_postmonthly.postmonthly_id
                WHERE at_postmonthly.post_id = post.id
                AND postMonthly.month = ${req.month}
                AND postMonthly.year = ${req.year}) 
            AS count_monthly`))
        .leftJoin('T_User as user', 'post.user_id', '=', 'user.id')
        .where({'post.publish' : '1', 'post.removed' : 0})
        .modify(function(queryBuilder) {
            if(utility.issetVal(req.content)){
                queryBuilder.where('post.content', 'LIKE', "%"+req.content+"%")
            }
            _.each(sortArray, function(sort) {
                queryBuilder.orderBy(sort.field, sort.direction);
            });
        })
        // .orderBy('post.featured', 'DESC')
        // .orderBy('post.create_date', 'desc')
        
        .limit(req.limit)
        .offset(req.start)
        .then(datas=>{
            return Promise.all(datas.map(data => {
                let promiseComment = new Promise(function( resolve, reject){
                    postComment.getCountData({post_id : data.id}, function(errCount, resCount){
                        if(!utility.issetVal(errCount)){
                            resolve(resCount)
                        } else {
                            resolve(resCount)
                        }
                    })
                })
    
                let promiseLike = new Promise(function( resolve, reject){
                    postLike.getCountData({post_id : data.id}, function(errCount, resCount){
                        if(!utility.issetVal(errCount)){
                            resolve(resCount)
                        } else {
                            resolve(resCount)
                        }
                    })
                })

                let promisePolling = new Promise(function(resolve, reject) {
                    postPolling.getByPostId({post_id : data.id}, (errRes,resPolling) => {
                        if(!errRes){
                            if(utility.issetVal(resPolling)){
                                // console.log(resPolling);
                                resolve(resPolling);
                            } else {
                              resolve();
                            }
                        } else {
                          resolve();
                        }
                    });
                  });

                let promiseParticipant = new Promise(function( resolve, reject){
                    postResponse.getCountData({id : data.id}, function(errCount, resCount){
                        if(!utility.issetVal(errCount)){
                            resolve(resCount)
                        } else {
                            resolve(resCount)
                        }
                    })
                })


                let promiseUserLike = new Promise(function(resolve, reject){
                    postLike.getData({post_id : data.id,  user_id : req.user_id}, function(errLike,resLike ){               
                        if(!utility.issetVal(errLike)){
                            // console.log(req);
                            if(utility.issetVal(resLike)){
                                resolve(1)
                            } else {
                                resolve(0)
                            }
                            // console.log(resData);
                        } else {
                            resolve(0)
                        }
                    })
                })

                let promisePostImages = new Promise(function(resolve, reject){
                    postImages.getData({id : data.id}, function(err,res ){       
                        console.log('err',err); 
                        console.log('res',err); 
                        console.log('id',data.id);        
                        if(!utility.issetVal(err)){
                            // console.log(req);
                            if(utility.issetVal(res)){
                                resolve(res)
                            } else {
                                resolve()
                            }
                            // console.log(resData);
                        } else {
                            resolve()
                        }
                    })
                })
                
             

                return Promise.all([promiseComment, promiseLike, promisePolling, promiseParticipant, promiseUserLike, promisePostImages])
                .then(([comment, like,  polling, participant, userLike, postImages]) =>{
                    data.comment = comment
                    data.like = like
                    data.liked = userLike;

                    if(!utility.issetVal(data.user_id)){
                        data.username = 'Pwc Admin';
                        data.img = null;
                    } else {
                        data.username = data.username;
                        if(utility.issetVal(data.img)){                        
                            data.img = url.url_img+'user/'+data.img;
                        } else {
                            data.img = null;
                        }
                    }

                    if(utility.issetVal(postImages)){
                        let postImg = []
                        let arrayImg = {}
                        postImages.map(resImages => {
                            arrayImg = resImages
                            arrayImg.img = url.url_img+'post/'+arrayImg.img;
                        })
                        postImg.push(arrayImg);
                        data.images = postImg
                    } else {
                        data.images = null
                    }
                    

                    if(data.type == 'polling') {
                    
                        const filterVoted = _.filter(participant, o => o.user_id === req.user_id);
                        utility.issetVal(filterVoted) ? 
                            data.voted = 1 
                            : data.voted = 0;
                        
                        data.participant = participant.length
                        if(utility.issetVal(polling)){
                            return Promise.all(polling.map(resMap => {
                                resMap.voted = 0;
                                if(utility.issetVal(filterVoted[0])){
                                    if(filterVoted[0].polling_id===resMap.id){
                                        resMap.voted = 1;
                                    } 
                                    
                                }
                                let promiseResponse = new Promise(function(resolve, reject) {
                                    const body = {
                                        post_id : resMap.post_id,
                                        polling_id : resMap.id
                                    }
                                    // console.log(body);
                                    postResponse.getResponse(body,function(errRes,resData) {
                                        // console.log(errRes);
                                        if(!errRes){
                                            resolve(resData)
                                        }
                                    });
                                })
                                
                                return Promise.all([promiseResponse]).then(arr => {
                                    if(utility.issetVal(arr[0])){
                                        resMap.answer = arr[0].length
                                        let persentase = (arr[0].length/participant.length)*100;
                                        resMap.persentase = `${Math.round(persentase)}%`; 
                                    } else {
                                        resMap.answer = 0
                                        let persentase = 0;
                                        resMap.persentase = `${Math.round(persentase)}%`;
                                    }
                                    return resMap
                                })
                                
                            })).then(resData => {
                                // console.log('ress', resData);
                                data.polling = resData
                                return data; 
                            }).catch(function(error){ 
                                callback(error, null)
                            });
                        } else {
                            return data
                        }
                    } else {
                        return data
                    }
                })
            })).then(response => {
                return response
            });
        })
        .then(datas=>{
            callback(null, datas)
        }).catch(function(error) { 
            callback(error, null)
        });
    },

    getCountInterest  : function(req, callback){

        return exec.knex(`${table} as post`)
        .count('post.id as id')
        .leftJoin('AT_PostInterest as postInterest', 'post.id', '=', 'postInterest.post_id')
        .leftJoin('AT_AlumniInterest as alumniInterest', 'alumniInterest.interest_id', '=', 'postInterest.interest_id')
        .where({'publish' : '1', 'removed' : 0})
        .groupBy('post.id')
        .modify(function(queryBuilder) {
            if(utility.issetVal(req.content)){
                queryBuilder.where('content', 'LIKE', "%"+req.content+"%")
            }

            if(utility.issetVal(req.interest)){
                queryBuilder.whereIn('postInterest.interest_id', req.interest)
            }
        })
        .then(datas=>{
            callback(null, datas.length)
        }).catch(function(error) { 
            callback(error, null)
        });
    },
    
    getAllInterest  : function(req, callback){
        let sortArray = [];
        
        if(req.sort == "popular"){
            sortArray.push({'field' :'popular', 'direction': 'ASC'})
        } else if(req.sort == "weekly"){
            sortArray.push({'field' :'weekly', 'direction': 'ASC'})
        } else if(req.sort == "monthly"){
            sortArray.push({'field' :'monthly', 'direction': 'ASC'})
        } else {
            sortArray.push({'field' :'create_date', 'direction': 'DESC'})
        }

        let column = [ 'user.name as username'
                , 'user.img as img'
            ];
        return exec.knex('T_Post as post')
        .max('post.id as id')
        .max('post.user_id as user_id')
        .max('post.content as content')
        .max('post.type as type')
        .max('post.notes as notes')
        .max('post.featured as featured')
        .max('post.publish as publish')
        .max('post.modify_date as modify_date')
        .max('post.create_date as create_date')
        .max('post.user_type as user_type')
        .max('post.publish_date as publish_date')
        .max('post.font_style as font_style')
        .max('post.removed as removed')
        .max('post.end_date as end_date')
        .max('user.name as username')
        .max('user.img as img')
        .select(exec.knex.raw(`
                (SELECT 
                    COUNT(at_postmonthly.postmonthly_id) 
                FROM AT_PostMonthly at_postmonthly 
                LEFT JOIN T_PostMonthly postMonthly on postMonthly.id = at_postmonthly.postmonthly_id
                WHERE at_postmonthly.post_id = post.id
                AND postMonthly.month = ${req.month}
                AND postMonthly.year = ${req.year}) 
            AS count_monthly`))
        .leftJoin('T_User as user', 'post.user_id', '=', 'user.id')
        .leftJoin('AT_PostInterest as postInterest', 'post.id', '=', 'postInterest.post_id')
        .leftJoin('AT_AlumniInterest as alumniInterest', 'alumniInterest.interest_id', '=', 'postInterest.interest_id')
        .where({'post.publish' : '1', 'post.removed' : 0})
        .groupBy('post.id')
        .modify(function(queryBuilder) {
            if(utility.issetVal(req.content)){
                queryBuilder.where('post.content', 'LIKE', "%"+req.content+"%")
            }
            if(utility.issetVal(req.interest)){
                queryBuilder.whereIn('postInterest.interest_id', req.interest)
            }
            _.each(sortArray, function(sort) {
                queryBuilder.orderBy(sort.field, sort.direction);
            });
        })
        // .orderBy('post.featured', 'DESC')
        // .orderBy('post.create_date', 'desc')
        
        .limit(req.limit)
        .offset(req.start)
        .then(datas=>{
            return Promise.all(datas.map(data => {
                let promiseComment = new Promise(function( resolve, reject){
                    postComment.getCountData({post_id : data.id}, function(errCount, resCount){
                        if(!utility.issetVal(errCount)){
                            resolve(resCount)
                        } else {
                            resolve(resCount)
                        }
                    })
                })
    
                let promiseLike = new Promise(function( resolve, reject){
                    postLike.getCountData({post_id : data.id}, function(errCount, resCount){
                        if(!utility.issetVal(errCount)){
                            resolve(resCount)
                        } else {
                            resolve(resCount)
                        }
                    })
                })

                let promisePolling = new Promise(function(resolve, reject) {
                    postPolling.getByPostId({post_id : data.id}, (errRes,resPolling) => {
                        if(!errRes){
                            if(utility.issetVal(resPolling)){
                                // console.log(resPolling);
                                resolve(resPolling);
                            } else {
                              resolve();
                            }
                        } else {
                          resolve();
                        }
                    });
                  });

                let promiseParticipant = new Promise(function( resolve, reject){
                    postResponse.getCountData({id : data.id}, function(errCount, resCount){
                        if(!utility.issetVal(errCount)){
                            resolve(resCount)
                        } else {
                            resolve(resCount)
                        }
                    })
                })


                let promiseUserLike = new Promise(function(resolve, reject){
                    postLike.getData({post_id : data.id,  user_id : req.user_id}, function(errLike,resLike ){               
                        if(!utility.issetVal(errLike)){
                            // console.log(req);
                            if(utility.issetVal(resLike)){
                                resolve(1)
                            } else {
                                resolve(0)
                            }
                            // console.log(resData);
                        } else {
                            resolve(0)
                        }
                    })
                })
                
                let promisePostImages = new Promise(function(resolve, reject){
                    postImages.getData({id : data.id}, function(err,res ){       
                        console.log('err',err); 
                        console.log('res',err); 
                        console.log('id',data.id);        
                        if(!utility.issetVal(err)){
                            // console.log(req);
                            if(utility.issetVal(res)){
                                resolve(res)
                            } else {
                                resolve()
                            }
                            // console.log(resData);
                        } else {
                            resolve()
                        }
                    })
                })
             

                return Promise.all([promiseComment, promiseLike, promisePolling, promiseParticipant, promiseUserLike, promisePostImages])
                .then(([comment, like,  polling, participant, userLike, postImages]) =>{
                    data.comment = comment
                    data.like = like
                    data.liked = userLike;

                    if(!utility.issetVal(data.user_id)){
                        data.username = 'Pwc Admin';
                        data.img = null;
                    } else {
                        data.username = data.username;
                        if(utility.issetVal(data.img)){                        
                            data.img = url.url_img+'user/'+data.img;
                        } else {
                            data.img = null;
                        }
                    }

                    if(utility.issetVal(postImages)){
                        let postImg = []
                        let arrayImg = {}
                        postImages.map(resImages => {
                            arrayImg = resImages
                            arrayImg.img = url.url_img+'post/'+arrayImg.img;
                        })
                        postImg.push(arrayImg);
                        data.images = postImg
                    } else {
                        data.images = null
                    }
                    
                    
                    if(data.type == 'polling') {
                    
                        const filterVoted = _.filter(participant, o => o.user_id === req.user_id);
                        utility.issetVal(filterVoted) ? 
                            data.voted = 1 
                            : data.voted = 0;
                        
                        data.participant = participant.length
                        if(utility.issetVal(polling)){
                            return Promise.all(polling.map(resMap => {
                                resMap.voted = 0;
                                if(utility.issetVal(filterVoted[0])){
                                    if(filterVoted[0].polling_id===resMap.id){
                                        resMap.voted = 1;
                                    } 
                                    
                                }
                                let promiseResponse = new Promise(function(resolve, reject) {
                                    const body = {
                                        post_id : resMap.post_id,
                                        polling_id : resMap.id
                                    }
                                    // console.log(body);
                                    postResponse.getResponse(body,function(errRes,resData) {
                                        // console.log(errRes);
                                        if(!errRes){
                                            resolve(resData)
                                        }
                                    });
                                })
                                
                                return Promise.all([promiseResponse]).then(arr => {
                                    if(utility.issetVal(arr[0])){
                                        resMap.answer = arr[0].length
                                        let persentase = (arr[0].length/participant.length)*100;
                                        resMap.persentase = `${Math.round(persentase)}%`; 
                                    } else {
                                        resMap.answer = 0
                                        let persentase = 0;
                                        resMap.persentase = `${Math.round(persentase)}%`;
                                    }
                                    return resMap
                                })
                                
                            })).then(resData => {
                                // console.log('ress', resData);
                                data.polling = resData
                                return data; 
                            }).catch(function(error){ 
                                callback(error, null)
                            });
                        } else {
                            return data
                        }
    
                    } else {
                        return data
                    }
                })
            })).then(response => {
                return response
            });
        })
        .then(datas=>{
            callback(null, datas)
        }).catch(function(error) { 
            callback(error, null)
        });
    },
    getCountByAlumni : function(req,callback){
        return exec.knex(table)
        .count('id as id')
        .where(req)
        .then(datas=>{
            callback(null, datas[0].id)
        }).catch(function(error) { 
            callback(error, null)
        });
    },
    getAllByAlumni  : function(req, callback){
        let sortArray = [];
        
        if(req.sort == "popular"){
            sortArray.push({'field' :'popular', 'direction': 'ASC'})
        } else if(req.sort == "weekly"){
            sortArray.push({'field' :'weekly', 'direction': 'ASC'})
        } else if(req.sort == "monthly"){
            sortArray.push({'field' :'monthly', 'direction': 'ASC'})
        } else {
            sortArray.push({'field' :'post.create_date', 'direction': 'DESC'})
        }

        let column = [
                'post.*'
                , 'user.name as username'
                , 'user.img as img'
            ];
        return exec.knex('T_Post as post')
        .select(column)
        .select(exec.knex.raw(`
                (SELECT 
                    COUNT(at_postmonthly.postmonthly_id) 
                FROM AT_PostMonthly at_postmonthly 
                LEFT JOIN T_PostMonthly postMonthly on postMonthly.id = at_postmonthly.postmonthly_id
                WHERE at_postmonthly.post_id = post.id
                AND postMonthly.month = ${req.month}
                AND postMonthly.year = ${req.year}) 
            AS count_monthly`))
        .leftJoin('T_User as user', 'post.user_id', '=', 'user.id')
        .where({'user_id' : req.alumni_id, 'removed' : req.removed})
        .modify(function(queryBuilder) {
            if(utility.issetVal(req.content)){
                queryBuilder.where('post.content', 'LIKE', "%"+req.content+"%")
            }
            _.each(sortArray, function(sort) {
                queryBuilder.orderBy(sort.field, sort.direction);
            });
        })
        // .orderBy('post.featured', 'DESC')
        // .orderBy('post.create_date', 'desc')
        
        .limit(req.limit)
        .offset(req.start)
        .then(datas=>{
            return Promise.all(datas.map(data => {
                let promiseComment = new Promise(function( resolve, reject){
                    postComment.getCountData({post_id : data.id}, function(errCount, resCount){
                        if(!utility.issetVal(errCount)){
                            resolve(resCount)
                        } else {
                            resolve(resCount)
                        }
                    })
                })
    
                let promiseLike = new Promise(function( resolve, reject){
                    postLike.getCountData({post_id : data.id}, function(errCount, resCount){
                        if(!utility.issetVal(errCount)){
                            resolve(resCount)
                        } else {
                            resolve(resCount)
                        }
                    })
                })

                let promisePolling = new Promise(function(resolve, reject) {
                    postPolling.getByPostId({post_id : data.id}, (errRes,resPolling) => {
                        if(!errRes){
                            if(utility.issetVal(resPolling)){
                                // console.log(resPolling);
                                resolve(resPolling);
                            } else {
                              resolve();
                            }
                        } else {
                          resolve();
                        }
                    });
                  });

                let promiseParticipant = new Promise(function( resolve, reject){
                    postResponse.getCountData({id : data.id}, function(errCount, resCount){
                        if(!utility.issetVal(errCount)){
                            resolve(resCount)
                        } else {
                            resolve(resCount)
                        }
                    })
                })


                let promiseUserLike = new Promise(function(resolve, reject){
                    postLike.getData({post_id : data.id,  user_id : req.user_id}, function(errLike,resLike ){               
                        if(!utility.issetVal(errLike)){
                            // console.log(req);
                            if(utility.issetVal(resLike)){
                                resolve(1)
                            } else {
                                resolve(0)
                            }
                            // console.log(resData);
                        } else {
                            resolve(0)
                        }
                    })
                })
                

                  
                let promisePostImages = new Promise(function(resolve, reject){
                    postImages.getData({id : data.id}, function(err,res ){       
                        console.log('err',err); 
                        console.log('res',err); 
                        console.log('id',data.id);        
                        if(!utility.issetVal(err)){
                            // console.log(req);
                            if(utility.issetVal(res)){
                                resolve(res)
                            } else {
                                resolve()
                            }
                            // console.log(resData);
                        } else {
                            resolve()
                        }
                    })
                })
             
             

                return Promise.all([promiseComment, promiseLike, promisePolling, promiseParticipant, promiseUserLike, promisePostImages])
                .then(([comment, like,  polling, participant, userLike, postImages]) =>{
                    data.comment = comment
                    data.like = like
                    data.liked = userLike;

                    if(!utility.issetVal(data.user_id)){
                        data.username = 'Pwc Admin';
                        if(!utility.issetVal(data.img)){
                            data.img = null;
                        }
                    } else {
                        data.username = data.username;
                        if(utility.issetVal(data.img)){                        
                            data.img = url.url_img+'user/'+data.img;
                        } else {
                            data.img = null;
                        }
                    }

                    if(utility.issetVal(postImages)){
                        let postImg = []
                        let arrayImg = {}
                        postImages.map(resImages => {
                            arrayImg = resImages
                            arrayImg.img = url.url_img+'post/'+arrayImg.img;
                        })
                        postImg.push(arrayImg);
                        data.images = postImg
                    } else {
                        data.images = null
                    }
                    
                    

                    if(data.type == 'polling') {
                    
                        const filterVoted = _.filter(participant, o => o.user_id === req.user_id);
                        utility.issetVal(filterVoted) ? 
                            data.voted = 1 
                            : data.voted = 0;
                        //bugsAnu
                        data.participant = participant.length
                        if(utility.issetVal(polling)){
                            return Promise.all(polling.map(resMap => {
                                resMap.voted = 0;
                                if(utility.issetVal(filterVoted[0])){
                                    if(filterVoted[0].polling_id===resMap.id){
                                        resMap.voted = 1;
                                    } 
                                    
                                }
                                let promiseResponse = new Promise(function(resolve, reject) {
                                    const body = {
                                        post_id : resMap.post_id,
                                        polling_id : resMap.id
                                    }
                                    // console.log(body);
                                    postResponse.getResponse(body,function(errRes,resData) {
                                        // console.log(errRes);
                                        if(!errRes){
                                            resolve(resData)
                                        }
                                    });
                                })
                                
                                return Promise.all([promiseResponse]).then(arr => {
                                    if(utility.issetVal(arr[0])){
                                        resMap.answer = arr[0].length
                                        let persentase = (arr[0].length/participant.length)*100;
                                        resMap.persentase = `${Math.round(persentase)}%`; 
                                    } else {
                                        resMap.answer = `${0}%`;
                                    }
                                    return resMap
                                })
                                
                            })).then(resData => {
                                // console.log('ress', resData);
                                data.polling = resData
                                return data; 
                            }).catch(function(error){ 
                                callback(error, null)
                            });
                        } else {
                            return data
                        }
                    } else {
                        return data
                    }
                })
            })).then(response => {
                return response
            });
        })
        .then(datas=>{
            callback(null, datas)
        }).catch(function(error) { 
            callback(error, null)
        });
    },

    checkWord : function(req, callback){
        console.log({req});
        return exec
        .knex('T_ForbiddenWord')
        .select('word')
        .where({})
        .then(datas => {
            let wordsForbidden = datas.map(data => data.word)
            let result = true
            let count = 0
            /*  wordsForbidden.forEach(word => {
                 console.log({word : word});
                 let lowContent = req.toLowerCase()
                 console.log(lowContent.search(word.toLowerCase()));
                 if(lowContent.search(word.toLowerCase()) !== -1){
                     result = false
                 } 
             }); */
             if(utility.issetVal(req)){
                 while(result){
                     // console.log({'word' : wordsForbidden[count]});
                     let lowContent = req.toLowerCase()
                     // console.log(lowContent.search(wordsForbidden[count].toLowerCase()));
                     if(lowContent.search(wordsForbidden[count].toLowerCase()) !== -1){
                         result = false
                     } 
     
                     if(count >= wordsForbidden.length-1){
                         break;
                     }
                     // console.log({count: count});
                     count++
                 }
             }
            console.log({'datas CheckWord' : result});
            callback(null,result)
        })
        .catch(error => {
            console.log({error});
            callback(error, null)
        })
    },

    addData: function(req, callback){
        console.log('ADD DATA');
        return exec.save(req, table, callback);
    },

    updateData: function(req, callback){
        return exec.findByIdAndUpdate(req.id, req, table, callback);
    },

    checkFeatured: function(req, callback){
        return exec.getCountData({featured: '1'}, table, callback);
    },

    getLikes : function (req, callback){
        // console.log(req);
        
          Model
          .find({post_id : req.post_id})
          .select()
          .skip(req.start)
          .limit(req.limit)
          .then(postData =>{
            // console.log(postData);
             return Promise.all(postData.map(data =>{
                let result = {
                  id : data.id,
                  post_id : data.post_id,
                  user_id : data.user_id,
                }
                // console.log(result);
                let promiseUser = new Promise( function(resolve, reject){
                  user.getById({id : result.user_id},function(errRes,resData) {
                    if(!errRes){
                        // console.log(resData);
                        resolve(resData)
                    }
                  });
                })
                return Promise.all([promiseUser])
                .then(arr=>{
                  result.name = arr[0].name
                  utility.issetVal(arr[0].img) ? result.img = url.url_img + 'user/' + arr[0].img : result.img = null;
                  return result
                })
                .catch(error =>{
                  console.log(error);
                })
              }))
          })
          .then(userData =>{
            callback(null, userData)
          })
          .catch((error =>{
            callback(error, null)
          }))
    }
    
}