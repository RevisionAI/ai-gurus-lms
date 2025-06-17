/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Configure webpack to handle CSS files from node_modules
  webpack: (config) => {
    return config;
  },
}

module.exports = nextConfig
