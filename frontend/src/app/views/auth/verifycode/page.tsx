'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const VerifyCode = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  
  const [code, setCode] = useState<string[]>(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (index: number, value: string) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newCode = [...code];
      newCode[index] = value;
      setCode(newCode);

      if (value && index < 5) {
        const nextInput = document.querySelector(
          `input[name="code-${index + 1}"]`
        ) as HTMLInputElement;
        nextInput?.focus();
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const prevInput = document.querySelector(
        `input[name="code-${index - 1}"]`
      ) as HTMLInputElement;
      prevInput?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!email) {
      setError('Email no encontrado');
      setLoading(false);
      return;
    }

    try {
      const verificationCode = code.join('');
      
      const response = await fetch('http://localhost:5000/api/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          code: verificationCode
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error en la verificacion');
      }

      // Guardar token si existe
      if (data.token) {
        localStorage.setItem('token', data.token);
      }

      // Redireccionar al login despues de verificacion exitosa
      router.push('/views/auth/login');
      
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex w-1/2 bg-emerald-500">
        <div className="w-full flex items-center justify-center">
          <img 
            src="https://www.corporacionlinares.cl/ordenesIngreso/assets/images/logo.png" 
            alt="Logo Corporacion" 
            className="max-w-md w-full object-contain p-8"
          />
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">Verificar Cuenta</h2>
            <p className="mt-2 text-sm text-gray-600">
              Ingresa el codigo de verificacion enviado a tu correo
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div className="flex justify-center space-x-4">
              {code.map((digit, index) => (
                <input
                  key={index}
                  name={`code-${index}`}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-12 text-center text-2xl rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-secondary text-primary"
                />
              ))}
            </div>

            {error && (
              <div className="bg-red-50 text-red-500 text-sm p-3 rounded-lg text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || code.some(digit => !digit)}
              className="w-full flex justify-center py-3 px-4 rounded-lg text-sm font-medium text-white bg-emerald-500 hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {loading ? (
                <div className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin" />
              ) : (
                'Verificar'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default VerifyCode;