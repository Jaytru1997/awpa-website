const express = require("express");
const {
  renderMediaDashboard,
  getMedia,
  getMediaById,
  addMedia,
  updateMedia,
  deleteMedia,
} = require("../controllers/mediaController");
const authMiddleware = require("../middleware/authMiddleware");
const { checkRole } = require("../middleware/rbacMiddleware");
const { access } = require("../config/access");

const router = express.Router();

router.get(
  "/",
  authMiddleware,
  checkRole(access.manager),
  renderMediaDashboard
);

router.post("/", authMiddleware, checkRole(access.manager), addMedia);

router.get("/:id", authMiddleware, checkRole(access.manager), getMediaById);
router.post("/:id", authMiddleware, checkRole(access.manager), updateMedia);
router.delete("/:id", authMiddleware, checkRole(access.manager), deleteMedia);

module.exports = router;
