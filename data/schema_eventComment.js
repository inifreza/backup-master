var mongoose = require('mongoose');
var Schema = mongoose.Schema;

let table = "EventComments";

let collectionSchema = new Schema({
  event_id    :  String,
  user_id     :  String,
  content     :  String,
  publish     :  Number,
  comment_type: String, 
  modify_date : { type: Date, default: Date.now },
  create_date : { type: Date },
}, {timestamps: { modify_date: 'modify_date' }, collection: table, strict: false });
module.exports = mongoose.model(table, collectionSchema);

