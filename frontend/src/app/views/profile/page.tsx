'use client';

import React, { useState, useEffect } from 'react';
import { User, Lock, Eye, EyeOff, Check, X, Edit, Copy, Share2, Users, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { toast } from 'react-hot-toast';
import { formatRutAsUserTypes, cleanRut } from '../../../utils/rutValidator';

interface PasswordRequirement {
  text: string;
  met: boolean;
}

interface UserData {
  rut: string;
  fullName: string;
  email: string;
}

interface ReferralStats {
  referralCode: string;
  referralCount: number;
  referredUsers: any[];
}

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (password: string) => void;
  isLoading: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onClose, onConfirm, isLoading }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Limpiar el campo de contraseña cada vez que se abre el modal
  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setShowPassword(false);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.trim()) {
      onConfirm(password);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Confirmar cambios
        </h3>
        <p className="text-gray-600 mb-4">
          Para confirmar los cambios en tus datos personales, ingresa tu contraseña actual:
        </p>
        <form onSubmit={handleSubmit}>
          <div className="relative mb-4">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="Contraseña actual"
              required
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading || !password.trim()}
              className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              Confirmar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ProfilePage = () => {
  const { user, token } = useAuth();
  
  // Estados para datos personales
  const [userData, setUserData] = useState<UserData>({
    rut: '',
    fullName: '',
    email: ''
  });
  
  const [originalUserData, setOriginalUserData] = useState<UserData>({
    rut: '',
    fullName: '',
    email: ''
  });
  
  // Estados para validación de RUT (solo para admin)
  const [rutStatus, setRutStatus] = useState<{
    checking: boolean;
    available: boolean | null;
    message: string;
  }>({ checking: false, available: null, message: '' });
  
  // Estado para controlar si los campos están en modo edición
  const [isEditing, setIsEditing] = useState(false);

  // Estados para cambio de contraseña
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const [isLoading, setIsLoading] = useState(false);

  // Estados para sistema de referidos
  const [referralStats, setReferralStats] = useState<ReferralStats | null>(null);

  // Estados para secciones desplegables en móvil
  const [expandedSections, setExpandedSections] = useState({
    personal: false,
    password: false,
    referrals: false
  });

  // Estados para modal de confirmación
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [pendingUserData, setPendingUserData] = useState<UserData | null>(null);

  // Cargar datos del usuario al montar el componente
  useEffect(() => {
    if (user) {
      const initialData = {
        rut: (user as any).rut || '',
        fullName: (user as any).name || '',
        email: (user as any).email || ''
      };
      setUserData(initialData);
      setOriginalUserData(initialData);
    }
  }, [user]);

  // Cargar estadísticas de referidos
  useEffect(() => {
    fetchReferralStats();
  }, []);

  // Función para obtener estadísticas de referidos
  const fetchReferralStats = async () => {
    try {
      const response = await fetch('/api/referrals/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setReferralStats(data);
      } else {
        console.error('Error al obtener estadísticas de referidos');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // Función para manejar cambios en los datos del usuario
  const handleUserDataChange = (field: keyof UserData, value: string) => {
    if (field === 'rut') {
      return; // No permitir cambios en el RUT
    }
    
    setUserData(prev => ({ ...prev, [field]: value }));
  };

  // Función para verificar disponibilidad del RUT
  const checkRutAvailability = async (rut: string) => {
    if (!rut || rut.length < 8) {
      setRutStatus({ checking: false, available: null, message: '' });
      return;
    }

    setRutStatus({ checking: true, available: null, message: 'Verificando...' });
    
    try {
      const cleanedRut = cleanRut(rut);
      const response = await fetch(`/api/auth/check-rut?rut=${cleanedRut}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setRutStatus({
          checking: false,
          available: data.available,
          message: data.available ? 'RUT disponible' : 'RUT ya está en uso'
        });
      } else {
        setRutStatus({
          checking: false,
          available: false,
          message: data.message || 'Error al verificar RUT'
        });
      }
    } catch (error) {
      setRutStatus({
        checking: false,
        available: false,
        message: 'Error de conexión'
      });
    }
  };

  // Función para alternar modo de edición
  const handleEditToggle = () => {
    if (isEditing) {
      // Cancelar edición - restaurar datos originales
      setUserData(originalUserData);
      setRutStatus({ checking: false, available: null, message: '' });
    }
    setIsEditing(!isEditing);
  };

  // Función para verificar si se puede guardar
  const canSave = () => {
    const hasChanges = JSON.stringify(userData) !== JSON.stringify(originalUserData);
    return hasChanges && userData.fullName.trim() && userData.email.trim();
  };

  // Función para guardar datos personales
  const handleSavePersonalData = async () => {
    setPendingUserData(userData);
    setShowConfirmationModal(true);
  };

  // Función para confirmar cambios con contraseña
  const confirmDataChanges = async (password: string) => {
    if (!pendingUserData) return;
    
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          rut: cleanRut(pendingUserData.rut),
          fullName: pendingUserData.fullName.trim(),
          email: pendingUserData.email.trim(),
          currentPassword: password
        })
      });
      
      if (response.ok) {
        const updatedUser = await response.json();
        setOriginalUserData(pendingUserData);
        setIsEditing(false);
        setShowConfirmationModal(false);
        setPendingUserData(null);
        toast.success('Datos actualizados correctamente');
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Error al actualizar los datos');
      }
    } catch (error) {
      toast.error('Error de conexión');
    } finally {
      setIsLoading(false);
    }
  };

  // Función para manejar cambios en contraseña
  const handlePasswordChange = (field: string, value: string) => {
    setPasswordData(prev => ({ ...prev, [field]: value }));
  };

  // Función para alternar visibilidad de contraseñas
  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  // Validaciones de contraseña
  const passwordRequirements: PasswordRequirement[] = [
    {
      text: 'Al menos 8 caracteres',
      met: passwordData.newPassword.length >= 8
    },
    {
      text: 'Al menos una letra mayúscula',
      met: /[A-Z]/.test(passwordData.newPassword)
    },
    {
      text: 'Al menos una letra minúscula',
      met: /[a-z]/.test(passwordData.newPassword)
    },
    {
      text: 'Al menos un número',
      met: /\d/.test(passwordData.newPassword)
    },
    {
      text: 'Al menos un carácter especial',
      met: /[!@#$%^&*(),.?":{}|<>]/.test(passwordData.newPassword)
    }
  ];

  const passwordsMatch = passwordData.newPassword === passwordData.confirmPassword && passwordData.confirmPassword !== '';
  
  const isPasswordValid = () => {
    return passwordRequirements.every(req => req.met) && 
           passwordsMatch && 
           passwordData.currentPassword !== '';
  };

  // Función para cambiar contraseña
  const handleChangePassword = async () => {
    if (!isPasswordValid()) return;
    
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/users/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });
      
      if (response.ok) {
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        toast.success('Contraseña cambiada correctamente');
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Error al cambiar la contraseña');
      }
    } catch (error) {
      toast.error('Error de conexión');
    } finally {
      setIsLoading(false);
    }
  };

  // Función para copiar enlace de referido
  const copyReferralLink = () => {
    if (referralStats?.referralCode) {
      const referralLink = `${window.location.origin}/register?ref=${referralStats.referralCode}`;
      navigator.clipboard.writeText(referralLink);
      toast.success('Enlace copiado al portapapeles');
    }
  };

  // Función para compartir enlace de referido
  const shareReferralLink = () => {
    if (referralStats?.referralCode) {
      const referralLink = `${window.location.origin}/register?ref=${referralStats.referralCode}`;
      const shareText = `¡Únete a nuestra plataforma usando mi código de invitación! ${referralLink}`;
      
      if (navigator.share) {
        navigator.share({
          title: 'Código de Invitación',
          text: shareText,
          url: referralLink
        });
      } else {
        // Fallback para navegadores que no soportan Web Share API
        navigator.clipboard.writeText(shareText);
        toast.success('Mensaje de invitación copiado al portapapeles');
      }
    }
  };

  const toggleSection = (section: 'personal' | 'password' | 'referrals') => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
    <div className="min-h-screen ">
      {/* Modal de confirmación */}
      <ConfirmationModal
        isOpen={showConfirmationModal}
        onClose={() => {
          setShowConfirmationModal(false);
          setPendingUserData(null);
        }}
        onConfirm={confirmDataChanges}
        isLoading={isLoading}
      />
      {/* Título simple sin banner */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4">
        <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
          <User className="h-6 w-6 text-emerald-600" />
          Configuración de la Cuenta
        </h1>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Diseño para móvil - Secciones desplegables */}
        <div className="lg:hidden space-y-4">
          {/* Sección Datos Personales */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <button
              onClick={() => toggleSection('personal')}
              className="w-full px-6 py-4 flex items-center justify-between bg-emerald-50 hover:bg-emerald-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-emerald-600" />
                <span className="font-semibold text-gray-900">Datos Personales</span>
              </div>
              {expandedSections.personal ? (
                <ChevronUp className="w-5 h-5 text-emerald-600" />
              ) : (
                <ChevronDown className="w-5 h-5 text-emerald-600" />
              )}
            </button>
            
            {expandedSections.personal && (
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      RUT
                    </label>
                    <input
                      type="text"
                      value={userData.rut}
                      onChange={(e) => handleUserDataChange('rut', e.target.value)}
                      disabled={true}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-gray-100 text-gray-500 cursor-not-allowed opacity-60"
                      placeholder="RUT"
                    />
                    <p className="text-xs text-gray-500 mt-1">El RUT no puede ser modificado</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre Completo
                    </label>
                    <input
                      type="text"
                      value={userData.fullName}
                      onChange={(e) => handleUserDataChange('fullName', e.target.value)}
                      disabled={!isEditing}
                      className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                        !isEditing ? 'bg-gray-100 text-gray-500 cursor-not-allowed opacity-60' : ''
                      }`}
                      placeholder="Ingresa tu nombre completo"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Correo Electrónico
                    </label>
                    <input
                      type="email"
                      value={userData.email}
                      onChange={(e) => handleUserDataChange('email', e.target.value)}
                      disabled={!isEditing}
                      className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                        !isEditing ? 'bg-gray-100 text-gray-500 cursor-not-allowed opacity-60' : ''
                      }`}
                      placeholder="Ingresa tu correo electrónico"
                    />
                  </div>
                </div>
                
                <div className="mt-6 flex gap-3">
                  {!isEditing ? (
                    <button
                      onClick={handleEditToggle}
                      disabled={isLoading}
                      className="bg-emerald-600 text-white px-6 py-2 rounded-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                    >
                      <Edit className="w-4 h-4" />
                      Modificar Datos
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={handleSavePersonalData}
                        disabled={isLoading || !canSave()}
                        className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {isLoading ? 'Guardando...' : 'Guardar'}
                      </button>
                      <button
                        onClick={handleEditToggle}
                        disabled={isLoading}
                        className="bg-gray-500 text-white px-6 py-2 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Cancelar
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sección Cambiar Contraseña */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <button
              onClick={() => toggleSection('password')}
              className="w-full px-6 py-4 flex items-center justify-between bg-emerald-50 hover:bg-emerald-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5 text-emerald-600" />
                <span className="font-semibold text-gray-900">Cambiar Contraseña</span>
              </div>
              {expandedSections.password ? (
                <ChevronUp className="w-5 h-5 text-emerald-600" />
              ) : (
                <ChevronDown className="w-5 h-5 text-emerald-600" />
              )}
            </button>
            
            {expandedSections.password && (
              <div className="p-6">
                <div className="space-y-4">
                  {/* Contraseña Actual */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contraseña Actual
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords.current ? 'text' : 'password'}
                        value={passwordData.currentPassword}
                        onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        placeholder="Ingresa tu contraseña actual"
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('current')}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showPasswords.current ? (
                          <EyeOff className="w-4 h-4 text-gray-400" />
                        ) : (
                          <Eye className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>
                  
                  {/* Nueva Contraseña */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nueva Contraseña
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords.new ? 'text' : 'password'}
                        value={passwordData.newPassword}
                        onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        placeholder="Ingresa tu nueva contraseña"
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('new')}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showPasswords.new ? (
                          <EyeOff className="w-4 h-4 text-gray-400" />
                        ) : (
                          <Eye className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>
                  
                  {/* Repetir Nueva Contraseña */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Repetir Nueva Contraseña
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords.confirm ? 'text' : 'password'}
                        value={passwordData.confirmPassword}
                        onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        placeholder="Repite tu nueva contraseña"
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('confirm')}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showPasswords.confirm ? (
                          <EyeOff className="w-4 h-4 text-gray-400" />
                        ) : (
                          <Eye className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Requisitos de Contraseña */}
                <div className="mt-4 p-4 bg-gray-50 rounded-md">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Requisitos de contraseña:</h3>
                  <div className="space-y-2">
                    {passwordRequirements.map((requirement, index) => (
                      <div key={index} className="flex items-center gap-2">
                        {requirement.met ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <X className="w-4 h-4 text-red-500" />
                        )}
                        <span className={`text-sm ${
                          requirement.met ? 'text-green-700' : 'text-red-700'
                        }`}>
                          {requirement.text}
                        </span>
                      </div>
                    ))}
                    <div className="flex items-center gap-2">
                      {passwordsMatch ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <X className="w-4 h-4 text-red-500" />
                      )}
                      <span className={`text-sm ${
                        passwordsMatch ? 'text-green-700' : 'text-red-700'
                      }`}>
                        Las contraseñas coinciden
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Link para recuperar contraseña */}
                <div className="mt-4 text-center">
                  <a href="#" className="text-sm text-emerald-600 hover:text-emerald-800 underline">
                    ¿Olvidaste tu contraseña?
                  </a>
                </div>
                
                {/* Botón de cambiar contraseña */}
                <div className="mt-6">
                  <button
                    onClick={handleChangePassword}
                    disabled={isLoading || !isPasswordValid()}
                    className="w-full bg-emerald-600 text-white py-2 px-4 rounded-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isLoading ? 'Cambiando...' : 'Cambiar Contraseña'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Sección Sistema de Referidos */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <button
              onClick={() => toggleSection('referrals')}
              className="w-full px-6 py-4 flex items-center justify-between bg-emerald-50 hover:bg-emerald-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-emerald-600" />
                <span className="font-semibold text-gray-900">Sistema de Referidos</span>
              </div>
              {expandedSections.referrals ? (
                <ChevronUp className="w-5 h-5 text-emerald-600" />
              ) : (
                <ChevronDown className="w-5 h-5 text-emerald-600" />
              )}
            </button>
            
            {expandedSections.referrals && (
              <div className="p-6">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Tu Código de Invitación</h3>
                    <div className="bg-gray-50 rounded-lg p-4 border-2 border-dashed border-gray-300">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-emerald-600 mb-2">
                          {referralStats?.referralCode || 'Cargando...'}
                        </div>
                        <p className="text-sm text-gray-600 mb-4">
                          Comparte este código con tus amigos para que se registren
                        </p>
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={copyReferralLink}
                            className="bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700 transition-colors flex items-center gap-2 text-sm"
                          >
                            <Copy className="w-4 h-4" />
                            Copiar Enlace
                          </button>
                          <button
                            onClick={shareReferralLink}
                            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm"
                          >
                            <Share2 className="w-4 h-4" />
                            Compartir
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Personas invitadas</h3>
                    <div className="bg-emerald-50 rounded-lg p-4">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-emerald-600 mb-2">
                        {referralStats?.referredUsers?.length || 0}
                      </div>
                        <p className="text-sm text-emerald-700">
                          Personas que se han registrado con tu código
                        </p>
                      </div>
                    </div>
                    
                    {referralStats?.referredUsers && referralStats.referredUsers.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-md font-medium text-gray-800 mb-3">Lista de referidos:</h4>
                        <div className="space-y-2">
                          {referralStats.referredUsers.map((referredUser, index) => (
                            <div key={index} className="bg-white border border-gray-200 rounded-lg p-3">
                              <div className="flex justify-between items-center">
                                <div>
                                  <p className="font-medium text-gray-900">{referredUser.name}</p>
                                  <p className="text-sm text-gray-600">{referredUser.email}</p>
                                </div>
                                <div className="text-xs text-gray-500">
                                  {new Date(referredUser.createdAt).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Diseño para desktop - Layout original en 3 columnas */}
        <div className="hidden lg:grid lg:grid-cols-3 gap-8">
          {/* Columna 1: Datos Personales */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <User className="w-5 h-5 text-emerald-600" />
                Datos Personales
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    RUT
                  </label>
                  <input
                    type="text"
                    value={userData.rut}
                    onChange={(e) => handleUserDataChange('rut', e.target.value)}
                    disabled={true}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-gray-100 text-gray-500 cursor-not-allowed opacity-60"
                    placeholder="RUT"
                  />
                  <p className="text-xs text-gray-500 mt-1">El RUT no puede ser modificado</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    value={userData.fullName}
                    onChange={(e) => handleUserDataChange('fullName', e.target.value)}
                    disabled={!isEditing}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                      !isEditing ? 'bg-gray-100 text-gray-500 cursor-not-allowed opacity-60' : ''
                    }`}
                    placeholder="Ingresa tu nombre completo"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    value={userData.email}
                    onChange={(e) => handleUserDataChange('email', e.target.value)}
                    disabled={!isEditing}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                      !isEditing ? 'bg-gray-100 text-gray-500 cursor-not-allowed opacity-60' : ''
                    }`}
                    placeholder="Ingresa tu correo electrónico"
                  />
                </div>
              </div>
              
              <div className="mt-6 flex gap-3">
                {!isEditing ? (
                  <button
                    onClick={handleEditToggle}
                    disabled={isLoading}
                    className="bg-emerald-600 text-white px-6 py-2 rounded-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Modificar Datos
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleSavePersonalData}
                      disabled={isLoading || !canSave()}
                      className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isLoading ? 'Guardando...' : 'Guardar'}
                    </button>
                    <button
                      onClick={handleEditToggle}
                      disabled={isLoading}
                      className="bg-gray-500 text-white px-6 py-2 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Cancelar
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Columna 2: Cambio de Contraseña */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <Lock className="w-5 h-5 text-emerald-600" />
                Cambiar Contraseña
              </h2>
              
              <div className="space-y-4">
                {/* Contraseña Actual */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contraseña Actual
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.current ? 'text' : 'password'}
                      value={passwordData.currentPassword}
                      onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="Ingresa tu contraseña actual"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('current')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPasswords.current ? (
                        <EyeOff className="w-4 h-4 text-gray-400" />
                      ) : (
                        <Eye className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
                
                {/* Nueva Contraseña */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nueva Contraseña
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.new ? 'text' : 'password'}
                      value={passwordData.newPassword}
                      onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="Ingresa tu nueva contraseña"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('new')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPasswords.new ? (
                        <EyeOff className="w-4 h-4 text-gray-400" />
                      ) : (
                        <Eye className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
                
                {/* Repetir Nueva Contraseña */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Repetir Nueva Contraseña
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.confirm ? 'text' : 'password'}
                      value={passwordData.confirmPassword}
                      onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="Repite tu nueva contraseña"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('confirm')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPasswords.confirm ? (
                        <EyeOff className="w-4 h-4 text-gray-400" />
                      ) : (
                        <Eye className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Requisitos de Contraseña */}
              <div className="mt-4 p-4 bg-gray-50 rounded-md">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Requisitos de contraseña:</h3>
                <div className="space-y-2">
                  {passwordRequirements.map((requirement, index) => (
                    <div key={index} className="flex items-center gap-2">
                      {requirement.met ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <X className="w-4 h-4 text-red-500" />
                      )}
                      <span className={`text-sm ${
                        requirement.met ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {requirement.text}
                      </span>
                    </div>
                  ))}
                  <div className="flex items-center gap-2">
                    {passwordsMatch ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <X className="w-4 h-4 text-red-500" />
                    )}
                    <span className={`text-sm ${
                      passwordsMatch ? 'text-green-700' : 'text-red-700'
                    }`}>
                      Las contraseñas coinciden
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Link para recuperar contraseña */}
              <div className="mt-4 text-center">
                <a href="#" className="text-sm text-emerald-600 hover:text-emerald-800 underline">
                  ¿Olvidaste tu contraseña?
                </a>
              </div>
              
              {/* Botón de cambiar contraseña */}
              <div className="mt-6">
                <button
                  onClick={handleChangePassword}
                  disabled={isLoading || !isPasswordValid()}
                  className="w-full bg-emerald-600 text-white py-2 px-4 rounded-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? 'Cambiando...' : 'Cambiar Contraseña'}
                </button>
              </div>
            </div>
          </div>

          {/* Columna 3: Sistema de Referidos */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-6">
                <Users className="h-6 w-6 text-emerald-600" />
                <h2 className="text-xl font-semibold text-gray-900">Sistema de Referidos</h2>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Tu Código de Invitación</h3>
                  <div className="bg-gray-50 rounded-lg p-4 border-2 border-dashed border-gray-300">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-emerald-600 mb-2">
                        {referralStats?.referralCode || 'Cargando...'}
                      </div>
                      <p className="text-sm text-gray-600 mb-4">
                        Comparte este código con tus amigos para que se registren
                      </p>
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={copyReferralLink}
                          className="bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700 transition-colors flex items-center gap-2 text-sm"
                        >
                          <Copy className="w-4 h-4" />
                          Copiar Enlace
                        </button>
                        <button
                          onClick={shareReferralLink}
                          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm"
                        >
                          <Share2 className="w-4 h-4" />
                          Compartir
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Personas invitadas</h3>
                  <div className="bg-emerald-50 rounded-lg p-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-emerald-600 mb-2">
                        {referralStats?.referredUsers?.length || 0}
                      </div>
                      <p className="text-sm text-emerald-700">
                        Personas que se han registrado con tu código
                      </p>
                    </div>
                  </div>
                  
                  {referralStats?.referredUsers && referralStats.referredUsers.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-md font-medium text-gray-800 mb-3">Lista de referidos:</h4>
                      <div className="space-y-2">
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                        {referralStats.referredUsers.map((referredUser, index) => (
                          <div key={index} className="bg-white border border-gray-200 rounded-lg p-3">
                            <div className="flex items-center">
                              <p className="font-medium text-gray-900">{referredUser.name}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;