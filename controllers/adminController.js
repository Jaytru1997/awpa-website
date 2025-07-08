const Media = require("../models/Media");
const Blog = require("../models/Blog");
const Event = require("../models/Event");
const User = require("../models/User");
const Feedback = require("../models/Feedback");
const Subscriber = require("../models/Subscriber");
const { asyncWrapper } = require("../utils/async");
const { StatusCodes } = require("http-status-codes");
const { config } = require("../config/config");
const sanitizeHtml = require("sanitize-html");
const Payment = require("../models/Payment");

// Render Admin Dashboard
exports.renderAdminDashboard = asyncWrapper(async (req, res) => {
  const events = await Event.find().lean();
  const blogs = await Blog.find().lean();
  const media = await Media.find().lean();
  const ebooks = media.filter((el) => el.type === "ebook");
  const audios = media.filter((el) => el.type === "audio");
  const videos = media.filter((el) => el.type === "video");
  const testimonies = await Feedback.find({ isApproved: false }).lean();
  const subscribers = await Subscriber.find().lean();
  const pendingPurchasesCount = await Payment.countDocuments({
    status: "pending",
  });

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
    testimonies,
    subscribers,
    pendingPurchasesCount,
  });
});

exports.renderChurchDetailsDashboard = asyncWrapper(async (req, res) => {
  return res.status(StatusCodes.OK).render("admin/church-details", {
    app_name: process.env.APP_NAME,
    url: process.env.URL,
    title: "Admin Dashboard",
    description: config.page_desc,
    keywords: "home, welcome, church, Angel Wings Power Assembly",
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

exports.adminSubmitFeedBack = asyncWrapper(async (req, res) => {
  const { name, email, title, comment } = req.body;
  const feedback = await Feedback.create({
    user: {
      name,
      email,
    },
    title,
    comment,
    isApproved: true,
  });

  return res.status(StatusCodes.CREATED).render("status/status", {
    app_name: process.env.APP_NAME,
    url: process.env.URL,
    title: "Feedback Success",
    description: config.page_desc,
    keywords: "home, welcome, church, Angel Wings Power Assembly",
    status: 201,
    message_title: "Testimony Submitted",
    message: "Testimony has been recorded successfully",
    actionUrl: "/admin/testimonies",
    actionText: "Back to testimonies",
  });
});

exports.approveFeedback = asyncWrapper(async (req, res) => {
  try {
    const testimony = await Feedback.findByIdAndUpdate(
      req.params.id,
      { isApproved: true },
      { new: true }
    );
    if (!testimony) {
      return res.status(StatusCodes.NOT_FOUND).render("status/status", {
        app_name: process.env.APP_NAME,
        url: process.env.URL,
        title: "Home",
        description: config.page_desc,
        keywords: "home, welcome, church, Angel Wings Power Assembly",
        status: 404,
        message_title: "Not Found",
        message: "The testimony you have requested cannot be found.",
        actionUrl: "/admin/testimonies",
        actionText: "Back to testimonies",
      });
    }
    return res.status(StatusCodes.OK).render("status/status", {
      app_name: process.env.APP_NAME,
      url: process.env.URL,
      title: "Feedback Success",
      description: config.page_desc,
      keywords: "home, welcome, church, Angel Wings Power Assembly",
      status: 200,
      message_title: "Testimony Approved",
      message: "Testimony has been approved successfully",
      actionUrl: "/admin/testimonies",
      actionText: "Back to testimonies",
    });
  } catch (error) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .render("status/status", {
        app_name: process.env.APP_NAME,
        url: process.env.URL,
        title: "Feedback Success",
        description: config.page_desc,
        keywords: "home, welcome, church, Angel Wings Power Assembly",
        status: 500,
        message_title: "Error",
        message: "Error approving testimony",
        actionUrl: "/admin/testimonies",
        actionText: "Back to testimonies",
      });
  }
});

exports.unapproveFeedback = asyncWrapper(async (req, res) => {
  try {
    const testimony = await Feedback.findByIdAndUpdate(
      req.params.id,
      { isApproved: false },
      { new: true }
    );
    if (!testimony) {
      return res.status(StatusCodes.NOT_FOUND).render("status/status", {
        app_name: process.env.APP_NAME,
        url: process.env.URL,
        title: "Home",
        description: config.page_desc,
        keywords: "home, welcome, church, Angel Wings Power Assembly",
        status: 404,
        message_title: "Not Found",
        message: "The testimony you have requested cannot be found.",
        actionUrl: "/admin/testimonies",
        actionText: "Back to testimonies",
      });
    }
    return res.status(StatusCodes.OK).render("status/status", {
      app_name: process.env.APP_NAME,
      url: process.env.URL,
      title: "Feedback Success",
      description: config.page_desc,
      keywords: "home, welcome, church, Angel Wings Power Assembly",
      status: 200,
      message_title: "Testimony Unapproved",
      message: "Testimony has been unapproved successfully",
      actionUrl: "/admin/testimonies",
      actionText: "Back to testimonies",
    });
  } catch (error) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .render("status/status", {
        app_name: process.env.APP_NAME,
        url: process.env.URL,
        title: "Feedback Success",
        description: config.page_desc,
        keywords: "home, welcome, church, Angel Wings Power Assembly",
        status: 500,
        message_title: "Error",
        message: "Error unapproving testimony",
        actionUrl: "/admin/testimonies",
        actionText: "Back to testimonies",
      });
  }
});

exports.deleteFeedback = asyncWrapper(async (req, res) => {
  try {
    const testimony = await Feedback.findByIdAndDelete(req.params.id);
    if (!testimony) {
      return res.status(StatusCodes.NOT_FOUND).render("status/status", {
        app_name: process.env.APP_NAME,
        url: process.env.URL,
        title: "Home",
        description: config.page_desc,
        keywords: "home, welcome, church, Angel Wings Power Assembly",
        status: 404,
        message_title: "Not Found",
        message: "The testimony you have requested cannot be found.",
        actionUrl: "/admin/testimonies",
        actionText: "Back to testimonies",
      });
    }
    res.redirect("/admin/testimonies?success=Testimony deleted.");
  } catch (error) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .render("status/status", {
        app_name: process.env.APP_NAME,
        url: process.env.URL,
        title: "Feedback Success",
        description: config.page_desc,
        keywords: "home, welcome, church, Angel Wings Power Assembly",
        status: 500,
        message_title: "Error",
        message: "Error deleting testimony",
        actionUrl: "/admin/testimonies",
        actionText: "Back to testimonies",
      });
  }
});

exports.renderSubscribersDashboard = asyncWrapper(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const perPage = 10;

  // Validate page number
  if (page < 1) {
    return res.status(StatusCodes.NOT_FOUND).render("status/status", {
      app_name: process.env.APP_NAME,
      url: process.env.URL,
      title: "Page Not Found",
      description: config.page_desc,
      keywords: "home, welcome, church, Angel Wings Power Assembly",
      status: 404,
      message_title: "Page Not Found",
      message: "The page you are looking for is not available on this website.",
      actionUrl: "/admin/subscribers",
      actionText: "Back to subscribers",
    });
  }

  try {
    // Fetch total count and paginated subscribers
    const total = await Subscriber.countDocuments();
    const subscribers = await Subscriber.find()
      .select("user")
      .skip((page - 1) * perPage)
      .limit(perPage)
      .lean();

    // Calculate total pages
    const totalPages = Math.ceil(total / perPage);

    // Check if page is out of range
    if (page > totalPages && total > 0) {
      return res.status(StatusCodes.NOT_FOUND).render("status/status", {
        app_name: process.env.APP_NAME,
        url: process.env.URL,
        title: "Page Not Found",
        description: config.page_desc,
        keywords: "home, welcome, church, Angel Wings Power Assembly",
        status: 404,
        message_title: "Page Not Found",
        message:
          "The page you are looking for is not available on this website.",
        actionUrl: "/admin/subscribers",
        actionText: "Back to subscribers",
      });
    }

    return res.status(StatusCodes.OK).render("admin/subscribers", {
      app_name: process.env.APP_NAME,
      url: process.env.URL,
      title: "Page Not Found",
      description: config.page_desc,
      keywords: "home, welcome, church, Angel Wings Power Assembly",
      title: "Subscribers",
      subscribers,
      page,
      perPage,
      total,
      totalPages,
    });
  } catch (error) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .render("status/status", {
        app_name: process.env.APP_NAME,
        url: process.env.URL,
        title: "Server Error",
        description: config.page_desc,
        keywords: "home, welcome, church, Angel Wings Power Assembly",
        status: 500,
        message_title: "Server Error",
        message: `${error.message}`,
        actionUrl: "/admin/subscribers",
        actionText: "Back to subscribers",
      });
  }
});

