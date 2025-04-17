const jwt = require("jsonwebtoken");
const { promisify } = require("util");
const Blacklist = require("../models/Blacklist");
const { asyncWrapper } = require("../utils/async");

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
    return res.status(403).send("Access denied. Token is invalidated.");
  }

  if (!token) {
    return next(new AppError("You are not logged in!", 401));
  }

  //verify token
  const decoded = await promisify(jwt.verify)(token, config.JWT_SECRET);

  //check if user still exists
  let currentUser = await User.findById(decoded.id).select("-password");
  if (!currentUser) {
    return res.status(401).json({ message: "User no longer exists." });
  }

  //check if user changed password after the token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    logger.error(
      `User recently changed password! Please log in again. ${req.ip}`
    );
    return res.status(401).json({ message: "User recently changed password!" });
  }

  //grant access to protected route
  req.user = currentUser;
  next();
});

module.exports = authMiddleware;
