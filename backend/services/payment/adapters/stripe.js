/**
 * Stripe payment adapter.
 * Used when PAYMENT_PROVIDER=stripe.
 */

const Stripe = require('stripe');

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

async function createPaymentSession(booking, user) {
  if (!stripe) {
    throw new Error('Stripe is not configured. Set STRIPE_SECRET_KEY.');
  }
  const currency = (booking.currency || 'INR').toLowerCase();
  const amount = Math.round(Number(booking.totalPrice) * 100);
  if (amount < 1) {
    throw new Error('Invalid booking amount');
  }
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [{
      price_data: {
        currency,
        unit_amount: amount,
        product_data: {
          name: `Booking ${booking.bookingType || 'Stay'}`,
          description: `Booking ref: ${booking._id}`,
        },
      },
      quantity: 1,
    }],
    success_url: `${frontendUrl}/bookings?payment=success`,
    cancel_url: `${frontendUrl}/bookings/payment?id=${booking._id}`,
    metadata: {
      bookingId: booking._id.toString(),
      userId: user._id.toString(),
    },
    client_reference_id: booking._id.toString(),
  });
  return { url: session.url };
}

module.exports = { createPaymentSession };
