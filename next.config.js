/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configure images
  images: {
    // Allow images from these domains
    domains: [
      'res.cloudinary.com',
      'alumni-connection-platform-production.up.railway.app',
      'alumni-connection-platform.vercel.app'
    ],
    // Enable image optimization
    formats: ['image/avif', 'image/webp'],
    // Disable image optimization during development
    disableStaticImages: process.env.NODE_ENV !== 'production',
    // Configure device sizes for responsive images
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    // Configure image sizes for responsive images
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Allow all image content types
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    // Enable remotePatterns for more control
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**',
      },
    ],
  },

  // Enable React Strict Mode
  reactStrictMode: true,
  
  // Configure WebSocket support for production
  webpack: (config, { isServer }) => {
    // This allows us to use WebSockets in the browser
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        net: false,
        tls: false,
        dns: false,
        fs: false,
        child_process: false,
      };
    }
    return config;
  },
  
  // Configure headers for WebSocket upgrade
  async headers() {
    return [
      {
        // Match all API routes
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization' },
        ],
      },
    ];
  },
  
  // Configure server runtime config
  serverRuntimeConfig: {
    // Will only be available on the server side
    socketIoPath: '/api/socket.io',
  },
  
  // Configure public runtime config
  publicRuntimeConfig: {
    // Will be available on both server and client
    wsUrl: process.env.NODE_ENV === 'production'
      ? `${process.env.NEXT_PUBLIC_APP_URL?.startsWith('https') ? 'wss' : 'ws'}://${process.env.RAILWAY_PUBLIC_DOMAIN || process.env.VERCEL_URL || 'localhost:3000'}`
      : 'ws://localhost:3000',
    // Add app URL for client-side use
    appUrl: process.env.NEXT_PUBLIC_APP_URL || 
           (process.env.NODE_ENV === 'production' 
             ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN || process.env.VERCEL_URL || 'localhost:3000'}`
             : 'http://localhost:3000'),
  },
  
  // Add health check endpoint for Railway
  async rewrites() {
    return [
      {
        source: '/health',
        destination: '/api/health',
      },
    ];
  },
};

module.exports = nextConfig;
