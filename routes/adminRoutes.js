const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const { checkRole } = require("../middleware/rbacMiddleware");
const { access } = require("../config/access");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin management
 */

module.exports = router;
