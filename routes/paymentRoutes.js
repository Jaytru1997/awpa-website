const express = require("express");
const {
  createPaymentLink,
  paymentCallback,
  createManualPayment,
  approvePayment,
  renderAdminPayments,
} = require("../controllers/paymentController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: Payments management
 */

/**
 * @swagger
 * /payments/create-link:
 *   post:
 *     summary: Create a payment link
 *     tags: [Payments]
 *     description: Allows a user to create a payment link.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *               email:
 *                 type: string
 *     responses:
 *       201:
 *         description: Payment link created successfully
 *       500:
 *         description: Server error
 */
router.post("/create-link", authMiddleware, createPaymentLink);

/**
 * @swagger
 * /payments/manual:
 *   post:
 *     summary: Create a manual payment for media purchase
 *     tags: [Payments]
 *     description: Creates a manual payment record for media purchases.
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             properties:
 *               product_id:
 *                 type: string
 *               product_type:
 *                 type: string
 *               email:
 *                 type: string
 *               phone_number:
 *                 type: string
 *               description:
 *                 type: string
 *               tx_ref:
 *                 type: string
 *     responses:
 *       201:
 *         description: Manual payment created successfully
 *       500:
 *         description: Server error
 */
router.post("/manual", createManualPayment);

/**
 * @swagger
 * /payments/callback:
 *   get:
 *     summary: Payment callback
 *     tags: [Payments]
 *     description: Payment callback URL.
 *     responses:
 *       200:
 *         description: Payment successful
 *       500:
 *         description: Payment failed
 */
router.get("/callback", paymentCallback);

// Approve payment (admin only)
router.post("/:id/approve", authMiddleware, approvePayment);

router.get("/admin/purchases", authMiddleware, renderAdminPayments);

module.exports = router;
