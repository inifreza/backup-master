let mongoose = require('mongoose');
let Schema = mongoose.Schema;
var Model = require('../../data/schema_postReport');

module.exports = {
    addData: function(req, callback){
        let newData = new Model(req);
        newData.save(callback);
    },

    deleteData: function(param, callback){
        Model.findByIdAndDelete(param.id, callback);
    },

    // updateData: function(param, callback){
    //     Model.findByIdAndUpdate(param.id, param, callback);
    // },

    // getAll: function(req, callback){
    //     Model.find({})
    //         .select()
    //         .skip(req.start)
    //         .limit(req.limit)
    //         .exec(callback);
    // },

    // getAllByPost: function(req, callback){
    //     Model.find(req)
    //         .select()
    //         .exec(callback);
    // },

    // getCountData: function(req,callback){
    //     console.log(req);
    //     Model.countDocuments(req, callback);
    // },

    getByPost : function(req, callback){
      Model.find(req).select().exec(callback)
    }

    // getById: function(req, callback){
    //     console.log(req);
    //     Model.findById(req).select().exec(callback);
    // },

    // getData : function (req, callback){
    //     Model.find(req, callback)
    // }
}
