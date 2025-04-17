const express = require("express");

const router = express.Router();

router.get("/", (req, res) => {
  res.status(200).json({
    message: "Welcome to the Angel Wings Power Assembly",
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
