const cron = require("node-cron-js");
const { sendEmail } = require("./emailService"); // Assuming an email service exists
const User = require("../models/userModel"); // Assuming User model exists
const logger = require("./logger");
require("dotenv").config();

const cronEveryMinute = "* * * * *"; // Runs every minute
const cronEveryHour = "0 * * * *"; // Runs every hour
const cronEveryDay = "0 0 * * *"; // Runs every day at midnight
const cronEveryWeek = "0 0 * * 0"; // Runs every Sunday at midnight
const cronEveryMonth = "0 0 1 * *"; // Runs every month on the 1st at midnight
