const { StatusCodes } = require("http-status-codes");
const { config } = require("../config/config");

exports.checkRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(StatusCodes.FORBIDDEN).render("status/status", {
        app_name: process.env.APP_NAME,
        url: process.env.URL,
        title: "Access Denied",
        description: config.page_desc,
        keywords: "home, welcome, church, Angel Wings Power Assembly",
        status: 201,
        message_title: "Access Denied",
        message: "You are not authorised to view this page",
        actionUrl: "/auth/login",
        actionText: "Login",
      });
    }
    next();
  };
};

exports.restricttoOwner = (req, res, next) => {
  if (req.user._id.toString() !== req.params.id) {
    return res.status(StatusCodes.FORBIDDEN).render("status/status", {
      app_name: process.env.APP_NAME,
      url: process.env.URL,
      title: "Access Denied",
      description: config.page_desc,
      keywords: "home, welcome, church, Angel Wings Power Assembly",
      status: 201,
      message_title: "Access Denied",
      message: "Access Denied: Insufficient permissions to perform this action",
      actionUrl: "/auth/login",
      actionText: "Login",
    });
  }
  next();
};
