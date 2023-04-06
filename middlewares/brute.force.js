
/** 
 * This middelware is used to prevent brute force attack
 */

const ExpressBrute = require('express-brute');
const MongooseStore = require("express-brute-mongoose");
const BruteForceSchema = require("express-brute-mongoose/dist/schema");
const mongoose = require("mongoose");

const model = mongoose.model(
    "bruteforce",
    new mongoose.Schema(BruteForceSchema)
);

const store = new MongooseStore(model);

const bruteforce = new ExpressBrute(store, {
    freeRetries: 5,
    minWait: 1*60*1000,
    maxWait: 15*60*1000 // 15 minutes
});

module.exports = { bruteforce };