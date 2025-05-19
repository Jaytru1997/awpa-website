const path = require("path");
const fs = require("fs").promises;
require("dotenv").config();
const Event = require("../models/Event");
const Registration = require("../models/Registration");
const { asyncWrapper } = require("../utils/async");
const { StatusCodes } = require("http-status-codes");
const { config } = require("../config/config");
const { sendEmail } = require("../services/emailService");

exports.renderEventsDashboard = asyncWrapper(async (req, res) => {
  const events = (await Event.find()) || [];
  return res.status(StatusCodes.OK).render("admin/events", {
    app_name: process.env.APP_NAME,
    url: process.env.URL,
    title: "Events Dashboard",
    description: config.page_desc,
    keywords: "home, welcome, church, Angel Wings Power Assembly",
    events,
  });
});

// Add a new event
exports.addEvent = asyncWrapper(async (req, res) => {
  const {
    title,
    description,
    location,
    tags,
    priceStatus,
    price,
    startDate,
    endDate,
  } = req.body;
  let banner = ""; // Initialize banner variable
  console.log(title, req.files.banner);

  // Handle banner file upload
  if (req.files) {
    const bannerFile = req.files.banner;

    // Validate file type (e.g., only images)
    const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
    if (!allowedTypes.includes(bannerFile.mimetype)) {
      return res.status(StatusCodes.BAD_REQUEST).render("status/status", {
        app_name: process.env.APP_NAME,
        url: process.env.URL,
        title: "Admin Dashboard",
        description: config.page_desc,
        keywords: "home, welcome, church, Angel Wings Power Assembly",
        status: 400,
        message_title: "Invalid File Type",
        message: "Banner must be a JPEG, PNG, or GIF image.",
        actionUrl: "/events",
        actionText: "Go back to events",
      });
    }

    // Define upload directory
    const uploadDir = path.join(
      __dirname,
      "..",
      "public",
      "asset",
      "images",
      "events"
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
          actionUrl: "/events",
          actionText: "Go back to events",
        });
    }

    // Generate unique filename (e.g., timestamp + original name)
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const fileExtension = path.extname(bannerFile.name);
    const fileName = `${uniqueSuffix}${fileExtension}`;
    const filePath = path.join(uploadDir, fileName);

    // Save the file
    try {
      await bannerFile.mv(filePath); // express-fileupload's mv() method to move the file
      banner = `/asset/images/events/${fileName}`; // Store relative URL path
    } catch (err) {
      console.error("Error saving file:", err);
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
          message: "Failed to save banner image. Please try again.",
          actionUrl: "/events",
          actionText: "Go back to events",
        });
    }
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
      message: "You have not set a title for this event.",
      actionUrl: "/events",
      actionText: "Go back to events",
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
      message: "You must set the price properly for this event.",
      actionUrl: "/events",
      actionText: "Go back to events",
    });
  }

  // Create event
  const event = await Event.create({
    title,
    description,
    location,
    tags: tags.split(","),
    priceStatus,
    price: priceStatus === "paid" ? price : 0,
    banner,
    startDate: startDate || Date.now(),
    endDate,
    publisher: req.user._id, // Assumes req.user is set by auth middleware
  });

  return res.status(StatusCodes.CREATED).render("status/status", {
    app_name: process.env.APP_NAME,
    url: process.env.URL,
    title: "Admin Dashboard",
    description: config.page_desc,
    keywords: "home, welcome, church, Angel Wings Power Assembly",
    status: 201,
    message_title: "Event Created",
    message: "A new event has been published successfully.",
    actionUrl: "/events",
    actionText: "Go back to events",
  });
});

// Delete an event
exports.deleteEvent = asyncWrapper(async (req, res) => {
  const { id } = req.params;

  // Find event
  const event = await Event.findByIdAndDelete(id);
  if (!event) {
    return res.status(StatusCodes.NOT_FOUND).render("status/status", {
      app_name: process.env.APP_NAME,
      url: process.env.URL,
      title: "Admin Dashboard",
      description: config.page_desc,
      keywords: "home, welcome, church, Angel Wings Power Assembly",
      status: 404,
      message_title: "Event Not Found",
      message: "We could not find the event on the database.",
      actionUrl: "/events",
      actionText: "Go back to events",
    });
  }

  // Check if user is authorized (publisher or admin)
  if (
    event.publisher.toString() !== req.user._id.toString() &&
    req.user.role !== "admin"
  ) {
    return res.status(StatusCodes.FORBIDDEN).render("status/status", {
      app_name: process.env.APP_NAME,
      url: process.env.URL,
      title: "Admin Dashboard",
      description: config.page_desc,
      keywords: "home, welcome, church, Angel Wings Power Assembly",
      status: 403,
      message_title: "Unuathorised access",
      message: "Unauthorised to delete this event.",
      actionUrl: "/events",
      actionText: "Go back to events",
    });
  }

  // Delete related registrations
  await Registration.deleteMany({ event: id });

  return res.status(StatusCodes.OK).render("status/status", {
    app_name: process.env.APP_NAME,
    url: process.env.URL,
    title: "Admin Dashboard",
    description: config.page_desc,
    keywords: "home, welcome, church, Angel Wings Power Assembly",
    status: 200,
    message_title: "Event Deleted",
    message: "This event has been deleted successfully.",
    actionUrl: "/events",
    actionText: "Go back to events",
  });
});

