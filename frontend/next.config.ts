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
                    
                    // Nuevas palabras con tildes encontradas en el código
                    { search: /\badministracion\b/g, replace: 'administración' },
                    { search: /\bconfiguracion\b/g, replace: 'configuración' },
                    { search: /\bcreacion\b/g, replace: 'creación' },
                    { search: /\bdescripcion\b/g, replace: 'descripción' },
                    { search: /\bdireccion\b/g, replace: 'dirección' },
                    { search: /\bedicion\b/g, replace: 'edición' },
                    { search: /\beliminacion\b/g, replace: 'eliminación' },
                    { search: /\bgestion\b/g, replace: 'gestión' },
                    { search: /\bmodificacion\b/g, replace: 'modificación' },
                    { search: /\borganizacion\b/g, replace: 'organización' },
                    { search: /\bparticipacion\b/g, replace: 'participación' },
                    { search: /\bpublicacion\b/g, replace: 'publicación' },
                    { search: /\brealizacion\b/g, replace: 'realización' },
                    { search: /\bseleccion\b/g, replace: 'selección' },
                    { search: /\bsituacion\b/g, replace: 'situación' },
                    { search: /\bubicacion\b/g, replace: 'ubicación' },
                    { search: /\bactualizacion\b/g, replace: 'actualización' },
                    { search: /\baplicacion\b/g, replace: 'aplicación' },
                    { search: /\bcomunicacion\b/g, replace: 'comunicación' },
                    { search: /\bdocumentacion\b/g, replace: 'documentación' },
                    { search: /\bespecificacion\b/g, replace: 'especificación' },
                    { search: /\bimplementacion\b/g, replace: 'implementación' },
                    { search: /\binstalacion\b/g, replace: 'instalación' },
                    { search: /\bintegracion\b/g, replace: 'integración' },
                    { search: /\bmigracion\b/g, replace: 'migración' },
                    { search: /\boptimizacion\b/g, replace: 'optimización' },
                    { search: /\bpersonalizacion\b/g, replace: 'personalización' },
                    { search: /\bpresentacion\b/g, replace: 'presentación' },
                    { search: /\bprogramacion\b/g, replace: 'programación' },
                    { search: /\bsincronizacion\b/g, replace: 'sincronización' },
                    { search: /\btransformacion\b/g, replace: 'transformación' },
                    { search: /\bvisualizacion\b/g, replace: 'visualización' },
                    { search: /\badministrador\b/g, replace: 'administrador' },
                    { search: /\bcategoria\b/g, replace: 'categoría' },
                    { search: /\bcategorias\b/g, replace: 'categorías' },
                    { search: /\bcomercio\b/g, replace: 'comercio' },
                    { search: /\btelefono\b/g, replace: 'teléfono' },
                    { search: /\bnumero\b/g, replace: 'número' },
                    { search: /\blogica\b/g, replace: 'lógica' },
                    { search: /\bbasica\b/g, replace: 'básica' },
                    { search: /\bpublica\b/g, replace: 'pública' },
                    { search: /\bprivada\b/g, replace: 'privada' },
                    { search: /\bunica\b/g, replace: 'única' },
                    { search: /\bmultiple\b/g, replace: 'múltiple' },
                    { search: /\brapida\b/g, replace: 'rápida' },
                    { search: /\bfacil\b/g, replace: 'fácil' },
                    { search: /\butil\b/g, replace: 'útil' },
                    { search: /\bmovil\b/g, replace: 'móvil' },
                    { search: /\bportatil\b/g, replace: 'portátil' },
                    { search: /\bautomatico\b/g, replace: 'automático' },
                    { search: /\bdinamico\b/g, replace: 'dinámico' },
                    { search: /\bestatico\b/g, replace: 'estático' },
                    { search: /\bpublico\b/g, replace: 'público' },
                    { search: /\bprivado\b/g, replace: 'privado' },
                    { search: /\bunico\b/g, replace: 'único' },
                    { search: /\brapido\b/g, replace: 'rápido' },
                    { search: /\bmas\b/g, replace: 'más' },
                    { search: /\btambien\b/g, replace: 'también' },
                    { search: /\bsolo\b/g, replace: 'sólo' },
                    { search: /\bdespues\b/g, replace: 'después' },
                    { search: /\baqui\b/g, replace: 'aquí' },
                    { search: /\balli\b/g, replace: 'allí' },
                    { search: /\basi\b/g, replace: 'así' },
                    { search: /\bsi\b/g, replace: 'sí' },
                    { search: /\baccion\b/g, replace: 'acción' },
                    { search: /\bacciones\b/g, replace: 'acciones' },
                    { search: /\batencion\b/g, replace: 'atención' },
                    { search: /\bsolucion\b/g, replace: 'solución' },
                    { search: /\bsoluciones\b/g, replace: 'soluciones' },
                    { search: /\brelacion\b/g, replace: 'relación' },
                    { search: /\brelaciones\b/g, replace: 'relaciones' },
                    { search: /\bsugerencia\b/g, replace: 'sugerencia' },
                    { search: /\bsugerencias\b/g, replace: 'sugerencias' },
                    
                    // Palabras específicas con ñ
                    { search: /\bano\b/g, replace: 'año' },
                    { search: /\banos\b/g, replace: 'años' },
                    { search: /\bnino\b/g, replace: 'niño' },
                    { search: /\bninos\b/g, replace: 'niños' },
                    { search: /\bespanol\b/g, replace: 'español' },
                    { search: /\bespanola\b/g, replace: 'española' },
                    { search: /\bcompanero\b/g, replace: 'compañero' },
                    { search: /\bcompaneros\b/g, replace: 'compañeros' },
                    { search: /\bcompanera\b/g, replace: 'compañera' },
                    { search: /\bcompaneras\b/g, replace: 'compañeras' },
                    { search: /\bpequeno\b/g, replace: 'pequeño' },
                    { search: /\bpequenos\b/g, replace: 'pequeños' },
                    { search: /\bpequena\b/g, replace: 'pequeña' },
                    { search: /\bpequenas\b/g, replace: 'pequeñas' },
                    { search: /\bsueno\b/g, replace: 'sueño' },
                    { search: /\bsuenos\b/g, replace: 'sueños' },
                    { search: /\bmontana\b/g, replace: 'montaña' },
                    { search: /\bmontanas\b/g, replace: 'montañas' },
                    { search: /\bmanana\b/g, replace: 'mañana' },
                    { search: /\bmananas\b/g, replace: 'mañanas' },
                    { search: /\bbano\b/g, replace: 'baño' },
                    { search: /\bbanos\b/g, replace: 'baños' },
                    { search: /\bdano\b/g, replace: 'daño' },
                    { search: /\bdanos\b/g, replace: 'daños' },
                    { search: /\bextrano\b/g, replace: 'extraño' },
                    { search: /\bextranos\b/g, replace: 'extraños' },
                    { search: /\bextrana\b/g, replace: 'extraña' },
                    { search: /\bextranas\b/g, replace: 'extrañas' },
                    { search: /\bcorazon\b/g, replace: 'corazón' },
                    { search: /\bcorazones\b/g, replace: 'corazones' },
                    { search: /\brazon\b/g, replace: 'razón' },
                    { search: /\brazones\b/g, replace: 'razones' }
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
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000, // 1 año
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