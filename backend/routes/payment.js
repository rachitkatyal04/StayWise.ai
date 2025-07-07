const express = require("express");
const { body, validationResult } = require("express-validator");
const Booking = require("../models/Booking");
const {
  authenticate,
  requireCustomer,
  protect,
} = require("../middleware/auth");
const asyncHandler = require("express-async-handler");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const router = express.Router();

// For now, we'll create a simple payment simulation
// In production, you would integrate with Razorpay SDK

// Create payment order
router.post(
  "/create-order",
  authenticate,
  requireCustomer,
  [
    body("bookingId").isMongoId().withMessage("Valid booking ID is required"),
    body("amount").isNumeric().withMessage("Valid amount is required"),
  ],
  async (req, res) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { bookingId, amount } = req.body;

      // Verify booking exists and belongs to user
      const booking = await Booking.findById(bookingId);
      if (!booking) {
        return res.status(404).json({
          message: "Booking not found",
        });
      }

      if (booking.user.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          message: "Access denied. You can only pay for your own bookings.",
        });
      }

      if (booking.payment.status === "completed") {
        return res.status(400).json({
          message: "Payment has already been completed for this booking",
        });
      }

      // Verify amount matches booking total
      const bookingTotal = booking.pricing?.totalAmount || booking.totalAmount;
      if (amount !== bookingTotal) {
        return res.status(400).json({
          message: "Payment amount does not match booking total",
        });
      }

      // In a real implementation, you would create a Razorpay order here
      // For now, we'll simulate the order creation
      const orderId = `order_${Date.now()}_${Math.random()
        .toString(36)
        .substring(2, 15)}`;

      // Update booking with order information
      booking.payment.razorpayOrderId = orderId;
      booking.payment.status = "processing";
      await booking.save();

      res.json({
        message: "Payment order created successfully",
        orderId,
        amount,
        currency: "INR",
        bookingId,
        razorpayKeyId: "your_razorpay_key_id", // In production, use actual Razorpay key
      });
    } catch (error) {
      console.error("Payment order creation error:", error);
      res.status(500).json({
        message: "Failed to create payment order",
        error: error.message,
      });
    }
  }
);

// Verify payment
router.post(
  "/verify",
  authenticate,
  requireCustomer,
  [
    body("bookingId").isMongoId().withMessage("Valid booking ID is required"),
    body("paymentId").notEmpty().withMessage("Payment ID is required"),
    body("orderId").notEmpty().withMessage("Order ID is required"),
    body("signature")
      .optional()
      .notEmpty()
      .withMessage("Signature is required for Razorpay verification"),
  ],
  async (req, res) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { bookingId, paymentId, orderId, signature } = req.body;

      // Verify booking exists and belongs to user
      const booking = await Booking.findById(bookingId);
      if (!booking) {
        return res.status(404).json({
          message: "Booking not found",
        });
      }

      if (booking.user.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          message:
            "Access denied. You can only verify payments for your own bookings.",
        });
      }

      // Verify order ID matches
      if (booking.payment.razorpayOrderId !== orderId) {
        return res.status(400).json({
          message: "Order ID mismatch",
        });
      }

      // In a real implementation, you would verify the payment signature with Razorpay
      // For now, we'll simulate successful payment verification
      const isValidSignature = true; // In production: verify using Razorpay signature

      if (isValidSignature) {
        // Update booking payment status
        booking.payment.status = "completed";
        booking.payment.razorpayPaymentId = paymentId;
        booking.payment.razorpaySignature = signature;
        booking.payment.paidAt = new Date();
        booking.status = "confirmed";

        await booking.save();

        // Populate booking details for response
        await booking.populate("hotel", "name location images contact");

        res.json({
          message: "Payment verified and booking confirmed successfully",
          booking,
          paymentStatus: "success",
        });
      } else {
        // Payment verification failed
        booking.payment.status = "failed";
        await booking.save();

        res.status(400).json({
          message: "Payment verification failed",
          paymentStatus: "failed",
        });
      }
    } catch (error) {
      console.error("Payment verification error:", error);
      res.status(500).json({
        message: "Failed to verify payment",
        error: error.message,
      });
    }
  }
);

// Simulate payment success (for testing purposes)
router.post(
  "/simulate-success",
  authenticate,
  requireCustomer,
  [body("bookingId").isMongoId().withMessage("Valid booking ID is required")],
  async (req, res) => {
    try {
      const { bookingId } = req.body;

      const booking = await Booking.findById(bookingId);
      if (!booking) {
        return res.status(404).json({
          message: "Booking not found",
        });
      }

      if (booking.user.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          message: "Access denied",
        });
      }

      // Simulate successful payment
      booking.payment.status = "completed";
      booking.payment.razorpayPaymentId = `pay_${Date.now()}_${Math.random()
        .toString(36)
        .substring(2, 15)}`;
      booking.payment.transactionId = `txn_${Date.now()}`;
      booking.payment.paidAt = new Date();
      booking.status = "confirmed";

      await booking.save();

      // Populate booking details
      await booking.populate("hotel", "name location images contact");

      res.json({
        message: "Payment simulated successfully - Booking confirmed!",
        booking,
        paymentStatus: "success",
      });
    } catch (error) {
      console.error("Payment simulation error:", error);
      res.status(500).json({
        message: "Failed to simulate payment",
        error: error.message,
      });
    }
  }
);

