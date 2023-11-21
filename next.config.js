/**
 * @type {import('next').NextConfig}
 */
module.exports = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    domains: ['avatars.githubusercontent.com'],
  },
  headers: () =>
    Promise.resolve([
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value:
              'accelerometer=(), autoplay=(), camera=(), cross-origin-isolated=(), display-capture=(), document-domain=(), encrypted-media=(), fullscreen=(), geolocation=(), gyroscope=(), keyboard-map=(), magnetometer=(), microphone=(), midi=(), payment=(), picture-in-picture=(), publickey-credentials-get=(), screen-wake-lock=(), sync-xhr=(), usb=(), web-share=(), xr-spatial-tracking=()',
          },
          {
            key: 'Content-Security-Policy',
            value: csp.join('; '),
          },
        ],
      },
    ]),
}

const csp = [
  "default-src 'unsafe-inline' 'self'",
  "img-src 'self' data: https://avatars.githubusercontent.com",
  "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
  "manifest-src 'self'",
  "connect-src 'self' https://vitals.vercel-insights.com",
  "style-src-elem 'self' 'unsafe-inline'",
]
