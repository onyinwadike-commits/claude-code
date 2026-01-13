/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@void-confessions/core', 'three'],
  reactStrictMode: true,

  // Enable WebGL for Three.js
  webpack: (config, { isServer }) => {
    config.module.rules.push({
      test: /\.(glsl|vs|fs|vert|frag)$/,
      exclude: /node_modules/,
      use: ['raw-loader', 'glslify-loader'],
    });

    // Fix for canvas in server-side rendering
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        canvas: false,
      };
    }

    return config;
  },

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.void-confessions.app',
      },
      {
        protocol: 'https',
        hostname: '**.walmart.com',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
    ],
    // Allow unoptimized images for demo
    unoptimized: process.env.NODE_ENV === 'development',
  },

  // Environment variables exposed to browser
  env: {
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001',
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || 'Walmart Ops',
    NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
  },

  // Experimental features for better performance
  experimental: {
    // Enable optimizations
    optimizePackageImports: ['framer-motion', '@react-three/fiber', '@react-three/drei'],
  },

  // Headers for security
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },

  // Redirects (if needed)
  async redirects() {
    return [
      // Example: Redirect old routes to new ones
      // {
      //   source: '/old-route',
      //   destination: '/new-route',
      //   permanent: true,
      // },
    ];
  },

  // Output configuration for deployment
  output: 'standalone',

  // Disable powered by header
  poweredByHeader: false,

  // Generate source maps in production for error tracking
  productionBrowserSourceMaps: false,

  // Compress responses
  compress: true,
};

module.exports = nextConfig;
