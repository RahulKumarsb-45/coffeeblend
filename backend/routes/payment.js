const express = require("express");
const router = express.Router();
const checkoutNodeJssdk = require("@paypal/checkout-server-sdk");
const { paypalClient } = require("../config/paypal");
const Payment = require("../models/Payment");
const Order = require("../models/Order");
const Cart = require("../models/Cart");
const { protect } = require("../middleware/auth");

// ============================================================
// POST /api/payment/create-order
// Create a PayPal order — called when user clicks Pay button
// ============================================================
router.post("/create-order", protect, async (req, res) => {
  try {
    const { amount, orderId, items } = req.body;

    if (!amount || amount <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid amount" });
    }

    // Build PayPal order request
    const request = new checkoutNodeJssdk.orders.OrdersCreateRequest();
    request.prefer("return=representation");
    request.requestBody({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: "USD",
            value: parseFloat(amount).toFixed(2),
            breakdown: {
              item_total: {
                currency_code: "USD",
                value: parseFloat(amount).toFixed(2),
              },
            },
          },
          items: items
            ? items.map((item) => ({
                name: item.name.substring(0, 127),
                unit_amount: {
                  currency_code: "USD",
                  value: parseFloat(item.price).toFixed(2),
                },
                quantity: String(item.quantity),
              }))
            : [
                {
                  name: "CoffeeBlend Order",
                  unit_amount: {
                    currency_code: "USD",
                    value: parseFloat(amount).toFixed(2),
                  },
                  quantity: "1",
                },
              ],
        },
      ],
      application_context: {
        brand_name: "CoffeeBlend",
        locale: "en-US",
        landing_page: "BILLING",
        user_action: "PAY_NOW",
        return_url:
          "https://coffeeblend-rho.vercel.app/checkout.html?paypal=success",

        cancel_url:
          "https://coffeeblend-rho.vercel.app/checkout.html?paypal=cancel",
      },
    });

    // Call PayPal API
    const paypalOrder = await paypalClient().execute(request);

    // Save payment record to MongoDB
    const payment = await Payment.create({
      user: req.user._id,
      order: orderId || null,
      paypalOrderId: paypalOrder.result.id,
      amount: parseFloat(amount),
      currency: "USD",
      status: "created",
      rawResponse: paypalOrder.result,
    });

    res.json({
      success: true,
      paypalOrderId: paypalOrder.result.id,
      paymentId: payment._id,
      links: paypalOrder.result.links,
    });
  } catch (err) {
    console.error("PayPal create error:", err);
    res
      .status(500)
      .json({
        success: false,
        message: "PayPal order creation failed",
        error: err.message,
      });
  }
});

// ============================================================
// POST /api/payment/capture/:paypalOrderId
// Capture payment after user approves on PayPal
// ============================================================
router.post("/capture/:paypalOrderId", protect, async (req, res) => {
  try {
    const { paypalOrderId } = req.params;
    const { cartItems, shippingAddress } = req.body;

    // Capture payment via PayPal API
    const request = new checkoutNodeJssdk.orders.OrdersCaptureRequest(
      paypalOrderId,
    );
    request.requestBody({});

    const captureData = await paypalClient().execute(request);
    const capture = captureData.result.purchase_units[0].payments.captures[0];
    const payer = captureData.result.payer;

    // Update Payment in MongoDB
    const payment = await Payment.findOneAndUpdate(
      { paypalOrderId },
      {
        status: "captured",
        paypalPayerId: payer.payer_id,
        paypalTransactionId: capture.id,
        payerEmail: payer.email_address,
        payerName: `${payer.name.given_name} ${payer.name.surname}`,
        rawResponse: captureData.result,
      },
      { new: true },
    );

    // Create order in MongoDB after successful payment
    let order = null;
    if (cartItems && cartItems.length > 0) {
      const totalAmount = cartItems.reduce(
        (s, i) => s + i.price * i.quantity,
        0,
      );
      order = await Order.create({
        user: req.user._id,
        items: cartItems,
        totalAmount,
        shippingAddress: shippingAddress || {},
        paymentMethod: "PayPal",
        status: "confirmed", // auto-confirm on PayPal payment
      });

      // Clear cart
      await Cart.findOneAndUpdate(
        { user: req.user._id },
        { items: [], totalAmount: 0 },
      );

      // Link payment to order
      if (payment) {
        payment.order = order._id;
        await payment.save();
      }
    }

    res.json({
      success: true,
      message: "Payment successful! 🎉",
      transactionId: capture.id,
      payerEmail: payer.email_address,
      payerName: `${payer.name.given_name} ${payer.name.surname}`,
      amount: capture.amount.value,
      orderId: order ? order._id : null,
    });
  } catch (err) {
    console.error("PayPal capture error:", err);

    // Mark payment as failed
    await Payment.findOneAndUpdate(
      { paypalOrderId: req.params.paypalOrderId },
      { status: "failed" },
    );

    res
      .status(500)
      .json({
        success: false,
        message: "Payment capture failed",
        error: err.message,
      });
  }
});

// ============================================================
// GET /api/payment/my-payments
// Get logged-in user's payment history
// ============================================================
router.get("/my-payments", protect, async (req, res) => {
  try {
    const payments = await Payment.find({ user: req.user._id })
      .populate("order")
      .sort("-createdAt");
    res.json({ success: true, count: payments.length, payments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================================
// GET /api/payment/all  (Admin)
// ============================================================
const { adminOnly } = require("../middleware/auth");
router.get("/all", protect, adminOnly, async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate("user", "username email")
      .populate("order")
      .sort("-createdAt");
    res.json({ success: true, count: payments.length, payments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================================
// GET /api/payment/config
// Send PayPal client ID to frontend (no secret exposed)
// ============================================================
router.get("/config", (req, res) => {
  res.json({
    success: true,
    clientId: process.env.PAYPAL_CLIENT_ID,
    mode: process.env.PAYPAL_MODE || "sandbox",
    currency: "USD",
  });
});

module.exports = router;
