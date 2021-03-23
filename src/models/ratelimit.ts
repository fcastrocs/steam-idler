/**
 * API ratelimit
 */

import mongoose from "mongoose";
const Schema = mongoose.Schema;

let apiLimiter = new Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "user" },
  createdAt: { type: Date, default: Date.now, expires: "5m" },
});

module.exports = mongoose.model("ratelimit", apiLimiter);
