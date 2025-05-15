'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { toast, Toast as ToasterToast } from 'react-hot-toast';

interface LoginResponse {
  token: string;
  user: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  message?: string;
  resetPasswordAvailable?: boolean;
  email?: string;
  resetToken?: string;
}

export default function Login() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: '',
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
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
    
      const data: LoginResponse = await response.json();
    
      if (!response.ok) {
        if (data.resetPasswordAvailable) {
          toast((t: ToasterToast) => (
            <div className="flex flex-col gap-2">
              <p>{data.message}</p>
              <button 
                onClick={async () => {
                  toast.dismiss(t.id);
                  try {
                    const resetResponse = await fetch('http://localhost:5000/api/auth/reset-password', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json'
                      },
                      body: JSON.stringify({ email: data.email })
                    });
        
                    if (resetResponse.ok) {
                      toast.success('Se ha enviado un enlace de recuperacion a tu correo');
                      
                      // Redireccionar a Gmail con cuenta especifica
                      setTimeout(() => {
                        const email = data.email; // Email del usuario
                        window.location.href = `https://mail.google.com/mail/u/${email}`;
                      }, 2000);
                    } else {
                      throw new Error('Error al enviar el correo');
                    }
                  } catch (error) {
                    toast.error('Error al enviar el correo de recuperacion');
                  }
                }}
                className="text-emerald-500 underline hover:text-emerald-600"
              >
                Restablecer contraseña
              </button>
            </div>
          ), { duration: 5000 });
          return;
        }
        
        setError(data.message || 'Error en el inicio de sesion');
        return;
      }

      const userToStore = {
        _id: data.user._id,
        name: data.user.name,
        email: data.user.email,
        role: data.user.role,
      };

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(userToStore));
    
      // Por esto:
      router.push('/views/dashboard');
      
    } catch (err) {
      console.error('Login error:', err);
      setError((err as Error).message || 'Error al iniciar sesion');
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
            <h2 className="text-3xl font-bold text-gray-900">Iniciar Sesion</h2>
            <p className="mt-2 text-sm text-gray-600">Ingresa tus credenciales</p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div className="space-y-4">
              <div className="relative">
                <input
                  type="email"
                  name="email"
                  required
                  className="w-full px-4 py-3 pl-10 rounded-lg border border-gray-300 focus:outline-none focus:border-emerald-500 bg-secondary text-primary transition-colors"
                  placeholder="Correo electronico"
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
              className="w-full flex justify-center py-3 px-4 rounded-lg text-sm font-medium text-white bg-green-500 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {loading ? (
                <div className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin" />
              ) : (
                'Iniciar Sesión'
              )}
            </button>

            <div className="text-sm text-center">
              <Link 
                href="/views/auth/register"
                className="text-emerald-600 hover:text-emerald-500"
              >
                ¿No tienes cuenta? Registrate aqui
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}