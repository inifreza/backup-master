let mongoose = require('mongoose');
let Schema = mongoose.Schema;
var Model = require('../../data/schema_postRemoved');

// models
const post = require('../models/post')
const user = require('../models/user')

// utils
const utility = require('../../helpers/utility')
const exec = require('../../helpers/mssql_adapter')
const globals = require('../../configs/global')
const { config } = require('../../default')
let url = globals[config.environment]; // development || production
let _ = require('lodash');

module.exports = {
    addData: function(req, callback){
        let newData = new Model(req);
        newData.save(callback);
    },

    getCountData: function(req,callback){
        let query = req || {}
        Model.countDocuments(query, callback);
    },

    deleteData: function(param, callback){
      Model.findByIdAndDelete(param.id, callback);
    },

    getById: function(req, callback){
      //console.log(req.body.name);
      Model.findById(req.id).select().exec(callback);
    }
}
