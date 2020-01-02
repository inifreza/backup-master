let mongoose = require('mongoose');
let Schema = mongoose.Schema;
var Model = require('../../data/schema_eventCommentLikes');
const utility = require('../../helpers/utility')
const user = require('../models/user')

// setting immage 
const globals = require('../../configs/global')
const {
  config
} = require('../../default')
let url = globals[config.environment];

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
        Model.find({})
            .select()
            .skip(req.start)
            .limit(req.limit)
            .exec(callback);
    },

    getAllByPost: function(req, callback){
        Model.find(req)
            .select()
            .exec(callback);
    },

    getCountData: function(req,callback){
        Model.countDocuments(req).exec(callback);
    },

    getByComment : function(req, callback){
        // console.log({'Get By Comment' : req});
        Model
        .find({comment_id : req.comment_id})
        .select()
        .skip(req.start)
        .limit(req.limit)
        // .exec(callback)
        .then(datas => {
            // console.log({datas : datas[0]})
            return Promise.all(datas.map(data => {
                console.log({data});
                console.log({data : data.event_id });
                let result = {
                    id : data._id,
                    user_id : data.user_id,
                    comment_id : data.comment_id
                }
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
    },

    getById: function(req, callback){
        //console.log(req.body.name);
        Model.findById(req.body.id).select().exec(callback);
    },

    getData : function (req, callback){
        Model.find(req, callback)
    }
}
