const express = require("express");
require("dotenv").config();
const { config } = require("../config/config");
const sanitizeHtml = require("sanitize-html");
const Feedback = require("../models/Feedback");
const Media = require("../models/Media");
const Event = require("../models/Event");
const Blog = require("../models/Blog");
const Subscriber = require("../models/Subscriber");
const { asyncWrapper } = require("../utils/async");
const { sendEmail } = require("../services/emailService");
const { StatusCodes } = require("http-status-codes");

const router = express.Router();

router.get(
  "/",
  asyncWrapper(async (req, res) => {
    // Find events with startDate greater than or equal to today
    const today = new Date();
    const event = await Event.findOne({ startDate: { $gte: today } })
      .sort({ startDate: 1 })
      .select("title description startDate location banner endDate");

    // Fetch blogs and sanitize content
    const blog = await Blog.find({})
      .sort({ createdAt: -1 })
      .select("title content createdAt author images tags");

    // Sanitize blog data
    const sanitizedBlogs = blog.map((blogItem) => ({
      ...blogItem._doc,
      title: sanitizeHtml(blogItem.title, {
        allowedTags: [],
        allowedAttributes: {},
      }),
      content: sanitizeHtml(blogItem.content, {
        allowedTags: [
          "p",
          "h1",
          "h2",
          "h3",
          "strong",
          "em",
          "br",
          "ul",
          "ol",
          "li",
          "a",
        ],
        allowedAttributes: {
          a: ["href", "target", "rel"],
        },
      }),
      tags: blogItem.tags.map((tag) =>
        sanitizeHtml(tag, { allowedTags: [], allowedAttributes: {} })
      ),
      author: sanitizeHtml(blogItem.author, {
        allowedTags: [],
        allowedAttributes: {},
      }),
    }));

    const features = sanitizedBlogs.slice(-1); // Last item in sanitized blog array

    const isApproved = true;
    const testimonies = await Feedback.find({ isApproved });

    res.status(StatusCodes.OK).render("index", {
      app_name: process.env.APP_NAME,
      url: process.env.URL,
      title: "Home",
      description: config.page_desc,
      keywords: "home, welcome, church, Angel Wings Power Assembly",
      event,
      blog: sanitizedBlogs,
      features,
      testimonies,
    });
  })
);

router.get("/who-we-are", (req, res) => {
  res.status(StatusCodes.OK).render("who-we-are", {
    app_name: process.env.APP_NAME,
    url: process.env.URL,
    title: "Who We Are",
    description: config.page_desc,
    keywords: "Who we are, about, church, Angel Wings Power Assembly",
  });
});

router.get("/visit-us", (req, res) => {
  res.status(StatusCodes.OK).render("visit-us", {
    app_name: process.env.APP_NAME,
    url: process.env.URL,
    title: "Visit Us",
    description: config.page_desc,
    keywords: "Visit Us, church, Angel Wings Power Assembly",
  });
});

router.get(
  "/church-media",
  asyncWrapper(async (req, res) => {
    const media = await Media.find();
    const audios = media.filter((el) => el.type === "audio");
    const videos = media.filter((el) => el.type === "video");
    const ebooks = media.filter((el) => el.type === "ebook");
    res.status(StatusCodes.OK).render("media", {
      app_name: process.env.APP_NAME,
      url: process.env.URL,
      title: "Media",
      description: config.page_desc,
      keywords: "Media, church, Angel Wings Power Assembly",
      audios,
      videos,
      ebooks,
    });
  })
);

