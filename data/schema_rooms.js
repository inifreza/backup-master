"use strict";
var mongoose = require('mongoose');
mongoose.set('useCreateIndex', true);
const Schema = mongoose.Schema;

const table = "Rooms";
const collectionSchema = new Schema({
  title: {
    type: String
  },
  type: {
    type: String
  },
  creator_id: {
    type: String
  },
  creator_type: {
    type: String
  },
  img: {
    type: String,
    default: null
  },
  publish: {
    type: Number,
    default: 1
  },
  modify_date: {
    type: Date,
    default: Date.now
  },
  create_date: {
    type: Date
  }
}, {collection: table});


module.exports = mongoose.model(table, collectionSchema);