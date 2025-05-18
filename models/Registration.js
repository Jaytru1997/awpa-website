const mongoose = require("mongoose");

const RegistrationSchema = new mongoose.Schema({
  user: {
    name: String,
    email: String,
  },
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Event",
    required: true,
  },
  registeredAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Registration", RegistrationSchema);
