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

export default function CategoryCommercePage() {
  const params = useParams();
  const [commerces, setCommerces] = useState<Commerce[]>([]);
  const [categoryName, setCategoryName] = useState('');

  const fetchCategoryCommerces = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/categories/${params.id}/commerces`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Error loading category commerces');
      const data = await response.json();
      setCommerces(data.commerces);
      setCategoryName(data.category.name);
    } catch (error) {
      toast.error('Error loading category commerces');
    }
  };

  useEffect(() => {
    fetchCategoryCommerces();
  }, [params.id]);

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
      <h1 className="text-2xl font-bold text-gray-800 mb-6">{categoryName}</h1>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
        {commerces.map((commerce) => (
          <div 
            key={commerce._id}
            className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col"
          >
            <div className="relative h-48">
              <img 
                src={commerce.imageUrl.startsWith('http') 
                  ? commerce.imageUrl 
                  : `http://localhost:5000${commerce.imageUrl}`}
                alt={commerce.name}
                className="w-full h-full object-cover"
              />
              <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs ${
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
    </div>
  );
}