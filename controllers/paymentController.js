const Flutterwave = require("flutterwave-node-v3");
const { asyncWrapper } = require("../utils/async");
require("dotenv").config();
const Payment = require("../models/Payment");
const Media = require("../models/Media");
const { StatusCodes } = require("http-status-codes");
const { config } = require("../config/config");
const { sendEmail } = require("../services/emailService");
const { currencyConverter } = require("../utils/rates");
const archiver = require("archiver");
const fs = require("fs");
const path = require("path");

// const sessionManager = require("../middleware/sessionManager");
// ...

const payment_mode = process.env.PAYMENT_MODE; // local or online

const flw = new Flutterwave(
  process.env.FLUTTERWAVE_SECRET_KEY,
  process.env.FLUTTERWAVE_PUBLIC_KEY
);

exports.createPaymentLink = asyncWrapper(async (req, res) => {
  const { amount, email, phone_number, description, products } = req.body;
  const nairaEquivalent = await currencyConverter(amount, "USD", "NGN");

  const payload = {
    tx_ref: `awpa-${Date.now()}`, // Unique transaction reference
    amount: amount,
    currency: "NGN", // Currency in Naira
    email: email,
    phone_number: phone_number,
    redirect_url: `${process.env.URL}/payment-success`,
    order_id: `awpa-order-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 9)}`,
    description: description,
  };
  // Save payment record
  const payment = await Payment.create({
    tx_ref: payload.tx_ref,
    amount,
    email,
    phone_number,
    description,
    products,
  });

  if (payment_mode === "local") {
    // send email notification to admin to confirm purchase only after bank transfer confirmed
    await sendEmail({
      to: `admin@${process.env.URL}`,
      subject: "New Purchase From Website",
      message_1: `A new purchase has been made on the website.`,
      message_2: `Transaction Reference: ${
        payment.tx_ref
      } \n Amount: ${amount} USD \n
      Naira Equivalent: ${nairaEquivalent.amount.toFixed(2)} NGN \n
      Email: ${email} \n Phone Number: ${phone_number} \n Description: ${description}`,
      message_3: `Please confirm the payment via bank transfer before accepting the purchase.`,
      cta: "Approve Purchase",
      ctaLink: `${process.env.URL}/payments/${payment._id}/approve?_method=POST`,
    });
    // Render payment page with local payment instructions
    return res.status(StatusCodes.CREATED).render("payment", {
      app_name: process.env.APP_NAME,
      url: process.env.URL,
      title: "Payment Status",
      description: config.page_desc,
      keywords: "home, welcome, church, Angel Wings Power Assembly",
      status: 201,
      payment,
      nairaEquivalent: nairaEquivalent.amount.toFixed(2),
      paymentLink: null, // No payment link for local payments
    });
  } else if (payment_mode === "online") {
    const response = await flw.PaymentLinks.create(payload);
    if (response.status === "success") {
      // return res.json({
      //   message: "Payment link created",
      //   link: response.data.link,
      // });
      res.status(StatusCodes.CREATED).render("payment", {
        app_name: process.env.APP_NAME,
        url: process.env.URL,
        title: "Payment Status",
        description: config.page_desc,
        keywords: "home, welcome, church, Angel Wings Power Assembly",
        status: 201,
        payment,
        paymentLink: response.data.link, // Pass the payment
        // link to the view
      });
    } else {
      return res.status(StatusCodes.BAD_REQUEST).render("status/status", {
        app_name: process.env.APP_NAME,
        url: process.env.URL,
        title: "Payment Status",
        description: config.page_desc,
        keywords: "home, welcome, church, Angel Wings Power Assembly",
        status: 400,
        message_title: "Payment Error",
        message: "Error creating payment link.",
        actionUrl: "/",
        actionText: "Back to website",
      });
    }
  }
});

exports.paymentCallback = asyncWrapper(async (req, res) => {
  const { status, tx_ref, transaction_id } = req.query;

  // Validate query parameters
  if (!status || !tx_ref || !transaction_id) {
    throw new CustomError(
      "Missing required query parameters",
      StatusCodes.BAD_REQUEST
    );
  }

  // Find payment record
  const payment = await Payment.findOne({ tx_ref });
  if (!payment) {
    throw new CustomError("Payment record not found", StatusCodes.NOT_FOUND);
  }

  // Verify payment with Flutterwave
  const verification = await flw.Transaction.verify({ id: transaction_id });

  if (
    verification.status === "success" &&
    verification.data.status === "successful"
  ) {
    // Update payment status to completed
    payment.status = "completed";
    await payment.save();

    return res.status(StatusCodes.OK).json({
      message: "Payment successful",
      tx_ref,
    });
  } else {
    // Update payment status to failed
    payment.status = "failed";
    await payment.save();

    return res.status(StatusCodes.BAD_REQUEST).json({
      message: "Payment failed",
      tx_ref,
    });
  }
});

