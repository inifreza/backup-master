var mongoose = require('mongoose');
mongoose.set('useCreateIndex', true);
var Schema = mongoose.Schema;
let table = "EventBookmarks";
var collectionSchema = new Schema({
    event_id: String,
    user_id: String,
    modify_date: { type: Date, default: Date.now },
    create_date: { type: Date }
  }, 
{collection: table}
// {timestamps: { modify_date: 'modify_date' }, 
// }
);
  collectionSchema.index({'event_id':1, 'user_id':1}, { unique: true });

module.exports = mongoose.model(table, collectionSchema);