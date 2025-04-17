const Notification = require("../models/Notification");
const { asyncWrapper } = require("../utils/async");

exports.createNotification = asyncWrapper(async (req, res) => {
  const { userId, message, type } = req.body;
  const notification = await Notification.create({ userId, message, type });

  res.status(201).json({ message: "Notification created", data: notification });
});

exports.getUserNotifications = asyncWrapper(async (req, res) => {
  const notifications = await Notification.find({ userId: req.user.id });
  res.status(200).json({ data: notifications });
});
