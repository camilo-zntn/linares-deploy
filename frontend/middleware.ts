import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Rutas que requieren autenticación
  const protectedRoutes = [
    '/views/dashboard',
    '/views/management', 
    '/views/users',
    '/views/requests',
    '/views/analytics',
    '/views/commerce',
    '/views/saved'
  ]
  
  // Rutas públicas (no requieren autenticación)
  const publicRoutes = [
    '/views/home',
    '/views/help',
    '/views/auth/login',
    '/views/auth/register',
    '/views/auth/verifycode',
    '/views/auth/recovery',
    '/'
  ]
  
  // Si es una ruta pública, permitir acceso
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next()
  }
  
  // Para rutas protegidas, verificar token
  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    const token = request.cookies.get('token')?.value || 
                 request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.redirect(new URL('/views/auth/login', request.url))
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}