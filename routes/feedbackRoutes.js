const express = require("express");
const {
  submitFeedback,
  getAllFeedback,
  getFeedbackAnalytics,
} = require("../controllers/feedbackController");
const authMiddleware = require("../middleware/authMiddleware");
const { checkRole } = require("../middleware/rbacMiddleware");
const { access } = require("../config/access");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Feedback
 *   description: Feedback management and analytics
 */

/**
 * @swagger
 * /feedback:
 *   post:
 *     summary: Submit feedback
 *     tags: [Feedback]
 *     description: Submit feedback for a user.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *               feedback:
 *                 type: string
 *     responses:
 *       201:
 *         description: Feedback submitted successfully
 *       500:
 *         description: Server error
 */
router.post("/", submitFeedback);

/**
 * @swagger
 * /feedback:
 *   get:
 *     summary: Get all feedback
 *     tags: [Feedback]
 *     description: Get all feedback submitted by users.
 *     responses:
 *       200:
 *         description: Feedback retrieved successfully
 *       500:
 *         description: Server error
 */
router.get("/", authMiddleware, checkRole(access.admin), getAllFeedback);

/**
 * @swagger
 * /feedback/analytics:
 *   get:
 *     summary: Get feedback analytics
 *     tags: [Feedback]
 *     description: Get feedback analytics for admin users.
 *     responses:
 *       200:
 *         description: Feedback analytics retrieved successfully
 *       500:
 *         description: Server error
 */
router.get(
  "/analytics",
  authMiddleware,
  checkRole(access.admin),
  getFeedbackAnalytics
);

module.exports = router;