exports.deleteSubscriber = asyncWrapper(async (req, res) => {
  try {
    const subscriber = await Subscriber.findByIdAndDelete(req.params.id);
    if (!subscriber) {
      return res.status(StatusCodes.NOT_FOUND).render("status/status", {
        app_name: process.env.APP_NAME,
        url: process.env.URL,
        title: "Server Error",
        description: config.page_desc,
        keywords: "home, welcome, church, Angel Wings Power Assembly",
        status: 404,
        message_title: "Not found",
        message: "Could not find this subscriber on our database.",
        actionUrl: "/admin/subscribers",
        actionText: "Back to subscribers",
      });
    }
    return res.status(StatusCodes.OK).render("status/status", {
      app_name: process.env.APP_NAME,
      url: process.env.URL,
      title: "Server Error",
      description: config.page_desc,
      keywords: "home, welcome, church, Angel Wings Power Assembly",
      status: 200,
      message_title: "Subscriber deleted",
      message: "The subscriber has been removed from our database.",
      actionUrl: "/admin/subscribers",
      actionText: "Back to subscribers",
    });
  } catch (error) {
    console.error("Error deleting subscriber:", error);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .render("status/status", {
        app_name: process.env.APP_NAME,
        url: process.env.URL,
        title: "Server Error",
        description: config.page_desc,
        keywords: "home, welcome, church, Angel Wings Power Assembly",
        status: 500,
        message_title: "Server Error",
        message: "Failed to delete subscriber.",
        actionUrl: "/admin/subscribers",
        actionText: "Back to subscribers",
      });
  }
});

