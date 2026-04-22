'use client';

import { Store } from 'lucide-react';
import { API_BASE_URL } from '@/config/api';

interface DiscountCardProps {
  data: {
    title: string;
    description?: string;
    percent: number;
    minReferrals: number;
    active?: boolean;
    daysOfWeek?: string[];
    commerceName?: string;
    imageUrl?: string;
  };
  daysMap?: { [key: string]: string };
}

const DEFAULT_DAYS_MAP: { [key: string]: string } = {
  'monday': 'Lun', 'tuesday': 'Mar', 'wednesday': 'Mié', 'thursday': 'Jue',
  'friday': 'Vie', 'saturday': 'Sáb', 'sunday': 'Dom'
};

export default function DiscountCard({ data, daysMap = DEFAULT_DAYS_MAP }: DiscountCardProps) {
  // Normalizar la URL de la imagen si es necesario
  const getImageUrl = (url?: string) => {
    if (!url) return undefined;
    if (url.startsWith('http')) return url;
    return `${API_BASE_URL}${url}`;
  };

  const bgImage = getImageUrl(data.imageUrl);

  return (
    <div className="relative w-full overflow-hidden rounded-2xl shadow-lg aspect-[1.8/1] group transition-transform hover:scale-[1.02]">
      {/* Fondo con Imagen del Comercio */}
      {bgImage ? (
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${bgImage})` }}
        />
      ) : (
        <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
          <Store className="w-12 h-12 text-gray-400" />
        </div>
      )}
      
      {/* Overlay Gradiente Verde */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/90 to-teal-800/90" />

      {/* Contenido */}
      <div className="relative z-10 h-full p-6 flex flex-col justify-between text-white">
        <div className="flex justify-between items-start">
          <div className="flex flex-col">
            {/* Badge de Estado solo si active está definido (contexto merchant) */}
            {typeof data.active !== 'undefined' && (
              <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold self-start mb-2">
                {data.active ? 'Disponible' : 'No disponible'}
              </div>
            )}
            {/* Nombre del Comercio */}
            {data.commerceName && (
              <span className="text-xs font-medium text-emerald-100 opacity-90 mb-1">
                {data.commerceName}
              </span>
            )}
          </div>
          <div className="text-4xl font-bold tracking-tight">
            -{data.percent}%
          </div>
        </div>
        
        <div>
          <h3 className="text-xl font-bold mb-2 line-clamp-1 leading-tight text-shadow-sm">
            {data.title || 'Título del descuento'}
          </h3>
          
          <p className="text-emerald-50 text-sm mb-4 line-clamp-2 leading-relaxed opacity-90 min-h-[2.5em]">
            {data.description || ' '}
          </p>
          
          <div className="flex flex-wrap gap-2 text-xs font-medium text-emerald-50">
            {/* Solo mostrar referidos si es mayor a 0 */}
            {data.minReferrals > 0 && (
              <div className="bg-black/20 px-2 py-1 rounded backdrop-blur-sm">
                Ref: {data.minReferrals}
              </div>
            )}
            <div className="bg-black/20 px-2 py-1 rounded backdrop-blur-sm">
              {(data.daysOfWeek && data.daysOfWeek.length > 0)
                ? data.daysOfWeek.map(d => daysMap[d] || d).join(', ') 
                : 'Todos los días'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
