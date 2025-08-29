'use client';

import { AuthProvider } from '@/context/AuthContext';
import { Toaster } from 'react-hot-toast';
import { Inter } from 'next/font/google';
import AuthCheck from '@/components/AuthCheck/page';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isFading, setIsFading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsFading(true);
      setTimeout(() => {
        setIsLoading(false);
      }, 800);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <html lang="es" className={inter.className} suppressHydrationWarning>
      <head>
        <link
          rel="preload"
          as="image"
          href="/img/logo.png"
          imageSizes="(max-width: 768px) 200px, (max-width: 1200px) 300px, 400px"
          imageSrcSet="/_next/image?url=%2Fimg%2Flogo.png&w=256&q=85 256w, /_next/image?url=%2Fimg%2Flogo.png&w=384&q=85 384w, /_next/image?url=%2Fimg%2Flogo.png&w=640&q=85 640w"
        />
      </head>
      <body suppressHydrationWarning>
        <AuthProvider>
          <AuthCheck>
            {isLoading && (
              <div 
                className={`fixed inset-0 bg-emerald-500 z-50 flex flex-col items-center justify-center gap-8`}
                style={{
                  opacity: isFading ? '0' : '1',
                  transition: 'all 0.8s ease-in-out'
                }}
                suppressHydrationWarning
              >
                <Image 
                  src="/img/logo.png"
                  alt="Logo Corporación"
                  width={256}
                  height={256}
                  className="w-64 h-auto"
                  style={{
                    opacity: isFading ? '0' : '1',
                    transform: isFading ? 'scale(0.95)' : 'scale(1)',
                    transition: 'all 0.8s ease-in-out'
                  }}
                  priority
                />
                <div 
                  className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin"
                  style={{
                    opacity: isFading ? '0' : '1',
                    transform: isFading ? 'scale(0.95)' : 'scale(1)',
                    transition: 'all 0.8s ease-in-out'
                  }}
                />
              </div>
            )}
            <Toaster 
              position="top-center"
              toastOptions={{
                duration: 3000,
                style: {
                  background: '#333',
                  color: '#fff'
                }
              }}
            />
            <div
              style={{
                opacity: isLoading ? '0' : '1',
                transition: 'opacity 0.8s ease-in-out'
              }}
              suppressHydrationWarning
            >
              {children}
            </div>
          </AuthCheck>
        </AuthProvider>
      </body>
    </html>
  );
}
