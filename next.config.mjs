/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuración de subcarpeta para ingresar desde studiopixel.cl/zodia
  basePath: '/zodia',
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
