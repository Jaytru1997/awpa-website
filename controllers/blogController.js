const path = require("path");
const fs = require("fs").promises;
const Blog = require("../models/Blog");
const { asyncWrapper } = require("../utils/async");
const { StatusCodes } = require("http-status-codes");
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
  const posts = (await Blog.find()) || [];
  return res.status(StatusCodes.OK).render("admin/blog", {
    app_name: process.env.APP_NAME,
    url: process.env.URL,
    title: "Articles Dashboard",
    description: config.page_desc,
    keywords: "home, welcome, church, Angel Wings Power Assembly",
    articles: posts,
  });
});

// Get all blog posts
exports.getAllPosts = asyncWrapper(async (req, res) => {
  const posts = await Blog.find();
  // populate("publisher", "name email")

  if (!posts || posts.length === 0) return [];
  res.status(StatusCodes.OK).json(posts);
});

// Get a single blog post
exports.getPostById = asyncWrapper(async (req, res) => {
  const post = await Blog.findById(req.params.id)
    .populate("publisher", "name email")
    .populate("comments.user", "name email");
  if (!post) return res.status(404).json({ message: "Post not found" });
  res.status(200).json(post);
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

// Add a comment to a blog post
exports.addComment = asyncWrapper(async (req, res) => {
  const { text } = req.body;
  const post = await Blog.findById(req.params.id);
  if (!post) return res.status(404).json({ message: "Post not found" });

  post.comments.push({ user: req.user.id, text });
  await post.save();

  res.status(201).json({ message: "Comment added", post });
});

// Get comments for a post
exports.getComments = asyncWrapper(async (req, res) => {
  const post = await Blog.findById(req.params.id);
  if (!post) return res.status(404).json({ message: "Post not found" });

  res.status(200).json(post.comments);
});
