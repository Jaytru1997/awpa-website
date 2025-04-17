const twilio = require("twilio");
// const sgMail = require("@sendgrid/mail");
const User = require("../models/User");
const { sendEmail } = require("../services/emailService");
const { asyncWrapper } = require("../utils/async");

// sgMail.setApiKey(process.env.SENDGRID_API_KEY);

exports.logInteraction = asyncWrapper(async (req, res) => {
  const { userId, type, message } = req.body;

  // Send Notification
  const user = await User.findById(userId);
  if (user) {
    await sendNotification(user.phone, message);
  }

  res.status(201).json({ message: "CRM Log saved", data: log });
});

async function sendNotification(phone, message) {
  const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
  await client.messages.create({
    body: message,
    from: process.env.TWILIO_PHONE,
    to: phone,
  });

  const emailOptions = {
    email: process.env.ADMIN_EMAIL,
    subject: "New CRM Interaction",
    header: "New CRM Interaction",
    message,
  };
  await sendEmail(emailOptions);
}
