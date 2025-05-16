'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

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
}

export default function HomePage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [commerces, setCommerces] = useState<Commerce[]>([]);
  const [selectedCommerce, setSelectedCommerce] = useState<Commerce | null>(null);

  const fetchCategories = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/categories', {
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
      const response = await fetch(`http://localhost:5000/api/categories/${categoryId}/commerces`, {
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

  useEffect(() => {
    fetchCategories();
  }, []);

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
      {!selectedCategory && (
        <>
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Categorías</h1>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {categories.map((category) => (
              <div 
                key={category._id}
                onClick={() => fetchCommercesByCategory(category._id)}
                className="group relative cursor-pointer"
              >
                <div 
                  className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 flex flex-col items-center relative overflow-hidden"
                  style={{ 
                    background: `linear-gradient(135deg, ${category.color}08, white 50%, ${category.color}08)`
                  }}
                >
                  <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: category.color }} />
                  
                  <div className="w-full p-6">
                    <div 
                      className="w-16 h-16 mx-auto flex items-center justify-center mb-4 rounded-2xl"
                      style={{ 
                        backgroundColor: `${category.color}15`,
                        color: category.color,
                        boxShadow: `0 4px 6px -1px ${category.color}15`
                      }}
                      dangerouslySetInnerHTML={{ __html: category.icon }}
                    />
                    
                    <div className="text-center">
                      <h3 className="text-base font-semibold text-gray-800 mb-1">{category.name}</h3>
                    </div>
                  </div>

                  <div 
                    className="w-full py-3 px-4 bg-gray-50 border-t text-xs text-center group-hover:bg-opacity-80 transition-colors"
                    style={{ color: category.color }}
                  >
                    Ver comercios
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {selectedCategory && !selectedCommerce && (
        <>
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => {
                setSelectedCategory(null);
                setCommerces([]);
              }}
              className="text-gray-600 hover:text-gray-800"
            >
              ← Volver a categorías
            </button>
            <h1 className="text-2xl font-bold text-gray-800">
              {categories.find(c => c._id === selectedCategory)?.name}
            </h1>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
            {commerces.map((commerce) => (
              <div 
                key={commerce._id}
                onClick={() => setSelectedCommerce(commerce)}
                className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col cursor-pointer hover:shadow-xl transition-all duration-300"
              >
                <div className="relative h-48">
                  <img 
                    src={commerce.imageUrl.startsWith('http') 
                      ? commerce.imageUrl 
                      : `http://localhost:5000${commerce.imageUrl}`}
                    alt={commerce.name}
                    className="w-full h-full object-cover"
                  />
                  <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium ${
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

          <div className="max-w-5xl mx-auto">
            <div className="flex items-start gap-8 mb-12">
              <div className="w-48 h-48 flex-shrink-0">
                <img 
                  src={selectedCommerce.imageUrl.startsWith('http') 
                    ? selectedCommerce.imageUrl 
                    : `http://localhost:5000${selectedCommerce.imageUrl}`}
                  alt={selectedCommerce.name}
                  className="w-full h-full object-cover rounded-lg shadow-md"
                />
              </div>
              
              <div className="flex-1 min-w-0">
                <div>
                  <h1 className="text-4xl font-bold text-gray-800 break-words">{selectedCommerce.name}</h1>
                  <div className="mt-2">
                    <span className={`text-sm font-medium px-3 py-1 rounded-full inline-block ${
                      isBusinessOpen(selectedCommerce.schedule) 
                        ? 'bg-green-50 text-green-600' 
                        : 'bg-red-50 text-red-600'
                    }`}>
                      {isBusinessOpen(selectedCommerce.schedule) ? 'Abierto' : 'Cerrado'}
                    </span>
                  </div>
                </div>
                <p className="mt-4 text-lg text-gray-600 leading-relaxed break-words">
                  {selectedCommerce.description}
                </p>
              </div>
            </div>

            <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Sección del Mapa */}
              {selectedCommerce.googleMapsIframe && (
                <div className="rounded-xl p-6">
                  <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Ubicacion
                  </h2>
                  <div 
                    className="w-full h-[400px] rounded-lg overflow-hidden shadow-inner"
                    dangerouslySetInnerHTML={{ __html: selectedCommerce.googleMapsIframe }}
                  />
                </div>
              )}

              {/* Sección de Horarios */}
              <div className="rounded-xl p-6">
                <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Horarios de atencion
                </h2>
                <div className="space-y-4">
                  {Object.entries(selectedCommerce.schedule).map(([day, schedule]) => (
                    <div key={day} className="flex items-center justify-between py-3 px-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                      <span className="text-lg font-medium text-gray-700">
                        {day === 'monday' ? 'Lunes' :
                         day === 'tuesday' ? 'Martes' :
                         day === 'wednesday' ? 'Miercoles' :
                         day === 'thursday' ? 'Jueves' :
                         day === 'friday' ? 'Viernes' :
                         day === 'saturday' ? 'Sabado' : 'Domingo'}
                      </span>
                      <span className={`text-lg font-medium px-4 py-1 rounded-full ${
                        schedule.isClosed 
                          ? 'bg-red-100 text-red-600' 
                          : 'bg-emerald-100 text-emerald-600'
                      }`}>
                        {schedule.isClosed ? 'Cerrado' : `${schedule.start} - ${schedule.end}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}