const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const sessionManager = require("./middleware/sessionManager");
const xss = require("xss-clean");
const hpp = require("hpp");
const helmet = require("helmet");
const morgan = require("morgan");
const mongoSanitize = require("express-mongo-sanitize");
const fileUpload = require("express-fileupload");
const methodOverride = require("method-override");
const staticRoutes = require("./routes/staticRoutes");
const authRoutes = require("./routes/authRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const adminRoutes = require("./routes/adminRoutes");
const managerRoutes = require("./routes/managerRoutes");
const memberRoutes = require("./routes/memberRoutes");
const blogRoutes = require("./routes/blogRoutes");
const eventRoutes = require("./routes/eventRoutes");
const mediaRoutes = require("./routes/mediaRoutes");
const feedbackRoutes = require("./routes/feedbackRoutes");

const logger = require("./services/logger");
const { swaggerSpec, swaggerUi } = require("./config/swagger");

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

// Initialize app
const app = express();

// 1) GLOBAL MIDDLEWARES
// Set security HTTP headers
app.set("trust proxy", "127.0.0.1");
app.use(helmet());
app.use(fileUpload());

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(methodOverride("_method"));

// set the view engine to ejs
app.set("view engine", "ejs");

app.disable("view cache");

// Logging Requests
app.use((req, res, next) => {
  logger.info(`${req.method} Request to ${req.url} from ${req.ip}`);
  next();
});

// Development logging
const morganFormat =
  ":method :url :status :res[content-length] - :response-time ms"; // Customize format
app.use(morgan(morganFormat));

app.use(sessionManager());

app.use(cors());

app.use(function (req, res, next) {
  const allowedOrigins = [
    "http://localhost:10000",
    "https://angelwingspowerassembly.org",
    "https://angelwingspowerassembly.org",
  ];

  const origin = req.headers.origin;

  if (allowedOrigins.includes(origin)) {
    // Website you wish to allow to connect
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  // Request methods you wish to allow
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, PATCH, DELETE"
  );

  // Request headers you wish to allow
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-Requested-With,content-type, Accept, Authorization"
  );

  // Set to true if you need the website to include cookies in the requests sent
  // to the API (e.g. in case you use sessions)
  res.setHeader("Access-Control-Allow-Credentials", true);

  // res.setHeader("Content-Security-Policy", "script-src 'self' 'unsafe-inline'");
  res.setHeader(
    "Content-Security-Policy",
    "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:;"
  );

  res.set(
    "Cache-control",
    "no-store, no-cache, must-revalidate, proxy-revalidate"
  );
  res.set("Pragma", "no-cache");
  // res.set("Expires", "0");
  // res.set("Surrogate-Control", "no-store");
  next();
});

//Data Sanitization against NoSQL query injection
app.use(mongoSanitize());

//Data Sanitization against XSS
app.use(xss());

//Prevents parameter pollution
app.use(hpp()); //use white list to pass in duplicate query parameters

// Routes
app.use("/", staticRoutes);
app.use("/auth", authRoutes);
app.use("/bookings", bookingRoutes);
app.use("/payments", paymentRoutes);
app.use("/admin", adminRoutes);
app.use("/manager", managerRoutes);
app.use("/member", memberRoutes);
app.use("/blog", blogRoutes);
app.use("/events", eventRoutes);
app.use("/media", mediaRoutes);
app.use("/feedback", feedbackRoutes);

// Swagger Docs
app.use("/awpa-api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

//Serve Static Files
app.use(express.static("public"));

// Error Handling
app.use((err, req, res, next) => {
  logger.error("Server error:", err);
  res.status(err.statusCode || 500).render("status/status", {
    app_name: process.env.APP_NAME,
    url: process.env.URL,
    title: "Server Error",
    description: "An error occurred",
    keywords: "error",
    status: err.statusCode || 500,
    message_title: "Server Error",
    message: err.message || "Something went wrong. Please try again later.",
    actionUrl: "/",
    actionText: "Go to Home",
  });
});

// Process Error Handlers
process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception:", error);
  process.exit(1);
});
process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled Rejection:", reason);
  process.exit(1);
});

// Start server
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