// Update an event
exports.updateEvent = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const {
    title,
    description,
    location,
    tags,
    priceStatus,
    price,
    banner,
    startDate,
    endDate,
  } = req.body;

  // Find event
  const event = await Event.findById(id);
  if (!event) {
    return res.status(StatusCodes.NOT_FOUND).render("status/status", {
      app_name: process.env.APP_NAME,
      url: process.env.URL,
      title: "Admin Dashboard",
      description: config.page_desc,
      keywords: "home, welcome, church, Angel Wings Power Assembly",
      status: 404,
      message_title: "Event Not Found",
      message: "We could not find the event on the database.",
      actionUrl: "/events",
      actionText: "Go back to events",
    });
  }

  // Check if user is authorized (publisher or admin)
  if (
    event.publisher.toString() !== req.user._id.toString() &&
    req.user.role !== "admin"
  ) {
    return res.status(StatusCodes.FORBIDDEN).render("status/status", {
      app_name: process.env.APP_NAME,
      url: process.env.URL,
      title: "Admin Dashboard",
      description: config.page_desc,
      keywords: "home, welcome, church, Angel Wings Power Assembly",
      status: 403,
      message_title: "Unuathorised access",
      message: "Unauthorised to delete this event.",
      actionUrl: "/events",
      actionText: "Go back to events",
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
      message: "Price must be provided and greater than 0 for paid events.",
      actionUrl: "/events",
      actionText: "Go back to events",
    });
  }

  // Update fields
  event.title = title || event.title;
  event.description = description || event.description;
  event.location = location || event.location;
  event.tags = tags || event.tags;
  event.priceStatus = priceStatus || event.priceStatus;
  event.price = priceStatus === "paid" ? price : 0;
  event.banner = banner || event.banner;
  event.startDate = startDate || event.startDate;
  event.endDate = endDate || event.endDate;

  // Save updated event
  await event.save();

  return res.status(StatusCodes.OK).render("status/status", {
    app_name: process.env.APP_NAME,
    url: process.env.URL,
    title: "Admin Dashboard",
    description: config.page_desc,
    keywords: "home, welcome, church, Angel Wings Power Assembly",
    status: 200,
    message_title: "Event Updated",
    message: "This event has been updated successfully.",
    actionUrl: "/events",
    actionText: "Go back to events",
  });
});

// Register for an event
exports.registerForEvent = asyncWrapper(async (req, res) => {
  const { id } = req.params;

  // Find event
  const event = await Event.findById(id);
  if (!event) {
    return res.status(StatusCodes.NOT_FOUND).render("status/status", {
      app_name: process.env.APP_NAME,
      url: process.env.URL,
      title: "Programs and Events",
      description: config.page_desc,
      keywords: "home, welcome, church, Angel Wings Power Assembly",
      status: 404,
      message_title: "Event Not Found",
      message: "We could not find the event on the database.",
      actionUrl: "/programs-and-events",
      actionText: "Go back to events",
    });
  }

  // Check if user is already registered
  const existingRegistration = await Registration.findOne({
    user: { email: req.body.email, name: req.body.name },
    event: id,
  });
  if (existingRegistration) {
    return res.status(StatusCodes.BAD_REQUEST).render("status/status", {
      app_name: process.env.APP_NAME,
      url: process.env.URL,
      title: "Programs and Events",
      description: config.page_desc,
      keywords: "home, welcome, church, Angel Wings Power Assembly",
      status: 400,
      message_title: "Already registered",
      message: "You are already registered for this event.",
      actionUrl: "/programs-and-events",
      actionText: "Go back to events",
    });
  }

  // Check if event is in the future
  if (event.startDate < Date.now() || event.endDate < Date.now()) {
    return res.status(StatusCodes.BAD_REQUEST).render("status/status", {
      app_name: process.env.APP_NAME,
      url: process.env.URL,
      title: "Programs and Events",
      description: config.page_desc,
      keywords: "home, welcome, church, Angel Wings Power Assembly",
      status: 400,
      message_title: "Event passed",
      message: "Cannot register for past events.",
      actionUrl: "/programs-and-events",
      actionText: "Go back to events",
    });
  }

  // Create registration
  await Registration.create({
    user: { name: req.body.name, email: req.body.email },
    event: id,
  });

  const message_1 = `We are thrilled to confirm your successful registration for "${event.title}" at Angel Wings Power Assembly! Your participation in this special event on ${event.startDate} is a blessing, and we look forward to sharing a time of worship and fellowship with you.`;
  const message_2 = `Please mark your calendar for ${event.startDate} and keep an eye on your inbox for additional details, including any updates or reminders about the event. Your presence will make this occasion even more meaningful as we come together to glorify God.
`;
  const message_3 = `If you have any questions or need assistance, please don’t hesitate to reach out to us at contact@${process.env.URL}. We can’t wait to welcome you to "${event.title}" and celebrate God’s goodness together!`;

  await sendEmail({
    email: req.body.email,
    subject: `Event Registration`,
    message_1,
    message_2,
    message_3,
    cta: "Visit Website",
    ctaLink: `https://${process.env.URL}`,
  });

  return res.status(StatusCodes.CREATED).render("status/status", {
    app_name: process.env.APP_NAME,
    url: process.env.URL,
    title: "Programs and Events",
    description: config.page_desc,
    keywords: "home, welcome, church, Angel Wings Power Assembly",
    status: 201,
    message_title: "Registration successful",
    message: "Successfully registered for the event.",
    actionUrl: "/programs-and-events",
    actionText: "Go back to events",
  });
});