exports.renderTestimoniesDashboard = asyncWrapper(async (req, res) => {
  const unapprovedPage = parseInt(req.query.unapprovedPage) || 1;
  const approvedPage = parseInt(req.query.approvedPage) || 1;
  const perPage = 10;

  // Validate page numbers
  if (unapprovedPage < 1 || approvedPage < 1) {
    return res.status(StatusCodes.NOT_FOUND).render("status/status", {
      app_name: process.env.APP_NAME,
      url: process.env.URL,
      title: "Not Found",
      description: config.page_desc,
      keywords: "home, welcome, church, Angel Wings Power Assembly",
      status: 404,
      message_title: "Not Found",
      message: "Page not found.",
      actionUrl: "/admin/tesitmonies",
      actionText: "Back to testimonies",
    });
  }

  try {
    // Fetch counts
    const unapprovedTotal = await Feedback.countDocuments({ approved: false });
    const approvedTotal = await Feedback.countDocuments({ approved: true });

    // Fetch paginated testimonies
    const unapprovedTestimonies = await Feedback.find({ isApproved: false })
      .select("title comment isApproved createdAt")
      .skip((unapprovedPage - 1) * perPage)
      .limit(perPage)
      .lean();
    const approvedTestimonies = await Feedback.find({ isApproved: true })
      .select("title comment isApproved createdAt")
      .skip((approvedPage - 1) * perPage)
      .limit(perPage)
      .lean();

    // Sanitize testimonies
    const sanitizeTestimony = (testimony) => ({
      ...testimony,
      title: sanitizeHtml(testimony.title, {
        allowedTags: ["p", "strong", "em", "br"],
        allowedAttributes: {},
      }),
      content: sanitizeHtml(testimony.comment, {
        allowedTags: ["p", "strong", "em", "br"],
        allowedAttributes: {},
      }),
    });

    const sanitizedUnapproved = unapprovedTestimonies.map(sanitizeTestimony);
    const sanitizedApproved = approvedTestimonies.map(sanitizeTestimony);

    // Calculate total pages
    const unapprovedTotalPages = Math.ceil(unapprovedTotal / perPage);
    const approvedTotalPages = Math.ceil(approvedTotal / perPage);

    // Check page ranges
    if (
      (unapprovedPage > unapprovedTotalPages && unapprovedTotal > 0) ||
      (approvedPage > approvedTotalPages && approvedTotal > 0)
    ) {
      return res.status(StatusCodes.NOT_FOUND).render("status/status", {
        app_name: process.env.APP_NAME,
        url: process.env.URL,
        title: "Not Found",
        description: config.page_desc,
        keywords: "home, welcome, church, Angel Wings Power Assembly",
        status: 404,
        message_title: "Not Found",
        message: "Page not found.",
        actionUrl: "/admin/tesitmonies",
        actionText: "Back to testimonies",
      });
    }

    res.render("admin/testimonies", {
      app_name: process.env.APP_NAME,
      url: process.env.URL,
      title: "Testimonies",
      description: config.page_desc,
      keywords: "home, welcome, church, Angel Wings Power Assembly",
      unapprovedTestimonies: sanitizedUnapproved,
      approvedTestimonies: sanitizedApproved,
      unapprovedPage,
      approvedPage,
      perPage,
      unapprovedTotal,
      approvedTotal,
      unapprovedTotalPages,
      approvedTotalPages,
      success: req.query.success,
      error: req.query.error,
    });
  } catch (error) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .render("status/status", {
        app_name: process.env.APP_NAME,
        url: process.env.URL,
        title: "Server Error",
        description: config.page_desc,
        keywords: "home, welcome, church, Angel Wings Power Assembly",
        status: 500,
        message_title: "Server Error",
        message: `${error.message}`,
        actionUrl: "/admin/testimonies",
        actionText: "Back to subscribers",
      });
  }
});
