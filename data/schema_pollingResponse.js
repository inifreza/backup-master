var mongoose = require('mongoose');
var Schema = mongoose.Schema;

let table = "PostPolling_response";
var collectionSchema = new Schema({
    post_id:  String,
    polling_id:  String,
    user_id:  String,
    modify_date: { type: Date, default: Date.now },
    create_date: { type: Date }
  }, {timestamps: { modify_date: 'modify_date' }, collection: table});

module.exports = mongoose.model(table, collectionSchema);

