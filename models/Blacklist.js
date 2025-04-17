const mongoose = require("mongoose");
require("dotenv").config();

const blacklistSchema = new mongoose.Schema({
  token: { type: String, required: true, unique: true },
  blacklistedAt: { type: Date, default: Date.now }, // Timestamp when the token was blacklisted
});

// Add an index to automatically delete documents after a specific duration

const expireCalc = process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60; // The `expireAfterSeconds` value is set to x days (x * 24 * 60 * 60 = x seconds)
blacklistSchema.index({ blacklistedAt: 1 }, { expireAfterSeconds: expireCalc });

module.exports = mongoose.model("Blacklist", blacklistSchema);
