'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

interface MyDiscount {
  _id: string;
  title: string;
  description: string;
  percent: number;
  minReferrals: number;
  active: boolean;
  createdAt: string;
}

export default function CreateDiscountPage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [percent, setPercent] = useState(10);
  const [minReferrals, setMinReferrals] = useState(0);
  const [active, setActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState<MyDiscount[]>([]);

  const fetchMy = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await axios.get('/api/discounts/my', { headers: { Authorization: `Bearer ${token}` } });
      setList(res.data.discounts || []);
    } catch (e) {}
  };

  useEffect(() => { fetchMy(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) return;
      await axios.post('/api/discounts', { title, description, percent, minReferrals, active }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Descuento creado');
      setTitle(''); setDescription(''); setPercent(10); setMinReferrals(0); setActive(true);
      fetchMy();
    } catch (e) {
      toast.error('Error al crear');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Crear descuento</h1>
      <form onSubmit={submit} className="bg-white rounded-xl p-6 shadow space-y-4 max-w-xl">
        <div>
          <label className="block text-sm text-gray-700 mb-1">Titulo</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full border rounded-lg px-3 py-2" placeholder="Ej: Descuento en hamburguesa" required />
        </div>
        <div>
          <label className="block text-sm text-gray-700 mb-1">Descripcion</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full border rounded-lg px-3 py-2" rows={4} placeholder="Detalle del descuento" required />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Porcentaje</label>
            <input type="number" min={1} max={100} value={percent} onChange={(e) => setPercent(Number(e.target.value))} className="w-full border rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Min Referidos</label>
            <input type="number" min={0} value={minReferrals} onChange={(e) => setMinReferrals(Number(e.target.value))} className="w-full border rounded-lg px-3 py-2" />
          </div>
          <div className="flex items-center gap-2">
            <input id="active" type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
            <label htmlFor="active" className="text-sm text-gray-700">Activo</label>
          </div>
        </div>
        <button type="submit" disabled={loading} className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">{loading ? 'Creando...' : 'Crear'}</button>
      </form>

      <div className="mt-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-3">Mis descuentos</h2>
        {list.length === 0 ? (
          <div className="text-gray-600">Sin descuentos</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {list.map(d => (
              <div key={d._id} className="bg-white rounded-xl shadow p-4">
                <div className="flex items-center justify-between">
                  <div className="text-lg font-semibold text-gray-800">{d.title}</div>
                  <div className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-md font-medium">-{d.percent}%</div>
                </div>
                <p className="text-gray-700 mt-2 text-sm">{d.description}</p>
                <div className="text-sm text-gray-500 mt-2">Min referidos: {d.minReferrals}</div>
                <div className="text-sm text-gray-500">Estado: {d.active ? 'Activo' : 'Inactivo'}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

