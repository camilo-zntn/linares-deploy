'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Pencil, Trash2 } from 'lucide-react';
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

export default function CommercePage() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [commerces, setCommerces] = useState<Commerce[]>([]);
  const [categories, setCategories] = useState<{ _id: string; name: string; }[]>([]); // Add this line
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    imageUrl: '',
    imageFile: null as File | null,
    category: '',  // Add this
    schedule: {
      monday: { start: '09:00', end: '18:00', isClosed: false },
      tuesday: { start: '09:00', end: '18:00', isClosed: false },
      wednesday: { start: '09:00', end: '18:00', isClosed: false },
      thursday: { start: '09:00', end: '18:00', isClosed: false },
      friday: { start: '09:00', end: '18:00', isClosed: false },
      saturday: { start: '09:00', end: '14:00', isClosed: false },
      sunday: { start: '09:00', end: '18:00', isClosed: true }
    }
  });

  const isBusinessOpen = (schedule: Schedule): boolean => {
    try {
      if (!schedule) return false;
      
      const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const today = days[new Date().getDay()];
      const todaySchedule = schedule[today as keyof Schedule];
  
      if (!todaySchedule || todaySchedule.isClosed) return false;
  
      const currentTime = new Date();
      const currentHour = currentTime.getHours();
      const currentMinute = currentTime.getMinutes();
  
      const [startHour, startMinute] = todaySchedule.start.split(':').map(Number);
      const [endHour, endMinute] = todaySchedule.end.split(':').map(Number);
  
      const currentTotalMinutes = currentHour * 60 + currentMinute;
      const startTotalMinutes = startHour * 60 + startMinute;
      const endTotalMinutes = endHour * 60 + endMinute;
  
      return currentTotalMinutes >= startTotalMinutes && currentTotalMinutes < endTotalMinutes;
    } catch (error) {
      console.error('Error checking business hours:', error);
      return false;
    }
  };

  const fetchCommerces = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/views/auth/login');
        return;
      }

      const response = await fetch('http://localhost:5000/api/commerces', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Error loading commerces');
      
      const data = await response.json();
      setCommerces(data.commerces.map((commerce: any) => ({
        ...commerce,
        schedule: typeof commerce.schedule === 'string' ? JSON.parse(commerce.schedule) : commerce.schedule
      })));
    } catch (error) {
      toast.error('Error loading commerces');
    }
  };

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/categories', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Error loading categories');
      const data = await response.json();
      setCategories(data.categories);
    } catch (error) {
      toast.error('Error loading categories');
    }
  };

  useEffect(() => {
    fetchCommerces();
    fetchCategories(); // Add this line
    const interval = setInterval(fetchCommerces, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/views/auth/login');
        return;
      }

      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('schedule', JSON.stringify(formData.schedule));
      formDataToSend.append('category', formData.category);  // Add this
      if (formData.imageFile) {
        formDataToSend.append('image', formData.imageFile);
      }

      const url = editingId 
        ? `http://localhost:5000/api/commerces/${editingId}`
        : 'http://localhost:5000/api/commerces';

      const response = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      });

      if (!response.ok) throw new Error('Error processing commerce');
      
      toast.success(editingId ? 'Comercio actualizado' : 'Comercio creado');
      setIsModalOpen(false);
      setFormData({
        name: '',
        description: '',
        imageUrl: '',
        imageFile: null,
        category: '',  
        schedule: {
          monday: { start: '09:00', end: '18:00', isClosed: false },
          tuesday: { start: '09:00', end: '18:00', isClosed: false },
          wednesday: { start: '09:00', end: '18:00', isClosed: false },
          thursday: { start: '09:00', end: '18:00', isClosed: false },
          friday: { start: '09:00', end: '18:00', isClosed: false },
          saturday: { start: '09:00', end: '14:00', isClosed: false },
          sunday: { start: '09:00', end: '18:00', isClosed: true }
        }
      });
      setEditingId(null);
      fetchCommerces();
    } catch (error) {
      toast.error('Error al procesar el comercio');
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Gestionar Comercios</h1>
        <button
          onClick={() => {
            setEditingId(null);
            setFormData({
              name: '',
              description: '',
              imageUrl: '',
              imageFile: null,
              category: '', 
              schedule: {
                monday: { start: '09:00', end: '18:00', isClosed: false },
                tuesday: { start: '09:00', end: '18:00', isClosed: false },
                wednesday: { start: '09:00', end: '18:00', isClosed: false },
                thursday: { start: '09:00', end: '18:00', isClosed: false },
                friday: { start: '09:00', end: '18:00', isClosed: false },
                saturday: { start: '09:00', end: '14:00', isClosed: false },
                sunday: { start: '09:00', end: '18:00', isClosed: true }
              }
            });
            setIsModalOpen(true);
          }}
          className="flex items-center px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Crear Comercio
        </button>
      </div>

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
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.onerror = null;
                  target.src = '/images/default-store.jpg';
                }}
              />
              <div className="absolute inset-0 bg-black/20" />
              <div 
                className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium ${
                  isBusinessOpen(commerce.schedule)
                    ? 'bg-green-500/90 text-white'
                    : 'bg-red-500/90 text-white'
                }`}
              >
                {isBusinessOpen(commerce.schedule) ? 'Abierto' : 'Cerrado'}
              </div>
            </div>
            <div className="p-4 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-800 mt-1">{commerce.name}</h3>
                  {(() => {
                    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
                    const today = days[new Date().getDay()];
                    const todaySchedule = commerce.schedule[today as keyof Schedule];
                    return (
                      <span className="text-sm text-gray-500">
                        {todaySchedule.isClosed ? 'Cerrado hoy' : `${todaySchedule.start} - ${todaySchedule.end}`}
                      </span>
                    );
                  })()}
                </div>
                <div className="flex justify-between items-start mt-2">
                  <p className="text-sm text-gray-600 line-clamp-2 flex-1">{commerce.description}</p>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => {
                        const parsedSchedule = typeof commerce.schedule === 'string' 
                          ? JSON.parse(commerce.schedule) 
                          : commerce.schedule;
                        setFormData({
                          name: commerce.name,
                          description: commerce.description,
                          imageUrl: commerce.imageUrl,
                          imageFile: null,
                          category: commerce.category._id,  // Add this
                          schedule: parsedSchedule
                        });
                        setEditingId(commerce._id);
                        setIsModalOpen(true);
                      }}
                      className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={async () => {
                        if (!confirm('¿Estás seguro de que quieres eliminar este comercio?')) return;
                        try {
                          const token = localStorage.getItem('token');
                          const response = await fetch(`http://localhost:5000/api/commerces/${commerce._id}`, {
                            method: 'DELETE',
                            headers: {
                              'Authorization': `Bearer ${token}`
                            }
                          });
                          if (!response.ok) throw new Error('Error deleting commerce');
                          toast.success('Comercio eliminado');
                          fetchCommerces();
                        } catch (error) {
                          toast.error('Error al eliminar el comercio');
                        }
                      }}
                      className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">
              {editingId ? 'Editar Comercio' : 'Crear Nuevo Comercio'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2 border rounded-md"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripcion
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-2 border rounded-md"
                  rows={3}
                  required
                />
              </div>

              <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoria
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full p-2 border rounded-md"
                  required
                >
                  <option value="">Seleccionar categoría</option>
                  {categories.map((category) => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Imagen
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      stroke="currentColor"
                      fill="none"
                      viewBox="0 0 48 48"
                      aria-hidden="true"
                    >
                      <path
                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="file-upload"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-emerald-600 hover:text-emerald-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-emerald-500"
                      >
                        <span>Subir imagen</span>
                        <input
                          id="file-upload"
                          name="file-upload"
                          type="file"
                          className="sr-only"
                          accept="image/webp,image/jpeg,image/png"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setFormData({ ...formData, imageFile: file });
                            }
                          }}
                          required={!editingId}
                        />
                      </label>
                      <p className="pl-1">o arrastra y suelta</p>
                    </div>
                    <p className="text-xs text-gray-500">PNG, JPG, WEBP hasta 10MB</p>
                    {formData.imageFile && (
                      <p className="text-sm text-emerald-600">
                        Archivo seleccionado: {formData.imageFile.name}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Horarios
                </label>
                {[
                  ['Lunes', 'monday'],
                  ['Martes', 'tuesday'],
                  ['Miércoles', 'wednesday'],
                  ['Jueves', 'thursday'],
                  ['Viernes', 'friday'],
                  ['Sábado', 'saturday'],
                  ['Domingo', 'sunday']
                ].map(([label, day]) => (
                  <div key={day} className="flex items-center gap-3">
                    <span className="w-24 text-sm font-medium">{label}</span>
                    <div className="flex-1 grid grid-cols-3 gap-2">
                      <input
                        type="time"
                        value={formData.schedule[day as keyof Schedule].start}
                        onChange={(e) => setFormData({
                          ...formData,
                          schedule: {
                            ...formData.schedule,
                            [day]: { ...formData.schedule[day as keyof Schedule], start: e.target.value }
                          }
                        })}
                        className="p-2 border rounded-md"
                        disabled={formData.schedule[day as keyof Schedule].isClosed}
                      />
                      <input
                        type="time"
                        value={formData.schedule[day as keyof Schedule].end}
                        onChange={(e) => setFormData({
                          ...formData,
                          schedule: {
                            ...formData.schedule,
                            [day]: { ...formData.schedule[day as keyof Schedule], end: e.target.value }
                          }
                        })}
                        className="p-2 border rounded-md"
                        disabled={formData.schedule[day as keyof Schedule].isClosed}
                      />
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formData.schedule[day as keyof Schedule].isClosed}
                          onChange={(e) => setFormData({
                            ...formData,
                            schedule: {
                              ...formData.schedule,
                              [day]: { ...formData.schedule[day as keyof Schedule], isClosed: e.target.checked }
                            }
                          })}
                          className="rounded text-emerald-500"
                        />
                        <span className="text-sm">Cerrado</span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
                >
                  {editingId ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
