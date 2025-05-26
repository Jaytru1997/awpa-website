const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const { checkRole } = require("../middleware/rbacMiddleware");
const { access } = require("../config/access");
const {
  renderAdminDashboard,
  renderChurchDetailsDashboard,
  toggleUserStatus,
  adminSubmitFeedBack,
  renderSubscribersDashboard,
  renderTestimoniesDashboard,
  deleteSubscriber,
  approveFeedback,
  unapproveFeedback,
  deleteFeedback,
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

router.get(
  "/testimonies",
  authMiddleware,
  checkRole(access.admin),
  renderTestimoniesDashboard
);

router.post(
  "/feedback",
  authMiddleware,
  checkRole(access.admin),
  adminSubmitFeedBack
);

router.put(
  "/testimonies/:id/approve",
  authMiddleware,
  checkRole(access.admin),
  approveFeedback
);

// PUT /admin/testimonies/:id/unapprove - Unapprove testimony
router.put(
  "/testimonies/:id/unapprove",
  authMiddleware,
  checkRole(access.admin),
  unapproveFeedback
);

// DELETE /admin/testimonies/:id - Delete testimony
router.delete(
  "/testimonies/:id",
  authMiddleware,
  checkRole(access.admin),
  deleteFeedback
);

router.get(
  "/subscribers",
  authMiddleware,
  checkRole(access.admin),
  renderSubscribersDashboard
);

router.delete(
  "/subscribers/:id",
  authMiddleware,
  checkRole(access.admin),
  deleteSubscriber
);

module.exports = router;
