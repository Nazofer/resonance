import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  /* config options here */
  devIndicators: false,
  reactCompiler: true,
  turbopack: {
    root: path.join(__dirname, '..'),
  },
  experimental: {
    proxyClientMaxBodySize: '20mb',
  },
};

export default nextConfig;
