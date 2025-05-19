const mongoose = require("mongoose");

const MediaSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: String,
    type: {
      type: String,
      enum: ["image", "video", "ebook", "audio"],
      required: true,
    },
    url: { type: String, required: true },
    image: String,
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    tags: [{ type: String }],
    category: String,
    favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    priceStatus: {
      type: String,
      enum: ["free", "paid"],
      default: "free",
    },
    price: {
      type: Number,
      default: 0,
    },
    author: String,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Media", MediaSchema);
