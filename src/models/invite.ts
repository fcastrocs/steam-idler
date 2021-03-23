/**
 * Invite to steamidler.com
 */

import mongoose from "mongoose";
const Schema = mongoose.Schema;

let invite = new Schema({
  token: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: "3h" },
});

module.exports = mongoose.model("invite", invite);
