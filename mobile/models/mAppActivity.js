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

    getCountData: function(req, callback){
        console.log(Model)
        Model.countDocuments(req, callback);
    },
    

}
