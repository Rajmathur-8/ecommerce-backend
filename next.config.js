/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['images.unsplash.com', 'localhost'],
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  generateBuildId: async () => {
    return 'build-' + Date.now()
  },
}

module.exports = nextConfig 