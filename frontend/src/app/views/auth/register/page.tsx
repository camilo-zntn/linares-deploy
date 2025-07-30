'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import { User, Mail, Lock, Eye, EyeOff, Gift } from 'lucide-react';

// Utilidades para validación de RUT
const cleanRut = (rut: string): string => {
  return rut.replace(/[^0-9kK]/g, '').toLowerCase();
};

const formatRut = (rut: string): string => {
  const cleaned = cleanRut(rut);
  
  // Limitar a máximo 9 caracteres (8 dígitos + 1 dígito verificador)
  if (cleaned.length > 9) {
    return formatRut(cleaned.substring(0, 9));
  }
  
  if (cleaned.length <= 1) return cleaned;
  
  const body = cleaned.slice(0, -1);
  const dv = cleaned.slice(-1);
  
  // Formatear el cuerpo con puntos
  const formattedBody = body.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
  
  return `${formattedBody}-${dv}`;
};

const calculateDV = (rut: string): string => {
  const cleanedRut = rut.replace(/[^0-9]/g, '');
  let sum = 0;
  let multiplier = 2;
  
  for (let i = cleanedRut.length - 1; i >= 0; i--) {
    sum += parseInt(cleanedRut[i]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }
  
  const remainder = sum % 11;
  const dv = 11 - remainder;
  
  if (dv === 11) return '0';
  if (dv === 10) return 'k';
  return dv.toString();
};

// Función para verificar patrones inválidos
const hasInvalidPattern = (rutBody: string): boolean => {
  // Verificar si todos los dígitos son iguales
  const allSame = rutBody.split('').every(digit => digit === rutBody[0]);
  if (allSame) return true;
  
  // Verificar secuencias ascendentes o descendentes
  let ascending = true;
  let descending = true;
  
  for (let i = 1; i < rutBody.length; i++) {
    const current = parseInt(rutBody[i]);
    const previous = parseInt(rutBody[i - 1]);
    
    if (current !== previous + 1) ascending = false;
    if (current !== previous - 1) descending = false;
  }
  
  return ascending || descending;
};

const validateRut = (rut: string): { isValid: boolean; message?: string } => {
  const cleaned = cleanRut(rut);
  
  // Verificar longitud mínima y máxima
  if (cleaned.length < 8 || cleaned.length > 9) {
    return { isValid: false, message: 'RUT debe tener entre 8 y 9 caracteres' };
  }
  
  const body = cleaned.slice(0, -1);
  const dv = cleaned.slice(-1);
  
  if (!/^\d+$/.test(body)) {
    return { isValid: false, message: 'RUT contiene caracteres inválidos' };
  }
  
  if (!/^[0-9kK]$/.test(dv)) {
    return { isValid: false, message: 'Dígito verificador inválido' };
  }
  
  // Verificar patrones inválidos (dígitos repetitivos o secuenciales)
  if (hasInvalidPattern(body)) {
    return { isValid: false, message: 'RUT no puede tener todos los dígitos iguales o en secuencia' };
  }
  
  const calculatedDV = calculateDV(body);
  if (dv !== calculatedDV) {
    return { isValid: false, message: 'RUT inválido' };
  }
  
  return { isValid: true };
};

const Register = () => {
  const searchParams = useSearchParams();
  
  useEffect(() => {
    const refCode = searchParams.get('ref');
    if (refCode) {
      setFormData(prev => ({
        ...prev,
        referralCode: refCode.toUpperCase()
      }));
      validateReferralCode(refCode);
    }
  }, [searchParams]);
  
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [rutError, setRutError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    rut: '',
    password: '',
    referralCode: ''
  });
  const [referralValidation, setReferralValidation] = useState<{
    isValid: boolean;
    message: string;
    referrerName?: string;
  } | null>(null);

  // Función para validar código de referidos
  const validateReferralCode = async (code: string) => {
    if (!code.trim()) {
      setReferralValidation(null);
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/referrals/validate/${code}`);
      const data = await response.json();
      
      if (data.valid) {
        setReferralValidation({
          isValid: true,
          message: `Invitado por: ${data.referrerName}`,
          referrerName: data.referrerName
        });
      } else {
        setReferralValidation({
          isValid: false,
          message: data.message || 'Código de invitación inválido'
        });
      }
    } catch (error) {
      setReferralValidation({
        isValid: false,
        message: 'Error al validar código de invitación'
      });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'referralCode') {
      setFormData({
        ...formData,
        [name]: value.toUpperCase()
      });
      
      // Validar código después de un pequeño delay
      const timeoutId = setTimeout(() => {
        validateReferralCode(value);
      }, 500);
      
      return () => clearTimeout(timeoutId);
    }
    
    if (name === 'rut') {
      // Formatear RUT automáticamente
      const formattedRut = formatRut(value);
      setFormData({
        ...formData,
        [name]: formattedRut
      });
      
      // Validar RUT
      if (formattedRut.length > 0) {
        const cleaned = cleanRut(formattedRut);
        if (cleaned.length > 9) {
          setRutError('RUT no puede tener más de 9 dígitos');
        } else {
          const validation = validateRut(formattedRut);
          if (validation.isValid) {
            setRutError(null);
          } else {
            setRutError(validation.message || 'RUT inválido');
          }
        }
      } else {
        setRutError(null);
      }
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validar RUT antes de enviar
    const rutValidation = validateRut(formData.rut);
    if (!rutValidation.isValid) {
      setError(rutValidation.message || 'Por favor, ingresa un RUT válido');
      setLoading(false);
      return;
    }

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
                  name="rut"
                  required
                  className={`w-full px-4 py-3 pl-10 rounded-lg border focus:outline-none transition-colors bg-secondary text-primary ${
                    rutError ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-emerald-500'
                  }`}
                  placeholder="RUT (ej: 12.345.678-9)"
                  value={formData.rut}
                  onChange={handleChange}
                  maxLength={12}
                />
                <User className="absolute left-3 top-3.5 text-gray-400 h-5 w-5" />
                {rutError && (
                  <p className="text-red-500 text-xs mt-1">{rutError}</p>
                )}
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

              {/* Campo de código de invitación */}
              <div className="relative">
                <input
                  type="text"
                  name="referralCode"
                  className={`w-full px-4 py-3 pl-10 rounded-lg border focus:outline-none transition-colors bg-secondary text-primary ${
                    referralValidation?.isValid === false 
                      ? 'border-red-500 focus:border-red-500' 
                      : referralValidation?.isValid === true 
                      ? 'border-green-500 focus:border-green-500'
                      : 'border-gray-300 focus:border-emerald-500'
                  }`}
                  placeholder="Código de Invitación (Opcional)"
                  value={formData.referralCode}
                  onChange={handleChange}
                  maxLength={8}
                />
                <Gift className="absolute left-3 top-3.5 text-gray-400 h-5 w-5" />
                {referralValidation && (
                  <p className={`text-xs mt-1 ${
                    referralValidation.isValid ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {referralValidation.message}
                  </p>
                )}
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-500 text-sm p-3 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !!rutError}
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