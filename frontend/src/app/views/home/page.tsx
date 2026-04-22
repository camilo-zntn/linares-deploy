'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { Clock, Phone, Mail, Globe, Facebook, Instagram, MessageCircle, Heart, Loader2 } from 'lucide-react';
import { createAnalyticsView, trackSocialClick, trackContactClick, trackMapClick } from '../../../lib/analytics';
import TestTimer from '../../../components/TestTimer/page';
// Importar la configuración de API
import { API_BASE_URL, apiRoutes } from '../../../config/api';

interface DaySchedule {
  start: string;
  end: string;
  isClosed: boolean;
}

interface Schedule {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

interface Category {
  _id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

interface Commerce {
  _id: string;
  name: string;
  description: string;
  imageUrl: string;
  category: {
    _id: string;
    name: string;
  };
  schedule: Schedule;
  googleMapsIframe?: string;
  contact?: {
    email?: string;
    phone?: string;
    website?: string;
    socialMedia?: {
      facebook?: string;
      instagram?: string;
      whatsapp?: string;
    };
  };
}

export default function HomePage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [commerces, setCommerces] = useState<Commerce[]>([]);
  const [selectedCommerce, setSelectedCommerce] = useState<Commerce | null>(null);
  const [isLoadingCommerce, setIsLoadingCommerce] = useState(false);
  // Nuevos estados para favoritos
  const [favoriteCommerces, setFavoriteCommerces] = useState<string[]>([]);
  const [loadingFavorites, setLoadingFavorites] = useState<{ [key: string]: boolean }>({});

  // Analítica: preparar contexto y ciclo de vida del cronómetro
  const analyticsCtx = selectedCommerce
    ? { commerceId: selectedCommerce._id, path: `/views/home/${selectedCommerce._id}` }
    : selectedCategory
      ? { categoryId: selectedCategory, path: `/views/home/category/${selectedCategory}` }
      : { path: '/views/home' };

  const fetchCategories = async () => {
    try {
      const response = await fetch(apiRoutes.categories, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
  
      if (!response.ok) throw new Error('Error cargando categorías');
      const data = await response.json();
      setCategories(data.categories);
    } catch (error) {
      toast.error('Error al cargar las categorías');
    }
  };

  const fetchCommercesByCategory = async (categoryId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(apiRoutes.commerces(categoryId), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Error cargando comercios');
      const data = await response.json();
      setCommerces(data.commerces);
      setSelectedCategory(categoryId);
      setSelectedCommerce(null);
    } catch (error) {
      toast.error('Error al cargar los comercios');
    }
  };

  const fetchUserFavorites = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(apiRoutes.favorites, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setFavoriteCommerces(data.favoriteCommerces.map((c: Commerce) => c._id));
      }
    } catch (error) {
      console.error('Error fetching favorites:', error);
    }
  };

  const toggleFavorite = async (commerceId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Debes iniciar sesión para guardar favoritos');
      return;
    }

    setLoadingFavorites(prev => ({ ...prev, [commerceId]: true }));

