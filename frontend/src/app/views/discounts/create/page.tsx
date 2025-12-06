'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { Pencil, Trash2, Ticket, Info, Percent } from 'lucide-react';
import { toast } from 'react-hot-toast';
import DiscountCard from '@/components/DiscountCard';

interface MyDiscount {
  _id: string;
  title: string;
  description: string;
  percent: number;
  minReferrals: number;
  active: boolean;
  createdAt: string;
  daysOfWeek?: string[];
  targetRut?: string;
}

interface CommerceData {
  _id: string;
  name: string;
  imageUrl?: string;
}

export default function CreateDiscountPage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [percent, setPercent] = useState(10);
  const [minReferrals, setMinReferrals] = useState(0);
  const [active, setActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState<MyDiscount[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [daysOfWeek, setDaysOfWeek] = useState<string[]>([]);
  const [targetRut, setTargetRut] = useState('');
  const [commerce, setCommerce] = useState<CommerceData | null>(null);

  const fetchMy = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await axios.get('/api/discounts/my', { headers: { Authorization: `Bearer ${token}` } });
      setList(res.data.discounts || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchCommerce = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await axios.get('/api/commerces/my-commerce', { headers: { Authorization: `Bearer ${token}` } });
      setCommerce(res.data.commerce);
    } catch (e) {
      console.error('Error fetching commerce:', e);
    }
  };

  useEffect(() => { 
    fetchMy(); 
    fetchCommerce();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) return;

      const payload = { 
        title, 
        description, 
        percent, 
        minReferrals, 
        active, 
        daysOfWeek,
        targetRut: targetRut || undefined 
      };

      if (editId) {
        await axios.put(`/api/discounts/${editId}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Descuento actualizado');
      } else {
        await axios.post('/api/discounts', payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Descuento creado');
      }
      
      resetForm();
      fetchMy();
    } catch (e) {
      toast.error('Error al guardar el descuento');
    } finally {
      setLoading(false);
    }
  };

  const deleteDiscount = async (id: string) => {
    if (!confirm('¿Estas seguro de eliminar este descuento?')) return;
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      await axios.delete(`/api/discounts/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Descuento eliminado');
      fetchMy();
    } catch (e) {
      toast.error('Error al eliminar');
    }
  };

  const startEdit = (d: MyDiscount) => {
    setEditId(d._id);
    setTitle(d.title);
    setDescription(d.description);
    setPercent(d.percent);
    setMinReferrals(d.minReferrals);
    setActive(d.active);
    setDaysOfWeek(d.daysOfWeek || []);
    setTargetRut(d.targetRut || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPercent(10);
    setMinReferrals(0);
    setActive(true);
    setEditId(null);
    setDaysOfWeek([]);
    setTargetRut('');
  };

  const toggleDay = (day: string) => {
    setDaysOfWeek(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const daysMap: { [key: string]: string } = {
    'monday': 'Lun', 'tuesday': 'Mar', 'wednesday': 'Mie', 'thursday': 'Jue',
    'friday': 'Vie', 'saturday': 'Sab', 'sunday': 'Dom'
  };

  const orderedDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <Ticket className="w-8 h-8 text-emerald-600" />
        Gestion de Descuentos
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Formulario */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              {editId ? 'Editar Descuento' : 'Crear Nuevo Descuento'}
            </h2>
            
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titulo del cupon</label>
                <input 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all" 
                  placeholder="Ej: 20% OFF en toda la tienda" 
                  required 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripcion <span className="text-gray-400 font-normal">(Opcional)</span></label>
                <textarea 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all" 
                  rows={3} 
                  placeholder="Detalles y condiciones del descuento..." 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">RUT de usuario especifico <span className="text-gray-400 font-normal">(Opcional)</span></label>
                <input 
                  value={targetRut} 
                  onChange={(e) => {
                    const val = e.target.value;
                    setTargetRut(val);
                    if (val) setMinReferrals(0);
                  }} 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all" 
                  placeholder="Ej: 12345678-9 (Para asignar a un usuario)" 
                />
                <p className="text-xs text-gray-500 mt-1">Si se completa, solo este usuario podra ver el descuento.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Porcentaje (%)</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      min={1} 
                      max={100} 
                      value={percent} 
                      onChange={(e) => setPercent(Number(e.target.value))} 
                      className="w-full border border-gray-300 rounded-lg pl-3 pr-8 py-2 focus:ring-2 focus:ring-emerald-500 outline-none" 
                    />
                    <Percent className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min. Referidos</label>
                  <input 
                    type="number" 
                    min={0} 
                    value={minReferrals} 
                    onChange={(e) => setMinReferrals(Number(e.target.value))} 
                    disabled={!!targetRut}
                    className={`w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 outline-none ${targetRut ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : ''}`}
                  />
                  {targetRut && <p className="text-xs text-emerald-600 mt-1">Desactivado por RUT especifico</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Dias validos</label>
                <div className="flex flex-wrap gap-2">
                  {orderedDays.map(day => (
                    <button
                      type="button"
                      key={day}
                      onClick={() => toggleDay(day)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        daysOfWeek.includes(day)
                          ? 'bg-emerald-100 text-emerald-700 border-emerald-200 border'
                          : 'bg-gray-50 text-gray-600 border-gray-200 border hover:bg-gray-100'
                      }`}
                    >
                      {daysMap[day]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button 
                  type="button" 
                  onClick={() => setActive(!active)} 
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${active ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                  {active ? 'Estado: Activo' : 'Estado: Inactivo'}
                </button>

                <div className="flex items-center gap-2">
                  {editId && (
                    <button 
                      type="button" 
                      onClick={resetForm} 
                      className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors"
                    >
                      Cancelar
                    </button>
                  )}
                  <button 
                    type="submit" 
                    disabled={loading} 
                    className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium shadow-sm transition-all hover:shadow-md"
                  >
                    {loading ? 'Guardando...' : (editId ? 'Actualizar Cupon' : 'Crear Cupon')}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Vista Previa */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-6">
            <div className="flex items-center gap-2 mb-4 text-emerald-800">
              <Info className="w-5 h-5" />
              <h2 className="text-lg font-semibold">Vista Previa</h2>
            </div>
            
            <div className="max-w-sm mx-auto">
              <DiscountCard 
                data={{ 
                  title, 
                  description, 
                  percent, 
                  minReferrals, 
                  active, 
                  daysOfWeek,
                  commerceName: commerce?.name,
                  imageUrl: commerce?.imageUrl
                }} 
              />
            </div>

            <p className="text-xs text-gray-500 mt-4 text-center">
              Asi es como los usuarios veran tu cupon en la aplicacion.
            </p>
          </div>
        </div>
      </div>

      {/* Lista de Descuentos */}
      <div className="mt-12">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Mis Descuentos Activos</h2>
        
        {list.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
            <Ticket className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No has creado descuentos todavia</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {list.map((item) => (
              <div key={item._id} className="flex flex-col bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all">
                {/* Tarjeta Visual */}
                <div className="p-4 pb-0">
                  <DiscountCard 
                    data={{
                      ...item,
                      commerceName: commerce?.name,
                      imageUrl: commerce?.imageUrl
                    }} 
                  />
                </div>

                {/* Acciones */}
                <div className="p-4 flex gap-2">
                  <button 
                    onClick={() => startEdit(item)}
                    className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                    Editar
                  </button>
                  <button 
                    onClick={() => deleteDiscount(item._id)}
                    className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
