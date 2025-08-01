/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: '/api/gateway/:path*',
        destination: 'http://localhost:8000/:path*',
      },
      {
        source: '/api/llm/:path*',
        destination: 'http://localhost:8003/:path*',
      },
      {
        source: '/api/mcp/:path*',
        destination: 'http://localhost:8001/:path*',
      },
      {
        source: '/api/airtable/:path*',
        destination: 'http://localhost:8002/:path*',
      },
    ];
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    return config;
  },
};

module.exports = nextConfig;