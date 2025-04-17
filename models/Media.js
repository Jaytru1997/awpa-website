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
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    tags: [{ type: String }],
    category: String,
    views: { type: Number, default: 0 },
    ratings: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        rating: { type: Number, min: 1, max: 5 },
        createdAt: { type: Date, default: Date.now },
      },
    ],
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
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Media", MediaSchema);
