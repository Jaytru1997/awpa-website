const Blog = require("../models/Blog");
const { asyncWrapper } = require("../utils/async");

// Create a new blog post
exports.createPost = asyncWrapper(async (req, res) => {
  const { title, content, categories, tags, language, author } = req.body;
  const publisher = req.user.id;
  const newPost = new Blog({
    title,
    content,
    author,
    publisher,
    categories,
    tags,
    language,
  });

  await newPost.save();
  res.status(201).json({ message: "Blog post created", post: newPost });
});

// Get all blog posts
exports.getAllPosts = asyncWrapper(async (req, res) => {
  const posts = await Blog.find().populate("publisher", "name email");

  if (!posts || posts.length === 0) return [];
  res.status(200).json(posts);
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
