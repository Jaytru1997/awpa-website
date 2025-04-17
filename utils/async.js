const logger = require("../services/logger");
exports.asyncWrapper = (fn) => {
  return async (req, res, next) => {
    try {
      await fn(req, res, next);
    } catch (err) {
      logger.error(err);
      next(err);
    }
  };
};
