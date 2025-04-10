import type { NextConfig } from "next";
import TerserPlugin from 'terser-webpack-plugin';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  
  webpack: (config, { dev, isServer }) => {
    // Configure terser for proper Unicode handling
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        minimize: true,
        minimizer: [
          new TerserPlugin({
            terserOptions: {
              parse: { ecma: 8 },
              compress: { 
                ecma: 5, 
                warnings: false
              },
              mangle: { safari10: true },
              output: { 
                ecma: 5,
                ascii_only: true,
                comments: false
              }
            }
          })
        ]
      };
    }

    if (dev && !isServer) {
      console.log('\x1b[36m%s\x1b[0m', `
╔═══════════════════════════════════════════════╗
║                                               ║
║     Sistema de Digitalización de Archivos     ║
║                                               ║ 
╚═══════════════════════════════════════════════╝
      `);
    }

    if (!isServer) {
      config.module = {
        ...config.module,
        rules: [
          ...(config.module?.rules || []),
          {
            test: /\.(js|jsx|ts|tsx)$/,
            exclude: [/node_modules/, /api/],
            include: /src/,
            use: [
              {
                loader: 'string-replace-loader',
                options: {
                  multiple: [
                    { search: /\bdigitalizacion\b/g, replace: 'digitalización' },
                    { search: /\bcategoria\b/g, replace: 'categoría' },
                    { search: /\bcategorias\b/g, replace: 'categorías' },
                    { search: /\bcontrasena\b/g, replace: 'contraseña' },
                    { search: /\bsesion\b/g, replace: 'sesión' },
                    { search: /\bvalidacion\b/g, replace: 'validación' },
                    { search: /\binformacion\b/g, replace: 'información' },
                    { search: /\bseccion\b/g, replace: 'sección' },
                    { search: /\bcodigo\b/g, replace: 'código' },
                    { search: /\bpagina\b/g, replace: 'página' },
                    { search: /\bdocumentacion\b/g, replace: 'documentación' },
                    { search: /\banos\b/g, replace: 'años' },
                  ]
                }
              }
            ]
          }
        ]
      };
    }
    return config;
  },
  
  env: {
    NEXT_PUBLIC_API_URL: 'http://localhost:5000'
  },

  images: {
    domains: ['localhost'],
    formats: ['image/webp']
  },

  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:5000/api/:path*'
      }
    ];
  },

  typescript: {
    ignoreBuildErrors: true
  },

  eslint: {
    ignoreDuringBuilds: true
  }
};

export default nextConfig;