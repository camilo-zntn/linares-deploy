'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Pencil, Trash2, Facebook, Instagram, MessageCircle, Mail, Phone, Globe } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import { API_BASE_URL } from '@/config/api';

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

export default function CommercePage() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [commerceToDelete, setCommerceToDelete] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [commerces, setCommerces] = useState<Commerce[]>([]);
  const [categories, setCategories] = useState<{ _id: string; name: string; }[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    imageUrl: '',
    imageFile: null as File | null,
    category: '',
    googleMapsIframe: '',
    contact: {
      email: '',
      phone: '',
      website: '',
      socialMedia: {
        facebook: '',
        instagram: '',
        whatsapp: ''
      }
    },
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

      const response = await fetch(`${API_BASE_URL}/api/commerces`, {
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
      const response = await fetch(`${API_BASE_URL}/api/categories`, {
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
    fetchCategories();
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
      formDataToSend.append('category', formData.category);
      formDataToSend.append('googleMapsIframe', formData.googleMapsIframe);
      formDataToSend.append('contact', JSON.stringify(formData.contact));

      if (formData.imageFile) {
        formDataToSend.append('image', formData.imageFile);
      }

      const url = editingId 
        ? `${API_BASE_URL}/api/commerces/${editingId}`
        : `${API_BASE_URL}/api/commerces`;

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
        googleMapsIframe: '',
        contact: {
          email: '',
          phone: '',
          website: '',
          socialMedia: {
            facebook: '',
            instagram: '',
            whatsapp: ''
          }
        },
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

  const handleDeleteCommerce = async () => {
    if (!commerceToDelete) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/commerces/${commerceToDelete}`, {
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
    } finally {
      setIsDeleteModalOpen(false);
      setCommerceToDelete(null);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Comercios</h1>
        <button
          onClick={() => {
            setEditingId(null);
            setFormData({
              name: '',
              description: '',
              imageUrl: '',
              imageFile: null,
              category: '',
              googleMapsIframe: '',
              contact: {
                email: '',
                phone: '',
                website: '',
                socialMedia: {
                  facebook: '',
                  instagram: '',
                  whatsapp: ''
                }
              },
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
          className="flex items-center px-2 py-1.5 sm:px-4 sm:py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors text-sm sm:text-base"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
          <span className="sm:hidden">Crear</span>
          <span className="hidden sm:inline">Crear</span>
        </button>
      </div>
  
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6">
        {commerces.map((commerce) => (
          <div 
            key={commerce._id}
            className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col"
          >
            <Link 
              href={`/views/commerce/${commerce._id}`}
              className="flex-1 cursor-pointer hover:opacity-90"
            >
              <div className="relative h-32 sm:h-48">
                <img 
                  src={commerce.imageUrl.startsWith('http') 
                    ? commerce.imageUrl 
                    : `${API_BASE_URL}${commerce.imageUrl}`}
                  alt={commerce.name}
                  className="w-full h-full object-cover"
                />
                <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium ${
                  isBusinessOpen(commerce.schedule) ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                }`}>
                  {isBusinessOpen(commerce.schedule) ? 'Abierto' : 'Cerrado'}
                </div>
              </div>
              <div className="p-3 sm:p-4">
                <h3 className="text-sm sm:text-lg font-semibold text-gray-800">{commerce.name}</h3>
                <p className="text-xs sm:text-sm text-gray-600 mt-1 sm:mt-2 line-clamp-2">{commerce.description}</p>
              </div>
            </Link>
            <div className="flex justify-end gap-1 sm:gap-2 p-3 sm:p-4 pt-0">
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
                    category: commerce.category._id,
                    googleMapsIframe: commerce.googleMapsIframe || '',
                    contact: commerce.contact || {
                      email: '',
                      phone: '',
                      website: '',
                      socialMedia: {
                        facebook: '',
                        instagram: '',
                        whatsapp: ''
                      }
                    },
                    schedule: parsedSchedule
                  });
                  setEditingId(commerce._id);
                  setIsModalOpen(true);
                }}
                className="p-1 sm:p-2 md:p-2.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
              >
                <Pencil className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />
              </button>
              <button
                onClick={() => {
                  setCommerceToDelete(commerce._id);
                  setIsDeleteModalOpen(true);
                }}
                className="p-1 sm:p-2 md:p-2.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
              >
                <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de confirmación de eliminación */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Confirmar eliminación
              </h3>
              <p className="text-gray-600 mb-6">
                ¿Estás seguro de que quieres eliminar este comercio? Esta acción no se puede deshacer.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setCommerceToDelete(null);
                  }}
                  className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteCommerce}
                  className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">
                {editingId ? 'Editar Comercio' : 'Crear Nuevo Comercio'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Primera Columna - Información básica, contacto y mapa */}
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nombre
                        </label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Categoria
                        </label>
                        <select
                          value={formData.category}
                          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                          required
                        >
                          <option value="">Seleccionar categoria</option>
                          {categories.map((category) => (
                            <option key={category._id} value={category._id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    {/* Información de Contacto */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-gray-700">Información de Contacto</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Correo Electrónico
                          </label>
                          <div className="relative">
                            <input
                              type="email"
                              value={formData.contact.email}
                              onChange={(e) => setFormData({
                                ...formData,
                                contact: { ...formData.contact, email: e.target.value }
                              })}
                              className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                              placeholder="correo@ejemplo.com"
                            />
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                              <Mail className="w-5 h-5" />
                            </span>
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Teléfono
                          </label>
                          <div className="relative">
                            <input
                              type="tel"
                              value={formData.contact.phone}
                              onChange={(e) => setFormData({
                                ...formData,
                                contact: { ...formData.contact, phone: e.target.value }
                              })}
                              className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                              placeholder="(123) 456-7890"
                            />
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                              <Phone className="w-5 h-5" />
                            </span>
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Sitio Web
                          </label>
                          <div className="relative">
                            <input
                              type="url"
                              value={formData.contact.website}
                              onChange={(e) => setFormData({
                                ...formData,
                                contact: { ...formData.contact, website: e.target.value }
                              })}
                              className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                              placeholder="https://ejemplo.com"
                            />
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                              <Globe className="w-5 h-5" />
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Google Maps */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Google Maps Iframe
                      </label>
                      <textarea
                        value={formData.googleMapsIframe}
                        onChange={(e) => setFormData({ ...formData, googleMapsIframe: e.target.value })}
                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                        rows={3}
                        placeholder="<iframe src='https://www.google.com/maps/embed?...'></iframe>"
                      />
                    </div>
                  </div>
                  
                  {/* Segunda Columna - Descripción, redes sociales e imagen */}
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Descripción
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all min-h-[132px]"
                        rows={4}
                        required
                      />
                    </div>
                    
                    {/* Redes Sociales */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-gray-700">Redes Sociales</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Facebook
                          </label>
                          <div className="relative">
                            <input
                              type="url"
                              value={formData.contact.socialMedia.facebook}
                              onChange={(e) => setFormData({
                                ...formData,
                                contact: {
                                  ...formData.contact,
                                  socialMedia: {
                                    ...formData.contact.socialMedia,
                                    facebook: e.target.value
                                  }
                                }
                              })}
                              className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                              placeholder="https://facebook.com/tucomercio"
                            />
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                              <Facebook className="w-5 h-5" />
                            </span>
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Instagram
                          </label>
                          <div className="relative">
                            <input
                              type="url"
                              value={formData.contact.socialMedia.instagram}
                              onChange={(e) => setFormData({
                                ...formData,
                                contact: {
                                  ...formData.contact,
                                  socialMedia: {
                                    ...formData.contact.socialMedia,
                                    instagram: e.target.value
                                  }
                                }
                              })}
                              className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                              placeholder="https://instagram.com/tucomercio"
                            />
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                              <Instagram className="w-5 h-5" />
                            </span>
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            WhatsApp
                          </label>
                          <div className="relative">
                            <input
                              type="url"
                              value={formData.contact.socialMedia.whatsapp}
                              onChange={(e) => setFormData({
                                ...formData,
                                contact: {
                                  ...formData.contact,
                                  socialMedia: {
                                    ...formData.contact.socialMedia,
                                    whatsapp: e.target.value
                                  }
                                }
                              })}
                              className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                              placeholder="https://wa.me/tuNumero"
                            />
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                              <MessageCircle className="w-5 h-5" />
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Imagen */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Imagen del Comercio
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setFormData({ ...formData, imageFile: file });
                          }
                        }}
                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                      />
                      {(formData.imageUrl || formData.imageFile) && (
                        <div className="mt-2">
                          <img
                            src={formData.imageFile 
                              ? URL.createObjectURL(formData.imageFile)
                              : formData.imageUrl.startsWith('http') 
                                ? formData.imageUrl 
                                : `${API_BASE_URL}${formData.imageUrl}`
                            }
                            alt="Preview"
                            className="w-full h-32 object-cover rounded-lg"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Tercera Columna - Horarios */}
                  <div className="space-y-6">
                    <h3 className="text-lg font-medium text-gray-700">Horarios de Atención</h3>
                    {Object.entries(formData.schedule).map(([day, schedule]) => {
                      const dayNames: { [key: string]: string } = {
                        monday: 'Lunes',
                        tuesday: 'Martes',
                        wednesday: 'Miércoles',
                        thursday: 'Jueves',
                        friday: 'Viernes',
                        saturday: 'Sábado',
                        sunday: 'Domingo'
                      };
                      
                      return (
                        <div key={day} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-gray-700">
                              {dayNames[day]}
                            </label>
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={schedule.isClosed}
                                onChange={(e) => setFormData({
                                  ...formData,
                                  schedule: {
                                    ...formData.schedule,
                                    [day]: {
                                      ...schedule,
                                      isClosed: e.target.checked
                                    }
                                  }
                                })}
                                className="mr-2"
                              />
                              <span className="text-sm text-gray-600">Cerrado</span>
                            </label>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="time"
                              value={formData.schedule[day as keyof Schedule].start}
                              onChange={(e) => setFormData({
                                ...formData,
                                schedule: {
                                  ...formData.schedule,
                                  [day]: {...formData.schedule[day as keyof Schedule], start: e.target.value }
                                }
                              })}
                              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                              disabled={formData.schedule[day as keyof Schedule].isClosed}
                            />
                            <input
                              type="time"
                              value={formData.schedule[day as keyof Schedule].end}
                              onChange={(e) => setFormData({
                                ...formData,
                                schedule: {
                                  ...formData.schedule,
                                  [day]: {...formData.schedule[day as keyof Schedule], end: e.target.value }
                                }
                              })}
                              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                              disabled={formData.schedule[day as keyof Schedule].isClosed}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex justify-end space-x-4 pt-6 border-t">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-6 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-emerald-500 text-white font-medium rounded-lg hover:bg-emerald-600 transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                  >
                    {editingId ? 'Actualizar' : 'Crear'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


