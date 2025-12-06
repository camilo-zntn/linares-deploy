'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import Image from 'next/image';

interface DiscountCard {
  discountId: string;
  title: string;
  description: string;
  percent: number;
  minReferrals: number;
  commerceId: string;
  commerceName: string;
  imageUrl?: string;
}

export default function DiscountsPage() {
  const [discounts, setDiscounts] = useState<DiscountCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<DiscountCard | null>(null);

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
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Descuentos</h1>
      {loading ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : discounts.length === 0 ? (
        <div className="text-gray-600">No hay descuentos disponibles por ahora</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {discounts.map(d => (
            <div key={d.discountId} className="bg-white rounded-xl shadow hover:shadow-lg transition cursor-pointer" onClick={() => setSelected(d)}>
              <div className="relative h-40">
                {d.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={d.imageUrl.startsWith('http') ? d.imageUrl : `${process.env.NEXT_PUBLIC_API_URL}${d.imageUrl}`} alt={d.commerceName} className="w-full h-full object-cover rounded-t-xl" />
                ) : (
                  <div className="w-full h-full bg-emerald-100 rounded-t-xl" />
                )}
                <div className="absolute top-3 left-3 bg-emerald-600 text-white px-3 py-1 rounded-full text-sm font-semibold">-{d.percent}%</div>
              </div>
              <div className="p-4">
                <div className="text-sm text-gray-500">{d.commerceName}</div>
                <div className="text-lg font-semibold text-gray-800">{d.title}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-semibold text-gray-800">{selected.title}</h2>
              <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-md font-medium">-{selected.percent}%</span>
            </div>
            <p className="text-gray-700 mb-4">{selected.description}</p>
            <div className="text-sm text-gray-500">Comercio: {selected.commerceName}</div>
            <div className="text-sm text-gray-500">Requiere al menos {selected.minReferrals} referidos</div>
            <div className="mt-6 flex justify-end">
              <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700" onClick={() => setSelected(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

