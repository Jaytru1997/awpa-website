const Feedback = require("../models/Feedback");
const { asyncWrapper } = require("../utils/async");
require("dotenv").config();
const { StatusCodes } = require("http-status-codes");
const { config } = require("../config/config");
const { sendEmail } = require("../services/emailService");

exports.submitFeedback = asyncWrapper(async (req, res) => {
  const { name, email, title, comment } = req.body;
  const feedback = await Feedback.create({
    user: {
      name,
      email,
    },
    title,
    comment,
  });

  const options = {
    email: `contact@${process.env.URL}`,
    subject: "New Testimony Submitted",
    message_1: `${name} just shared a testimony on the church website.`,
    message_2:
      "Kindly login to the admin dashboard to approve the testimony on the website.",
    cta: "Go to dashboard",
    ctaLink: `https://${process.env.URL}/auth/login`,
  };

  await sendEmail(options);

  return res.status(StatusCodes.CREATED).render("status/status", {
    app_name: process.env.APP_NAME,
    url: process.env.URL,
    title: "Feedback Success",
    description: config.page_desc,
    keywords: "home, welcome, church, Angel Wings Power Assembly",
    status: 201,
    message_title: "Testimony Submitted",
    message:
      "Thank you for sharing the testimony of God's goodness in your life. We rejoice with you and thank God with you!",
    actionUrl: "/",
    actionText: "Back to website",
  });
});

exports.getAllFeedback = asyncWrapper(async (req, res) => {
  const feedbackList = await Feedback.find();
  res.status(200).json({ data: feedbackList });
});

exports.getFeedbackAnalytics = asyncWrapper(async (req, res) => {
  const analytics = await Feedback.aggregate([
    {
      $group: {
        _id: null,
        averageRating: { $avg: "$rating" },
        count: { $sum: 1 },
      },
    },
  ]);

  res
    .status(200)
    .json({ data: analytics[0] || { averageRating: 0, count: 0 } });
});
