'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
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
  googleMapsIframe?: string; // Add this line to fix the TypeScript error
}

export default function CommerceDetailPage() {
  const params = useParams();
  const [commerce, setCommerce] = useState<Commerce | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCommerceDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/commerces/${params.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Error loading commerce details');
      const data = await response.json();
      setCommerce(data.commerce);
    } catch (error) {
      toast.error('Error loading commerce details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommerceDetails();
  }, [params.id]);

  const isBusinessOpen = (schedule: Schedule): boolean => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const today = days[new Date().getDay()];
    const todaySchedule = schedule[today as keyof Schedule];
    
    if (!todaySchedule || todaySchedule.isClosed) return false;
    
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    const [startHour, startMinute] = todaySchedule.start.split(':').map(Number);
    const [endHour, endMinute] = todaySchedule.end.split(':').map(Number);
    
    const currentTotalMinutes = currentHour * 60 + currentMinute;
    const startTotalMinutes = startHour * 60 + startMinute;
    const endTotalMinutes = endHour * 60 + endMinute;
    
    return currentTotalMinutes >= startTotalMinutes && currentTotalMinutes < endTotalMinutes;
  };

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!commerce) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-800">Comercio no encontrado</h1>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="flex items-start gap-8 mb-12">
        <div className="w-48 h-48 flex-shrink-0">
          <img 
            src={commerce.imageUrl.startsWith('http') 
              ? commerce.imageUrl 
              : `http://localhost:5000${commerce.imageUrl}`}
            alt={commerce.name}
            className="w-full h-full object-cover rounded-lg shadow-md"
          />
        </div>
        
        <div className="flex-1 min-w-0">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 break-words">{commerce.name}</h1>
            <div className="mt-2">
              <span className={`text-sm font-medium px-3 py-1 rounded-full inline-block ${
                isBusinessOpen(commerce.schedule) 
                  ? 'bg-green-50 text-green-600' 
                  : 'bg-red-50 text-red-600'
              }`}>
                {isBusinessOpen(commerce.schedule) ? 'Abierto' : 'Cerrado'}
              </span>
            </div>
          </div>
          <p className="mt-4 text-lg text-gray-600 leading-relaxed break-words">{commerce.description}</p>
        </div>
      </div>
  
      <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Sección del Mapa */}
        <div className="rounded-xl p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Ubicacion
          </h2>
          {commerce.googleMapsIframe ? (
            <div 
              className="w-full h-[400px] rounded-lg overflow-hidden shadow-inner"
              dangerouslySetInnerHTML={{ __html: commerce.googleMapsIframe }}
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

        {/* Sección de Horarios */}
        <div className="rounded-xl p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Horarios de atencion
          </h2>
          <div className="space-y-4">
            {Object.entries(commerce.schedule).map(([day, schedule]) => (
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
  );
}