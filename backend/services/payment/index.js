/**
 * Provider-agnostic payment service.
 * Switch provider via PAYMENT_PROVIDER=razorpay|stripe.
 */

const { fulfillBooking } = require('./fulfillment');

const PROVIDER = (process.env.PAYMENT_PROVIDER || 'razorpay').toLowerCase();

function getAdapter() {
  if (PROVIDER === 'stripe') {
    return require('./adapters/stripe');
  }
  if (PROVIDER === 'razorpay') {
    return require('./adapters/razorpay');
  }
  return null;
}

/**
 * Create a payment session (redirect URL) for the booking.
 * @param {object} booking - Booking document (plain or Mongoose)
 * @param {object} user - User document (req.user)
 * @returns {Promise<{ url: string }>}
 */
async function createPaymentSession(booking, user) {
  const adapter = getAdapter();
  if (!adapter || !adapter.createPaymentSession) {
    throw new Error(`Payment provider "${PROVIDER}" is not configured or has no createPaymentSession.`);
  }
  return adapter.createPaymentSession(booking, user);
}

module.exports = {
  createPaymentSession,
  fulfillBooking,
  getProvider: () => PROVIDER,
};