router.get(
  "/resources",
  asyncWrapper(async (req, res) => {
    try {
      // Fetch blogs with populated author, sorted by newest first
      const blogs = await Blog.find({})
        .sort({ createdAt: -1 })
        .select("title content createdAt author images tags")
        .populate("author", "name")
        .lean()
        .limit(20); // Limit for performance

      if (!blogs || blogs.length === 0) {
        return res.status(StatusCodes.NOT_FOUND).render("resources", {
          app_name: process.env.APP_NAME,
          url: process.env.URL,
          title: "Resources",
          description: config.page_desc,
          keywords: "Resources, church, Angel Wings Power Assembly",
          blogs: [],
          error: "No resources found.",
        });
      }

      // Sanitize blog data
      const sanitizedBlogs = blogs.map((blogItem) => ({
        ...blogItem,
        title: sanitizeHtml(blogItem.title, {
          allowedTags: [],
          allowedAttributes: {},
        }),
        content: sanitizeHtml(blogItem.content, {
          allowedTags: [
            "p",
            "h1",
            "h2",
            "h3",
            "strong",
            "em",
            "br",
            "ul",
            "ol",
            "li",
            "a",
            "iframe",
          ],
          allowedAttributes: {
            a: ["href", "target", "rel"],
            iframe: [
              "src",
              "width",
              "height",
              "frameborder",
              "allow",
              "allowfullscreen",
            ],
          },
          transformTags: {
            iframe: (tagName, attribs) => {
              if (
                attribs.src &&
                (attribs.src.startsWith("https://www.youtube.com/embed/") ||
                  attribs.src.startsWith(
                    "https://www.youtube-nocookie.com/embed/"
                  ))
              ) {
                return {
                  tagName: "iframe",
                  attribs: {
                    src: attribs.src,
                    width: attribs.width || "560",
                    height: attribs.height || "315",
                    frameborder: "0",
                    allow:
                      "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture",
                    allowfullscreen: true,
                  },
                };
              }
              return { tagName: "", attribs: {} };
            },
          },
        }),
        tags: blogItem.tags.map((tag) =>
          sanitizeHtml(tag, { allowedTags: [], allowedAttributes: {} })
        ),
        author: sanitizeHtml(blogItem.author || "Unknown", {
          allowedTags: [],
          allowedAttributes: {},
        }),
        images: blogItem.images || [], // URLs are safe, no sanitization needed
        createdAt: new Date(blogItem.createdAt).toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        }), // Format as "May 23, 2025"
      }));

      res.status(StatusCodes.OK).render("resources", {
        app_name: process.env.APP_NAME,
        url: process.env.URL,
        title: "Resources",
        description: config.page_desc,
        keywords: "Resources, church, Angel Wings Power Assembly",
        blogs: sanitizedBlogs,
      });
    } catch (error) {
      console.error("Error fetching resources:", error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).render("resources", {
        app_name: process.env.APP_NAME,
        url: process.env.URL,
        title: "Resources",
        description: config.page_desc,
        keywords: "Resources, church, Angel Wings Power Assembly",
        blogs: [],
        error: "Failed to load resources.",
      });
    }
  })
);

router.get(
  "/resources/articles/:id",
  asyncWrapper(async (req, res) => {
    const { id } = req.params;

    // Fetch all blogs with populated author in one query
    const blogs = await Blog.find()
      .select("title content createdAt author images tags")
      .populate("author", "name")
      .lean();

    // Find the current blog by ID
    const blog = blogs.find((el) => el._id.toString() === id);

    if (!blog) {
      return res.status(StatusCodes.NOT_FOUND).render("error", {
        app_name: process.env.APP_NAME,
        url: process.env.URL,
        title: "Article Not Found",
        description: "The requested article could not be found.",
        error: "Article not found.",
      });
    }

    // Filter other articles (exclude current blog)
    const otherArticles = blogs
      .filter((el) => el._id.toString() !== id)
      .slice(0, 5); // Limit to 5 for performance

    // Sanitize blog data
    const sanitizedBlog = {
      ...blog,
      title: sanitizeHtml(blog.title, {
        allowedTags: [],
        allowedAttributes: {},
      }),
      content: sanitizeHtml(blog.content, {
        allowedTags: [
          "p",
          "h1",
          "h2",
          "h3",
          "strong",
          "em",
          "br",
          "ul",
          "ol",
          "li",
          "a",
          "iframe",
        ],
        allowedAttributes: {
          a: ["href", "target", "rel"],
          iframe: [
            "src",
            "width",
            "height",
            "frameborder",
            "allow",
            "allowfullscreen",
          ],
        },
        transformTags: {
          iframe: (tagName, attribs) => {
            if (
              attribs.src &&
              (attribs.src.startsWith("https://www.youtube.com/embed/") ||
                attribs.src.startsWith(
                  "https://www.youtube-nocookie.com/embed/"
                ))
            ) {
              return {
                tagName: "iframe",
                attribs: {
                  src: attribs.src,
                  width: attribs.width || "560",
                  height: attribs.height || "315",
                  frameborder: "0",
                  allow:
                    "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture",
                  allowfullscreen: true,
                },
              };
            }
            return { tagName: "", attribs: {} };
          },
        },
      }),
      tags: blog.tags.map((tag) =>
        sanitizeHtml(tag, { allowedTags: [], allowedAttributes: {} })
      ),
      author: sanitizeHtml(blog.author, {
        allowedTags: [],
        allowedAttributes: {},
      }),
      images: blog.images.map((url) => url),
    };

    res.status(StatusCodes.OK).render("single-resource", {
      app_name: process.env.APP_NAME,
      url: process.env.URL,
      title: sanitizedBlog.title,
      description: config.page_desc,
      keywords: "online donation, giving, church, Angel Wings Power Assembly",
      article: sanitizedBlog,
      articles: otherArticles,
    });
  })
);

