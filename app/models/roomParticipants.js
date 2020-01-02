//Schema
const Model = require('../../data/schema_roomParticipants')
const User = require('./user')
const LineService = require('./lineService')

//Utility
const Utility = require('../../helpers/utility')
const response = require('../../helpers/response')

module.exports = {
  addData: function(req, callback){
      Model
      .insertMany(req)
      .then(data=>{
        callback(null, data)
      }).catch(error =>{
        callback('error', null)
      })
  },

  deleteData: function(param, callback){
      Model.findByIdAndDelete(param.id, callback);
  },

  updateData: function(param, callback){
      Model.findByIdAndUpdate(param.id, param, callback);
  },

  getData : function (req, callback){
    console.log(req)
    Model.find(req, callback)
  },
}