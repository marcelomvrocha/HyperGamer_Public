/* eslint-disable @typescript-eslint/no-require-imports */
const { getConfiguredBasePath } = require('./lib/base-path');

const basePath = getConfiguredBasePath();

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  basePath,
  output: 'standalone',
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
  images: {
    unoptimized: false,
  },
  // Silence Next 16 Turbopack vs webpack warning; use Turbopack (default).
  turbopack: {},
  webpack: (config, { isServer }) => {
    // Used when running with --webpack (e.g. if Turbopack has issues)
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    return config;
  },
  transpilePackages: ['recharts'],
}

module.exports = nextConfig
