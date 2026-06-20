/**
 * Logs requests to public listing routes that omit the web client header.
 * Does not hard-block — anonymous limiter applies a lower rate cap instead.
 */

function clientFingerprint(req, res, next) {
  if (process.env.NODE_ENV === 'production' && req.method === 'GET') {
    const client = req.get('X-Triberoutes-Client');
    if (client !== 'web') {
      console.warn('[Listing] Request without X-Triberoutes-Client header', {
        ip: req.ip,
        path: req.originalUrl,
        userAgent: req.get('user-agent'),
      });
    }
  }
  next();
}

module.exports = clientFingerprint;
