'use client';

import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { 
  FolderHeart,
  Users, 
  Files, 
  FolderPlus,
  MapPinned,
  House,
  LogOut,
  MessageCircleQuestion 
} from 'lucide-react';

interface UserData {
  role?: string;
}

interface MenuItem {
  title: string;
  icon: any;
  href: string;
  adminOnly?: boolean;
  commerceOnly?: boolean;
  description?: string;
}

interface MenuSection {
  section: string;
  items: MenuItem[];
}

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [userData, setUserData] = useState<UserData | null>(null);
  
  useEffect(() => {
    const data = localStorage.getItem('user');
    if (data) {
      setUserData(JSON.parse(data));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('authToken');
    setUserData(null);
    
    // Forzar recarga completa de la página (equivalente a F5)
    window.location.href = '/views/home';
    // O alternativamente, si quieres recargar la página actual:
    // window.location.reload();
  };

  const isActive = (href: string) => pathname === href;

  const menuItems: (MenuItem | MenuSection)[] = [
    {
      section: 'Panel Soporte',
      items: [
        {
          title: 'Registro de eventos',
          icon: Users,
          href: '/views/logs',
          adminOnly: true,
          description: 'Administrar usuarios del sistema'
        },
        {
          title: 'Solicitudes',
          icon: Files,
          href: '/views/requests',
          adminOnly: true,
          description: 'Gestionar categorias de documentos'
        },
      ]
    },
    {
      section: 'Panel Admin',
      items: [
        {
          title: 'Gestionar Usuarios',
          icon: Users,
          href: '/views/users',
          adminOnly: true,
          description: 'Administrar usuarios del sistema'
        },
        {
          title: 'Gestionar Categorias',
          icon: Files,
          href: '/views/category',
          adminOnly: true,
          description: 'Gestionar categorias de documentos'
        },
        {
          title: 'Gestionar Comercios',
          icon: FolderPlus,
          href: '/views/commerce',
          adminOnly: true,
          description: 'Crear nuevos estantes digitales'
        }
      ]
    },
    {
      section: 'Panel Comercio',
      items: [
        {
          title: 'Mi Comercio',
          icon: FolderPlus,
          href: '/views/management',
          commerceOnly: true,
          description: 'Gestionar mi comercio'
        }
      ]
    },
    {
      section: 'Panel Usuario',
      items: [
        {
          title: 'Inicio',
          icon: House,
          href: '/views/home',
          description: 'Sección Principal'
        },
        {
          title: 'Favoritos',
          icon: FolderHeart,
          href: '/views/saved', // Corregir la ruta
          description: 'Comercios Guardados'
        }
      ]
    },
    {
      section: 'Soporte Usuario',
      items: [
        {
          title: 'Ayuda',
          icon: MessageCircleQuestion, // Cambiar House por MessageCircleQuestion
          href: '/views/help',
          description: 'Sección Principal'
        },
      ]
    }
  ];

  const filteredMenuItems = menuItems.map(item => {
    if ('items' in item) {
      return {
        ...item,
        items: item.items.filter(subItem => {
          // Filtrar elementos solo para admin
          if (subItem.adminOnly && userData?.role?.toLowerCase() !== 'admin') {
            return false;
          }
          // Filtrar elementos solo para commerce
          if (subItem.commerceOnly && userData?.role?.toLowerCase() !== 'commerce') {
            return false;
          }
          return true;
        })
      };
    }
    return item;
  });

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-primary border-r border-color shadow-[5px_0_30px_0_rgba(0,0,0,0.1)]">
      <div className="flex flex-col h-full">
        {/* Header mejorado */}
        <div className="p-6 border-b border-color bg-gradient-to-r from-emerald-500/10 to-transparent">
          <div className="flex flex-col items-center justify-center">
            <div className="flex items-center justify-center mb-4 transform hover:scale-105 transition-transform duration-200">
              <div className="relative">
                <MapPinned className="w-12 h-12 text-emerald-500" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-primary mb-4 text-center bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-emerald-400">
              Linares
            </h2>
          </div>
        </div>

        {/* Navigation mejorado */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            {filteredMenuItems.map((section, idx) => (
              <div key={idx} className="space-y-2">
                {'href' in section ? (
                  <Link
                    href={section.href}
                    className={`group flex items-center gap-3 px-4 py-3 text-label rounded-lg 
                      transition-all duration-300 relative overflow-hidden
                      hover:translate-x-1
                      ${isActive(section.href) 
                        ? 'bg-emerald-500/10 text-emerald-600 shadow-sm' 
                        : 'hover:bg-emerald-500/5'}`}
                  >
                    <section.icon className={`w-5 h-5 transition-all duration-300 
                      group-hover:rotate-6 group-hover:scale-110 ${
                      isActive(section.href) ? 'text-emerald-600' : ''
                    }`} />
                    <span className={`font-medium transition-all duration-300 
                      group-hover:translate-x-1 ${
                      isActive(section.href) ? 'text-emerald-600' : ''
                    }`}>
                      {section.title}
                    </span>
                    {isActive(section.href) && (
                      <span className="absolute inset-0 bg-emerald-500/5 animate-pulse" />
                    )}
                  </Link>
                ) : (
                  <>
                    {section.items.length > 0 && (
                      <div className="px-4 py-2">
                        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                          {section.section}
                        </h3>
                      </div>
                    )}
                    {section.items.map((item, itemIdx) => (
                      <Link
                        key={itemIdx}
                        href={item.href}
                        className={`group flex items-center gap-3 px-4 py-3 text-label rounded-lg 
                          transition-all duration-300 relative overflow-hidden
                          hover:translate-x-1
                          ${isActive(item.href)
                            ? 'bg-emerald-500/10 text-emerald-600 shadow-sm'
                            : 'hover:bg-emerald-500/5'}
                          ${item.title === 'Favoritos' && !userData ? 'opacity-50 cursor-not-allowed' : ''}`}
                        onClick={(e) => {
                          if (item.title === 'Favoritos' && !userData) {
                            e.preventDefault();
                          }
                        }}
                      >
                        <item.icon className={`w-5 h-5 transition-all duration-300 
                          group-hover:rotate-6 group-hover:scale-110 ${
                          isActive(item.href) ? 'text-emerald-600' : ''
                        }`} />
                        <span className={`font-medium transition-all duration-300 
                          group-hover:translate-x-1 ${
                          isActive(item.href) ? 'text-emerald-600' : ''
                        }`}>
                          {item.title}
                        </span>
                        {isActive(item.href) && (
                          <span className="absolute inset-0 bg-emerald-500/5 animate-pulse" />
                        )}
                      </Link>
                    ))}
                  </>
                )}
              </div>
            ))}
          </div>
        </nav>

        {/* Mensaje condicional de registro */}
        {!userData && (
          <div className="p-4 text-center mb-2 text-sm text-gray-600">
            Regístrate e inicia sesión para obtener beneficios exclusivos
          </div>
        )}
        
        {/* Botón de logout mejorado */}
        <div className="p-4 border-t border-color mt-auto bg-gradient-to-t from-red-500/5 to-transparent">
          {userData ? (
            <button
              onClick={handleLogout}
              className="group flex items-center gap-3 w-full px-4 py-3 text-red-600 
                hover:bg-red-50 rounded-lg transition-all duration-300
                hover:shadow-md hover-red-100/50
                active:scale-95 relative overflow-hidden
                before:absolute before:inset-0 before:bg-red-100/0
                before:transition-all before:duration-300
                hover:before:bg-red-100/50"
            >
              <LogOut className="w-5 h-5 transition-transform duration-300 
                group-hover:rotate-12 group-hover:scale-110" />
              <span className="font-medium relative z-10 transition-all duration-300 
                group-hover:translate-x-1">
                Cerrar Sesión
              </span>
              <span className="absolute right-4 transform translate-x-8 opacity-0 
                transition-all duration-300 group-hover:translate-x-0 
                group-hover:opacity-100 font-bold text-lg">
                →
              </span>
            </button>
          ) : (
            <Link
              href="/views/auth/login"
              className="group flex items-center gap-3 w-full px-4 py-3 text-emerald-600 
                hover:bg-emerald-50 rounded-lg transition-all duration-300
                hover:shadow-md hover:shadow-emerald-100/50
                active:scale-95 relative overflow-hidden
                before:absolute before:inset-0 before:bg-emerald-100/0
                before:transition-all before:duration-300
                hover:before:bg-emerald-100/50"
            >
              <LogOut className="w-5 h-5 transition-transform duration-300 
                group-hover:rotate-12 group-hover:scale-110" />
              <span className="font-medium relative z-10 transition-all duration-300 
                group-hover:translate-x-1">
                Iniciar Sesión
              </span>
              <span className="absolute right-4 transform translate-x-8 opacity-0 
                transition-all duration-300 group-hover:translate-x-0 
                group-hover:opacity-100 font-bold text-lg">
                →
              </span>
            </Link>
          )}
        </div>
      </div>
    </aside>
  );
}