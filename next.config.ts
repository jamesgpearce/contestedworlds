import type { NextConfig } from 'next';
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
if (basePath && !/^\/[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_-]+)*$/.test(basePath))
  throw new Error(
    'NEXT_PUBLIC_BASE_PATH must be empty or a path such as /contestedworlds, without a trailing slash.',
  );
const nextConfig: NextConfig = {
  output: 'export',
  basePath,
  trailingSlash: true,
};
export default nextConfig;
