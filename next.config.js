/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    instrumentationHook: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

module.exports = nextConfig;
