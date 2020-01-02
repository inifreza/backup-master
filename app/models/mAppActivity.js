let mongoose = require('mongoose');
let Schema = mongoose.Schema;
var Model = require('../../data/schema_appActivity');

const utility = require('../../helpers/utility')

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

    getCountByUser: function(req, callback){
        console.log('user', req.user_id);
        Model.aggregate([{$match:
                {'user_id': req.user_id}
            },{
                $group: {
                    _id: {
                        date: "$date",
                        type: "$type",
                        user_id :  "$user_id" 
                    },
                    count: {
                        "$sum": 1
                    }
                }
            }, {
                $group: {
                    _id: "$_id.date",
                    type: {
                        $push: {
                            type: "$_id.type",
                            count: "$count"
                        }
                    }
                }
            }])     
            .then(datas => {
                return Promise.all(datas.map(data => {
                    const result = {
                        date : data._id
                        , home : 0
                        , alumni : 0
                        , event : 0
                        , message : 0
                        , jobs :0
                        , profile: 0
                    }
                    let activity = data.type;
                    Promise.all(activity.map(dataType => {
                        result[dataType.type] = dataType.count 
                    }))
                    return result;
                }))
            }).then(response => {
                callback(null, response.length)
            }).catch(function(error){ 
                callback(error, null)
            });
    },
    
   

    getAllByUser: function(req, callback){
        console.log('user', req.user_id);
        Model.aggregate([{$match:
                {'user_id': req.user_id}
            },{
                $group: {
                    _id: {
                        date: "$date",
                        type: "$type",
                        user_id :  "$user_id" 
                    },
                    count: {
                        "$sum": 1
                    }
                }
            }, {
                $group: {
                    _id: "$_id.date",
                    type: {
                        $push: {
                            type: "$_id.type",
                            count: "$count"
                        }
                    }
                }
            }, { $sort : { '_id' : -1 }}
            , { $skip : req.start}
            ,  { $limit : req.limit}
            ,  ])     
            .then(datas => {
                return Promise.all(datas.map(data => {
                    const result = {
                        date : data._id
                        , home : 0
                        , alumni : 0
                        , event : 0
                        , message : 0
                        , jobs :0
                        , profile: 0
                    }
                    let activity = data.type;
                    Promise.all(activity.map(dataType => {
                        result[dataType.type] = dataType.count 
                    }))
                    return result;
                }))
            }).then(response => {
                callback(null, response)
            }).catch(function(error){ 
                callback(error, null)
            });
    },
}