exports.createManualPayment = asyncWrapper(async (req, res) => {
  const { product_id, product_type, email, phone_number, description, tx_ref } =
    req.body;

  // Validate required fields
  if (!product_id || !product_type || !email || !phone_number || !tx_ref) {
    return res.status(StatusCodes.BAD_REQUEST).render("status/status", {
      app_name: process.env.APP_NAME,
      url: process.env.URL,
      title: "Payment Error",
      description: config.page_desc,
      keywords: "payment, error, Angel Wings Power Assembly",
      status: 400,
      message_title: "Missing Required Fields",
      message: "Please fill in all required fields.",
      actionUrl: "/church-media",
      actionText: "Back to Media",
    });
  }

  // Find the media item to get its price
  const media = await Media.findById(product_id);
  if (!media) {
    return res.status(StatusCodes.NOT_FOUND).render("status/status", {
      app_name: process.env.APP_NAME,
      url: process.env.URL,
      title: "Payment Error",
      description: config.page_desc,
      keywords: "payment, error, Angel Wings Power Assembly",
      status: 404,
      message_title: "Media Not Found",
      message: "The requested media item could not be found.",
      actionUrl: "/church-media",
      actionText: "Back to Media",
    });
  }

  // Check if media is paid and has a price
  if (media.priceStatus !== "paid" || !media.price) {
    return res.status(StatusCodes.BAD_REQUEST).render("status/status", {
      app_name: process.env.APP_NAME,
      url: process.env.URL,
      title: "Payment Error",
      description: config.page_desc,
      keywords: "payment, error, Angel Wings Power Assembly",
      status: 400,
      message_title: "Invalid Media",
      message: "This media item is not available for purchase.",
      actionUrl: "/church-media",
      actionText: "Back to Media",
    });
  }

  const amount = media.price;
  const nairaEquivalent = await currencyConverter(amount, "USD", "NGN");

  // Create payment record
  const payment = await Payment.create({
    tx_ref,
    amount,
    email,
    phone_number,
    description: description || `Purchase of ${media.title}`,
    products: [
      {
        product_id: product_id,
        product_type: product_type,
      },
    ],
  });

  // Send email notification to admin
  await sendEmail({
    email: `admin@${process.env.URL}`,
    subject: "New Media Purchase From Website",
    message_1: `A new media purchase has been made on the website.`,
    message_2: `Transaction Reference: ${payment.tx_ref} \n 
    Amount: ${amount} USD \n
    Naira Equivalent: ${nairaEquivalent.amount.toFixed(2)} NGN \n
    Email: ${email} \n 
    Phone Number: ${phone_number} \n 
    Media Title: ${media.title} \n
    Description: ${description || "No description provided"}`,
    message_3: `Please confirm the payment via bank transfer before providing access to the media.`,
    cta: "Approve Purchase",
    ctaLink: `${process.env.URL}/payments/${payment._id}/approve?_method=POST`,
  });

  // Prepare products data for the template
  const products = [
    {
      title: media.title,
      price: media.price,
      quantity: 1,
    },
  ];

  // Render payment confirmation page
  return res.status(StatusCodes.CREATED).render("payment", {
    app_name: process.env.APP_NAME,
    url: process.env.URL,
    title: "Payment Confirmation",
    description: config.page_desc,
    keywords: "payment, confirmation, Angel Wings Power Assembly",
    status: 201,
    payment: {
      ...payment.toObject(),
      products: products,
    },
    nairaEquivalent: nairaEquivalent.amount.toFixed(2),
    paymentLink: null, // No payment link for manual payments
    media: {
      title: media.title,
      price: media.price,
    },
  });
});

