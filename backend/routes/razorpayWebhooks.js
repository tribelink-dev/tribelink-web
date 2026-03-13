/**
 * Razorpay webhook handler.
 * Must be mounted with raw body (express.raw) for signature verification.
 * Route: POST /api/webhooks/razorpay
 */

const crypto = require('crypto');
const { fulfillBooking } = require('../services/payment');

const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

const router = require('express').Router();

function verifySignature(body, signature) {
  if (!webhookSecret) return false;
  const expected = crypto.createHmac('sha256', webhookSecret).update(body).digest('hex');
  return expected === signature;
}

router.post('/', (req, res) => {
  if (!webhookSecret) {
    console.error('[Razorpay Webhook] RAZORPAY_WEBHOOK_SECRET not set');
    return res.status(503).send('Webhook not configured');
  }

  const signature = req.headers['x-razorpay-signature'];
  if (!signature) {
    return res.status(400).send('Missing x-razorpay-signature');
  }

  const rawBody = req.body;
  const bodyStr = Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : (typeof rawBody === 'string' ? rawBody : JSON.stringify(rawBody));
  if (!verifySignature(bodyStr, signature)) {
    console.error('[Razorpay Webhook] Signature verification failed');
    return res.status(400).send('Invalid signature');
  }

  let payload;
  try {
    payload = JSON.parse(bodyStr);
  } catch (e) {
    return res.status(400).send('Invalid JSON');
  }

  const event = payload.event;
  if (event === 'payment.captured') {
    const payment = payload.payload?.payment?.entity;
    if (!payment || !payment.id) {
      return res.status(200).send('OK');
    }
    let bookingId = payment.notes?.bookingId;
    if (!bookingId && payment.payment_link_id) {
      const Razorpay = require('razorpay');
      const keySecret = process.env.RAZORPAY_KEY_SECRET;
      const keyId = process.env.RAZORPAY_KEY_ID;
      if (keyId && keySecret) {
        const instance = new Razorpay({ key_id: keyId, key_secret: keySecret });
        instance.paymentLink.fetch(payment.payment_link_id).then(link => {
          bookingId = link.notes?.bookingId;
          if (bookingId) {
            fulfillBooking(bookingId, payment.id, 'Razorpay').catch(err => console.error('[Razorpay Webhook]', err));
          }
        }).catch(err => console.error('[Razorpay Webhook] Fetch payment link:', err));
      }
    }
    if (bookingId) {
      (async () => {
        try {
          await fulfillBooking(bookingId, payment.id, 'Razorpay');
        } catch (err) {
          console.error('[Razorpay Webhook] Error fulfilling booking:', err);
        }
      })();
    }
  }

  res.status(200).send('OK');
});

module.exports = router;