// Get payment status
router.get("/status/:bookingId", authenticate, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId);

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found",
      });
    }

    // Check if user owns this booking or is admin
    if (
      booking.user.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        message:
          "Access denied. You can only check payment status for your own bookings.",
      });
    }

    res.json({
      message: "Payment status retrieved successfully",
      bookingId: booking._id,
      paymentStatus: booking.payment.status,
      paymentMethod: booking.payment.method,
      amount: booking.pricing.totalAmount,
      paidAt: booking.payment.paidAt,
      transactionId: booking.payment.transactionId,
    });
  } catch (error) {
    console.error("Payment status error:", error);
    res.status(500).json({
      message: "Failed to get payment status",
      error: error.message,
    });
  }
});

// Refund payment (Admin only)
router.post(
  "/refund",
  authenticate,
  [
    body("bookingId").isMongoId().withMessage("Valid booking ID is required"),
    body("amount").isNumeric().withMessage("Valid refund amount is required"),
    body("reason")
      .optional()
      .isLength({ max: 200 })
      .withMessage("Reason cannot exceed 200 characters"),
  ],
  async (req, res) => {
    try {
      // Check if user is admin
      if (req.user.role !== "admin") {
        return res.status(403).json({
          message: "Access denied. Only admins can process refunds.",
        });
      }

      const { bookingId, amount, reason } = req.body;

      const booking = await Booking.findById(bookingId);
      if (!booking) {
        return res.status(404).json({
          message: "Booking not found",
        });
      }

      if (booking.payment.status !== "completed") {
        return res.status(400).json({
          message: "Cannot refund. Payment was not completed.",
        });
      }

      if (amount > booking.pricing.totalAmount) {
        return res.status(400).json({
          message: "Refund amount cannot exceed the original payment amount",
        });
      }

      // In a real implementation, you would process the refund with Razorpay
      // For now, we'll simulate the refund
      const refundId = `rfnd_${Date.now()}_${Math.random()
        .toString(36)
        .substring(2, 15)}`;

      // Update booking with refund information
      booking.payment.status = "refunded";
      booking.payment.refundId = refundId;
      booking.payment.refundAmount = amount;
      booking.payment.refundedAt = new Date();
      booking.status = "cancelled";
      booking.cancellation.isCancelled = true;
      booking.cancellation.cancelledAt = new Date();
      booking.cancellation.cancelledBy = req.user._id;
      booking.cancellation.reason = reason || "Refund processed by admin";
      booking.cancellation.refundAmount = amount;

      await booking.save();

      res.json({
        message: "Refund processed successfully",
        refundId,
        refundAmount: amount,
        booking,
      });
    } catch (error) {
      console.error("Refund processing error:", error);
      res.status(500).json({
        message: "Failed to process refund",
        error: error.message,
      });
    }
  }
);

// Create payment intent
router.post(
  "/create-payment-intent",
  authenticate,
  requireCustomer,
  [
    body("amount").isNumeric().withMessage("Valid amount is required"),
    body("bookingId")
      .optional()
      .isMongoId()
      .withMessage("Valid booking ID is required"),
  ],
  async (req, res) => {
    try {
      const { amount, bookingId } = req.body;

      // Create a PaymentIntent with the order amount and currency
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount * 100, // Convert to cents
        currency: "inr",
        metadata: {
          bookingId: bookingId || "",
          userId: req.user._id.toString(),
        },
      });

      res.json({
        clientSecret: paymentIntent.client_secret,
      });
    } catch (error) {
      console.error("Payment intent creation error:", error);
      res.status(500).json({
        message: "Failed to create payment intent",
        error: error.message,
      });
    }
  }
);

// Webhook to handle Stripe events
router.post("/webhook", async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case "payment_intent.succeeded":
      const paymentIntent = event.data.object;
      const bookingId = paymentIntent.metadata.bookingId;

      if (bookingId) {
        try {
          const booking = await Booking.findById(bookingId);
          if (booking) {
            booking.payment = {
              status: "completed",
              stripePaymentIntentId: paymentIntent.id,
              paidAt: new Date(),
            };
            booking.status = "confirmed";
            await booking.save();
          }
        } catch (error) {
          console.error("Error updating booking after payment:", error);
        }
      }
      break;

    case "payment_intent.payment_failed":
      const failedPayment = event.data.object;
      const failedBookingId = failedPayment.metadata.bookingId;

      if (failedBookingId) {
        try {
          const booking = await Booking.findById(failedBookingId);
          if (booking) {
            booking.payment = {
              status: "failed",
              stripePaymentIntentId: failedPayment.id,
              failedAt: new Date(),
            };
            booking.status = "payment_failed";
            await booking.save();
          }
        } catch (error) {
          console.error("Error updating booking after payment failure:", error);
        }
      }
      break;
  }

  res.json({ received: true });
});

module.exports = router;
