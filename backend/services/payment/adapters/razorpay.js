/**
 * Razorpay payment adapter.
 * Used when PAYMENT_PROVIDER=razorpay.
 */

const Razorpay = require('razorpay');

const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;
const instance = keyId && keySecret ? new Razorpay({ key_id: keyId, key_secret: keySecret }) : null;

async function createPaymentSession(booking, user) {
  if (!instance) {
    throw new Error('Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.');
  }
  const amountPaise = Math.round(Number(booking.totalPrice) * 100);
  const amount = Math.max(100, amountPaise);
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const description = `Booking ${booking.bookingType || 'Stay'} - ${booking._id}`;
  const params = {
    amount,
    currency: 'INR',
    description,
    callback_url: `${frontendUrl}/bookings?payment=success`,
    callback_method: 'get',
    notes: {
      bookingId: booking._id.toString(),
      userId: user._id.toString(),
    },
  };
  if (user.name || user.email) {
    params.customer = {
      name: user.name || undefined,
      email: user.email || undefined,
      contact: user.phoneNumber || undefined,
    };
  }
  const response = await instance.paymentLink.create(params);
  const url = response.short_url;
  if (!url) {
    throw new Error('Razorpay did not return a payment URL.');
  }
  return { url };
}

module.exports = { createPaymentSession };
