const path = require("path");
const fs = require("fs").promises;
const Blog = require("../models/Blog");
const { asyncWrapper } = require("../utils/async");
const { StatusCodes } = require("http-status-codes");
const sanitizeHtml = require("sanitize-html");
const { config } = require("../config/config");
// Create a new blog post
exports.createPost = asyncWrapper(async (req, res) => {
  const { title, content, categories, tags, language, author } = req.body;
  let imagesArray = [];
  let banner = "";
  let thumbnail = "";

  // Handle file uploads
  if (req.files && (req.files.banner || req.files.thumbnail)) {
    const bannerFile = req.files.banner;
    const thumbnailFile = req.files.thumbnail;

    // Validate file presence
    if (!bannerFile || !thumbnailFile) {
      return res.status(StatusCodes.BAD_REQUEST).render("status/status", {
        app_name: process.env.APP_NAME,
        url: process.env.URL,
        title: "Admin Dashboard",
        description: config.page_desc,
        keywords: "home, welcome, church, Angel Wings Power Assembly",
        status: 400,
        message_title: "Missing Files",
        message: "Both banner and thumbnail images are required.",
        actionUrl: "/blog",
        actionText: "Go back to articles",
      });
    }

    // Validate file types
    const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
    if (
      !allowedTypes.includes(bannerFile.mimetype) ||
      !allowedTypes.includes(thumbnailFile.mimetype)
    ) {
      return res.status(StatusCodes.BAD_REQUEST).render("status/status", {
        app_name: process.env.APP_NAME,
        url: process.env.URL,
        title: "Admin Dashboard",
        description: config.page_desc,
        keywords: "home, welcome, church, Angel Wings Power Assembly",
        status: 400,
        message_title: "Invalid File Type",
        message: "Images must be a JPEG, PNG, or GIF image.",
        actionUrl: "/blog",
        actionText: "Go back to articles",
      });
    }

    // Define upload directory
    const uploadDir = path.join(
      __dirname,
      "..",
      "public",
      "asset",
      "images",
      "sermons"
    );

    // Create directory if it doesn't exist
    try {
      await fs.mkdir(uploadDir, { recursive: true });
    } catch (err) {
      console.error("Error creating upload directory:", err);
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .render("status/status", {
          app_name: process.env.APP_NAME,
          url: process.env.URL,
          title: "Admin Dashboard",
          description: config.page_desc,
          keywords: "home, welcome, church, Angel Wings Power Assembly",
          status: 500,
          message_title: "Server Error",
          message: "Failed to process file upload. Please try again.",
          actionUrl: "/blog",
          actionText: "Go back to articles",
        });
    }

    // Generate unique filenames
    const bannerUniqueSuffix =
      Date.now() + "-" + Math.round(Math.random() * 1e9);
    const thumbnailUniqueSuffix =
      Date.now() + "-" + Math.round(Math.random() * 1e9);
    const bannerFileExtension = path.extname(bannerFile.name);
    const thumbnailFileExtension = path.extname(thumbnailFile.name);
    const bannerFileName = `banner-${bannerUniqueSuffix}${bannerFileExtension}`;
    const thumbnailFileName = `thumbnail-${thumbnailUniqueSuffix}${thumbnailFileExtension}`;
    const bannerFilePath = path.join(uploadDir, bannerFileName);
    const thumbnailFilePath = path.join(uploadDir, thumbnailFileName);

    // Save both files
    try {
      await bannerFile.mv(bannerFilePath);
      banner = `/asset/images/sermons/${bannerFileName}`;
      await thumbnailFile.mv(thumbnailFilePath);
      thumbnail = `/asset/images/sermons/${thumbnailFileName}`;

      // Add to imagesArray
      imagesArray.push({ url: banner, description: "banner" });
      imagesArray.push({ url: thumbnail, description: "thumbnail" });
    } catch (err) {
      console.error("Error saving files:", err);
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .render("status/status", {
          app_name: process.env.APP_NAME,
          url: process.env.URL,
          title: "Admin Dashboard",
          description: config.page_desc,
          keywords: "home, welcome, church, Angel Wings Power Assembly",
          status: 500,
          message_title: "Server Error",
          message: "Failed to save images. Please try again.",
          actionUrl: "/blog",
          actionText: "Go back to articles",
        });
    }
  } else {
    return res.status(StatusCodes.BAD_REQUEST).render("status/status", {
      app_name: process.env.APP_NAME,
      url: process.env.URL,
      title: "Admin Dashboard",
      description: config.page_desc,
      keywords: "home, welcome, church, Angel Wings Power Assembly",
      status: 400,
      message_title: "Missing Files",
      message: "Both banner and thumbnail images are required.",
      actionUrl: "/blog",
      actionText: "Go back to articles",
    });
  }

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
      message: "You have not set a title for this post.",
      actionUrl: "/blog",
      actionText: "Go back to articles",
    });
  }

  // Create blog post
  const publisher = req.user.id;
  await Blog.create({
    title,
    content,
    author,
    publisher,
    categories,
    images: imagesArray,
    tags: tags ? tags.split(",").map((tag) => tag.trim()) : [],
    language,
  });

  return res.status(StatusCodes.CREATED).render("status/status", {
    app_name: process.env.APP_NAME,
    url: process.env.URL,
    title: "Admin Dashboard",
    description: config.page_desc,
    keywords: "home, welcome, church, Angel Wings Power Assembly",
    status: 201,
    message_title: "Blog Post Created",
    message: "A new blog post has been published successfully.",
    actionUrl: "/blog",
    actionText: "Go back to articles",
  });
});

