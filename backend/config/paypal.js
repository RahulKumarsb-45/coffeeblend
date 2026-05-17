const checkoutNodeJssdk = require('@paypal/checkout-server-sdk');

// Set up PayPal environment (sandbox or live)
function environment() {
  const clientId     = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  const mode         = process.env.PAYPAL_MODE || 'sandbox';

  if (mode === 'live') {
    return new checkoutNodeJssdk.core.LiveEnvironment(clientId, clientSecret);
  }
  return new checkoutNodeJssdk.core.SandboxEnvironment(clientId, clientSecret);
}

// Return PayPal HTTP client
function paypalClient() {
  return new checkoutNodeJssdk.core.PayPalHttpClient(environment());
}

module.exports = { paypalClient };
