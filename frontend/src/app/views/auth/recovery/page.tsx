'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Image from 'next/image';
import { API_BASE_URL } from '@/config/api';

export default function Recovery() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isValidToken, setIsValidToken] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const verifyToken = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');

        if (!token) {
          setError('Token no proporcionado');
          setTimeout(() => router.push('/views/auth/login'), 3000);
          return;
        }

        const response = await fetch(`${API_BASE_URL}/api/auth/verify-reset-token/${token}`);
        const data = await response.json();

        if (!response.ok) {
          setError(data.message);
          setTimeout(() => router.push('/views/auth/login'), 3000);
          return;
        }

        setIsValidToken(true);
      } catch (err) {
        setError('Error al verificar token');
        setTimeout(() => router.push('/views/auth/login'), 3000);
      }
    };

    verifyToken();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
  
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');
  
      if (!token) {
        setError('Token no valido');
        return;
      }
  
      const response = await fetch(`${API_BASE_URL}/api/auth/reset-password/new`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token,
          newPassword: password
        })
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        setError(data.message);
        return;
      }
  
      toast.success('Contraseña restablecida exitosamente');
      
      // Redireccion despues de 3 segundos
      setTimeout(() => {
        router.push('/views/auth/login');
      }, 2000);
  
    } catch (err) {
      setError('Error al restablecer contraseña');
    } finally {
      setLoading(false);
    }
  };

  if (!isValidToken) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-8 max-w-md">
          <h2 className="text-2xl font-bold text-red-600 mb-2">
            Token invalido o expirado
          </h2>
          <p className="text-gray-600">
            Seras redirigido al inicio de sesion...
          </p>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-8 max-w-md">
          <h2 className="text-2xl font-bold text-emerald-600 mb-4">
            ¡Contraseña restablecida exitosamente!
          </h2>
          <p className="text-gray-600 mb-4">
            Puedes cerrar esta ventana e iniciar sesion con tu nueva contraseña.
          </p>
          <Link
            href="/views/auth/login"
            className="text-emerald-600 hover:text-emerald-500 underline"
          >
            Ir al inicio de sesion
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex w-1/2 bg-emerald-500">
        <div className="w-full flex items-center justify-center">
          <Image 
            src="/img/logo.png" 
            alt="Logo Corporacion" 
            width={400}
            height={400}
            className="max-w-md w-full object-contain p-8"
            priority
          />
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">Restablecer Contraseña</h2>
            <p className="mt-2 text-sm text-gray-600">Ingresa tu nueva contraseña</p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div className="space-y-4">
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  required
                  className="w-full px-4 py-3 pl-10 rounded-lg border border-gray-300 focus:outline-none focus:border-emerald-500 bg-secondary text-primary transition-colors"
                  placeholder="Nueva contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <Lock className="absolute left-3 top-3.5 text-gray-400 h-5 w-5" />
                <button
                  type="button"
                  className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-500 text-sm p-3 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 rounded-lg text-sm font-medium text-white bg-emerald-500 hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {loading ? (
                <div className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin" />
              ) : (
                'Restablecer Contraseña'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
