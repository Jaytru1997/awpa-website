const User = require("../models/User");
Blacklist = require("../models/Blacklist");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { asyncWrapper } = require("../utils/async");
const { sendEmail } = require("../services/emailService");

exports.login = asyncWrapper(async (req, res) => {
  const { email, password } = req.body;

  // Check if user exists
  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ message: "Invalid credentials" });

  // Compare password
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

  // Generate token
  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );

  res.status(200).json({ token });
});

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

  res.status(statusCode).json({
    status: "success",
    token,
    data: user,
  });
};

exports.register = asyncWrapper(async (req, res, next) => {
  const { email, password, name } = req.body;

  const message_1 = `Welcome to ${process.env.APP_NAME}! We're delighted to have you with us. You're now part of a community of people who are passionate about their faith and are committed to living a godly lifestyle.`;

  const message_2 = `If you need assistance, contact our team at [contact@${process.env.URL}]. We're here to ensure you have a smooth onboarding experience.`;

  try {
    const user = await User.create({
      name,
      email,
      password,
    });
    if (!user) {
      return res.status(400).json({
        status: "failed",
        message: "User not created",
      });
    }
    await sendEmail({
      email,
      subject: `Welcome to ${process.env.APP_NAME}!`,
      header: `Welcome to ${process.env.APP_NAME}!`,
      message_1,
      message_2,
    });

    createSendToken(user, 201, res);
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
    return next(new AppError("Please provide email and password!", 400));
  }

  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await user.comparePassword(password))) {
    return next(new AppError("Invalid email or password!", 401));
  }
  if (user.isActive === true) {
    const token = signToken(user._id, user.role);

    res.status(200).json({
      status: "success",
      token,
      data: user,
    });
  } else {
    res.status(400).json({
      status: "failed",
      message: "USer account deactivated",
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
