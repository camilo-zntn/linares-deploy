'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { Facebook, Instagram, MessageCircle, Mail, Phone, Globe, MapPin, Clock } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { createAnalyticsView, trackSocialClick, trackContactClick, trackMapClick } from '../../../../lib/analytics';
import TestTimer from '../../../../components/TestTimer/page';

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

interface SocialMedia {
  facebook?: string;
  instagram?: string;
  whatsapp?: string;
}

interface Contact {
  email?: string;
  phone?: string;
  website?: string;
  socialMedia?: SocialMedia;
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
  contact?: Contact;
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

  useEffect(() => {
    if (commerce) {
      const { init, cleanup } = createAnalyticsView({
        commerceId: commerce._id,
        path: `/views/commerce/${commerce._id}`,
      });
      init();
      return () => cleanup();
    }
  }, [commerce]);

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
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!commerce) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">No se encontro el comercio</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
      <TestTimer label={`Comercio: ${commerce.name}`} />
      <div className="rounded-lg overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
          {/* Columna Izquierda - Imagen y Detalles Principales */}
          <div className="p-3 sm:p-6">
            <div className="relative aspect-square sm:aspect-video mb-4 sm:mb-6">
                <img 
                  src={commerce.imageUrl.startsWith('http') 
                    ? commerce.imageUrl 
                    : `http://localhost:5000${commerce.imageUrl}`}
                  alt={commerce.name}
                  className="w-full h-full object-cover rounded-lg sm:rounded-xl"
                />
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800">{commerce.name}</h1>
              <span className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium self-start ${isBusinessOpen(commerce.schedule) ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                {isBusinessOpen(commerce.schedule) ? 'Abierto' : 'Cerrado'}
              </span>
            </div>

            <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">{commerce.description}</p>

            {/* Horario */}
            <div className="bg-gray-50 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500" />
                Horario
              </h2>
              <div className="space-y-1 sm:space-y-2">
                {Object.entries(commerce.schedule).map(([day, schedule]) => (
                  <div key={day} className="flex justify-between items-center py-1.5 sm:py-2 px-2 sm:px-3 bg-white rounded text-sm sm:text-base">
                    <span className="capitalize text-gray-700">{day}</span>
                    <span className={schedule.isClosed ? 'text-red-500' : 'text-emerald-600'}>
                      {schedule.isClosed ? 'Cerrado' : `${schedule.start} - ${schedule.end}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Columna Derecha - Contacto y Redes Sociales */}
          <div className="p-3 sm:p-6">
            {/* Informacion de contacto */}
            {(commerce.contact?.email || commerce.contact?.phone || commerce.contact?.website) && (
              <div className="mb-6 sm:mb-8">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3 sm:mb-4">Informacion de contacto</h2>
                <div className="space-y-2 sm:space-y-3">
                  {commerce.contact?.phone && (
                    <a href={`tel:${commerce.contact.phone}`} 
                       onClick={() => trackContactClick('phone')}
                       className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-white rounded-lg hover:bg-emerald-50 transition-colors">
                      <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500 flex-shrink-0" />
                      <span className="text-sm sm:text-base text-gray-700">{commerce.contact.phone}</span>
                    </a>
                  )}
                  {commerce.contact?.email && (
                    <a href={`mailto:${commerce.contact.email}`} 
                       onClick={() => trackContactClick('email')}
                       className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-white rounded-lg hover:bg-emerald-50 transition-colors">
                      <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500 flex-shrink-0" />
                      <span className="text-sm sm:text-base text-gray-700 break-all">{commerce.contact.email}</span>
                    </a>
                  )}
                  {commerce.contact?.website && (
                    <a href={commerce.contact.website} 
                       target="_blank" 
                       rel="noopener noreferrer"
                       onClick={() => trackContactClick('website')}
                       className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-white rounded-lg hover:bg-emerald-50 transition-colors">
                      <Globe className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500 flex-shrink-0" />
                      <span className="text-sm sm:text-base text-gray-700">Sitio web</span>
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Redes Sociales */}
            {(commerce.contact?.socialMedia?.facebook || 
              commerce.contact?.socialMedia?.instagram || 
              commerce.contact?.socialMedia?.whatsapp) && (
              <div className="mb-6 sm:mb-8">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3 sm:mb-4">Redes Sociales</h2>
                <div className="flex gap-3 sm:gap-4">
                  {commerce.contact.socialMedia.facebook && (
                    <a href={commerce.contact.socialMedia.facebook}
                       target="_blank"
                       rel="noopener noreferrer"
                       onClick={() => trackSocialClick('facebook')}
                       className="p-2 sm:p-3 bg-white rounded-lg hover:bg-blue-50 transition-colors"
                       title="Facebook">
                      <Facebook className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                    </a>
                  )}
                  {commerce.contact.socialMedia.instagram && (
                    <a href={commerce.contact.socialMedia.instagram}
                       target="_blank"
                       rel="noopener noreferrer"
                       onClick={() => trackSocialClick('instagram')}
                       className="p-2 sm:p-3 bg-white rounded-lg hover:bg-pink-50 transition-colors"
                       title="Instagram">
                      <Instagram className="h-5 w-5 sm:h-6 sm:w-6 text-pink-600" />
                    </a>
                  )}
                  {commerce.contact.socialMedia.whatsapp && (
                    <a href={`https://wa.me/${commerce.contact.socialMedia.whatsapp}`}
                       target="_blank"
                       rel="noopener noreferrer"
                       onClick={() => trackSocialClick('whatsapp')}
                       className="p-2 sm:p-3 bg-white rounded-lg hover:bg-green-50 transition-colors"
                       title="WhatsApp">
                      <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Sección del Mapa */}
            <div className="rounded-lg sm:rounded-xl p-3 sm:p-6">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-800 mb-4 sm:mb-6 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6 mr-2 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Ubicacion
              </h2>
              {commerce.googleMapsIframe ? (
                <div 
                  className="w-full h-[250px] sm:h-[300px] lg:h-[400px] rounded-lg overflow-hidden shadow-inner"
                  onClick={trackMapClick}
                  dangerouslySetInnerHTML={{ __html: sanitizeMapIframe(commerce.googleMapsIframe) }}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-[250px] sm:h-[300px] lg:h-[400px] bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mb-2 sm:mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 12h.01M12 14h.01M12 16h.01M12 18h.01M12 20h.01M12 22h.01" />
                  </svg>
                  <p className="text-sm sm:text-base text-gray-600 text-center px-4">No hay mapa disponible para este comercio</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function sanitizeMapIframe(html: string) {
  return html
    .replace(/<\/?html[^>]*>/gi, '')
    .replace(/<\/?body[^>]*>/gi, '')
    .trim();
}