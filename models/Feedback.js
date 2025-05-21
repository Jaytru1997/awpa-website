const mongoose = require("mongoose");

const FeedbackSchema = new mongoose.Schema({
  user: {
    email: String,
    name: String,
  },
  title: String,
  comment: { type: String, required: true },
  isApproved: {
    type: Boolean,
    default: false,
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Feedback", FeedbackSchema);
