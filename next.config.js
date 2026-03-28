/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['images.unsplash.com', 'localhost'],
  },
  generateBuildId: async () => {
    return 'build-' + Date.now()
  },
}

module.exports = nextConfig 