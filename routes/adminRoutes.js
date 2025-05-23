const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const { checkRole } = require("../middleware/rbacMiddleware");
const { access } = require("../config/access");
const {
  renderAdminDashboard,
  renderChurchDetailsDashboard,
  toggleUserStatus,
  adminSubmitFeedBack,
} = require("../controllers/adminController");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin management
 */

router.get("/", authMiddleware, checkRole(access.admin), renderAdminDashboard);

router.post(
  "/users/:id/update-status",
  authMiddleware,
  checkRole(access.admin),
  toggleUserStatus
);

router.get(
  "/church-details",
  authMiddleware,
  checkRole(access.admin),
  renderChurchDetailsDashboard
);

router.post(
  "/feedback",
  authMiddleware,
  checkRole(access.admin),
  adminSubmitFeedBack
);

module.exports = router;
