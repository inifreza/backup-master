var mongoose = require('mongoose');
var Schema = mongoose.Schema;
let table = "NewsShares";
var collectionSchema = new Schema({
    news_id: String,
    user_id: String,
    modify_date: { type: Date, default: Date.now },
    create_date: { type: Date }
  }, {collection: table})
// {timestamps: { modify_date: 'modify_date' }, collection: table});
module.exports = mongoose.model(table, collectionSchema);
