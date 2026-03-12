/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/hrm',
  reactStrictMode: false,
  output: 'standalone',
  productionBrowserSourceMaps: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
