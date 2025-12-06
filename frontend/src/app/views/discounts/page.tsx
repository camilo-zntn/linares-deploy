'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import DiscountCard from '@/components/DiscountCard';

interface Discount {
  discountId: string;
  title: string;
  description: string;
  percent: number;
  minReferrals: number;
  commerceId: string;
  commerceName: string;
  imageUrl?: string;
  daysOfWeek?: string[];
}

export default function DiscountsPage() {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Discount | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await axios.get('/api/discounts/available', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setDiscounts(res.data.discounts || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Descuentos Disponibles</h1>
      
      {loading ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : discounts.length === 0 ? (
        <div className="text-gray-600 text-center py-12">No hay descuentos disponibles por ahora</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {discounts.map(d => (
            <div 
              key={d.discountId} 
              className="cursor-pointer transition-transform hover:-translate-y-1"
              onClick={() => setSelected(d)}
            >
              <DiscountCard 
                data={{
                  ...d,
                  active: undefined // No mostrar "Disponible" badge en vista de usuario, es redundante
                }} 
              />
            </div>
          ))}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            {/* Usar la misma tarjeta en el modal para consistencia visual */}
            <div className="mb-6">
              <DiscountCard data={selected} />
            </div>
            
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800">Detalles del Cupón</h2>
              <p className="text-gray-700">{selected.description}</p>
              
              <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Comercio:</span>
                  <span className="font-medium text-gray-900">{selected.commerceName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Descuento:</span>
                  <span className="font-medium text-emerald-600">-{selected.percent}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Referidos requeridos:</span>
                  <span className="font-medium text-gray-900">{selected.minReferrals}</span>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button 
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium transition-colors" 
                  onClick={() => setSelected(null)}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
