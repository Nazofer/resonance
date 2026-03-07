import type { NextConfig } from 'next';

// Валідація env на етапі збірки (Next.js 16+)
import './src/lib/env';

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
};

export default nextConfig;
