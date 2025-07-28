'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { Clock, Heart, HeartOff } from 'lucide-react';

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

export default function SavedPage() {
  const router = useRouter();
  const [favoriteCommerces, setFavoriteCommerces] = useState<Commerce[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFavoriteCommerces = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/views/auth/login');
        return;
      }

      const response = await fetch('http://localhost:5000/api/users/favorites', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Error cargando favoritos');
      const data = await response.json();
      setFavoriteCommerces(data.favoriteCommerces);
    } catch (error) {
      toast.error('Error al cargar comercios favoritos');
    } finally {
      setLoading(false);
    }
  };

  const removeFromFavorites = async (commerceId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/users/favorites/${commerceId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Error removiendo de favoritos');
      
      // Actualizar la lista local
      setFavoriteCommerces(prev => prev.filter(commerce => commerce._id !== commerceId));
      toast.success('Comercio removido de favoritos');
    } catch (error) {
      toast.error('Error al remover de favoritos');
    }
  };

  const isBusinessOpen = (schedule: Schedule): boolean => {
    const now = new Date();
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const currentDay = days[now.getDay()] as keyof Schedule;
    const currentTime = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
    
    const daySchedule = schedule[currentDay];
    if (daySchedule.isClosed) return false;
    
    return currentTime >= daySchedule.start && currentTime <= daySchedule.end;
  };

  useEffect(() => {
    fetchFavoriteCommerces();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <Heart className="h-8 w-8 text-red-500" />
        <h1 className="text-2xl font-bold text-gray-800">Comercios Guardados</h1>
      </div>

      {favoriteCommerces.length === 0 ? (
        <div className="text-center py-12">
          <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">No tienes comercios guardados</h3>
          <p className="text-gray-500 mb-6">Explora comercios y guarda tus favoritos haciendo clic en el corazon</p>
          <button
            onClick={() => router.push('/views/home')}
            className="px-6 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
          >
            Explorar Comercios
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
          {favoriteCommerces.map((commerce) => (
            <div 
              key={commerce._id}
              className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col relative group"
            >
              {/* Botón de remover favorito */}
              <button
                onClick={() => removeFromFavorites(commerce._id)}
                className="absolute top-2 right-2 z-10 p-2 bg-white/90 rounded-full shadow-md hover:bg-white transition-all duration-200 group-hover:scale-110"
              >
                <Heart className="h-5 w-5 text-red-500 fill-current" />
              </button>

              <div 
                onClick={() => router.push(`/views/commerce/${commerce._id}`)}
                className="cursor-pointer flex-1"
              >
                <div className="relative h-48">
                  <img 
                    src={commerce.imageUrl.startsWith('http') 
                      ? commerce.imageUrl 
                      : `http://localhost:5000${commerce.imageUrl}`}
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
                  <p className="text-xs text-emerald-600 mt-2 font-medium">{commerce.category.name}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}