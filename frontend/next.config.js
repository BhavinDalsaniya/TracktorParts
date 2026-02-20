/** @type {import('next').NextConfig} */
const nextConfig = {
  // Performance optimizations for low-end devices
  reactStrictMode: true,

  // Optimize images for slow internet
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [360, 640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000, // 1 year cache
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    unoptimized: false,
    // Allow local images
    domains: ['localhost'],
    // Remote images from CDN
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: '**.cdn.example.com',
      },
    ],
  },

  // Compress responses
  compress: true,

  // Optimize bundle size
  swcMinify: true,

  // Power optimizations for slow networks
  poweredByHeader: false,

  // Static exports for better performance
  output: 'standalone',

  // Enable modularize imports for smaller bundles
  modularizeImports: {
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{kebabCase member}}',
    },
  },

  // Webpack optimizations
  webpack: (config, { isServer }) => {
    // Optimize chunk splitting
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            commons: {
              name: 'commons',
              chunks: 'all',
              minChunks: 2,
            },
            // Vendor chunk for stable dependencies
            vendor: {
              name: 'vendor',
              chunks: 'all',
              test: /node_modules/,
              priority: 10,
            },
            // Separate react and react-dom
            react: {
              name: 'react',
              chunks: 'all',
              test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
              priority: 20,
            },
          },
        },
      };
    }

    return config;
  },

  // Headers for caching and performance
  async headers() {
    const securityHeaders = [
      {
        key: 'X-DNS-Prefetch-Control',
        value: 'on'
      },
      {
        key: 'X-Frame-Options',
        value: 'SAMEORIGIN'
      },
      {
        key: 'X-Content-Type-Options',
        value: 'nosniff'
      },
      {
        key: 'Referrer-Policy',
        value: 'origin-when-cross-origin'
      },
      {
        key: 'X-XSS-Protection',
        value: '1; mode=block'
      },
      {
        key: 'Strict-Transport-Security',
        value: 'max-age=31536000; includeSubDomains'
      }
    ];

    const cacheHeaders = [
      {
        key: 'Cache-Control',
        value: 'public, max-age=31536000, immutable'
      }
    ];

    return [
      // Security headers for all routes
      {
        source: '/:path*',
        headers: securityHeaders
      },
      // Static assets with long cache
      {
        source: '/static/:path*',
        headers: cacheHeaders
      },
      // Images with long cache
      {
        source: '/_next/image/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      },
      // JS/CSS chunks with cache busting
      {
        source: '/_next/static/:path*',
        headers: cacheHeaders
      },
      // API responses - shorter cache
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=60, s-maxage=300, stale-while-revalidate=600'
          }
        ]
      },
      // Font files
      {
        source: '/fonts/:path*',
        headers: cacheHeaders
      }
    ];
  },

  // Proxy uploads to backend server
  async rewrites() {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    return [
      {
        source: '/uploads/:path*',
        destination: `${backendUrl}/uploads/:path*`,
      },
    ];
  },

  // No redirects needed - app is in Gujarati by default
};

module.exports = nextConfig;
