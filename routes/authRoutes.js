const express = require("express");
const { register, login } = require("../controllers/authController");
const { check, validationResult } = require("express-validator");
const authMiddleware = require("../middleware/authMiddleware");
require("dotenv").config();
const { blacklistToken } = require("../controllers/blacklistController");
require("dotenv").config();
const { config } = require("../config/config");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User Authentication management
 */

router.get("/register", (req, res) => {
  res.status(200).render("auth/register", {
    app_name: process.env.APP_NAME,
    url: process.env.URL,
    title: "Home",
    description: config.page_desc,
    keywords: "sign up, welcome, church, Angel Wings Power Assembly",
  });
});

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     description: Allows a user to register on the platform.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: User already exists
 *       500:
 *         description: Server error
 */

router.post(
  "/register",
  [
    check("name", "Name is required").not().isEmpty(),
    check("email", "Please include a valid email").isEmail(),
    check("password", "Password must be at least 6 characters").isLength({
      min: 6,
    }),
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
  register
);

router.get("/login", (req, res) => {
  res.status(200).render("auth/login", {
    app_name: process.env.APP_NAME,
    url: process.env.URL,
    title: "Home",
    description: config.page_desc,
    keywords: "sign up, welcome, church, Angel Wings Power Assembly",
  });
});
/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login a user
 *     tags: [Authentication]
 *     description: Allows a user to login on the platform.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: User logged in successfully
 *       400:
 *         description: Invalid credentials
 *       500:
 *         description: Server error
 */

router.post(
  "/login",
  [
    check("email", "Please include a valid email").isEmail(),
    check("password", "Password is required").exists(),
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
  login
);

/**
 * @swagger
 * /auth/logout:
 *   get:
 *     summary: Logout a user
 *     tags: [Authentication]
 *     description: Logs out a user from the platform.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out successfully
 *       401:
 *         description: Unauthorized
 */
router.get("/logout", authMiddleware, async (req, res) => {
  const token = req.headers.authorization.split(" ")[1];
  // blacklist token
  await blacklistToken(token);
  return res
    .status(200)
    .json({ message: "Logged out successfully", redirect: process.env.URL });
});

module.exports = router;
