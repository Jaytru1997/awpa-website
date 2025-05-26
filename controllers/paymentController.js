const Flutterwave = require("flutterwave-node-v3");
const { asyncWrapper } = require("../utils/async");
require("dotenv").config();
const Payment = require("../models/Payment");
const { StatusCodes } = require("http-status-codes");
const { config } = require("../config/config");
const { sendEmail } = require("../services/emailService");
const { currencyConverter } = require("../utils/rates");

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
