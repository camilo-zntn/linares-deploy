'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      router.push('/views/dashboard'); // Cambiado: redirige a dashboard si hay token
    } else {
      router.push('/views/auth/login');
    }
  }, [router]);

  return null;
}