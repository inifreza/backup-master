var mongoose = require('mongoose');
mongoose.set('useCreateIndex', true);
var Schema = mongoose.Schema;

let table = "PostReport";
var collectionSchema = new Schema({
    post_id: String,
    user_id: String,
    reason : String,
    type  : String
  }, {timestamps: { modify_date: 'modify_date' }, collection: table});
  collectionSchema.index({'post_id':1, 'user_id':1, 'type':1}, { unique: true });


module.exports = mongoose.model(table, collectionSchema);