/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuración de subcarpeta para ingresar desde studiopixel.cl/zodia
  basePath: '/zodia',
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      async_hooks: false,
    };
    return config;
  },
  async redirects() {
    return [
      {
        source: '/',
        destination: '/zodia',
        basePath: false,
        permanent: false,
      },
      {
        source: '/admin',
        destination: '/zodia/admin',
        basePath: false,
        permanent: false,
      },
      {
        source: '/admin/:path*',
        destination: '/zodia/admin/:path*',
        basePath: false,
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
