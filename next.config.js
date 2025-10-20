/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    // Only lint errors will fail the build, warnings are allowed
    ignoreDuringBuilds: true,
  },
  typedRoutes: true,
  // Specify the project root to avoid lockfile warnings
  outputFileTracingRoot: __dirname,
  // Optimize Vercel deployment by excluding heavy Prisma engines from function bundles
  outputFileTracingExcludes: {
    '*': [
      'node_modules/@prisma/engines/**',
      'node_modules/@prisma/client/node_modules/**',
    ],
  },
  // Ensure Prisma Client is included only where needed
  outputFileTracingIncludes: {
    '/api/**/*': ['./node_modules/@prisma/client/**/*'],
  },
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
    webpackMemoryOptimizations: true,
  },
  images: {
    formats: ['image/webp', 'image/avif'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    minimumCacheTTL: 86400, // 24 hours
  },
}

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

module.exports = withBundleAnalyzer(nextConfig)
