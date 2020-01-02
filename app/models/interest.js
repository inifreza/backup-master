
let table = 'T_Interest';
const exec = require('../../helpers/mssql_adapter') 
var stringInject = require('stringinject')
const utility = require('../../helpers/utility')

module.exports = {
    deleteData : function(req, callback){
        return exec.findByIdAndDelete(req.id, table, callback);
    },
    
    getById  : function(req, callback){
        return exec.findById(req.id, '*', table , callback);
    },

    getCountData  : function(req, callback){
        // return exec.getCountData({}, table, callback);
        return exec
        .knex('T_Interest as interest')
        .max('interest.id as id')
        .max('interest.parent_id as parent_id')
        .max('interest.title as title')
        .max('interest.publish as publish')
        .max('interest.modify_date as modify_date')
        .max('interest.create_date as create_date')
        .max('interest.sort as sort')
        .max('interest.img as img')
        .modify(qb=>{
            if(utility.issetVal(req.keyword))
                qb.andWhere('interest.title', 'LIKE', `%${req.keyword}%`)
            if(utility.issetVal(req.create_date)){
                let date = req.create_date.split('-').map(x=>{
                    return x.trim()
                })
                qb.whereBetween('interest.create_date', date)
            }
        })
        .groupBy('interest.id')
        .then(rowsRes=>{
            let tempResult = rowsRes
            // console.log(datas);
            let parentArray = new Array()
            let childArray = new Array()
            let resultArray = new Array()
            
            for(let obj in rowsRes){
                // console.log(rowsRes[obj].parent_id)
                if(!utility.issetVal(rowsRes[obj].parent_id) || rowsRes[obj].parent_id =='root'){
                parentArray.push(rowsRes[obj])
                }else{
                childArray.push(rowsRes[obj])
                }
            }

            for(let parent in parentArray){
                let temp = {
                id: parentArray[parent].id,
                title: parentArray[parent].title,
                img: parentArray[parent].img,
                publish: parentArray[parent].publish,
                sort: parentArray[parent].sort,
                parent_id: 'root',
                create_date: parentArray[parent].create_date,
                modify_date: parentArray[parent].modify_date,
                child: []
                }
                // console.log({childArray : childArray});
                for(let child in childArray){
                if(childArray[child].parent_id == parentArray[parent].id){
                    // console.log(childArray[child]);
                    childArray[child].parent_name = parentArray[parent].title;
                    temp.child.push(childArray[child])
                    // temp.child.namaa = "anuu"
                }
                }
                resultArray.push(temp)
            }
            if(resultArray.length == 0){
                callback(null,rowsRes.length    )
            } else {
                callback(null, resultArray.length)
            }
        })
        .catch(error=>{
            callback(error,null)
        })
    },

    getAll  : function(req, callback){
        // return exec.getAll(null, '*', req.start, req.limit, 'create_date DESC ',  table, callback);
        return exec
        .knex('T_Interest as interest')
        .max('interest.id as id')
        .max('interest.parent_id as parent_id')
        .max('interest.title as title')
        .max('interest.publish as publish')
        .max('interest.modify_date as modify_date')
        .max('interest.create_date as create_date')
        .max('interest.sort as sort')
        .max('interest.img as img')
        .modify(qb=>{
            if(utility.issetVal(req.keyword))
                qb.andWhere('interest.title', 'LIKE', `%${req.keyword}%`)
            if(utility.issetVal(req.create_date)){
                let date = req.create_date.split('-').map(x=>{
                    return x.trim()
                })
                qb.whereBetween('interest.create_date', date)
            }
        })
        .groupBy('interest.id')
        .orderBy('create_date', 'DESC')
        .limit(req.limit)
        .offset(req.start)
        .then(datas=>{
            console.log({'datas' : datas});
          return Promise.all(datas.map(interest =>{
                return new Promise((resolve, reject)=>{
                    let {parent_id} = interest
                    // console.log({'parent id': parent_id});
                    if(parent_id != 'root'){
                        this.getById({id : parent_id},(error, resData)=>{
                            if(!error){
                                interest.parent_name = resData.title
                                resolve(interest)
                            } else {
                                resolve(interest)
                            }
                        })
                    } else{
                        resolve(interest)
                    }
                })
                .then(datas =>{
                    return datas
                })
            }))
        })
        .then(datas=>{
            callback(null, datas)
        })
        .catch(error=>{
            callback(error,null)
        })
    },

    getParent  : function(req, callback){
        let column = [
            'id'
            , 'title'
        ]
        return exec.findAll({'parent_id' : 'root', 'publish' : '1'}, column, 'title ASC', table, callback);
    },

    getChild  : function(req, callback){
        let param = {
            publish : 1
        };
        utility.issetVal(req.parent_id) ? param['parent_id'] = req.parent_id :  {};
       
        let column = [
            'id'
            , 'title'
        ]
        return exec.findAll(param, column, 'title ASC', table, callback);
    },

    getChildWithUser  : function(req, callback){
        let param = {
            publish : 1
        };
        utility.issetVal(req.parent_id) ? param['parent_id'] = req.parent_id :  {};
       
        let column = [
            'id'
            , 'title'
        ]
        return exec.knex(table).where(param).select(column).orderByRaw('title ASC')
        .then(datas=>{
            return Promise.all(datas.map(data => {
                var result = {
                    id: data.id,
                    title: data.title
                }
                let promiseUserInterest = new Promise(function(resolve, reject) {
                    exec.findAll({interest_id : result.id}, 'user_id', null, 'AT_AlumniInterest' , (err, resData) =>{
                        console.log(result)
                        if(resData){
                            resolve(resData)   
                        } else {
                            resolve()   
                        }
                    });
                })

                return Promise.all([promiseUserInterest])
                .then(([user]) =>{
                    console.log('data', user )
                    if(utility.issetVal(user)){    
                        result.user_list = user;
                        return result
                    } else {
                        result.user_list = null;
                        return result;
                    }
                })
            })).then(response => {
               return response;
            })
        })
        .then(datas=>{
            callback(null, datas)
        }).catch(function(error) { 
            callback(error, null)
        });
    },

    findAllWhereNot  : function(req, callback){
        let column = [
            'id'
            , 'title'
        ]
        return exec.findAll({'parent_id' : 'root'}, column, 'title ASC', table, callback);
    },

    addData: function(req, callback){
        return exec.save(req, table, callback);
    },

    updateData: function(req, callback){
        return exec.findByIdAndUpdate(req.id, req, table, callback);
    },

    getData  : function(req, callback){
        return exec.findAll(req, '*', 'title ASC', table, callback);
    },
 
    
}