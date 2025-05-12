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

router.get("/media", (req, res) => {
  res.status(200).render("media", {
    app_name: process.env.APP_NAME,
    url: process.env.URL,
    title: "Media",
    description: config.page_desc,
    keywords: "Media, church, Angel Wings Power Assembly",
  });
});

router.get("/resources", (req, res) => {
  res.status(200).render("resources", {
    app_name: process.env.APP_NAME,
    url: process.env.URL,
    title: "Resources",
    description: config.page_desc,
    keywords: "Resources, church, Angel Wings Power Assembly",
  });
});

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
