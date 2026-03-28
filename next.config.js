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
  // Prevent static generation of dynamic pages
  experimental: {
    isrMemoryCacheSize: 0,
  },
  onDemandEntries: {
    maxInactiveAge: 60 * 1000,
    pagesBufferLength: 5,
  },
  // Skip static optimization for all pages
  staticPageGenerationTimeout: 0,
  // Use standalone output for server-side rendering only
  output: 'standalone',
}

module.exports = nextConfig 