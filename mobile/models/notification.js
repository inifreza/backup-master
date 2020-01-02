
let table = 'T_Notification';
var stringInject = require('stringinject')
const exec = require('../../helpers/mssql_adapter') 
const _ = require('lodash');
const utility = require('../../helpers/utility')


let postComment = require('../../data/schema_postComment');

module.exports = {
    addData: function(req, callback){
        return exec.save(req, table, callback);
    },

    getAll  : function(req, callback){
        // let param = utility.issetVal(req.verified) ? {verified : req.verified} :  {};
        
        return exec.knex('T_Notification as notification')
            .count('active')
            .where(param)
            .where({'seen' : '1'})
            .orderBy('notification.create_date', 'desc')
            .then(datas=>{
                callback(null, datas)
            }).catch(function(error) { 
                callback(error, null)
            });
    },

    getCountData  : function(req, callback){
        // return exec.getCountData(null, table, callback);
        return exec.knex(table).count('recipient_id as id')
            .where({'recipient_id' : req.user_id})
            .then(datas=>{
                callback(null, datas[0].id)
            }).catch(function(error) { 
                callback(error, null)
            });
    },

    getUnread  : function(req, callback){
        // return exec.getCountData(null, table, callback);
        return exec.knex(table).count('recipient_id as id')
            .where({'recipient_id' : req.user_id, 'seen' : '0'})
            .then(datas=>{
                callback(null, datas[0].id)
            }).catch(function(error) { 
                callback(error, null)
            });
    },

    getById  : function(req, callback){
        return exec.findById(req.id, '*', table , callback);
    },

    updateData: function(req, callback){
        return exec.findByIdAndUpdate(req.id, req, table, callback);
    },
    getReadAll : function(req, callback){
        return exec.finOneAndUpdate({recipient_id : req.recipient_id},{seen : req.seen},table, callback)
    },

    getList : function(req, callback){
        let column = [
            'T_Notification.id as notification_id',
            'T_User.img as icon',
            // iconPath,
            'T_Notification.type_id',
            'T_Notification.type',
            // exec.knex.raw(),
            'T_Notification.sender_id',
            // lang,
            'T_Notification.seen',
            'T_Notification.object',
            'T_Notification.predicate',
            'T_Notification.create_date as date'
        ]
        return exec
        .knex(table)
        .select(column)
        .leftJoin('T_User', 'T_User.id', '=', 'T_Notification.sender_id')
        .where({'T_Notification.recipient_id' : req.user_id})
        .orderBy('T_Notification.create_date', 'desc')
        .limit(req.limit)
        .offset(req.start)
        .then(datas=>{
            Promise.all(datas.map(data =>{
                console.log({data});
                // return data
                if(data.type == 'post'  && data.predicate == 'create'){
                    let promisePost = new Promise((resolve, reject)=>{
                        return exec
                        .knex('T_Post')
                        .select('content')
                        .where({id : data.type_id})
                        .then(([post])=>{
                            if(utility.issetVal(post)){
                                resolve(post.content)
                            } else {
                                resolve();
                            }
                            // console.log(post);
                        })
                    })
                   return promisePost
                    .then(content =>{
                        data.leng = {
                            id : 'Post Baru berdasarkan interest kamu : "' + utility.htmlConvertString(content)+'"',
                            eg : 'New Post based on you interest : "' + utility.htmlConvertString(content) +'"'
                        }
                        return data
                    })
                } else if (data.type == 'event' && data.predicate == 'create'){
                    let promiseEvent = new Promise((resolve, reject)=>{
                        return exec
                        .knex('T_Event')
                        .select('title')
                        .where({id : data.type_id})
                        .then(([event])=>{
                            // console.log(event);
                            resolve(event.title)
                        })
                    })
                    return promiseEvent
                        .then(title =>{
                            data.leng = {
                                id : `Event : ${utility.htmlConvertString(title)}`,
                                eg : `Event : ${utility.htmlConvertString(title)}`,
                            }
                            return data
                        })
                } else if(data.type == 'post' && data.predicate == 'comment'){
                    let promisePost = new Promise((resolve, reject)=>{
                        return exec
                        .knex('T_User')
                        .select('name')
                        .where({id: data.sender_id})
                        .then(([user])=>{
                            if(utility.issetVal(user)){
                                resolve(user.name)
                            }else {
                                resolve()
                            }
                        })
                    })
                    return promisePost
                    .then(name=>{
                        let promisePost = new Promise((resolve, reject)=>{
                            return postComment.findById(data.object).select()
                            .then((post)=>{
                                console.log(data)
                                if(utility.issetVal(post)){
                                    resolve(post.comment)
                                }else {
                                    resolve()
                                }
                            })
                           
                        }) 
                        return promisePost
                        .then(content=>{
                            let dataComment = {};
                            dataComment.name = name;
                            dataComment.content = content;
                            return dataComment;
                        });
                        
                    })
                    .then(comments=>{
                        data.leng = {
                            id : `${comments.name} comment on your post : "${utility.htmlConvertString(comments.content)}"`,
                            eg : `${comments.name} comment on your post : "${utility.htmlConvertString(comments.content)}"`
                        }
                        return data
                    })
                } else if(data.type == 'post' && data.predicate == 'mention'){
                    let promisePost = new Promise((resolve, reject)=>{
                        return exec
                        .knex('T_User')
                        .select('name')
                        .where({id: data.sender_id})
                        .then(([user])=>{
                            if(utility.issetVal(user)){
                                resolve(user.name)
                            }else {
                                resolve()
                            }
                        })
                    })
                    return promisePost
                    .then(name=>{
                        let promisePost = new Promise((resolve, reject)=>{
                            return exec
                            .knex('T_Post')
                            .select('content')
                            .where({id: data.type_id})
                            .then(([post])=>{
                                if(utility.issetVal(post)){
                                    resolve(post.content)
                                }else {
                                    resolve()
                                }
                            })
                           
                        }) 
                        return promisePost
                        .then(content=>{
                            let dataMention = {};
                            dataMention.name = name;
                            dataMention.content = content;
                            return dataMention;
                        });
                        
                    })
                    .then(mentioned=>{
                        data.leng = {
                            id : `${mentioned.name} mentioned you in a post : "${utility.htmlConvertString(mentioned.content)}"`,
                            eg : `${mentioned.name} mentioned you in a post : "${utility.htmlConvertString(mentioned.content)}"`,
                        }
                        return data
                    })
                } else if(data.type == 'post' && data.predicate == 'commentMention'){
                    let promisePost = new Promise((resolve, reject)=>{
                        return exec
                        .knex('T_User')
                        .select('name')
                        .where({id: data.sender_id})
                        .then(([user])=>{
                            if(utility.issetVal(user)){
                                resolve(user.name)
                            }else {
                                resolve()
                            }
                        })
                    })
                    return promisePost
                    .then(name=>{
                        let promisePost = new Promise((resolve, reject)=>{
                            return postComment.findById(data.object).select()
                            .then((post)=>{
                                console.log(data)
                                if(utility.issetVal(post)){
                                    resolve(post.comment)
                                }else {
                                    resolve()
                                }
                            })
                           
                        }) 
                        return promisePost
                        .then(content=>{
                            let dataMention = {};
                            dataMention.name = name;
                            dataMention.content = content;
                            return dataMention;
                        });
                        
                    })
                    .then(mentioned=>{
                        data.leng = {
                            id : `${mentioned.name} mentioned you in a comment : "${utility.htmlConvertString(mentioned.content)}"`,
                            eg : `${mentioned.name} mentioned you in a comment : "${utility.htmlConvertString(mentioned.content)}"`,
                        }
                        return data
                    })
                } else if (data.type == 'event' && data.predicate == 'commentLike'){
                    let promiseComment = new Promise((resolve, reject)=>{
                        exec.findById(data.sender_id, 'name','T_user',(error,name)=>{
                            if(utility.issetVal(name)){
                                exec.findById(data.type_id, 'title', 'T_Event',(error, title)=>{
                                    if(utility.issetVal(title)){
                                        let result = {
                                            name : name.name,
                                            title : title.title
                                        }
                                        resolve(result)
                                    }
                                })
                            }
                        })
                    })
                    return promiseComment
                    .then(({name, title})=>{
                        data.leng = {
                            id : `${name} menyukai komentar kamu pada event : "${utility.htmlConvertString(title)}"`,
                            eg : `${name} liked your comment at event : "${utility.htmlConvertString(title)}"`,
                        }
                        return data
                    })
                } else if (data.type == 'post' && data.predicate == 'commentLike'){
                    let promiseComment = new Promise((resolve, reject)=>{
                        exec.findById(data.sender_id, 'name','T_user',(error,name)=>{
                            if(utility.issetVal(name)){
                                exec.findById(data.type_id, 'content', 'T_Post',(error, content)=>{
                                    if(utility.issetVal(content)){
                                        let result = {
                                            name : name.name,
                                            content : content.content
                                        }
                                        resolve(result)
                                    }
                                })
                            }
                        })
                    })
                    return promiseComment
                    .then(({name, content})=>{
                        data.leng = {
                            id : `${name} menyukai komentar kamu pada postingan :"${utility.htmlConvertString(content)}"`,
                            eg : `${name} liked your comment at post :"${utility.htmlConvertString(content)}"`
                        }
                        return data
                    })
                } else if (data.type == 'broadcast' && data.predicate == 'create'){
                    let promiseBroadcast = new Promise((resolve, reject)=>{
                        return exec.findById(data.type_id, 'title', 'T_PushNotification', (error, broadcast)=>{
                            if(utility.issetVal(broadcast)){
                                resolve(broadcast.title)
                            } else {
                                resolve();
                            }
                        })
                    })
                    return promiseBroadcast
                    .then(title=>{
                        console.log('title', title, data.type_id)
                        data.leng = {
                            id  : `"${utility.htmlConvertString(title)}"`,
                            eg  : `"${utility.htmlConvertString(title)}"`,
                        }
                        // console.log('lenng', data.leng, data.type_id)
                        return data
                    })
                } else if (data.type == 'post' && data.predicate == 'likes'){
                    let promisePost = new Promise((resolve, reject)=>{
                        return exec
                        .knex('T_User')
                        .select('name')
                        .where({id: data.sender_id})
                        .then(([user])=>{
                            resolve(user.name)
                        })
                    })
                    return promisePost
                    .then(name=>{
                        data.leng = {
                            id : `${name} Menyukai postingan kamu`,
                            eg : `${name} Liked on your post`
                        }
                        return data
                    })
                } else if (data.type == 'news' && data.predicate == 'create'){
                    let promiseData = new Promise((resolve, reject)=>{
                        return exec
                        .knex('T_News')
                        .select('title')
                        .where({id: data.type_id})
                        .then(([news])=>{
                            utility.issetVal(news) ? resolve(news.title) : resolve();
                        })
                    })
                    return promiseData
                    .then(title=>{
                        data.content = `${utility.htmlConvertString(title)}`;
                        data.leng = {
                            id  : `Berita terbaru : "${utility.htmlConvertString(title)}"`,
                            eg  : `New news : "${utility.htmlConvertString(title)}"`
                        }
                        return data
                    })
                }
                else {
                    return data
                }
            }))
            .then(result =>{
                callback(null, result)
            }).catch(error=>{
                console.log(error);
                callback(error, null)
            })
        })
        .catch(error=>{
            console.log(error);
            callback(error, null)
        })
    },

    deleteByTypeId : function(req, callback){
        return exec.findOneAndDelete({'type_id' :req.id}, table, callback);
    },
}