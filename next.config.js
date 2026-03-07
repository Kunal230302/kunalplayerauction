/** @type {import('next').NextConfig} */
const nextConfig = {
  // Skip type checking and linting during build (faster builds, errors shown in IDE)
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
    ],
  },
}
module.exports = nextConfig
