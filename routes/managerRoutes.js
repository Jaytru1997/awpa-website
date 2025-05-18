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

router.get("/", authMiddleware, checkRole([access.manager]), (req, res) => {
  res.status(200).render("admin/index", {
    app_name: process.env.APP_NAME,
    url: process.env.URL,
    title: "Admin Dashboard",
    description: "Admin Dashboard",
    keywords: "admin, dashboard, church, Angel Wings Power Assembly",
  });
});

module.exports = router;
