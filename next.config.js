/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['images.unsplash.com', 'localhost'],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  generateBuildId: async () => {
    return 'build-' + Date.now()
  },
  output: 'standalone',
  // Ignore build warnings
  swcMinify: true,
  reactStrictMode: false,
}

module.exports = nextConfig 