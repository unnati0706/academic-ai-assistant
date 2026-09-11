/** @type {import('next').NextConfig} */

const isProd = process.env.NODE_ENV === 'production';
const repositoryName = 'academic-ai-assistant';

// On Render: NEXT_PUBLIC_BASE_PATH="" (set in env vars)
// On GitHub Pages: basePath = /academic-ai-assistant
const basePath = process.env.NEXT_PUBLIC_BASE_PATH !== undefined
  ? process.env.NEXT_PUBLIC_BASE_PATH
  : (isProd ? `/${repositoryName}` : '');

const nextConfig = {
  output: 'export',
  basePath: basePath,
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
