const Media = require("../models/Media");
const { asyncWrapper } = require("../utils/async");

// Get all medias (with optional filters)
exports.getMedia = asyncWrapper(async (req, res) => {
  const { category, minPrice, maxPrice } = req.query;
  let filter = {};

  if (category) filter.category = category;
  if (minPrice) filter.price = { $gte: minPrice };
  if (maxPrice) filter.price = { ...filter.price, $lte: maxPrice };

  const medias = await Media.find(filter);
  res.json(medias);
});

// Get a single media by ID
exports.getMediaById = asyncWrapper(async (req, res) => {
  const media = await Media.findById(req.params.id);
  if (!media) return res.status(404).json({ message: "Media not found" });

  res.json(media);
});

// Add new media (Admin only)
exports.addMedia = asyncWrapper(async (req, res) => {
  if (req.user.role !== "admin" || req.user.role !== "manager") {
    return res.status(403).json({ message: "Access denied" });
  }

  const { name, category, price, description, stock } = req.body;

  const media = new Media({
    name,
    category,
    price,
    description,
    stock,
    createdBy: req.user.id,
  });

  await media.save();
  res.status(201).json({ message: "Media added successfully", media });
});

// Update media (Admin only)
exports.updateMedia = asyncWrapper(async (req, res) => {
  if (req.user.role !== "admin" || req.user.role !== "manager") {
    return res.status(403).json({ message: "Access denied" });
  }

  const media = await Media.findById(req.params.id);
  if (!media) return res.status(404).json({ message: "Media not found" });

  Object.assign(media, req.body);
  await media.save();

  res.json({ message: "Media updated", media });
});

// Delete media (Admin only)
exports.deleteMedia = asyncWrapper(async (req, res) => {
  if (req.user.role !== "admin" || req.user.role !== "manager") {
    return res.status(403).json({ message: "Access denied" });
  }

  const media = await Media.findByIdAndDelete(req.params.id);
  if (!media) return res.status(404).json({ message: "Media not found" });

  res.json({ message: "Media deleted successfully" });
});
