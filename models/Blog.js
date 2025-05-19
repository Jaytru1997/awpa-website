const mongoose = require("mongoose");

const BlogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    publisher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    author: String,
    categories: {
      type: String,
      enum: ["sermon", "devotional", "teaching"],
      default: "sermon",
    },
    tags: {
      type: [String],
      default: [],
    },
    language: {
      type: String,
      enum: ["en", "fr", "es", "de", "ha", "yo", "ig"], // languages
      default: "en",
    },
    priceStatus: {
      type: String,
      enum: ["free", "paid"],
      default: "free",
    },
    price: {
      type: Number,
      default: 0,
    },
    images: [
      {
        url: {
          type: String,
          required: true,
        },
        description: {
          type: String,
          enum: ["thumbnail", "banner", "gallery"],
          default: "",
        },
      },
    ],
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Blog", BlogSchema);