exports.renderBlogsDashboard = asyncWrapper(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const perPage = 10;
  if (page < 1) {
    return res.status(400).render("status/status", {
      app_name: process.env.APP_NAME,
      url: process.env.URL,
      title: "Admin Dashboard",
      description: "Manage church articles",
      keywords: "church, articles, admin, Angel Wings Power Assembly",
      status: 400,
      message_title: "Invalid Page Number",
      message: "Page number must be positive.",
      actionUrl: "/blog",
      actionText: "Go back to articles",
    });
  }
  try {
    const total = await Blog.countDocuments();
    const articles = await Blog.find()
      .select(
        "title author categories priceStatus price content tags language thumbnail banner"
      )
      .sort({ createdAt: -1 })
      .skip((page - 1) * perPage)
      .limit(perPage)
      .lean();

    const sanitizedArticles = articles.map((article) => ({
      ...article,
      title: sanitizeHtml(article.title, {
        allowedTags: [],
        allowedAttributes: {},
      }),
      author: article.author
        ? sanitizeHtml(article.author, {
            allowedTags: [],
            allowedAttributes: {},
          })
        : null,
      categories: sanitizeHtml(article.categories, {
        allowedTags: [],
        allowedAttributes: {},
      }),
      content: sanitizeHtml(article.content, {
        allowedTags: ["p", "strong", "em", "br", "ul", "ol", "li", "a", "img"],
        allowedAttributes: { a: ["href"], img: ["src"] },
      }),
      tags: article.tags.map((tag) =>
        sanitizeHtml(tag, { allowedTags: [], allowedAttributes: {} })
      ),
      language: sanitizeHtml(article.language, {
        allowedTags: [],
        allowedAttributes: {},
      }),
      priceStatus: sanitizeHtml(article.priceStatus, {
        allowedTags: [],
        allowedAttributes: {},
      }),
      price: article.price ? parseFloat(article.price).toFixed(2) : null,
      thumbnail: article.thumbnail
        ? sanitizeHtml(article.thumbnail, {
            allowedTags: [],
            allowedAttributes: {},
          })
        : null,
      banner: article.banner
        ? sanitizeHtml(article.banner, {
            allowedTags: [],
            allowedAttributes: {},
          })
        : null,
    }));

    const totalPages = Math.ceil(total / perPage);

    if (page > totalPages && total > 0) {
      return res.status(404).render("status/status", {
        app_name: process.env.APP_NAME,
        url: process.env.URL,
        title: "Admin Dashboard",
        description: "Manage church articles",
        keywords: "church, articles, admin, Angel Wings Power Assembly",
        status: 404,
        message_title: "Page Not Found",
        message: `Page ${page} does not exist.`,
        actionUrl: "/blog",
        actionText: "Go back to articles",
      });
    }

    return res.render("admin/blog", {
      app_name: process.env.APP_NAME,
      url: process.env.URL,
      description: "Manage church articles",
      keywords: "church, articles, admin",
      title: "Articles",
      articles: sanitizedArticles,
      page,
      perPage,
      total,
      totalPages,
      success: req.query.success,
      error: req.query.error,
    });
  } catch (error) {
    console.error("Error rendering articles:", error);
    return res.status(500).render("status/status", {
      app_name: process.env.APP_NAME,
      url: process.env.URL,
      title: "Admin Dashboard",
      description: "Manage church articles",
      keywords: "church, articles, admin, Angel Wings Power Assembly",
      status: 500,
      message_title: "Server Error",
      message: "Failed to load articles. Please try again later.",
      actionUrl: "/blog",
      actionText: "Go back to articles",
    });
  }
});

// Update a blog post
exports.updatePost = asyncWrapper(async (req, res) => {
  const { title, content, categories, tags, language } = req.body;
  const updatedPost = await Blog.findByIdAndUpdate(
    req.params.id,
    { title, content, categories, tags, language, updatedAt: Date.now() },
    { new: true }
  );

  if (!updatedPost) return res.status(404).json({ message: "Post not found" });

  res.status(200).json({ message: "Post updated", post: updatedPost });
});

// Delete a blog post
exports.deletePost = asyncWrapper(async (req, res) => {
  const deletedPost = await Blog.findByIdAndDelete(req.params.id);
  if (!deletedPost) return res.status(404).json({ message: "Post not found" });

  res.status(200).json({ message: "Post deleted" });
});
