const express = require("express");
const router = express.Router();
const {
  renderEventsDashboard,
  addEvent,
  renderSingleEventDashboard,
  deleteEvent,
  updateEvent,
  registerForEvent,
} = require("../controllers/eventController");
const authMiddleware = require("../middleware/authMiddleware");
const { checkRole } = require("../middleware/rbacMiddleware");
const { access } = require("../config/access");

// Routes for event management
router.get("/", authMiddleware, checkRole(access.admin), renderEventsDashboard);
router.post("/", authMiddleware, checkRole(access.admin), addEvent); // Create a new event
router.get(
  "/:id",
  authMiddleware,
  checkRole(access.admin),
  renderSingleEventDashboard
); // Get event details by ID
router.delete("/:id", authMiddleware, checkRole(access.admin), deleteEvent); // Delete an event
router.put("/:id", authMiddleware, checkRole(access.admin), updateEvent); // Update an event
router.post("/:id/register", registerForEvent); // Register for an event

module.exports = router;
