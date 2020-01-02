"use strict";

const Mongoose = require("mongoose");
const table = "Messages";

const messageSchema = new Mongoose.Schema({
  room_id: {
    type: Mongoose.Schema.Types.ObjectId,
    ref: "Rooms"
  },
  user_id: {
    type: String
  },
  message: {
    type: String
  },
  publish: {
    type: Number,
    default: 1
  },
  file: {
    type: String
  },
  seen: {
    type: Number,
    default: 0
  },
  delete: {
    type: Number,
    default: 0,
    min: 0,
    max: 3
  },
  modify_date: {
    type: Date,
    default: Date.now
  },
  create_date: {
    type: Date,
    default: Date.now
  }
},{ collection: table }
);

var messageModel = Mongoose.model(table, messageSchema);
module.exports = messageModel;
