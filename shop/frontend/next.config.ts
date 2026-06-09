import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.watchOptions = {
      ...config.watchOptions,
      ignored: [
        '**/node_modules/**',
        '**/.git/**',
        '**/uploads/**',
        '**/resources/**',
        '**/admin/**',
        '**/backend logs/**',
        '**/generated files/**',
        '**/.next/**'
      ],
    };
    return config;
  },
};
export default nextConfig;
