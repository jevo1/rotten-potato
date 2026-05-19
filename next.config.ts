/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '5mb', // Increases the payload limit
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'eipygqdrmwtksjgrmgqi.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

module.exports = nextConfig;