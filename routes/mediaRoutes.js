const express = require("express");
const {
  renderMediaDashboard,
  getMediaById,
  addMedia,
  updateMedia,
  toggleMediaStatus,
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
router.patch(
  "/:id/status",
  authMiddleware,
  checkRole(access.manager),
  toggleMediaStatus
);
router.delete("/:id", authMiddleware, checkRole(access.manager), deleteMedia);

module.exports = router;
