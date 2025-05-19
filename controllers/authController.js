const User = require("../models/User");
Blacklist = require("../models/Blacklist");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { asyncWrapper } = require("../utils/async");
const { sendEmail } = require("../services/emailService");
require("dotenv").config();
const { config } = require("../config/config");

const signToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id, user.role);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };
  if (process.env.NODE_ENV === "production") cookieOptions.secure = true;

  res.cookie("jwt", token, cookieOptions);

  user.password = undefined;

  res.status(statusCode);
};

exports.register = asyncWrapper(async (req, res, next) => {
  const { email, password, name } = req.body;

  const message_1 = `Welcome to ${process.env.APP_NAME}! We’re overjoyed to have you join our church family. You’re now part of a vibrant community dedicated to growing in faith, worshiping together, and serving with love.`;

  const message_2 = `Need help getting started? Our ministry team is here for you at contact@${process.env.URL}. We’re committed to supporting your spiritual journey every step of the way.`;

  const message_3 = `Join us for our next worship service or community event! Check your email for details on upcoming gatherings and ways to connect with our ${process.env.APP_NAME} family.`;

  try {
    // Check if user already exists
    const existingUser = await User.find({ email });
    if (existingUser.length > 0) {
      return res.status(400).render("status/status", {
        app_name: process.env.APP_NAME,
        url: process.env.URL,
        title: "Home",
        description: config.page_desc,
        keywords: "home, welcome, church, Angel Wings Power Assembly",
        status: 400,
        message_title: "User already exists",
        message: "User already exists with this email!",
        actionUrl: "/auth/login",
        actionText: "Go back to login",
      });
    }
    const user = await User.create({
      name,
      email,
      password,
    });
    if (!user) {
      return res.status(400).render("status/status", {
        app_name: process.env.APP_NAME,
        url: process.env.URL,
        title: "Home",
        description: config.page_desc,
        keywords: "home, welcome, church, Angel Wings Power Assembly",
        status: 400,
        message_title: "User not created",
        message: "User not created!",
        actionUrl: "/auth/register",
        actionText: "Go back to login",
      });
    }
    await sendEmail({
      email,
      subject: `Welcome to ${process.env.APP_NAME}!`,
      message_1,
      message_2,
      message_3,
      cta: "Login",
      ctaLink: `${process.env.URL}/auth/login`,
    });

    createSendToken(user, 201, res);
    if (user.role === "admin") {
      return res.redirect("/admin");
    }
    if (user.role === "manager") {
      return res.redirect("/manager");
    }
    if (user.role === "member") {
      return res.redirect("/member");
    }
  } catch (err) {
    logger.error(err);
    return next(
      new AppError("There was an error sending the email. Try again later!"),
      500
    );
  }
});

exports.login = asyncWrapper(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).render("status/status", {
      app_name: process.env.APP_NAME,
      url: process.env.URL,
      title: "Home",
      description: config.page_desc,
      keywords: "home, welcome, church, Angel Wings Power Assembly",
      status: 400,
      message_title: "Invalid credentials",
      message: "Please provide email and password!",
      actionUrl: "/auth/login",
      actionText: "Go back to login",
    });
  }

  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await user.comparePassword(password))) {
    return res.status(400).render("status/status", {
      app_name: process.env.APP_NAME,
      url: process.env.URL,
      title: "Home",
      description: config.page_desc,
      keywords: "home, welcome, church, Angel Wings Power Assembly",
      status: 400,
      message_title: "Invalid credentials",
      message: "Incorrect email or password!",
      actionUrl: "/auth/login",
      actionText: "Go back to login",
    });
  }
  if (user.isActive === true) {
    createSendToken(user, 200, res);
    if (user.role === "admin") {
      return res.redirect("/admin");
    }
    if (user.role === "manager") {
      return res.redirect("/manager");
    }
    if (user.role === "member") {
      return res.redirect("/member");
    }
  } else {
    res.status(400).render("status/status", {
      app_name: process.env.APP_NAME,
      url: process.env.URL,
      title: "Home",
      description: config.page_desc,
      keywords: "home, welcome, church, Angel Wings Power Assembly",
      status: 400,
      message_title: "Account not active",
      message: "Your account is not active. Please contact the admin.",
      actionUrl: "/auth/login",
      actionText: "Go back to login",
    });
  }
});

exports.forgotPassword = asyncWrapper(async (req, res, next) => {
  //get user based on posted email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return res.status(404).json({
      status: "failed",
      message: "There is no user with email address",
    });
  }

  //generate random token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  //send it to user's email
  const resetURL = `${req.get("origin")}/reset-password/${resetToken}`;
  // const resetURL = resetToken;

  const message = `Forgot your password? Submit a request with your new password and passwordConfirm to: \n\n ${resetURL}`;
  try {
    await sendEmail({
      email: user.email,
      subject: "Your password reset token (valid for 10 minutes)",
      header: "Your password reset token (valid for 10 minutes)",
      message,
    });

    res.status(200).json({
      status: "success",
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError("There was an error sending the email. Try again later!"),
      500
    );
  }
});

exports.resetPassword = asyncWrapper(async (req, res, next) => {
  //get user based on the token
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  //make sure the token is not expired and there is a user, set the new password
  if (!user) {
    return res.status(400).json({
      status: "failed",
      message: "Token is invalid or has expired",
    });
  }

  //update changedPasswordAt property for the user
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  //Log the user in, send JWT
  createSendToken(user, 200, res);
  next();
});

exports.updatePassword = asyncWrapper(async (req, res, next) => {
  //get user from collection
  const user = await User.findById(req.user.id).select("+password");

  //check if posted current password is correct
  if (!(await user.comparePassword(req.body.currentPassword))) {
    return next(new AppError("Your current password is wrong!", 401));
  }

  //update password
  user.password = req.body.password;
  await user.save();

  //Log user in, send JWT
  createSendToken(user, 200, res);
  next();
});
