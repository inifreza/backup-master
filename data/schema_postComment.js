var mongoose = require('mongoose');
var Schema = mongoose.Schema;

let table = "PostComments";
var collectionSchema = new Schema({
    post_id:  String,
    user_id:  String,
    comment:  String,
    publish:  Number,
    comment_type: String, 
    modify_date: { type: Date, default: Date.now },
    create_date: { type: Date }
  }, {timestamps: { modify_date: 'modify_date' }, collection: table});

module.exports = mongoose.model(table, collectionSchema); 