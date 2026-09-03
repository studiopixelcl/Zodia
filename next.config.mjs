/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuración de subcarpeta para ingresar desde studiopixel.cl/zodia
  basePath: '/zodia',
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  async redirects() {
    return [
      {
        source: '/',
        destination: '/zodia',
        basePath: false,
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
