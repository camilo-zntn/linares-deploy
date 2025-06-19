'use client';

import { AuthProvider } from '@/context/AuthContext';
import { Toaster } from 'react-hot-toast';
import { Inter } from 'next/font/google';
import AuthCheck from '@/components/AuthCheck/page';
import { useState, useEffect } from 'react';
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
    }, 1200);

    return () => clearTimeout(timer);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <html lang="es" className={inter.className} suppressHydrationWarning>
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
                <img 
                  src="https://www.corporacionlinares.cl/ordenesIngreso/assets/images/logo.png"
                  alt="Logo Corporación"
                  className="w-64 h-auto"
                  style={{
                    opacity: isFading ? '0' : '1',
                    transform: isFading ? 'scale(0.95)' : 'scale(1)',
                    transition: 'all 0.8s ease-in-out'
                  }}
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