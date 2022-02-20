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
      key: "X-Frame-Options",
      value: "SAMEORIGIN",
    },
    {
      key: "X-Content-Type-Options",
      value: "nosniff",
    },
    {
      key: "Referrer-Policy",
      value: "origin-when-cross-origin",
    },
  ],
};
