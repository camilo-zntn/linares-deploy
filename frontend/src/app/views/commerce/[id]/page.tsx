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
  
      <div className="mt-12">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">Horarios de atencion</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 max-w-4xl">
          {Object.entries(commerce.schedule).map(([day, schedule]) => (
            <div key={day} className="flex items-center justify-between py-3 border-b border-gray-100">
              <span className="text-lg font-medium text-gray-700">
                {day === 'monday' ? 'Lunes' :
                 day === 'tuesday' ? 'Martes' :
                 day === 'wednesday' ? 'Miercoles' :
                 day === 'thursday' ? 'Jueves' :
                 day === 'friday' ? 'Viernes' :
                 day === 'saturday' ? 'Sabado' : 'Domingo'}
              </span>
              <span className={`text-lg ${schedule.isClosed ? 'text-red-500 font-medium' : 'text-gray-600'}`}>
                {schedule.isClosed ? 'Cerrado' : `${schedule.start} - ${schedule.end}`}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}