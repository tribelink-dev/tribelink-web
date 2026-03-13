/**
 * Shared booking fulfillment after successful payment.
 * Used by all payment provider webhooks (Stripe, Razorpay).
 */

const Booking = require('../../models/Booking');

/**
 * Mark a booking as paid. Idempotent: safe to call multiple times for same booking.
 * @param {string} bookingId - MongoDB booking _id
 * @param {string} transactionId - Provider payment/transaction id
 * @param {string} paymentMethod - e.g. 'Stripe', 'Razorpay'
 * @returns {Promise<{ updated: boolean }>}
 */
async function fulfillBooking(bookingId, transactionId, paymentMethod) {
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    console.error('[Payment Fulfillment] Booking not found:', bookingId);
    return { updated: false };
  }
  if (booking.paymentStatus === 'Completed') {
    return { updated: false };
  }
  booking.paymentStatus = 'Completed';
  booking.status = 'Confirmed';
  booking.paymentMethod = paymentMethod;
  booking.paymentDate = new Date();
  booking.transactionId = transactionId;
  await booking.save();
  console.log('[Payment Fulfillment] Booking marked paid:', bookingId);
  return { updated: true };
}

module.exports = { fulfillBooking };
