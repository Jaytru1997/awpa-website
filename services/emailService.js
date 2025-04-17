const dns = require("dns");
const fs = require("fs");
const tls = require("tls");
const path = require("path");
const geoip = require("geoip-lite");
const { createTransport } = require("nodemailer");
const { HttpsProxyAgent } = require("https-proxy-agent");
const { SocksProxyAgent } = require("socks-proxy-agent");
const { template } = require("./email.template");
require("dotenv").config();
const logger = require("./logger");

// Create a secure context for STARTTLS
const secureContext = tls.createSecureContext({
  ciphers: "DEFAULT:@SECLEVEL=1", // Set custom cipher suites
});

// Proxies
const proxyFilePath = path.join(__dirname, "active_proxies.txt");

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
/**
 * Parse the proxy list from a file.
 */
function loadProxies(proxyFilePath) {
  console.log("loading proxies");
  const proxies = fs
    .readFileSync(proxyFilePath, "utf-8")
    .split("\n")
    .filter((line) => line.trim() !== "");
  return proxies.map((proxy) => {
    const [protocol, address] = proxy.split("://");
    return { protocol, address };
  });
}

/**
 * Find the nearest proxy based on recipient's location.
 */
function findNearestProxy(proxies, recipientLocation) {
  console.log("finding nearest proxy");
  let nearestProxy = null;
  let shortestDistance = Infinity;

  proxies.forEach((proxy) => {
    const proxyIP = proxy.address.split(":")[0];
    const proxyLocation = geoip.lookup(proxyIP);

    if (proxyLocation && recipientLocation) {
      const distance = calculateDistance(
        recipientLocation.ll[0],
        recipientLocation.ll[1],
        proxyLocation.ll[0],
        proxyLocation.ll[1]
      );

      if (distance < shortestDistance) {
        shortestDistance = distance;
        nearestProxy = proxy;
      }
    }
  });

  return nearestProxy;
}

/**
 * Return a randomly selected proxy
 */
function getRandomProxy(proxies) {
  if (!proxies || proxies.length === 0) {
    return null;
  }
  const randomIndex = Math.floor(Math.random() * proxies.length);
  return proxies[randomIndex];
}

/**
 * Calculate distance between two geographical points using the Haversine formula.
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  console.log("calculating distance");
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
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
    const proxies = loadProxies(proxyFilePath);
    let agent = null;

    // Find the nearest proxy
    const randomProxy = getRandomProxy(proxies);
    if (!randomProxy) {
      console.error("No suitable proxy found.");
      return;
    }

    agent =
      randomProxy.protocol === "socks4"
        ? new SocksProxyAgent(
            `${randomProxy.protocol}://${randomProxy.address}`
          )
        : new HttpsProxyAgent(
            `${randomProxy.protocol}://${randomProxy.address}`
          );
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
      proxy: agent,
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
