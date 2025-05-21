const express = require("express");
require("dotenv").config();
const { config } = require("../config/config");

const Feedback = require("../models/Feedback");
const Media = require("../models/Media");
const Event = require("../models/Event");
const Blog = require("../models/Blog");
const { asyncWrapper } = require("../utils/async");

const router = express.Router();

router.get(
  "/",
  asyncWrapper(async (req, res) => {
    // Find events with startDate greater than or equal to today
    // Sort by startDate in ascending order and limit to 1
    const today = new Date();
    const event = await Event.findOne({ startDate: { $gte: today } })
      .sort({ startDate: 1 })
      .select("title description startDate location banner endDate"); // Select relevant fields

    const blog = await Blog.find({})
      .sort({ createdAt: -1 })
      .select("title content createdAt author images tags")
      .populate("author", "name");

    const features = Array.from(blog).slice(-1); // last four items in blog array

    res.status(200).render("index", {
      app_name: process.env.APP_NAME,
      url: process.env.URL,
      title: "Home",
      description: config.page_desc,
      keywords: "home, welcome, church, Angel Wings Power Assembly",
      event,
      blog,
      features,
    });
  })
);

router.get("/who-we-are", (req, res) => {
  res.status(200).render("who-we-are", {
    app_name: process.env.APP_NAME,
    url: process.env.URL,
    title: "Who We Are",
    description: config.page_desc,
    keywords: "Who we are, about, church, Angel Wings Power Assembly",
  });
});

router.get("/visit-us", (req, res) => {
  res.status(200).render("visit-us", {
    app_name: process.env.APP_NAME,
    url: process.env.URL,
    title: "Visit Us",
    description: config.page_desc,
    keywords: "Visit Us, church, Angel Wings Power Assembly",
  });
});

router.get(
  "/church-media",
  asyncWrapper(async (req, res) => {
    const media = await Media.find();
    const audios = media.filter((el) => el.type === "audio");
    const videos = media.filter((el) => el.type === "video");
    const ebooks = media.filter((el) => el.type === "ebook");
    res.status(200).render("media", {
      app_name: process.env.APP_NAME,
      url: process.env.URL,
      title: "Media",
      description: config.page_desc,
      keywords: "Media, church, Angel Wings Power Assembly",
      audios,
      videos,
      ebooks,
    });
  })
);

router.get(
  "/resources",
  asyncWrapper(async (req, res) => {
    const blog = await Blog.find()
      .sort({ createdAt: -1 })
      .select("title content createdAt author images tags")
      .populate("author", "name");
    res.status(200).render("resources", {
      app_name: process.env.APP_NAME,
      url: process.env.URL,
      title: "Resources",
      description: config.page_desc,
      keywords: "Resources, church, Angel Wings Power Assembly",
      blog,
    });
  })
);

router.get("/giving", (req, res) => {
  res.status(200).render("giving", {
    app_name: process.env.APP_NAME,
    url: process.env.URL,
    title: "Giving",
    description: config.page_desc,
    keywords: "online donation, giving, church, Angel Wings Power Assembly",
  });
});

router.get("/programs-and-events", (req, res) => {
  res.status(200).render("programs-and-events", {
    app_name: process.env.APP_NAME,
    url: process.env.URL,
    title: "Programs and Events",
    description: config.page_desc,
    keywords: "Programs and Events, church, Angel Wings Power Assembly",
  });
});

module.exports = router;
