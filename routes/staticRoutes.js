const express = require("express");
require("dotenv").config();
const { config } = require("../config/config");

const router = express.Router();

router.get("/", (req, res) => {
  res.status(200).render("index", {
    app_name: process.env.APP_NAME,
    url: process.env.URL,
    title: "Home",
    description: config.page_desc,
    keywords: "home, welcome, church, Angel Wings Power Assembly",
  });
});

router.get("/who-we-are", (req, res) => {
  res.status(200).json({
    message: "We are a team of dedicated professionals.",
  });
});

router.get("/visit-us", (req, res) => {
  res.status(200).json({
    message: "Visit us at our headquarters.",
  });
});

router.get("/media", (req, res) => {
  res.status(200).json({
    message: "Check out our media resources.",
  });
});

router.get("/resources", (req, res) => {
  res.status(200).json({
    message: "Explore our resources.",
  });
});

router.get("/giving", (req, res) => {
  res.status(200).json({
    message: "Support us by giving.",
  });
});

router.get("/programs-and-events", (req, res) => {
  res.status(200).json({
    message: "Join our programs and events.",
  });
});

module.exports = router;
