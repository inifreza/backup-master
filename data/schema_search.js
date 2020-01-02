var mongoose = require('mongoose');
var Schema = mongoose.Schema;
let table = "Search";
var collectionSchema = new Schema({
    type_id: String,
    type: String,
    title: String,
    description: String,
    img: String,
    modify_date: { type: Date, default: Date.now },
    create_date: { type: Date }
  }, {collection: table})


collectionSchema.index({ title: 'text', description: 'text'}, {
    weights: {
        title: 10,
        description: 2,
    },
  });
// {timestamps: { modify_date: 'modify_date' }, collection: table});
module.exports = mongoose.model(table, collectionSchema);