exports.approvePayment = asyncWrapper(async (req, res) => {
  const paymentId = req.params.id;
  const payment = await Payment.findById(paymentId);
  if (!payment) {
    return res.status(404).render("status/status", {
      app_name: process.env.APP_NAME,
      url: process.env.URL,
      title: "Payment Not Found",
      description: config.page_desc,
      keywords: "payment, error, Angel Wings Power Assembly",
      status: 404,
      message_title: "Payment Not Found",
      message: "The payment record could not be found.",
      actionUrl: "/admin",
      actionText: "Back to admin dashboard",
    });
  }
  if (payment.status === "completed") {
    return res.status(400).render("status/status", {
      app_name: process.env.APP_NAME,
      url: process.env.URL,
      title: "Already Approved",
      description: config.page_desc,
      keywords: "payment, error, Angel Wings Power Assembly",
      status: 400,
      message_title: "Already Approved",
      message: "This payment has already been approved.",
      actionUrl: "/admin",
      actionText: "Back to admin dashboard",
    });
  }
  // Gather product files
  const productFiles = [];
  for (const prod of payment.products) {
    if (prod.product_type === "audio" || prod.product_type === "ebook") {
      const media = await Media.findById(prod.product_id);
      if (media && media.url) {
        productFiles.push(path.join(__dirname, "../public", media.url));
      }
    }
  }
  if (productFiles.length === 0) {
    return res.status(400).render("status/status", {
      app_name: process.env.APP_NAME,
      url: process.env.URL,
      title: "No Files",
      description: config.page_desc,
      keywords: "payment, error, Angel Wings Power Assembly",
      status: 400,
      message_title: "No Downloadable Files",
      message: "No downloadable files found for this purchase.",
      actionUrl: "/admin",
      actionText: "Back to admin dashboard",
    });
  }
  // Create zip
  const zipName = `purchase_${payment._id}.zip`;
  const zipPath = path.join(__dirname, `../logs/${zipName}`);
  try {
    await new Promise((resolve, reject) => {
      const output = fs.createWriteStream(zipPath);
      const archive = archiver("zip", { zlib: { level: 9 } });
      output.on("close", resolve);
      archive.on("error", reject);
      archive.pipe(output);
      for (const file of productFiles) {
        archive.file(file, { name: path.basename(file) });
      }
      archive.finalize();
    });
  } catch (zipErr) {
    console.error("Error creating zip:", zipErr);
    await sendEmail({
      email: `admin@${process.env.URL}`,
      subject: "Purchase Approval Failed (Zip Error)",
      message_1: `Failed to create zip for payment ${payment._id}: ${zipErr.message}`,
    });
    return res.status(500).render("status/status", {
      app_name: process.env.APP_NAME,
      url: process.env.URL,
      title: "Zip Error",
      description: config.page_desc,
      keywords: "payment, error, Angel Wings Power Assembly",
      status: 500,
      message_title: "Zip Error",
      message:
        "Failed to create zip file for this purchase. Admin has been notified.",
      actionUrl: "/admin",
      actionText: "Back to admin dashboard",
    });
  }
  // Send email with zip attachment
  let emailSuccess = true;
  try {
    await sendEmail({
      email: payment.email,
      subject: "Your Purchase from Angel Wings Power Assembly",
      message_1:
        "Thank you for your purchase! Please find your files attached.",
      message_2:
        "If you have any issues, contact us at contact@" + process.env.URL,
      attachments: [
        {
          filename: zipName,
          path: zipPath,
        },
      ],
    });
  } catch (emailErr) {
    emailSuccess = false;
    console.error("Error sending purchase email:", emailErr);
    await sendEmail({
      email: `admin@${process.env.URL}`,
      subject: "Purchase Approval Failed (Email Error)",
      message_1: `Failed to send purchase email for payment ${payment._id}: ${emailErr.message}`,
    });
  }
  // Clean up zip file
  try {
    fs.unlinkSync(zipPath);
  } catch (cleanupErr) {
    console.warn("Could not delete zip file:", zipPath, cleanupErr);
  }
  // Update payment status
  payment.status = "completed";
  await payment.save();
  return res.status(200).render("status/status", {
    app_name: process.env.APP_NAME,
    url: process.env.URL,
    title: "Payment Approved",
    description: config.page_desc,
    keywords: "payment, approved, Angel Wings Power Assembly",
    status: 200,
    message_title: emailSuccess
      ? "Purchase Approved"
      : "Purchase Approved (Email Failed)",
    message: emailSuccess
      ? "The purchase has been approved and files sent to the purchaser."
      : "The purchase was approved, but the email could not be sent. Admin has been notified.",
    actionUrl: "/admin",
    actionText: "Back to admin dashboard",
  });
});

exports.renderAdminPayments = asyncWrapper(async (req, res) => {
  const payments = await Payment.find({ status: "pending" }).lean();
  return res.render("admin/purchases", {
    app_name: process.env.APP_NAME,
    url: process.env.URL,
    title: "Pending Purchases",
    description: config.page_desc,
    keywords: "admin, purchases, Angel Wings Power Assembly",
    payments,
  });
});
