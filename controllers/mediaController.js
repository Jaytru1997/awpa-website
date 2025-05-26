const Media = require("../models/Media");
const { asyncWrapper } = require("../utils/async");
const path = require("path");
const fs = require("fs").promises;
const mongoose = require("mongoose");
require("dotenv").config();
const { StatusCodes } = require("http-status-codes");
const sanitizeHtml = require("sanitize-html");
const { config } = require("../config/config");

exports.renderMediaDashboard = asyncWrapper(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const perPage = 10;

  if (page < 1) {
    return res.status(400).render("status/status", {
      app_name: process.env.APP_NAME,
      url: process.env.URL,
      title: "Admin Dashboard",
      description: "Manage church media",
      keywords: "church, media, admin, Angel Wings Power Assembly",
      status: 400,
      message_title: "Invalid Page Number",
      message: "Page number must be positive.",
      actionUrl: "/admin/media",
      actionText: "Go back to media",
    });
  }

  try {
    const total = await Media.countDocuments();
    const media = await Media.find()
      .select(
        "title description type status tags category priceStatus price author"
      )
      .sort({ createdAt: -1 })
      .skip((page - 1) * perPage)
      .limit(perPage)
      .lean();

    const sanitizedMedia = media.map((item) => ({
      ...item,
      title: sanitizeHtml(item.title, {
        allowedTags: [],
        allowedAttributes: {},
      }),
      description: item.description
        ? sanitizeHtml(item.description, {
            allowedTags: [],
            allowedAttributes: {},
          })
        : "",
      type: sanitizeHtml(item.type, { allowedTags: [], allowedAttributes: {} }),
      status: sanitizeHtml(item.status, {
        allowedTags: [],
        allowedAttributes: {},
      }),
      tags: item.tags.map((tag) =>
        sanitizeHtml(tag, { allowedTags: [], allowedAttributes: {} })
      ),
      category: item.category
        ? sanitizeHtml(item.category, {
            allowedTags: [],
            allowedAttributes: {},
          })
        : "",
      priceStatus: sanitizeHtml(item.priceStatus, {
        allowedTags: [],
        allowedAttributes: {},
      }),
      price: item.price ? parseFloat(item.price).toFixed(2) : null,
      author: item.author
        ? sanitizeHtml(item.author, { allowedTags: [], allowedAttributes: {} })
        : "",
    }));

    const totalPages = Math.ceil(total / perPage);

    if (page > totalPages && total > 0) {
      return res.status(404).render("status/status", {
        app_name: process.env.APP_NAME,
        url: process.env.URL,
        title: "Admin Dashboard",
        description: "Manage church media",
        keywords: "church, media, admin, Angel Wings Power Assembly",
        status: 404,
        message_title: "Page Not Found",
        message: `Page ${page} does not exist.`,
        actionUrl: "/admin/media",
        actionText: "Go back to media",
      });
    }

    res.render("admin/media", {
      app_name: process.env.APP_NAME,
      url: process.env.URL,
      description: "Manage church media",
      keywords: "church, media, admin",
      title: "Media",
      media: sanitizedMedia,
      page,
      perPage,
      total,
      totalPages,
      success: req.query.success,
      error: req.query.error,
    });
  } catch (error) {
    console.error("Error rendering media:", error);
    res.status(500).render("status/status", {
      app_name: process.env.APP_NAME,
      url: process.env.URL,
      title: "Admin Dashboard",
      description: "Manage church media",
      keywords: "church, media, admin, Angel Wings Power Assembly",
      status: 500,
      message_title: "Server Error",
      message: "Failed to load media. Please try again later.",
      actionUrl: "/admin/media",
      actionText: "Go back to media",
    });
  }
});

