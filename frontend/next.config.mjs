/** @type {import('next').NextConfig} */

const nextConfig = {
  output: 'export',
  // Remove basePath — on Render Static Site, the app lives at root /
  basePath: '',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
