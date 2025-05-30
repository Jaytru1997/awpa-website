const mongoose = require("mongoose");

const SubscriberSchema = new mongoose.Schema({
  user: { type: String, unique: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Subscriber", SubscriberSchema);
