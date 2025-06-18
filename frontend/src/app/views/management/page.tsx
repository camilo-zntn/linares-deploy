'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  googleMapsIframe?: string;
  contact: {
    email: string;
    phone: string;
    website: string;
    socialMedia: {
      facebook: string;
      instagram: string;
      whatsapp: string;
    };
  };
}

export default function ManagementPage() {
  const router = useRouter();
  const [commerce, setCommerce] = useState<Commerce | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyCommerce = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/views/auth/login');
          return;
        }

        const response = await fetch('http://localhost:5000/api/commerces/my-commerce', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) throw new Error('Error cargando datos del comercio');
        
        const data = await response.json();
        setCommerce(data.commerce);
      } catch (error) {
        toast.error('Error cargando datos del comercio');
      } finally {
        setLoading(false);
      }
    };

    fetchMyCommerce();
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-gray-900"></div>
    </div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Editar Datos de Mi Comercio</h1>
      
      {commerce ? (
        <div className="bg-white rounded-lg shadow-lg p-6">
          {/* Aquí irán los formularios para editar los datos */}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-600">No tienes un comercio asignado.</p>
        </div>
      )}
    </div>
  );
}