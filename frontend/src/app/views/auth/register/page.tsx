'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, Mail, Lock, Eye, EyeOff } from 'lucide-react';

const Register = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    username: '',
    password: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error en el registro');
      }

      router.push(`/views/auth/verifycode?email=${encodeURIComponent(formData.email)}`);
    } catch (err) {
      setError((err as Error).message || 'Error al registrar usuario');
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
            <h2 className="text-3xl font-bold text-gray-900">Crear Cuenta</h2>
            <p className="mt-2 text-sm text-gray-600">Ingresa tus datos para registrarte</p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div className="space-y-4">
              <div className="relative">
                <input
                  type="text"
                  name="name"
                  required
                  className="w-full px-4 py-3 pl-10 rounded-lg border border-gray-300 focus:outline-none focus:border-emerald-500 bg-secondary text-primary transition-colors"
                  placeholder="Nombre Completo"
                  value={formData.name}
                  onChange={handleChange}
                />
                <User className="absolute left-3 top-3.5 text-gray-400 h-5 w-5" />
              </div>

              <div className="relative">
                <input
                  type="text"
                  name="username"
                  required
                  className="w-full px-4 py-3 pl-10 rounded-lg border border-gray-300 focus:outline-none focus:border-emerald-500 bg-secondary text-primary transition-colors"
                  placeholder="Nombre de Usuario"
                  value={formData.username}
                  onChange={handleChange}
                />
                <User className="absolute left-3 top-3.5 text-gray-400 h-5 w-5" />
              </div>

              <div className="relative">
                <input
                  type="email"
                  name="email"
                  required
                  className="w-full px-4 py-3 pl-10 rounded-lg border border-gray-300 focus:outline-none focus:border-emerald-500 bg-secondary text-primary transition-colors"
                  placeholder="Correo Electronico"
                  value={formData.email}
                  onChange={handleChange}
                />
                <Mail className="absolute left-3 top-3.5 text-gray-400 h-5 w-5" />
              </div>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  required
                  className="w-full px-4 py-3 pl-10 rounded-lg border border-gray-300 focus:outline-none focus:border-emerald-500 bg-secondary text-primary transition-colors"
                  placeholder="Contraseña"
                  value={formData.password}
                  onChange={handleChange}
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
                'Registrarse'
              )}
            </button>

            <div className="text-sm text-center">
              <Link 
                href="/views/auth/login"
                className="text-emerald-600 hover:text-emerald-500"
              >
                ¿Ya tienes cuenta? Inicia sesion
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;