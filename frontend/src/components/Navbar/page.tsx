'use client';

import { useRouter } from 'next/navigation';
import { Menu, FileBox, Home, Heart, HelpCircle, Users, Store, Settings, LogIn, LogOut, Lock, ClipboardList, MessageSquare, FolderTree } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';

// Definir el tipo para los elementos del menú
interface MenuItem {
    icon: any;
    label: string;
    path: string;
    disabled: boolean;
    disabledIcon?: any; // Agregar esta propiedad opcional
}

const Navbar = () => {
    const router = useRouter();
    const { user, logout } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Cerrar menú al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleMenuItemClick = (path: string) => {
        setIsMenuOpen(false);
        router.push(path);
    };

    const handleLogout = () => {
        setIsMenuOpen(false);
        logout();
    };

    const getMenuItems = (): MenuItem[] => {
        if (!user) {
            // Usuario no logueado
            return [
                {
                    icon: Home,
                    label: 'Home',
                    path: '/views/home',
                    disabled: false
                },
                {
                    icon: Heart,
                    label: 'Favoritos',
                    path: '/views/saved',
                    disabled: true,
                    disabledIcon: Lock
                },
                {
                    icon: HelpCircle,
                    label: 'Ayuda',
                    path: '/views/help',
                    disabled: false
                }
            ];
        }

        const baseItems: MenuItem[] = [
            {
                icon: Home,
                label: 'Home',
                path: '/views/home',
                disabled: false
            },
            {
                icon: Heart,
                label: 'Favoritos',
                path: '/views/saved',
                disabled: false
            },
            {
                icon: Users,
                label: 'Mi Perfil',
                path: '/views/profile',
                disabled: false
            },
            {
                icon: HelpCircle,
                label: 'Ayuda',
                path: '/views/help',
                disabled: false
            }
        ];

        // Agregar opciones específicas según el rol
        if (user.role === 'admin') {
            return [
                {
                    icon: Settings,
                    label: 'Panel Principal',
                    path: '/views/dashboard',
                    disabled: false
                },
                {
                    icon: Users,
                    label: 'Usuarios',
                    path: '/views/users',
                    disabled: false
                },
                {
                    icon: ClipboardList,
                    label: 'Registros',
                    path: '/views/logs',
                    disabled: false
                },
                {
                    icon: MessageSquare,
                    label: 'Solicitudes',
                    path: '/views/requests',
                    disabled: false
                },
                {
                    icon: FolderTree,
                    label: 'Categorias',
                    path: '/views/category',
                    disabled: false
                },
                {
                    icon: Store,
                    label: 'Comercios',
                    path: '/views/commerce',
                    disabled: false
                },
                ...baseItems
            ];
        } else if (user.role === 'commerce') {
            return [
                {
                    icon: Store,
                    label: 'Mi Comercio',
                    path: '/views/management',
                    disabled: false
                },
                ...baseItems
            ];
        }

        return baseItems;
    };

    return (
        <nav className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-primary border-b border-color z-40 shadow-md">
            <div className="flex items-center justify-between h-full px-4">
                {/* Logo y titulo */}
                <div className="flex items-center space-x-2">
                    <div className="relative">
                        <FileBox className="w-8 h-8 text-emerald-500" />
                    </div>
                </div>

                {/* Titulo central */}
                <h1 className="absolute left-1/2 transform -translate-x-1/2 text-lg font-medium text-label bg-primary/50 px-4 py-1 rounded-full backdrop-blur-sm">
                    Menu
                </h1>

                {/* Boton de menu desplegable */}
                <div className="relative" ref={menuRef}>
                    <button 
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-secondary transition-all duration-200 active:scale-95"
                    >
                        <Menu className="w-6 h-6 text-label" />
                    </button>

                    {/* Menu desplegable */}
                    {isMenuOpen && (
                        <div className="absolute right-0 top-16 w-56 bg-primary border border-color rounded-lg shadow-lg py-2 z-50">
                            {getMenuItems().map((item, index) => {
                                const IconComponent = item.disabled && item.disabledIcon ? item.disabledIcon : item.icon;
                                
                                return (
                                    <button
                                        key={index}
                                        onClick={() => !item.disabled && handleMenuItemClick(item.path)}
                                        disabled={item.disabled}
                                        className={`w-full flex items-center space-x-3 px-4 py-3 text-left transition-colors duration-200 ${
                                            item.disabled 
                                                ? 'text-gray-400 cursor-not-allowed' 
                                                : 'text-label hover:bg-secondary'
                                        }`}
                                    >
                                        <IconComponent className="w-5 h-5" />
                                        <span className="font-medium">{item.label}</span>
                                        {item.disabled && item.disabledIcon && (
                                            <Lock className="w-4 h-4 ml-auto" />
                                        )}
                                    </button>
                                );
                            })}
                            
                            {/* Separador */}
                            <div className="border-t border-color my-2"></div>
                            
                            {/* Boton de login/logout */}
                            {user ? (
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center space-x-3 px-4 py-3 text-left text-red-500 hover:bg-secondary transition-colors duration-200"
                                >
                                    <LogOut className="w-5 h-5" />
                                    <span className="font-medium">Cerrar Sesion</span>
                                </button>
                            ) : (
                                <button
                                    onClick={() => handleMenuItemClick('/views/auth/login')}
                                    className="w-full flex items-center space-x-3 px-4 py-3 text-left text-emerald-500 hover:bg-secondary transition-colors duration-200"
                                >
                                    <LogIn className="w-5 h-5" />
                                    <span className="font-medium">Iniciar Sesion</span>
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;