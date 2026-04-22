import type { NextConfig } from "next";
import TerserPlugin from 'terser-webpack-plugin';

const nextConfig: NextConfig = {
  reactStrictMode: true,

  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || ''
  },

  images: {
    domains: ['localhost'],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000,
    dangerouslyAllowSVG: false,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    unoptimized: false,
    loader: 'default',
    loaderFile: '',
    disableStaticImages: false,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      }
    ],
  },

  typescript: {
    ignoreBuildErrors: true
  },

  eslint: {
    ignoreDuringBuilds: true
  },

  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        minimize: true,
        minimizer: [
          new TerserPlugin({
            terserOptions: {
              parse: { ecma: 2020 },
              compress: { ecma: 5 },
              mangle: true,
              output: {
                ecma: 5,
                comments: false,
                ascii_only: true
              }
            }
          })
        ]
      };
    }
    return config;
  }
};

export default nextConfig;
