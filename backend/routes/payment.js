const express = require("express");
const router = express.Router();
const checkoutNodeJssdk = require("@paypal/checkout-server-sdk");
const { paypalClient } = require("../config/paypal");
const Payment = require("../models/Payment");
const Order = require("../models/Order");
const Cart = require("../models/Cart");
const { protect, adminOnly } = require("../middleware/auth");

// ============================================================
// GET /api/payment/config
// Send PayPal client ID to frontend (no secret exposed)
// ============================================================
router.get("/config", (req, res) => {
  res.json({
    success: true,
    clientId: process.env.PAYPAL_CLIENT_ID || "",
    mode: process.env.PAYPAL_MODE || "sandbox",
    currency: process.env.PAYPAL_CURRENCY || "USD",
  });
});

// ============================================================
// POST /api/payment/create-order
// Create a PayPal order — called when user clicks Pay button
// ============================================================
router.post("/create-order", protect, async (req, res) => {
  try {
    const { amount, orderId, items } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: "Invalid amount" });
    }

    if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
      return res.status(503).json({
        success: false,
        message: "PayPal integration is not configured on this server. Please use Cash on Delivery."
      });
    }

    const currency = process.env.PAYPAL_CURRENCY || "USD";
    const formattedAmount = parseFloat(amount).toFixed(2);

    // Build PayPal order request
    const request = new checkoutNodeJssdk.orders.OrdersCreateRequest();
    request.prefer("return=representation");
    request.requestBody({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: currency,
            value: formattedAmount,
            breakdown: {
              item_total: {
                currency_code: currency,
                value: formattedAmount,
              },
            },
          },
          items: items && items.length > 0
            ? items.map((item) => ({
                name: (item.name || "CoffeeBlend Item").substring(0, 127),
                unit_amount: {
                  currency_code: currency,
                  value: parseFloat(item.price || 0).toFixed(2),
                },
                quantity: String(item.quantity || 1),
              }))
            : [
                {
                  name: "CoffeeBlend Mumbai Order",
                  unit_amount: {
                    currency_code: currency,
                    value: formattedAmount,
                  },
                  quantity: "1",
                },
              ],
        },
      ],
      application_context: {
        brand_name: "CoffeeBlend Mumbai",
        locale: "en-US",
        landing_page: "BILLING",
        user_action: "PAY_NOW",
        return_url: `${process.env.FRONTEND_URL || "http://localhost:5000"}/orders.html?payment=success`,
        cancel_url: `${process.env.FRONTEND_URL || "http://localhost:5000"}/checkout.html?payment=cancelled`,
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
      currency: currency,
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
    res.status(500).json({
      success: false,
      message: "PayPal order creation failed",
      error: err.message,
    });
  }
});

// ============================================================
// POST /api/payment/capture/:paypalOrderId
// Capture payment after user approves on PayPal
// ============================================
router.post("/capture/:paypalOrderId", protect, async (req, res) => {
  try {
    const { paypalOrderId } = req.params;
    const { cartItems, shippingAddress, fulfilmentType = 'pickup' } = req.body;

    // Check if already captured to prevent duplicate processing
    const existingPayment = await Payment.findOne({ paypalOrderId });
    if (existingPayment && existingPayment.status === "captured") {
      return res.json({
        success: true,
        message: "Payment already captured.",
        orderId: existingPayment.order,
        transactionId: existingPayment.paypalTransactionId
      });
    }

    // Capture payment via PayPal API
    const request = new checkoutNodeJssdk.orders.OrdersCaptureRequest(paypalOrderId);
    request.requestBody({});

    const captureData = await paypalClient().execute(request);
    const capture = captureData.result.purchase_units[0].payments.captures[0];
    const payer = captureData.result.payer;

    // Update Payment in MongoDB
    const payment = await Payment.findOneAndUpdate(
      { paypalOrderId },
      {
        status: "captured",
        paypalPayerId: payer ? payer.payer_id : "",
        paypalTransactionId: capture ? capture.id : "",
        payerEmail: payer ? payer.email_address : "",
        payerName: payer && payer.name ? `${payer.name.given_name || ''} ${payer.name.surname || ''}`.trim() : "",
        rawResponse: captureData.result,
      },
      { new: true, upsert: true }
    );

    // Create order in MongoDB after verified payment
    let order = null;
    if (cartItems && cartItems.length > 0) {
      const totalAmount = cartItems.reduce(
        (s, i) => s + parseFloat(i.price) * (parseInt(i.quantity, 10) || 1),
        0
      );

      order = await Order.create({
        user: req.user._id,
        items: cartItems.map(i => ({
          name: i.name,
          price: parseFloat(i.price),
          quantity: parseInt(i.quantity, 10) || 1,
          image: i.image || 'images/menu-1.jpg',
          size: i.size || 'Regular',
          milk: i.milk || 'Standard',
          sugar: i.sugar || 'Normal'
        })),
        totalAmount: Math.round(totalAmount * 100) / 100,
        fulfilmentType,
        shippingAddress: fulfilmentType === 'delivery' ? (shippingAddress || {}) : {},
        paymentMethod: "PayPal",
        paymentStatus: "paid",
        status: "confirmed", // auto-confirm on verified payment
        paymentReference: capture.id
      });

      // Clear cart
      await Cart.findOneAndUpdate(
        { user: req.user._id },
        { items: [], totalAmount: 0 }
      );

      // Link payment to order
      if (payment) {
        payment.order = order._id;
        await payment.save();
      }
    }

    res.json({
      success: true,
      message: "Payment successful! Order confirmed. 🎉",
      transactionId: capture.id,
      payerEmail: payer ? payer.email_address : '',
      payerName: payer && payer.name ? `${payer.name.given_name || ''} ${payer.name.surname || ''}`.trim() : '',
      amount: capture.amount ? capture.amount.value : '',
      orderId: order ? order._id : null,
    });
  } catch (err) {
    console.error("PayPal capture error:", err);

    await Payment.findOneAndUpdate(
      { paypalOrderId: req.params.paypalOrderId },
      { status: "failed" }
    );

    res.status(500).json({
      success: false,
      message: "Payment capture failed",
      error: err.message,
    });
  }
});

// ============================================================
// GET /api/payment/my-payments
// ============================================================
router.get("/my-payments", protect, async (req, res) => {
  try {
    const payments = await Payment.find({ user: req.user._id })
      .populate("order")
      .sort({ createdAt: -1 });
    res.json({ success: true, count: payments.length, payments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================================
// GET /api/payment/all (Admin only)
// ============================================================
router.get("/admin/all", protect, adminOnly, async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate("user", "username email")
      .populate("order")
      .sort({ createdAt: -1 });
    res.json({ success: true, count: payments.length, payments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
