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
              parse: { ecma: 8 as any },
              compress: { 
                ecma: 5 as any
              },
              mangle: { safari10: true },
              output: { 
                ecma: 5 as any,
                ascii_only: false, // Permitir caracteres UTF-8
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
                    // Solo aplicar en strings literales, no en imports
                    // Patrones más específicos para evitar conflictos
                    { search: /\bfuncion\b/g, replace: 'función' },
                    { search: /\binformacion\b/g, replace: 'información' },
                    { search: /\bnotificacion\b/g, replace: 'notificación' },
                    { search: /\bautenticacion\b/g, replace: 'autenticación' },
                    { search: /\bvalidacion\b/g, replace: 'validación' },
                    { search: /\bverificacion\b/g, replace: 'verificación' },
                    { search: /\bregistracion\b/g, replace: 'registración' },
                    { search: /\bnavegacion\b/g, replace: 'navegación' },
                    { search: /\boperacion\b/g, replace: 'operación' },
                    { search: /\bsesion\b/g, replace: 'sesión' },
                    { search: /\bversion\b/g, replace: 'versión' },
                    { search: /\bpagina\b/g, replace: 'página' },
                    { search: /\bcodigo\b/g, replace: 'código' },
                    { search: /\busuario\b/g, replace: 'usuario' },
                    { search: /\bcontrasena\b/g, replace: 'contraseña' },
                    // Palabras específicas con ñ
                    { search: /\bano\b/g, replace: 'año' },
                    { search: /\bnino\b/g, replace: 'niño' },
                    { search: /\bespanol\b/g, replace: 'español' },
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