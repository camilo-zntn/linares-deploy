'use client';

import { useEffect, useState } from 'react';
import { 
  ClipboardList,
  Users,
  Tags,
  ShoppingBag,
  LogOut,
  BarChart2,
  House,
  Heart,
  User,
  FileQuestion,
  Ticket
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface UserData {
  _id: string;
  name: string;
  email: string;
  role: string;
}

interface DashboardCard {
  title: string;
  description: string;
  icon: any;
  color: string;
  link?: string;
  adminOnly?: boolean;
  action?: () => void;
  disabled?: boolean; 
  className?: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('authToken');
    router.push('/views/auth/login');
  };

  useEffect(() => {
    try {
      const data = localStorage.getItem('user');
      const storedToken = localStorage.getItem('authToken') || localStorage.getItem('token');
      
      if (storedToken) {
        setToken(storedToken);
      }
      
      if (data) {
        const parsedData = JSON.parse(data);
        setUserData({
          ...parsedData,
          department: typeof parsedData.department === 'object' 
            ? parsedData.department.name 
            : parsedData.department
        });
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      router.push('/views/auth/login');
    }
  }, [router]);

  const cards: DashboardCard[] = [
    {
      title: 'Registro de Eventos',
      description: 'Registro de acciones realizadas',
      icon: ClipboardList,
      color: 'from-slate-600 to-slate-400',
      link: '/views/logs',
      adminOnly: true
    },
    {
      title: 'Solicitudes',
      description: 'Solicitudes de soporte',
      icon: FileQuestion,
      color: 'from-orange-500 to-orange-400',
      link: '/views/requests',
      adminOnly: true
    },
    {
      title: 'Resumen General',
      description: 'Visualización de estadísticas generales',
      icon: BarChart2,
      color: 'from-blue-600 to-blue-400',
      link: '/views/analytics',
      adminOnly: true
    },
    {
      title: 'Usuarios',
      description: 'Gestiona usuarios del sistema',
      icon: Users,
      color: 'from-indigo-600 to-indigo-400',
      link: '/views/users',
      adminOnly: true
    },
    {
      title: 'Categorias',
      description: 'Gestiona categorias de estantes',
      icon: Tags,
      color: 'from-pink-600 to-pink-400',
      link: '/views/category',
      adminOnly: true
    },
    {
      title: 'Comercios',
      description: 'Gestiona los estantes digitales',
      icon: ShoppingBag,
      color: 'from-cyan-600 to-cyan-400',
      link: '/views/commerce',
      adminOnly: true
    },
    {
      title: 'Inicio',
      description: 'Linares conectado',
      icon: House,
      color: 'from-teal-500 to-teal-400',
      link: '/views/home',
      adminOnly: false
    },
    {
      title: 'Favoritos',
      description: 'Comercios favoritos',
      icon: Heart,
      color: 'from-rose-500 to-rose-400',
      link: '/views/saved',
      adminOnly: false
    },
    {
      title: 'Descuentos',
      description: 'Cupones disponibles',
      icon: Ticket,
      color: 'from-amber-500 to-amber-400',
      link: '/views/discounts',
      adminOnly: false
    },
    {
      title: 'Perfil',
      description: 'Datos personales',
      icon: User,
      color: 'from-violet-600 to-violet-400',
      link: '/views/profile',
      adminOnly: false
    },
    {
      title: 'Cerrar Sesion',
      description: 'Salir del sistema',
      icon: LogOut,
      color: 'from-red-600 to-red-400',
      action: handleLogout
    }
  ];

  const filteredCards = userData?.role?.toLowerCase() === 'admin' 
    ? cards 
    : cards.filter(card => !card.adminOnly);

  if (!userData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 flex items-center justify-center">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      {/* Header simplificado */}
      <div className="max-w-4xl mb-12">
        <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
          {/* Avatar mejorado */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl blur opacity-40 group-hover:opacity-60 transition duration-300" />
            <div className="relative h-24 w-24 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center transform group-hover:scale-105 transition-all duration-300 ring-2 ring-white/50">
              <span className="text-4xl font-bold text-white drop-shadow">
                {userData?.name.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>

          {/* Informacion del usuario */}
          <div className="text-center sm:text-left">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Bienvenido, {userData?.name}
            </h1>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
              <span className="inline-flex items-center px-2 py-1 bg-emerald-50/80 text-emerald-700 rounded-lg text-sm font-medium backdrop-blur-sm border border-emerald-100">
                {userData?.role?.toLowerCase() === 'admin' ? 'Administrador' : 'Usuario'}
              </span>
            </div>
          </div>
        </div>
      </div>
  
        {/* Grid de tarjetas mejorado */}
        <div className={`
            grid grid-cols-1 md:grid-cols-2 
            ${userData?.role?.toLowerCase() === 'admin' 
              ? 'lg:grid-cols-3 xl:grid-cols-4' 
              : 'lg:grid-cols-3'
            } 
            gap-6
          `}>
          {filteredCards.map((card, index) => (
            <div
              key={index}
              onClick={() => card.action ? card.action() : card.link && router.push(card.link)}
              className={`
                relative group bg-white/90 rounded-xl p-6 
                border border-gray-200/80 shadow-md
                hover:shadow-xl hover:border-gray-300
                transform hover:-translate-y-1
                transition-all duration-300 ease-in-out
                backdrop-blur-sm
                ${card.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                ${card.adminOnly ? 'ring-1 ring-blue-200/50' : ''}
              `}
            >
              {card.adminOnly && (
                <div className="absolute top-4 right-4">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200/80 shadow-sm">
                    Admin
                  </span>
                </div>
              )}
  
              <div className="relative group">
                <div className={`absolute -inset-1 bg-gradient-to-r ${card.color} rounded-xl blur opacity-20 group-hover:opacity-30 transition duration-300`}></div>
                <div className={`
                  relative w-16 h-16 rounded-xl bg-gradient-to-br ${card.color}
                  flex items-center justify-center shadow-md
                  transform group-hover:scale-110 transition-all duration-300
                  border border-white/10
                `}>
                  <card.icon className="h-8 w-8 text-white drop-shadow" />
                </div>
              </div>
  
              <div className="mt-6 space-y-2">
                <h3 className={`text-lg font-semibold text-gray-900 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r ${card.color} transition-colors duration-300`}>
                  {card.title}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  {card.description}
                </p>
              </div>
  
              {!card.disabled && (
                <div className={`mt-4 flex items-center group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r ${card.color} text-gray-400`}>
                  <div className="flex items-center opacity-80 group-hover:opacity-100 transition-all duration-300 transform translate-x-0 group-hover:translate-x-2">
                    <span className="text-sm font-medium">
                      {card.action ? 'Ejecutar' : 'Ver mas'}
                    </span>
                    <svg 
                      className="w-5 h-5 ml-2" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>
              )}
  
              {card.disabled && (
                <div className="absolute inset-0 bg-white/80 rounded-xl backdrop-blur-sm">
                  <div className="flex items-center justify-center h-full">
                    <span className="text-sm font-medium text-gray-500">Proximamente</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