exports.toggleMediaStatus = asyncWrapper(async (req, res) => {
  // Authorization check
  if (req.user.role !== "admin" && req.user.role !== "manager") {
    return res.status(StatusCodes.FORBIDDEN).render("status/status", {
      app_name: process.env.APP_NAME,
      url: process.env.URL,
      title: "Admin Dashboard",
      description: config.page_desc,
      keywords: "home, welcome, church, Angel Wings Power Assembly",
      status: 403,
      message_title: "Access Denied",
      message: "You do not have permission to change media status.",
      actionUrl: "/media",
      actionText: "Go back to media",
    });
  }
  const { id } = req.params;
  const media = await Media.findById(id);
  if (!media) {
    return res.status(StatusCodes.NOT_FOUND).render("status/status", {
      app_name: process.env.APP_NAME,
      url: process.env.URL,
      title: "Admin Dashboard",
      description: config.page_desc,
      keywords: "home, welcome, church, Angel Wings Power Assembly",
      status: 404,
      message_title: "Media Not Found",
      message: "The media item does not exist.",
      actionUrl: "/media",
      actionText: "Go back to media",
    });
  }
  // Toggle status
  media.status = media.status === "active" ? "inactive" : "active";
  await media.save();
  res.status(StatusCodes.OK).render("status/status", {
    app_name: process.env.APP_NAME,
    url: process.env.URL,
    title: "Admin Dashboard",
    description: config.page_desc,
    keywords: "home, welcome, church, Angel Wings Power Assembly",
    status: 200,
    message_title: "Media Status Updated",
    message: `The media item status has been changed to ${media.status}.`,
    actionUrl: "/media",
    actionText: "Go back to media",
  });
});

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
  // Authorization check
  if (req.user.role !== "admin" && req.user.role !== "manager") {
    return res.status(StatusCodes.FORBIDDEN).render("status/status", {
      app_name: process.env.APP_NAME,
      url: process.env.URL,
      title: "Admin Dashboard",
      description: config.page_desc,
      keywords: "home, welcome, church, Angel Wings Power Assembly",
      status: 403,
      message_title: "Access Denied",
      message: "You do not have permission to add media.",
      actionUrl: "/media",
      actionText: "Go back to media",
    });
  }

  const {
    title,
    description,
    type,
    tags,
    category,
    priceStatus,
    price,
    author,
  } = req.body;

  // Validate required fields
  if (!title) {
    return res.status(StatusCodes.BAD_REQUEST).render("status/status", {
      app_name: process.env.APP_NAME,
      url: process.env.URL,
      title: "Admin Dashboard",
      description: config.page_desc,
      keywords: "home, welcome, church, Angel Wings Power Assembly",
      status: 400,
      message_title: "Title Required",
      message: "You have not set a title for this media.",
      actionUrl: "/media",
      actionText: "Go back to media",
    });
  }

  if (!type || !["image", "video", "ebook", "audio"].includes(type)) {
    return res.status(StatusCodes.BAD_REQUEST).render("status/status", {
      app_name: process.env.APP_NAME,
      url: process.env.URL,
      title: "Admin Dashboard",
      description: config.page_desc,
      keywords: "home, welcome, church, Angel Wings Power Assembly",
      status: 400,
      message_title: "Invalid Media Type",
      message: "Media type must be image, video, ebook, or audio.",
      actionUrl: "/media",
      actionText: "Go back to media",
    });
  }

  // Validate priceStatus and price
  if (priceStatus === "paid" && (!price || price <= 0)) {
    return res.status(StatusCodes.BAD_REQUEST).render("status/status", {
      app_name: process.env.APP_NAME,
      url: process.env.URL,
      title: "Admin Dashboard",
      description: config.page_desc,
      keywords: "home, welcome, church, Angel Wings Power Assembly",
      status: 400,
      message_title: "Invalid Price",
      message: "You must set a valid price for paid media.",
      actionUrl: "/media",
      actionText: "Go back to media",
    });
  }

  // Handle file upload
  let url = "";
  let image = "";
  if (req.body.type === "video") url = req.body.file;
  if (req.files && req.files.image) {
    const thumbnailFile = req.files.image;

    // Validate file type based on media type
    const allowedTypes = {
      image: ["image/jpeg", "image/png", "image/gif"],
    };

    if (!allowedTypes[type].includes(thumbnailFile.mimetype)) {
      return res.status(StatusCodes.BAD_REQUEST).render("status/status", {
        app_name: process.env.APP_NAME,
        url: process.env.URL,
        title: "Admin Dashboard",
        description: config.page_desc,
        keywords: "home, welcome, church, Angel Wings Power Assembly",
        status: 400,
        message_title: "Invalid File Type",
        message: `File must be a valid ${type} format (${allowedTypes[
          type
        ].join(", ")}).`,
        actionUrl: "/media",
        actionText: "Go back to media",
      });
    }

    // Define upload directory
    const thumbnailDir = path.join("public", "asset", "media", "thumbnails");
    try {
      // Create directory if it doesn't exist
      await fs.mkdir(thumbnailDir, { recursive: true });
    } catch (error) {
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .render("status/status", {
          app_name: process.env.APP_NAME,
          url: process.env.URL,
          title: "Admin Dashboard",
          description: config.page_desc,
          keywords: "home, welcome, church, Angel Wings Power Assembly",
          status: 500,
          message_title: "Upload Error",
          message: "Failed to create upload directory for thumbnail.",
          actionUrl: "/media",
          actionText: "Go back to media",
        });
    }

    // Generate unique filename
    const thumbnailFileExtension = path.extname(thumbnailFile.name);
    const thumbnailFileName = `${Date.now()}-${thumbnailFile.name.replace(
      /[^a-zA-Z0-9]/g,
      ""
    )}`;
    const thumnailFilePath = path.join(thumbnailDir, thumbnailFileName);

    // Save file
    try {
      await thumbnailFile.mv(thumnailFilePath);
      // Store relative URL path
      image = `/asset/media/thumbnails/${thumbnailFileName}`;
    } catch (error) {
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .render("status/status", {
          app_name: process.env.APP_NAME,
          url: process.env.URL,
          title: "Admin Dashboard",
          description: config.page_desc,
          keywords: "home, welcome, church, Angel Wings Power Assembly",
          status: 500,
          message_title: "Upload Error",
          message: "Failed to save thumbnail file.",
          actionUrl: "/media",
          actionText: "Go back to media",
        });
    }
  }

  if (req.body.type !== "video" && req.files && req.files.file) {
    const mediaFile = req.files.file;

    // Validate file type based on media type
    const allowedTypes = {
      image: ["image/jpeg", "image/png", "image/gif"],
      video: ["video/mp4", "video/mpeg"],
      ebook: ["application/pdf", "application/epub+zip"],
      audio: ["audio/mpeg", "audio/wav"],
    };

    if (!allowedTypes[type].includes(mediaFile.mimetype)) {
      return res.status(StatusCodes.BAD_REQUEST).render("status/status", {
        app_name: process.env.APP_NAME,
        url: process.env.URL,
        title: "Admin Dashboard",
        description: config.page_desc,
        keywords: "home, welcome, church, Angel Wings Power Assembly",
        status: 400,
        message_title: "Invalid File Type",
        message: `File must be a valid ${type} format (${allowedTypes[
          type
        ].join(", ")}).`,
        actionUrl: "/media",
        actionText: "Go back to media",
      });
    }

    // Define upload directory
    const uploadDir = path.join("public", "asset", "media", type);
    try {
      await fs.mkdir(uploadDir, { recursive: true }); // Create directory if it doesn't exist
    } catch (error) {
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .render("status/status", {
          app_name: process.env.APP_NAME,
          url: process.env.URL,
          title: "Admin Dashboard",
          description: config.page_desc,
          keywords: "home, welcome, church, Angel Wings Power Assembly",
          status: 500,
          message_title: "Upload Error",
          message: "Failed to create upload directory for media file.",
          actionUrl: "/media",
          actionText: "Go back to media",
        });
    }

    // Generate unique filename
    const fileExtension = path.extname(mediaFile.name);
    const fileName = `${Date.now()}-${mediaFile.name.replace(
      /[^a-zA-Z0-9]/g,
      ""
    )}`;
    const filePath = path.join(uploadDir, fileName);

    // Save file
    try {
      await mediaFile.mv(filePath); // Move file to destination
      url = `/asset/media/${type}/${fileName}`; // Store relative URL path
    } catch (error) {
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .render("status/status", {
          app_name: process.env.APP_NAME,
          url: process.env.URL,
          title: "Admin Dashboard",
          description: config.page_desc,
          keywords: "home, welcome, church, Angel Wings Power Assembly",
          status: 500,
          message_title: "Upload Error",
          message: "Failed to save media file.",
          actionUrl: "/media",
          actionText: "Go back to media",
        });
    }
  }

  // Create media document
  const media = await Media.create({
    title,
    description,
    type,
    url,
    image,
    tags: tags ? tags.split(",").map((tag) => tag.trim()) : [], // Convert comma-separated string to array
    category,
    priceStatus: priceStatus || "free",
    price: priceStatus === "paid" ? price : 0,
    author,
    status: "active",
  });

  // Render success response
  return res.status(StatusCodes.CREATED).render("status/status", {
    app_name: process.env.APP_NAME,
    url: process.env.URL,
    title: "Admin Dashboard",
    description: config.page_desc,
    keywords: "home, welcome, church, Angel Wings Power Assembly",
    status: 201,
    message_title: "Media Added",
    message: "A new media item has been added successfully.",
    actionUrl: "/media",
    actionText: "Go back to media",
  });
});

