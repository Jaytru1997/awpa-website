const Flutterwave = require("flutterwave-node-v3");
const { asyncWrapper } = require("../utils/async");
require("dotenv").config();
const Payment = require("../models/Payment");
const { StatusCodes } = require("http-status-codes");
const { config } = require("../config/config");

// const sessionManager = require("../middleware/sessionManager");
// ...

const flw = new Flutterwave(
  process.env.FLUTTERWAVE_SECRET_KEY,
  process.env.FLUTTERWAVE_PUBLIC_KEY
);

// exports.createPaymentLink = asyncWrapper(async (req, res) => {
//   const { amount, email, phone_number, description } = req.body;

//   const payload = {
//     tx_ref: `awpa-${Date.now()}`, // Unique transaction reference
//     amount: amount,
//     currency: "NGN", // Currency in Naira
//     email: email,
//     phone_number: phone_number,
//     redirect_url: `${process.env.URL}/payment-success`,
//     order_id: `awpa-order-${Date.now()}-${Math.random()
//       .toString(36)
//       .slice(2, 9)}`, // Optional if you want to associate with orders
//     description: description,
//   };

//   const payment = await Payment.create({
//     tx_ref: payload.tx_ref,
//     amount,
//     email,
//     phone_number,
//     description,
//   });

//   const response = await flw.PaymentLinks.create(payload);

//   if (response.status === "success") {
//     return res.json({
//       message: "Payment link created",
//       link: response.data.link,
//     });
//   } else {
//     return res
//       .status(400)
//       .json({ message: "Error creating payment link", error: response });
//   }
// });

// Handle payment callback
// exports.paymentCallback = asyncWrapper((req, res) => {
//   const { status, tx_ref } = req.query;

//   // You can use tx_ref to confirm payment in your database
//   if (status === "successful") {
//     return res.status(200).json({ message: "Payment successful", tx_ref });
//   } else {
//     return res.status(400).json({ message: "Payment failed" });
//   }
// });

exports.createPaymentLink = asyncWrapper(async (req, res) => {
  const { amount, email, phone_number, description, products } = req.body;

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
  await Payment.create({
    tx_ref: payload.tx_ref,
    amount,
    email,
    phone_number,
    description,
    products,
  });

  const response = await flw.PaymentLinks.create(payload);

  if (response.status === "success") {
    return res.json({
      message: "Payment link created",
      link: response.data.link,
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
