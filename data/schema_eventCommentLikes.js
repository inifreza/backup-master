var mongoose = require('mongoose');
mongoose.set('useCreateIndex', true);
var Schema = mongoose.Schema;

let table = "EventCommentLikes";
var collectionSchema = new Schema({
    event_id:  String,
    user_id:  String,
    comment_id : String,
  }, {timestamps: { modify_date: 'modify_date' }, collection: table});
  collectionSchema.index({'event_id':1, 'user_id':1, 'comment_id': 1}, { unique: true });

module.exports = mongoose.model(table, collectionSchema);