/** @type {import('next').NextConfig} */
const apiUpstream = (
  process.env.API_UPSTREAM_ORIGIN || 'https://api.triberoutes.com'
).replace(/\/$/, '');

const nextConfig = {
  reactStrictMode: true,

  // Edge rewrite: JSON/small API calls via same-origin /tr-api (no CORS). Large multipart
  // should go straight to NEXT_PUBLIC_API_URL from the client (see lib/api.ts).
  async rewrites() {
    return [
      {
        source: '/tr-api/:path*',
        destination: `${apiUpstream}/api/:path*`,
      },
    ];
  },

  // Image domain whitelist for security (prevents SSRF)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'triberoutes.com',
      },
      {
        protocol: 'https',
        hostname: 'www.triberoutes.com',
      },
      {
        protocol: 'https',
        hostname: 'triberoutes-app.vercel.app',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com', // Cloudinary CDN
      },
      {
        protocol: 'http',
        hostname: 'localhost', // Development only
      },
    ],
    // Disable image optimization for external domains not in whitelist
    dangerouslyAllowSVG: false,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN' // Changed from DENY to allow same-origin embeds if needed
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          },
          // Content Security Policy
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // unsafe-eval needed for Next.js, unsafe-inline for structured data
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com", // Allow Google Fonts
              "style-src-elem 'self' 'unsafe-inline' https://fonts.googleapis.com", // Allow Google Fonts in style elements
              "img-src 'self' data: https://res.cloudinary.com https://triberoutes.com https://www.triberoutes.com https://triberoutes-app.vercel.app",
              "font-src 'self' data: https://fonts.gstatic.com", // Allow Google Fonts
              "media-src 'self' https://cdn.coverr.co", // Allow Coverr videos
              "connect-src 'self' https://api.triberoutes.com https://*.vercel.app http://localhost:5000 http://127.0.0.1:5000",
              "frame-ancestors 'self'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; ')
          },
        ],
      },
    ];
  },
}

module.exports = nextConfig

