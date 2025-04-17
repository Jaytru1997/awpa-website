exports.checkRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ message: "Access Denied: Insufficient permissions" });
    }
    next();
  };
};

exports.restricttoOwner = (req, res, next) => {
  if (req.user._id.toString() !== req.params.id) {
    return res.status(403).json({
      message: "Access Denied: Insufficient permissions to perform this action",
    });
  }
  next();
};
