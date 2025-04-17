const Feedback = require("../models/Feedback");
const { asyncWrapper } = require("../utils/async");

exports.submitFeedback = asyncWrapper(async (req, res) => {
  const { rating, comment } = req.body;
  const feedback = await Feedback.create({
    userId: req.user.id,
    rating,
    comment,
  });

  res
    .status(201)
    .json({ message: "Feedback submitted successfully", data: feedback });
});

exports.getAllFeedback = asyncWrapper(async (req, res) => {
  const feedbackList = await Feedback.find().populate("userId", "name email");
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
