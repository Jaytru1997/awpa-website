const express = require("express");
const {
  createPaymentLink,
  paymentCallback,
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

module.exports = router;
