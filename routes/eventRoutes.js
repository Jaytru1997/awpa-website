const express = require("express");
const router = express.Router();
const {
  renderEventsDashboard,
  addEvent,
  deleteEvent,
  updateEvent,
  registerForEvent,
} = require("../controllers/eventController");
const authMiddleware = require("../middleware/authMiddleware");
const { checkRole } = require("../middleware/rbacMiddleware");
const { access } = require("../config/access");

// Routes for event management
router.get("/", authMiddleware, renderEventsDashboard);
router.post("/", authMiddleware, addEvent); // Create a new event
router.delete("/:id", authMiddleware, checkRole(access.admin), deleteEvent); // Delete an event
router.put("/:id", authMiddleware, checkRole(access.admin), updateEvent); // Update an event
router.post("/:id/register", registerForEvent); // Register for an event

module.exports = router;
