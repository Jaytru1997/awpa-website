const Event = require("../models/Event");
const Registration = require("../models/Registration");
const { asyncWrapper } = require("../utils/async");
const { StatusCodes } = require("http-status-codes");

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
  const banner = req.files.banner;

  // Validate required fields
  if (!title) {
    throw new CustomError("Title is required", StatusCodes.BAD_REQUEST);
  }

  // Validate priceStatus and price
  if (priceStatus === "paid" && (!price || price <= 0)) {
    throw new CustomError(
      "Price must be provided and greater than 0 for paid events",
      StatusCodes.BAD_REQUEST
    );
  }

  // Create event
  const event = await Event.create({
    title,
    description,
    location,
    tags,
    priceStatus,
    price: priceStatus === "paid" ? price : 0,
    banner,
    startDate: startDate || Date.now(),
    endDate,
    publisher: req.user._id, // Assumes req.user is set by auth middleware
  });

  res.status(StatusCodes.CREATED).json({
    message: "Event created successfully",
    event,
  });
});

// Delete an event
exports.deleteEvent = asyncWrapper(async (req, res) => {
  const { id } = req.params;

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new CustomError("Invalid event ID", StatusCodes.BAD_REQUEST);
  }

  // Find event
  const event = await Event.findById(id);
  if (!event) {
    throw new CustomError("Event not found", StatusCodes.NOT_FOUND);
  }

  // Check if user is authorized (publisher or admin)
  if (
    event.publisher.toString() !== req.user._id.toString() &&
    req.user.role !== "admin"
  ) {
    throw new CustomError(
      "Unauthorized to delete this event",
      StatusCodes.FORBIDDEN
    );
  }

  // Delete related registrations
  await Registration.deleteMany({ event: id });

  // Delete event
  await event.remove();

  res.status(StatusCodes.OK).json({
    message: "Event deleted successfully",
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

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new CustomError("Invalid event ID", StatusCodes.BAD_REQUEST);
  }

  // Find event
  const event = await Event.findById(id);
  if (!event) {
    throw new CustomError("Event not found", StatusCodes.NOT_FOUND);
  }

  // Check if user is authorized (publisher or admin)
  if (
    event.publisher.toString() !== req.user._id.toString() &&
    req.user.role !== "admin"
  ) {
    throw new CustomError(
      "Unauthorized to update this event",
      StatusCodes.FORBIDDEN
    );
  }

  // Validate priceStatus and price
  if (priceStatus === "paid" && (!price || price <= 0)) {
    throw new CustomError(
      "Price must be provided and greater than 0 for paid events",
      StatusCodes.BAD_REQUEST
    );
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

  res.status(StatusCodes.OK).json({
    message: "Event updated successfully",
    event,
  });
});

// Register for an event
exports.registerForEvent = asyncWrapper(async (req, res) => {
  const { id } = req.params;

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new CustomError("Invalid event ID", StatusCodes.BAD_REQUEST);
  }

  // Find event
  const event = await Event.findById(id);
  if (!event) {
    throw new CustomError("Event not found", StatusCodes.NOT_FOUND);
  }

  // Check if user is already registered
  const existingRegistration = await Registration.findOne({
    user: req.user._id,
    event: id,
  });
  if (existingRegistration) {
    throw new CustomError(
      "You are already registered for this event",
      StatusCodes.BAD_REQUEST
    );
  }

  // Check if event is in the future
  if (event.startDate < Date.now()) {
    throw new CustomError(
      "Cannot register for past events",
      StatusCodes.BAD_REQUEST
    );
  }

  // Create registration
  const registration = await Registration.create({
    user: { name: req.body.name, email: req.body.email },
    event: id,
  });

  res.status(StatusCodes.CREATED).json({
    message: "Successfully registered for the event",
    registration,
  });
});