// Update media (Admin only)
exports.updateMedia = asyncWrapper(async (req, res) => {
  // Authorization check
  if (req.user.role !== "admin" && req.user.role !== "manager") {
    return res.status(StatusCodes.FORBIDDEN).render("status/status", {
      app_name: process.env.APP_NAME,
      url: process.env.URL,
      title: "Admin Dashboard",
      description: config.page_desc,
      keywords: "home, welcome, church, Angel Wings Power Assembly",
      status: 403,
      message_title: "Access Denied",
      message: "You do not have permission to update media.",
      actionUrl: "/media",
      actionText: "Go back to media",
    });
  }

  const { id } = req.params;
  const {
    title,
    description,
    type,
    tags,
    category,
    priceStatus,
    price,
    author,
  } = req.body;

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(StatusCodes.BAD_REQUEST).render("status/status", {
      app_name: process.env.APP_NAME,
      url: process.env.URL,
      title: "Admin Dashboard",
      description: config.page_desc,
      keywords: "home, welcome, church, Angel Wings Power Assembly",
      status: 400,
      message_title: "Invalid Media ID",
      message: "The provided media ID is invalid.",
      actionUrl: "/media",
      actionText: "Go back to media",
    });
  }

  // Find media
  const media = await Media.findById(id);
  if (!media) {
    return res.status(StatusCodes.NOT_FOUND).render("status/status", {
      app_name: process.env.APP_NAME,
      url: process.env.URL,
      title: "Admin Dashboard",
      description: config.page_desc,
      keywords: "home, welcome, church, Angel Wings Power Assembly",
      status: 404,
      message_title: "Media Not Found",
      message: "The media item does not exist.",
      actionUrl: "/media",
      actionText: "Go back to media",
    });
  }

  // Handle file upload
  let url = media.url;
  let image = media.image;

  // Allowed file types
  const allowedTypes = {
    image: ["image/jpeg", "image/png", "image/gif"],
    video: ["video/mp4", "video/mpeg"],
    ebook: ["application/pdf", "application/epub+zip"],
    audio: ["audio/mpeg", "audio/wav"],
  };

  // Handle thumbnail upload (image)
  if (req.files && req.files.image) {
    const thumbnailFile = req.files.image;

    // Validate file type (only images for thumbnails)
    if (!allowedTypes.image.includes(thumbnailFile.mimetype)) {
      return res.status(StatusCodes.BAD_REQUEST).render("status/status", {
        app_name: process.env.APP_NAME,
        url: process.env.URL,
        title: "Admin Dashboard",
        description: config.page_desc,
        keywords: "home, welcome, church, Angel Wings Power Assembly",
        status: 400,
        message_title: "Invalid File Type",
        message: "Thumbnail must be a JPEG, PNG, or GIF image.",
        actionUrl: "/media",
        actionText: "Go back to media",
      });
    }

    // Define upload directory
    const thumbnailDir = path.join("public", "asset", "media", "thumbnails");
    try {
      await fs.mkdir(thumbnailDir, { recursive: true });
    } catch (error) {
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .render("status/status", {
          app_name: process.env.APP_NAME,
          url: process.env.URL,
          title: "Admin Dashboard",
          description: config.page_desc,
          keywords: "home, welcome, church, Angel Wings Power Assembly",
          status: 500,
          message_title: "Upload Error",
          message: "Failed to create upload directory for thumbnail.",
          actionUrl: "/media",
          actionText: "Go back to media",
        });
    }

    // Generate unique filename with extension
    const thumbnailFileExtension = path.extname(thumbnailFile.name);
    const thumbnailFileName = `${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 15)}${thumbnailFileExtension}`;
    const thumbnailFilePath = path.join(thumbnailDir, thumbnailFileName);

    // Save new thumbnail
    try {
      await thumbnailFile.mv(thumbnailFilePath);
      image = `/asset/media/thumbnails/${thumbnailFileName}`;

      // Delete old thumbnail if it exists
      if (media.image) {
        const oldThumbnailPath = path.join("public", media.image);
        try {
          await fs.unlink(oldThumbnailPath);
        } catch (error) {
          console.error("Failed to delete old thumbnail:", error.message);
        }
      }
    } catch (error) {
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .render("status/status", {
          app_name: process.env.APP_NAME,
          url: process.env.URL,
          title: "Admin Dashboard",
          description: config.page_desc,
          keywords: "home, welcome, church, Angel Wings Power Assembly",
          status: 500,
          message_title: "Upload Error",
          message: "Failed to save thumbnail file.",
          actionUrl: "/media",
          actionText: "Go back to media",
        });
    }
  }

  // Handle main media file upload (for non-video types) or video URL
  if (type && type !== "video" && req.files && req.files.file) {
    const mediaFile = req.files.file;

    // Validate file type
    if (!allowedTypes[type].includes(mediaFile.mimetype)) {
      return res.status(StatusCodes.BAD_REQUEST).render("status/status", {
        app_name: process.env.APP_NAME,
        url: process.env.URL,
        title: "Admin Dashboard",
        description: config.page_desc,
        keywords: "home, welcome, church, Angel Wings Power Assembly",
        status: 400,
        message_title: "Invalid File Type",
        message: `File must be a valid ${type} format (${allowedTypes[
          type
        ].join(", ")}).`,
        actionUrl: "/media",
        actionText: "Go back to media",
      });
    }

    // Define upload directory
    const uploadDir = path.join("public", "asset", "media", type);
    try {
      await fs.mkdir(uploadDir, { recursive: true });
    } catch (error) {
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .render("status/status", {
          app_name: process.env.APP_NAME,
          url: process.env.URL,
          title: "Admin Dashboard",
          description: config.page_desc,
          keywords: "home, welcome, church, Angel Wings Power Assembly",
          status: 500,
          message_title: "Upload Error",
          message: "Failed to create upload directory for media file.",
          actionUrl: "/media",
          actionText: "Go back to media",
        });
    }

    // Generate unique filename with extension
    const mediaFileExtension = path.extname(mediaFile.name);
    const mediaFileName = `${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 15)}${mediaFileExtension}`;
    const mediaFilePath = path.join(uploadDir, mediaFileName);

    // Save new file
    try {
      await mediaFile.mv(mediaFilePath);
      url = `/asset/media/${type}/${mediaFileName}`;

      // Delete old file if it exists
      if (media.url) {
        const oldFilePath = path.join("public", media.url);
        try {
          await fs.unlink(oldFilePath);
        } catch (error) {
          console.error("Failed to delete old media file:", error.message);
        }
      }
    } catch (error) {
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .render("status/status", {
          app_name: process.env.APP_NAME,
          url: process.env.URL,
          title: "Admin Dashboard",
          description: config.page_desc,
          keywords: "home, welcome, church, Angel Wings Power Assembly",
          status: 500,
          message_title: "Upload Error",
          message: "Failed to save media file.",
          actionUrl: "/media",
          actionText: "Go back to media",
        });
    }
  } else if (type === "video" && req.body.file) {
    url = req.body.file; // Update video URL if provided
  }

  // Update media document
  media.title = title || media.title;
  media.description = description || media.description;
  media.type = type || media.type;
  media.url = url;
  media.image = image;
  media.tags = tags ? tags.split(",").map((tag) => tag.trim()) : media.tags;
  media.category = category || media.category;
  media.priceStatus = priceStatus || media.priceStatus;
  media.price = priceStatus === "paid" ? price : 0;
  media.author = author || media.author;

  // Save updated media
  await media.save();

  // Render success response
  return res.status(StatusCodes.OK).render("status/status", {
    app_name: process.env.APP_NAME,
    url: process.env.URL,
    title: "Admin Dashboard",
    description: config.page_desc,
    keywords: "home, welcome, church, Angel Wings Power Assembly",
    status: 200,
    message_title: "Media Updated",
    message: "The media item has been updated successfully.",
    actionUrl: "/media",
    actionText: "Go back to media",
  });
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
