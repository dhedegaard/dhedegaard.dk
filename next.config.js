/**
 * @type {import('next').NextConfig}
 */
module.exports = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    domains: ["avatars.githubusercontent.com"],
  },
  headers: async () => [
    {
      source: "/:path*",
      headers: [
        { key: "X-Frame-Options", value: "SAMEORIGIN" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "origin-when-cross-origin" },
        {
          key: "Content-Security-Policy",
          value: csp.join("; "),
        },
      ],
    },
  ],
};

const csp = [
  "default-src 'unsafe-inline'",
  "img-src 'self' https://avatars.githubusercontent.com",
  "script-src 'self' 'unsafe-eval'",
  "manifest-src 'self'",
  "connect-src 'self'",
];
