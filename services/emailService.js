const tls = require("tls");
const { createTransport } = require("nodemailer");
const { template } = require("./email.template");
require("dotenv").config();
const logger = require("./logger");

// Create a secure context for STARTTLS
const secureContext = tls.createSecureContext({
  ciphers: "DEFAULT:@SECLEVEL=1", // Set custom cipher suites
});

// Define mailer headers
function priorityHeaders(level) {
  const targetLevel = level;
  let mailOptions = {};
  switch (targetLevel) {
    case 1:
      mailOptions = {
        "X-Priority": "1",
        "X-MSMail-Priority": "High",
        Importance: "High",
        "List-Unsubscribe": `<mailto:unsubscribe@${process.env.URL}>`, // Include unsubscribe header
      };
      return mailOptions;
    case 3:
      mailOptions = {
        "X-Priority": "3",
        "X-MSMail-Priority": "Normal",
        Importance: "Normal",
        "List-Unsubscribe": `<mailto:unsubscribe@${process.env.URL}>`, // Include unsubscribe header
      };
      return mailOptions;
    case 5:
      mailOptions = {
        "X-Priority": "5",
        "X-MSMail-Priority": "Low",
        Importance: "Low",
        "List-Unsubscribe": `<mailto:unsubscribe@${process.env.URL}>`, // Include unsubscribe header
      };
      return mailOptions;
    default:
      mailOptions = {
        "X-Priority": "1",
        "X-MSMail-Priority": "High",
        Importance: "High",
        "List-Unsubscribe": `<mailto:unsubscribe@${process.env.URL}>`, // Include unsubscribe header
      };
      return mailOptions;
  }
}

//@desc     Send email using the nearest proxy
//@param    options: {email, subject, attachments, message || message_1, message_2, message_3, header}
//@return   void
exports.sendEmail = async (options) => {
  logger.info(`attempting sending email to ${options.email}`);
  let transporter;
  let _template = template(options);

  // Process.envure nodemailer transport
  if (process.env.NODE_ENV === "development") {
    transporter = createTransport({
      host: process.env.MAILTRAP_HOST,
      port: process.env.MAILTRAP_PORT,
      auth: {
        user: process.env.MAILTRAP_USERNAME,
        pass: process.env.MAILTRAP_PASSWORD,
      },
    });
  } else {
    transporter = createTransport({
      host: process.env.MAIL_HOST,
      port: process.env.MAIL_PORT,
      secure: process.env.MAIL_PORT === 465,
      auth: {
        user: process.env.MAIL_ADDR,
        pass: process.env.MAIL_SECRET,
      },
      tls:
        process.env.MAIL_PORT !== 465
          ? {
              secureContext, // Apply the secure context for STARTTLS
              rejectUnauthorized: false, // Optional: Skip certificate verification
            }
          : undefined,
    });
  }

  // Email options
  const mailOptions = {
    from: `"${process.env.MAIL_DISPLAYNAME}" <${process.env.MAIL_ADDR}>`,
    to: options.email,
    subject: options.subject,
    html: _template,
    attachments: options.attachments ? options.attachments : null,
    headers: priorityHeaders(1), // 1 or 3 or 5
  };

  try {
    await transporter.sendMail(mailOptions).then((info) => {
      logger.info(`Email sent to ${options.email}: ${info.response}`);
    });
  } catch (error) {
    logger.error(`Failed to send email to ${options.email}: ${error.message}`);
  }
  // });
};
