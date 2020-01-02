"use strict";
var mongoose = require('mongoose');

const Schema = mongoose.Schema;
const table = "Users";
const collectionSchema = new Schema(
    {
        user_id: {
            type: String,
            default: null
        },
        name: {
            type: String,
            default: null
        },
        email: {
            type: String,
            default: null
        },
        phone: {
            type: String,
            default: null
        },
        phone1: {
            type: String,
            default: null
        },
        company: {
            type: String,
            default: null
        },
        position: {
            type: String,
            default: null
        },
        alumni: {
            type: String,
            default: null
        },
        dob: {
            type: String,
            default: null
        },
        gender: {
            type: String,
            default: null
        },
        img: {
            type: String,
            default: null
        },
        verified: {
            type: String,
            default: null
        },
        publish: {
            type: String,
            default: null
        },
        join_date: {
            type: String,
            default: null
        },
        lineservice_id: {
            type: String,
            default: null
        },
        type: {
            type: String,
            default: null
        },
        batch: {
            type: String,
            default: null
        },
        type: {
            type: String,
            default: null
        },
        last_seen: { type: Date, default: Date.now },
        create_date: { type: Date},
        modify_date: { type: Date},
    },
  { collection: table }
);
module.exports = mongoose.model(table, collectionSchema);
