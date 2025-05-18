const Media = require("../models/Media");
const Blog = require("../models/Blog");
const Event = require("../models/Event");
const User = require("../models/User");
const { asyncWrapper } = require("../utils/async");
const { StatusCodes } = require("http-status-codes");
const { config } = require("../config/config");

// Render Admin Dashboard
exports.renderAdminDashboard = asyncWrapper(async (req, res) => {
  const events = await Event.find().lean();
  const blogs = await Blog.find().lean();
  const media = await Media.find().lean();
  const ebooks = media.filter((el) => el.type === "ebook");
  const audios = media.filter((el) => el.type === "audio");
  const videos = media.filter((el) => el.type === "video");

  return res.status(StatusCodes.OK).render("admin/dashboard", {
    app_name: process.env.APP_NAME,
    url: process.env.URL,
    title: "Admin Dashboard",
    description: config.page_desc,
    keywords: "home, welcome, church, Angel Wings Power Assembly",
    events,
    blogs,
    ebooks,
    audios,
    videos,
  });
});

// User Controls
// deactivate User
exports.toggleUserStatus = asyncWrapper(async (req, res) => {
  const userId = req.params.id;

  // Find user by ID
  const user = await User.findById(userId);

  // Check if user exists
  if (!user) {
    return res.status(404).render("status/status", {
      app_name: process.env.APP_NAME,
      url: process.env.URL,
      title: "Home",
      description: config.page_desc,
      keywords: "home, welcome, church, Angel Wings Power Assembly",
      status: 404,
      message_title: "User Nor Found",
      message: "The user you have requested cannot be found.",
      actionUrl: "/admin/users",
      actionText: "Back to users",
    });
  }

  // Toggle user status (assuming status is a boolean field, e.g., isActive)
  user.isActive = !user.isActive;

  // Save the updated user
  await user.save({ validateBeforeSave: false });

  // Send response
  return res.status(200).render("status/status", {
    app_name: process.env.APP_NAME,
    url: process.env.URL,
    title: "Home",
    description: config.page_desc,
    keywords: "home, welcome, church, Angel Wings Power Assembly",
    status: 200,
    message_title: "User Status Updated",
    message: "This user's status has been updated successfully.",
    actionUrl: "/admin/users",
    actionText: "Back to users",
  });
});
