const { withSentryConfig } = require("@sentry/nextjs");
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    optimizePackageImports: [
      'lucide-react', 
      '@radix-ui/react-icons',
      'recharts',
      'framer-motion'
    ],
    // Enable server components
    serverComponentsExternalPackages: ["prisma", "@prisma/client"],
  },
  
  // Compiler optimizations
  compiler: {
    // Remove console.log in production
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error']
    } : false,
  },
  
  // Bundle configuration and optimizations
  webpack: (config, { dev, isServer }) => {
    // Handle ESM modules correctly
    config.resolve.extensionAlias = {
      '.js': ['.js', '.ts', '.tsx'],
    };
    
    // Handle ESM packages properly for tree shaking
    config.resolve.fallback = {
      ...config.resolve.fallback,
    };
    
    // Enable tree shaking for production builds
    if (!dev) {
      config.optimization.usedExports = true;
    }
    
    // Bundle splitting for better caching
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        maxSize: 244000, // 244KB max chunk size
        cacheGroups: {
          // Heavy chart libraries
          charts: {
            test: /[\\/]node_modules[\\/](recharts|d3)[\\/]/,
            name: 'charts',
            priority: 15,
            reuseExistingChunk: true,
          },
          // Animation libraries
          animations: {
            test: /[\\/]node_modules[\\/](framer-motion)[\\/]/,
            name: 'animations',
            priority: 14,
            reuseExistingChunk: true,
          },
          // Data table libraries
          tables: {
            test: /[\\/]node_modules[\\/](@tanstack|react-virtual)[\\/]/,
            name: 'tables',
            priority: 13,
            reuseExistingChunk: true,
          },
          // Radix UI components
          radix: {
            test: /[\\/]node_modules[\\/]@radix-ui[\\/]/,
            name: 'radix-ui',
            priority: 12,
            reuseExistingChunk: true,
          },
          // React ecosystem
          react: {
            test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
            name: 'react',
            priority: 11,
            reuseExistingChunk: true,
          },
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: 10,
            reuseExistingChunk: true,
          },
          common: {
            name: 'common',
            minChunks: 2,
            priority: 5,
            reuseExistingChunk: true,
          },
          // Separate chunk for UI components
          ui: {
            test: /[\\/]src[\\/]components[\\/]ui[\\/]/,
            name: 'ui-components',
            priority: 8,
          },
          // Separate chunk for design system
          designSystem: {
            test: /[\\/]src[\\/]components[\\/]design-system[\\/]/,
            name: 'design-system',
            priority: 8,
          },
        },
      };
    }
    
    return config;
  },
  images: {
    domains: [
      'localhost', 
      'pyairtable.com',
      'lh3.googleusercontent.com', // Google OAuth avatars
      'avatars.githubusercontent.com', // GitHub OAuth avatars
    ],
    formats: ['image/webp', 'image/avif'],
  },
  headers: async () => [
    {
      source: '/api/:path*',
      headers: [
        { key: 'Access-Control-Allow-Origin', value: '*' },
        { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
        { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        // Cache API responses for 5 minutes
        { key: 'Cache-Control', value: 'public, max-age=300, stale-while-revalidate=60' },
      ],
    },
    {
      // Cache static assets for 1 year
      source: '/static/(.*)',
      headers: [
        { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
      ],
    },
    {
      // Cache images optimally
      source: '/_next/image(.*)',
      headers: [
        { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
      ],
    },
    {
      // Cache JavaScript and CSS bundles
      source: '/_next/static/(.*)',
      headers: [
        { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
      ],
    },
    {
      // Cache fonts for 1 year
      source: '/fonts/(.*)',
      headers: [
        { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
      ],
    },
    {
      // Cache manifest and service worker with shorter duration
      source: '/(manifest.json|sw.js)',
      headers: [
        { key: 'Cache-Control', value: 'public, max-age=86400' }, // 24 hours
      ],
    },
    {
      source: "/(.*)",
      headers: [
        {
          key: "X-Frame-Options",
          value: "DENY",
        },
        {
          key: "X-Content-Type-Options",
          value: "nosniff",
        },
        {
          key: "Referrer-Policy",
          value: "strict-origin-when-cross-origin",
        },
        {
          key: "Permissions-Policy",
          value: "camera=(), microphone=(), geolocation=(), payment=()",
        },
        // Performance headers
        {
          key: "X-DNS-Prefetch-Control",
          value: "on",
        },
        {
          key: "Strict-Transport-Security",
          value: "max-age=31536000; includeSubDomains",
        },
        // Cache HTML pages for 5 minutes with stale-while-revalidate
        {
          key: "Cache-Control",
          value: "public, max-age=300, stale-while-revalidate=60",
        },
      ],
    },
  ],
  
  // Redirects for authentication
  redirects: async () => [
    {
      source: "/login",
      destination: "/auth/login",
      permanent: true,
    },
    {
      source: "/register",
      destination: "/auth/register",
      permanent: true,
    },
    {
      source: "/signup",
      destination: "/auth/register",
      permanent: true,
    },
  ],
  
  // Environment variable validation
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  },
}

// Sentry configuration
const sentryWebpackPluginOptions = {
  // Additional config options for the Sentry Webpack plugin
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  
  // Only run plugin in production
  silent: process.env.NODE_ENV !== "production",
  
  // Upload source maps to Sentry
  widenClientFileUpload: true,
  
  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: process.env.NODE_ENV === "production",
  
  // Hide source maps from generated client bundles
  hideSourceMaps: true,
  
  // Disable Sentry during development to speed up builds
  disableServerWebpackPlugin: process.env.NODE_ENV !== "production",
  disableClientWebpackPlugin: process.env.NODE_ENV !== "production",
};

// Wrap config with Sentry only if DSN is provided
module.exports = withBundleAnalyzer(
  process.env.NEXT_PUBLIC_SENTRY_DSN
    ? withSentryConfig(nextConfig, sentryWebpackPluginOptions)
    : nextConfig
);