    try {
      const isFavorite = favoriteCommerces.includes(commerceId);
      
      if (isFavorite) {
        // Remover de favoritos
        const response = await fetch(`${apiRoutes.favorites}/${commerceId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          setFavoriteCommerces(prev => prev.filter(id => id !== commerceId));
          toast.success('Removido de favoritos');
        }
      } else {
        // Agregar a favoritos
        const response = await fetch(apiRoutes.favorites, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ commerceId })
        });

        if (response.ok) {
          setFavoriteCommerces(prev => [...prev, commerceId]);
          toast.success('Agregado a favoritos');
        }
      }
    } catch (error) {
      toast.error('Error al actualizar favoritos');
    } finally {
      setLoadingFavorites(prev => ({ ...prev, [commerceId]: false }));
    }
  };

  const handleCommerceSelection = (commerce: Commerce) => {
    setIsLoadingCommerce(true);
    setTimeout(() => {
      setSelectedCommerce(commerce);
      setIsLoadingCommerce(false);
    }, 1000);
  };

  useEffect(() => {
    fetchCategories();
    fetchUserFavorites();
  }, []);

  useEffect(() => {
    const view = createAnalyticsView(analyticsCtx);
    view.init();
    return () => view.cleanup();
  }, [analyticsCtx.categoryId, analyticsCtx.commerceId, analyticsCtx.path]);

  const isBusinessOpen = (schedule: Schedule): boolean => {
    const now = new Date();
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const currentDay = days[now.getDay()] as keyof Schedule;
    const currentTime = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
    
    const daySchedule = schedule[currentDay];
    if (daySchedule.isClosed) return false;
    
    return currentTime >= daySchedule.start && currentTime <= daySchedule.end;
  };

  return (
    <div className="p-6">
      {!selectedCategory && !selectedCommerce && <TestTimer label="Home" />}
      {selectedCategory && !selectedCommerce && (
        <TestTimer label={`Categoría: ${categories.find(c => c._id === selectedCategory)?.name || ''}`} />
      )}
      {selectedCommerce && <TestTimer label={`Comercio: ${selectedCommerce.name}`} />}
      {!selectedCategory && (
        <>
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Categorías</h1>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {categories.map((category) => (
              <div 
                key={category._id}
                onClick={() => fetchCommercesByCategory(category._id)}
                className="group cursor-pointer"
              >
                <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 flex flex-col items-center overflow-hidden border border-gray-100 hover:border-gray-200">
                  {/* Icono con fondo sutil */}
                  <div className="w-full p-6">
                    <div 
                      className="w-16 h-16 mx-auto flex items-center justify-center mb-3 rounded-2xl"
                      style={{ 
                        backgroundColor: `${category.color}15`,
                        color: category.color
                      }}
                      dangerouslySetInnerHTML={{ __html: category.icon }}
                    />
                    
                    {/* Título y descripción */}
                    <div className="text-center">
                      <h3 className="text-base font-semibold text-gray-800 mb-1">
                        {category.name}
                      </h3>
                      <p className="text-sm text-gray-600 leading-relaxed">{category.description}</p>
                    </div>
                  </div>

                  {/* Botón sencillo */}
                  <div className="w-full py-3 px-4 bg-gray-50 border-t border-gray-100 text-center">
                    <span className="text-sm font-medium text-gray-700 group-hover:text-current transition-colors duration-200" style={{ color: category.color }}>
                      Ver comercios
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {selectedCategory && !selectedCommerce && (
        <>
          <div className="relative flex flex-row items-center mb-6">
            <div className="absolute left-0 z-10">
              <button
                onClick={() => {
                  setSelectedCategory(null);
                  setCommerces([]);
                }}
                className="flex items-center gap-2 px-3 py-1.5 bg-white text-emerald-600 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 group border border-emerald-100 hover:bg-emerald-500 hover:border-emerald-500 text-sm whitespace-nowrap"
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  className="group-hover:-translate-x-1 transition-transform duration-300"
                >
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
                <span className="font-medium group-hover:text-white">Categorías</span>
              </button>
            </div>
            <div className="flex-1 text-center px-4">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800 truncate mx-auto">
                {categories.find(c => c._id === selectedCategory)?.name}
              </h1>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
            {commerces.map((commerce) => (
              <div 
                key={commerce._id}
                className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col cursor-pointer hover:shadow-xl transition-all duration-300 relative group"
              >
                {/* Botón de favorito */}
                <button
                  onClick={(e) => toggleFavorite(commerce._id, e)}
                  disabled={loadingFavorites[commerce._id]}
                  className="absolute top-2 right-2 z-10 p-2 bg-white/90 rounded-full shadow-md hover:bg-white transition-all duration-200 group-hover:scale-110 disabled:opacity-50"
                >
                  {loadingFavorites[commerce._id] ? (
                    <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
                  ) : (
                    <Heart 
                      className={`h-5 w-5 transition-colors ${
                        favoriteCommerces.includes(commerce._id) 
                          ? 'text-red-500 fill-current' 
                          : 'text-gray-400 hover:text-red-500'
                      }`} 
                    />
                  )}
                </button>

                <div onClick={() => handleCommerceSelection(commerce)} className="flex-1">
                  <div className="relative h-48">
                    <img 
                      src={commerce.imageUrl.startsWith('http') 
                        ? commerce.imageUrl 
                        : `${API_BASE_URL}${commerce.imageUrl}`}
                      alt={commerce.name}
                      className="w-full h-full object-cover"
                    />
                    <div className={`absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-medium ${
                      isBusinessOpen(commerce.schedule) ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                    }`}>
                      {isBusinessOpen(commerce.schedule) ? 'Abierto' : 'Cerrado'}
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-800">{commerce.name}</h3>
                    <p className="text-sm text-gray-600 mt-2">{commerce.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {selectedCommerce && (
        <>
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => setSelectedCommerce(null)}
              className="text-gray-600 hover:text-gray-800"
            >
              ← Volver a comercios
            </button>
          </div>

          <div className="container mx-auto px-4 py-8">
            <div className="rounded-lg overflow-hidden">
              <div className="grid lg:grid-cols-2 gap-8">
                {/* Columna Izquierda - Imagen y Detalles Principales */}
                <div className="p-6">
                  <div className="relative aspect-video mb-6">
                    <img 
                      src={selectedCommerce.imageUrl.startsWith('http') 
                        ? selectedCommerce.imageUrl 
                        : `${API_BASE_URL}${selectedCommerce.imageUrl}`}
                      alt={selectedCommerce.name}
                      className="aspect-square object-cover rounded-xl"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between mb-4">
                    <h1 className="text-3xl font-bold text-gray-800">{selectedCommerce.name}</h1>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${isBusinessOpen(selectedCommerce.schedule) ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                      {isBusinessOpen(selectedCommerce.schedule) ? 'Abierto' : 'Cerrado'}
                    </span>
                  </div>

                  <p className="text-gray-600 mb-6">{selectedCommerce.description}</p>

                  {/* Horario */}
                  <div className="rounded-lg p-4 mb-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <Clock className="h-5 w-5 text-emerald-500" />
                      Horario
                    </h2>
                    <div className="space-y-2">
                      {Object.entries(selectedCommerce.schedule).map(([day, schedule]) => (
                        <div key={day} className="flex justify-between items-center py-2 px-3 bg-white rounded">
                          <span className="capitalize text-gray-700">
                            {day === 'monday' ? 'Lunes' :
                             day === 'tuesday' ? 'Martes' :
                             day === 'wednesday' ? 'Miércoles' :
                             day === 'thursday' ? 'Jueves' :
                             day === 'friday' ? 'Viernes' :
                             day === 'saturday' ? 'Sábado' : 'Domingo'}
                          </span>
                          <span className={schedule.isClosed ? 'text-red-500' : 'text-emerald-600'}>
                            {schedule.isClosed ? 'Cerrado' : `${schedule.start} - ${schedule.end}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Columna Derecha - Contacto y Redes Sociales */}
                <div className="p-6">
                  {/* Información de contacto */}
                  {(selectedCommerce.contact?.email || selectedCommerce.contact?.phone || selectedCommerce.contact?.website) && (
                    <div className="mb-8">
                      <h2 className="text-xl font-semibold text-gray-800 mb-4">Información de contacto</h2>
                      <div className="space-y-3">
                        {selectedCommerce.contact?.phone && (
                          <a href={`tel:${selectedCommerce.contact.phone}`} 
                             onClick={() => trackContactClick('phone')}
                             className="flex items-center gap-3 p-3 bg-white rounded-lg hover:bg-emerald-50 transition-colors">
                            <Phone className="h-5 w-5 text-emerald-500" />
                            <span className="text-gray-700">{selectedCommerce.contact.phone}</span>
                          </a>
                        )}
                        {selectedCommerce.contact?.email && (
                          <a href={`mailto:${selectedCommerce.contact.email}`} 
                             onClick={() => trackContactClick('email')}
                             className="flex items-center gap-3 p-3 bg-white rounded-lg hover:bg-emerald-50 transition-colors">
                            <Mail className="h-5 w-5 text-emerald-500" />
                            <span className="text-gray-700">{selectedCommerce.contact.email}</span>
                          </a>
                        )}
                        {selectedCommerce.contact?.website && (
                          <a href={selectedCommerce.contact.website} 
                             target="_blank" 
                             rel="noopener noreferrer"
                             onClick={() => trackContactClick('website')}
                             className="flex items-center gap-3 p-3 bg-white rounded-lg hover:bg-emerald-50 transition-colors">
                            <Globe className="h-5 w-5 text-emerald-500" />
                            <span className="text-gray-700">Sitio web</span>
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Redes Sociales */}
                  {(selectedCommerce.contact?.socialMedia?.facebook || 
                    selectedCommerce.contact?.socialMedia?.instagram || 
                    selectedCommerce.contact?.socialMedia?.whatsapp) && (
                    <div className="mb-8">
                      <h2 className="text-xl font-semibold text-gray-800 mb-4">Redes Sociales</h2>
                      <div className="flex gap-4">
                        {selectedCommerce.contact.socialMedia.facebook && (
                          <a href={selectedCommerce.contact.socialMedia.facebook}
                             target="_blank"
                             rel="noopener noreferrer"
                             onClick={() => trackSocialClick('facebook')}
                             className="p-3 bg-white rounded-lg hover:bg-blue-50 transition-colors"
                             title="Facebook">
                            <Facebook className="h-6 w-6 text-blue-600" />
                          </a>
                        )}
                        {selectedCommerce.contact.socialMedia.instagram && (
                          <a href={selectedCommerce.contact.socialMedia.instagram}
                             target="_blank"
                             rel="noopener noreferrer"
                             onClick={() => trackSocialClick('instagram')}
                             className="p-3 bg-white rounded-lg hover:bg-pink-50 transition-colors"
                             title="Instagram">
                            <Instagram className="h-6 w-6 text-pink-600" />
                          </a>
                        )}
                        {selectedCommerce.contact.socialMedia.whatsapp && (
                          <a href={`https://wa.me/${selectedCommerce.contact.socialMedia.whatsapp}`}
                             target="_blank"
                             rel="noopener noreferrer"
                             onClick={() => trackSocialClick('whatsapp')}
                             className="p-3 bg-white rounded-lg hover:bg-green-50 transition-colors"
                             title="WhatsApp">
                            <MessageCircle className="h-6 w-6 text-green-600" />
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Sección del Mapa */}
                  <div className="rounded-xl p-6">
                    <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Ubicación
                    </h2>
                    {selectedCommerce.googleMapsIframe ? (
                      <div 
                        className="w-full h-[400px] rounded-lg overflow-hidden shadow-inner"
                        onClick={trackMapClick}
                        dangerouslySetInnerHTML={{ __html: sanitizeMapIframe(selectedCommerce.googleMapsIframe) }}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-[400px] bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 12h.01M12 14h.01M12 16h.01M12 18h.01M12 20h.01M12 22h.01" />
                        </svg>
                        <p className="text-gray-600 text-center">No hay mapa disponible para este comercio</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function sanitizeMapIframe(html: string) {
  return html
    .replace(/<\/?html[^>]*>/gi, '')
    .replace(/<\/?body[^>]*>/gi, '')
    .trim();
}
