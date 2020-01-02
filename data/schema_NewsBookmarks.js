var mongoose = require('mongoose');
mongoose.set('useCreateIndex', true);
var Schema = mongoose.Schema;
let table = "NewsBookmarks";
var collectionSchema = new Schema({
    news_id: String,
    user_id: String,
    modify_date: { type: Date, default: Date.now },
    create_date: { type: Date }
  }, {timestamps: { modify_date: 'modify_date' }, collection: table});
  collectionSchema.index({'news_id':1, 'user_id':1}, { unique: true });

module.exports = mongoose.model(table, collectionSchema);