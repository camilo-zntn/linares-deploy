'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Toaster } from 'react-hot-toast';
import AuthCheck from '@/components/AuthCheck/page';
import { AuthProvider } from '@/context/AuthContext';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsFading(true);
      setTimeout(() => {
        setIsLoading(false);
      }, 800);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  return (
    <AuthProvider>
      <AuthCheck>
        {isLoading && (
          <div
            className="fixed inset-0 bg-emerald-500 z-50 flex flex-col items-center justify-center gap-8"
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
  );
}
