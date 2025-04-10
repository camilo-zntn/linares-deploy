'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar/page';
import Navbar from '@/components/Navbar/page';

export default function AuthCheck({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem('token');
    const publicRoutes = ['/views/auth/login', '/views/auth/register', '/views/auth/verifycode', '/views/auth/recovery'];
    
    if (token && pathname?.startsWith('/views/auth')) {
      router.replace('/views/dashboard');
      return;
    }
    
    if (!token && !publicRoutes.includes(pathname || '')) {
      router.replace('/views/auth/login');
      return;
    }
  }, [pathname, router]);

  if (!mounted) return null;

  const isAuthPage = pathname?.startsWith('/views/auth');
  const isDashboardPage = pathname === '/views/dashboard';
  const isOtherPage = !isAuthPage && !isDashboardPage;

  if (isAuthPage) {
    return <>{children}</>;
  }

  if (isDashboardPage) {
    return <>{children}</>;
  }

  if (isOtherPage) {
    return (
      <div className="flex min-h-screen bg-secondary">
        <div className="hidden lg:block">
          <Sidebar />
        </div>
        <div className="flex-1 lg:ml-64">
          <Navbar />
          <main className="p-6 pt-20 lg:pt-6">
            {children}
          </main>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}