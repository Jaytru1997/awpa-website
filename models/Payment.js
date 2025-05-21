const mongoose = require("mongoose");
const PaymentSchema = new mongoose.Schema({
  tx_ref: { type: String, required: true, unique: true },
  amount: { type: Number, required: true },
  email: { type: String, required: true },
  phone_number: { type: String },
  description: { type: String },
  products: [
    {
      product_id: { type: String },
      product_type: { type: String, enum: ["audio", "ebook", "event"] },
    },
  ],
  status: {
    type: String,
    enum: ["pending", "completed", "failed"],
    default: "pending",
  },
  createdAt: { type: Date, default: Date.now },
});
module.exports = mongoose.model("Payment", PaymentSchema);
