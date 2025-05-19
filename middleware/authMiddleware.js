const jwt = require("jsonwebtoken");
const { promisify } = require("util");
const User = require("../models/User");
const Blacklist = require("../models/Blacklist");
const { StatusCodes } = require("http-status-codes");
const { config } = require("../config/config");
const { asyncWrapper } = require("../utils/async");
const logger = require("../services/logger");
require("dotenv").config();

const authMiddleware = asyncWrapper(async (req, res, next) => {
  //get token from header
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  const isBlacklisted = await Blacklist.findOne({ token });
  if (isBlacklisted) {
    return res.status(StatusCodes.FORBIDDEN).render("status/status", {
      app_name: process.env.APP_NAME,
      url: process.env.URL,
      title: "Access Denied",
      description: config.page_desc,
      keywords: "home, welcome, church, Angel Wings Power Assembly",
      status: 403,
      message_title: "Access Denied",
      message: "Your login session has expired. Log in and try again.",
      actionUrl: "/auth/login",
      actionText: "Login",
    });
  }

  if (!token) {
    return res.status(StatusCodes.UNAUTHORIZED).render("status/status", {
      app_name: process.env.APP_NAME,
      url: process.env.URL,
      title: "Access Denied",
      description: config.page_desc,
      keywords: "home, welcome, church, Angel Wings Power Assembly",
      status: 401,
      message_title: "Access Denied",
      message: "You are not logged in!",
      actionUrl: "/auth/login",
      actionText: "Login",
    });
  }

  //verify token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  //check if user still exists
  let currentUser = await User.findById(decoded.id).select("-password");
  if (!currentUser) {
    return res.status(StatusCodes.UNAUTHORIZED).render("status/status", {
      app_name: process.env.APP_NAME,
      url: process.env.URL,
      title: "Access Denied",
      description: config.page_desc,
      keywords: "home, welcome, church, Angel Wings Power Assembly",
      status: 401,
      message_title: "Access Denied",
      message: "User no longer exists",
      actionUrl: "/auth/login",
      actionText: "Login",
    });
  }

  //check if user changed password after the token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    logger.error(
      `User recently changed password! Please log in again. ${req.ip}`
    );
    return res.status(StatusCodes.UNAUTHORIZED).render("status/status", {
      app_name: process.env.APP_NAME,
      url: process.env.URL,
      title: "Access Denied",
      description: config.page_desc,
      keywords: "home, welcome, church, Angel Wings Power Assembly",
      status: 401,
      message_title: "Access Denied",
      message: "User changed passwords recently",
      actionUrl: "/auth/login",
      actionText: "Login",
    });
  }

  //grant access to protected route
  req.user = currentUser;
  next();
});

module.exports = authMiddleware;
