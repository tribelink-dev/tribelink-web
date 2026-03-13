/**
 * Stripe webhook handler.
 * Must be mounted with raw body (express.raw) for signature verification.
 * Route: POST /api/webhooks/stripe
 */

const Stripe = require('stripe');
const { fulfillBooking } = require('../services/payment');

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

const router = require('express').Router();

router.post('/', (req, res) => {
  if (!stripe || !webhookSecret) {
    console.error('[Stripe Webhook] STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET not set');
    return res.status(503).send('Webhook not configured');
  }

  const sig = req.headers['stripe-signature'];
  if (!sig) {
    return res.status(400).send('Missing stripe-signature');
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('[Stripe Webhook] Signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const bookingId = session.metadata?.bookingId;
    if (!bookingId) {
      console.warn('[Stripe Webhook] checkout.session.completed missing metadata.bookingId');
      return res.status(200).send('OK');
    }
    const transactionId = session.payment_intent || session.id;
    fulfillBooking(bookingId, transactionId, 'Stripe').catch(err => console.error('[Stripe Webhook]', err));
  }

  res.status(200).send('OK');
});

module.exports = router;