router.get("/giving", (req, res) => {
  res.status(StatusCodes.OK).render("giving", {
    app_name: process.env.APP_NAME,
    url: process.env.URL,
    title: "Giving",
    description: config.page_desc,
    keywords: "online donation, giving, church, Angel Wings Power Assembly",
  });
});

router.get(
  "/programs-and-events",
  asyncWrapper(async (req, res) => {
    const today = new Date();
    const events = await Event.find();
    const nearestEvent =
      events.find((el) => el.startDate > today) ||
      events.find((el) => el.endDate > today);
    res.status(StatusCodes.OK).render("programs-and-events", {
      app_name: process.env.APP_NAME,
      url: process.env.URL,
      title: "Programs and Events",
      description: config.page_desc,
      keywords: "Programs and Events, church, Angel Wings Power Assembly",
      nearestEvent,
      events,
    });
  })
);

router.get(
  "/programs-and-events/:id",
  asyncWrapper(async (req, res) => {
    const { id } = req.params;
    // Fetch all blogs with populated author in one query
    const events = await Event.find();

    // Find the current blog by ID
    const currentEvent = events.find((el) => el._id.toString() === id);
    res.status(StatusCodes.OK).render("event-registration", {
      app_name: process.env.APP_NAME,
      url: process.env.URL,
      title: "Programs and Events",
      description: config.page_desc,
      keywords: "Programs and Events, church, Angel Wings Power Assembly",
      events,
      currentEvent,
    });
  })
);

router.post(
  "/subscribe",
  asyncWrapper(async (req, res) => {
    const subscribe = await Subscriber.create({
      user: req.body.email,
    });

    const options = {
      email: `contact@${process.env.URL}`,
      subject: "New Subscriber",
      message_1: `${req.body.email} just subscribed to the church's website.`,
      message_2: "Login to dashboard to view all subscribers.",
      cta: "Go to dashboard",
      ctaLink: `https://${process.env.URL}/auth/login`,
    };

    await sendEmail(options);

    return res.status(StatusCodes.CREATED).render("status/status", {
      app_name: process.env.APP_NAME,
      url: process.env.URL,
      title: "Subscription Success",
      description: config.page_desc,
      keywords: "home, welcome, church, Angel Wings Power Assembly",
      status: 201,
      message_title: "Subscribed",
      message:
        "Thank you for subscrirbing. You will get regular updates about our church, upcoming events, newsletters and much more, as soon as they are available.",
      actionUrl: "/",
      actionText: "Back to website",
    });
  })
);

router.post(
  "/contact",
  asyncWrapper(async (req, res) => {
    const options = {
      email: `contact@${process.env.URL}`,
      subject: "New Contact From Website",
      message_1: `${req.body.name} just sent a message to the church via the church's website.`,
      message_2: req.body.message,
      cta: "Reply",
      ctaLink: `mailto:${req.body.email}`,
    };

    await sendEmail(options);

    return res.status(StatusCodes.CREATED).render("status/status", {
      app_name: process.env.APP_NAME,
      url: process.env.URL,
      title: "Subscription Success",
      description: config.page_desc,
      keywords: "home, welcome, church, Angel Wings Power Assembly",
      status: 201,
      message_title: "Message Sent",
      message: `Thank you for contact us, an admin will get in touch with you very soon, please pay attention to the your mail box: ${req.body.email}`,
      actionUrl: "/",
      actionText: "Back to website",
    });
  })
);

module.exports = router;
