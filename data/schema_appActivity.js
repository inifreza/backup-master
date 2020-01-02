var mongoose = require('mongoose');
var Schema = mongoose.Schema;
let table = "AppActivity";
var collectionSchema = new Schema({
    user_id: String,
    type: String,
    date: String,
    modify_date: { type: Date, default: Date.now },
    create_date: { type: Date }
  }, {collection: table})
// {timestamps: { modify_date: 'modify_date' }, collection: table});
module.exports = mongoose.model(table, collectionSchema);
