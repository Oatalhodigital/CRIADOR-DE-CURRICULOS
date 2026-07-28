const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  distDir: process.env.NEXT_PRIVATE_DIST_DIR
    ? path.isAbsolute(process.env.NEXT_PRIVATE_DIST_DIR)
      ? path.relative(__dirname, process.env.NEXT_PRIVATE_DIST_DIR)
      : process.env.NEXT_PRIVATE_DIST_DIR
    : '.next',
  images: {
    domains: [],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups',
          },
        ],
      },
    ];
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
}

module.exports = nextConfig
