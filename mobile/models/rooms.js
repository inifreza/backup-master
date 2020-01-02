//Schema
const Model = require('../../data/schema_rooms')
const response = require('../../helpers/response')

// utils
const utility = require('../../helpers/utility')
const exec = require('../../helpers/mssql_adapter')
const globals = require('../../configs/global')
const { config } = require('../../default')
let url = globals[config.environment]; // development || production

let user = require('../models/user')
let roomParticipant = require('../models/roomParticipants')
let _ = require('lodash');

module.exports = {
    addData: function(req, callback){
        let newData = new Model(req);
        newData.save(callback);
    },

    findOne: function(req, callback){
        //console.log(req.body.name);
        Model.findOne(req).select().exec(callback);
    },
}
