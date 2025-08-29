'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Store, Mail, Phone, Globe, Facebook, Instagram, MessageCircle, MapPin, Building2, FileText, Save, Clock } from 'lucide-react';
import { toast } from 'react-hot-toast';

// Interfaces separadas para mejor mantenibilidad
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
  facebook: string;
  instagram: string;
  whatsapp: string;
}

interface Contact {
  email: string;
  phone: string;
  website: string;
  socialMedia: SocialMedia;
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
  contact: Contact;
}

// Constantes para configuración
const API_BASE_URL = 'http://localhost:5000';
const API_ENDPOINTS = {
  MY_COMMERCE: `${API_BASE_URL}/api/commerces/my-commerce`,
  UPDATE_COMMERCE: (id: string) => `${API_BASE_URL}/api/commerces/commerce/${id}`,
};

// Horario por defecto para evitar errores
const DEFAULT_SCHEDULE: Schedule = {
  monday: { start: '09:00', end: '18:00', isClosed: false },
  tuesday: { start: '09:00', end: '18:00', isClosed: false },
  wednesday: { start: '09:00', end: '18:00', isClosed: false },
  thursday: { start: '09:00', end: '18:00', isClosed: false },
  friday: { start: '09:00', end: '18:00', isClosed: false },
  saturday: { start: '09:00', end: '18:00', isClosed: false },
  sunday: { start: '09:00', end: '18:00', isClosed: true }
};

// Contacto por defecto para evitar errores
const DEFAULT_CONTACT: Contact = {
  email: '',
  phone: '',
  website: '',
  socialMedia: {
    facebook: '',
    instagram: '',
    whatsapp: ''
  }
};

export default function ManagementPage() {
  const router = useRouter();
  const [commerce, setCommerce] = useState<Commerce | null>(null);
  const [formData, setFormData] = useState<Partial<Commerce> | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Separar la lógica de montaje y fetch
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      fetchMyCommerce();
    }
  }, [mounted]);

  const fetchMyCommerce = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/views/auth/login');
        return;
      }

      const response = await fetch(API_ENDPOINTS.MY_COMMERCE, {
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

  useEffect(() => {
    if (commerce) {
      // Asegurar que los datos tengan la estructura correcta
      const safeCommerce = {
        ...commerce,
        schedule: commerce.schedule || DEFAULT_SCHEDULE,
        contact: {
          ...DEFAULT_CONTACT,
          ...commerce.contact,
          socialMedia: {
            ...DEFAULT_CONTACT.socialMedia,
            ...commerce.contact?.socialMedia
          }
        }
      };
      setFormData(safeCommerce);
    }
  }, [commerce]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      if (!prev) return null;
      
      if (name.includes('.')) {
        const parts = name.split('.');
        const newData = JSON.parse(JSON.stringify(prev)); // Crear copia profunda
        
        let current = newData;
        for (let i = 0; i < parts.length - 1; i++) {
          if (!(parts[i] in current)) {
            current[parts[i]] = {};
          }
          current = current[parts[i]];
        }
        
        current[parts[parts.length - 1]] = value;
        return newData;
      }
      
      return { ...prev, [name]: value };
    });
  };

  const handleScheduleChange = (day: string, field: string, value: string | boolean) => {
    setFormData(prev => {
      if (!prev) return null;
      
      // Asegurar que schedule existe
      const currentSchedule = prev.schedule || DEFAULT_SCHEDULE;
      const currentDaySchedule = currentSchedule[day as keyof Schedule] || DEFAULT_SCHEDULE[day as keyof Schedule];
      
      return {
        ...prev,
        schedule: {
          ...currentSchedule,
          [day]: {
            ...currentDaySchedule,
            [field]: value
          }
        }
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('token');
      if (!token || !formData || !commerce?._id) return;

      // Crear el objeto de datos para enviar con validaciones
      const dataToSend = {
        name: formData.name || '',
        description: formData.description || '',
        category: formData.category?._id || '',
        schedule: formData.schedule || DEFAULT_SCHEDULE,
        googleMapsIframe: formData.googleMapsIframe || '',
        contact: {
          email: formData.contact?.email || '',
          phone: formData.contact?.phone || '',
          website: formData.contact?.website || '',
          socialMedia: {
            facebook: formData.contact?.socialMedia?.facebook || '',
            instagram: formData.contact?.socialMedia?.instagram || '',
            whatsapp: formData.contact?.socialMedia?.whatsapp || ''
          }
        }
      };

      const response = await fetch(API_ENDPOINTS.UPDATE_COMMERCE(commerce._id), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dataToSend)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error actualizando el comercio');
      }
      
      toast.success('Comercio actualizado exitosamente');
      await fetchMyCommerce(); // Recargar datos actualizados
    } catch (error) {
      toast.error('Error al actualizar el comercio');
      console.error('Error updating commerce:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!mounted) {
    return null; // Evitar cualquier renderizado hasta que el componente esté montado
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen" suppressHydrationWarning>
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8" suppressHydrationWarning>
      <div className="flex items-center gap-3 mb-8">
        <Store className="w-8 h-8 text-emerald-600" />
        <h1 className="text-3xl font-bold">Editar Datos de Mi Comercio</h1>
      </div>
      
      {commerce && formData ? (
        <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-8">
          {/* Columna Izquierda */}
          <div className="space-y-8">
            {/* Informacion Basica */}
            <div className="bg-white rounded-xl p-6 space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="w-5 h-5 text-emerald-600" />
                <h2 className="text-xl font-semibold">Informacion Basica</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name || ''}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descripcion</label>
                  <div className="relative">
                    <FileText className="absolute top-3 left-3 w-5 h-5 text-gray-400" />
                    <textarea
                      name="description"
                      value={formData.description || ''}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Ubicacion */}
            <div className="bg-white rounded-xl p-6 space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-5 h-5 text-emerald-600" />
                <h2 className="text-xl font-semibold">Ubicacion</h2>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Google Maps Iframe</label>
                <div className="relative">
                  <MapPin className="absolute top-3 left-3 w-5 h-5 text-gray-400" />
                  <textarea
                    name="googleMapsIframe"
                    value={formData.googleMapsIframe || ''}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                  />
                </div>
                {formData.googleMapsIframe && (
                  <div className="mt-4 rounded-lg overflow-hidden border border-gray-200">
                    <div dangerouslySetInnerHTML={{ __html: formData.googleMapsIframe }} />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Columna Derecha */}
          <div className="space-y-8">
            {/* Informacion de Contacto */}
            <div className="bg-white rounded-xl p-6 space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <Phone className="w-5 h-5 text-emerald-600" />
                <h2 className="text-xl font-semibold">Informacion de Contacto</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <div className="relative">
                    <Mail className="absolute top-1/2 left-3 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      name="contact.email"
                      value={formData.contact?.email || ''}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefono</label>
                  <div className="relative">
                    <Phone className="absolute top-1/2 left-3 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      name="contact.phone"
                      value={formData.contact?.phone || ''}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sitio Web</label>
                  <div className="relative">
                    <Globe className="absolute top-1/2 left-3 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="url"
                      name="contact.website"
                      value={formData.contact?.website || ''}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Redes Sociales */}
            <div className="bg-white rounded-xl p-6 space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <MessageCircle className="w-5 h-5 text-emerald-600" />
                <h2 className="text-xl font-semibold">Redes Sociales</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Facebook</label>
                  <div className="relative">
                    <Facebook className="absolute top-1/2 left-3 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="url"
                      name="contact.socialMedia.facebook"
                      value={formData.contact?.socialMedia?.facebook || ''}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Instagram</label>
                  <div className="relative">
                    <Instagram className="absolute top-1/2 left-3 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="url"
                      name="contact.socialMedia.instagram"
                      value={formData.contact?.socialMedia?.instagram || ''}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
                  <div className="relative">
                    <MessageCircle className="absolute top-1/2 left-3 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="url"
                      name="contact.socialMedia.whatsapp"
                      value={formData.contact?.socialMedia?.whatsapp || ''}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Horarios de Atencion */}
            <div className="bg-white rounded-xl p-6 space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-emerald-600" />
                <h2 className="text-xl font-semibold">Horarios de Atencion</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(formData.schedule || DEFAULT_SCHEDULE).map(([day, schedule]) => {
                  const dayNames: { [key: string]: string } = {
                    monday: 'Lunes',
                    tuesday: 'Martes',
                    wednesday: 'Miercoles',
                    thursday: 'Jueves',
                    friday: 'Viernes',
                    saturday: 'Sabado',
                    sunday: 'Domingo'
                  };
                  
                  const safeSchedule = schedule || DEFAULT_SCHEDULE[day as keyof Schedule];
                  
                  return (
                    <div key={day} className="space-y-2 p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-gray-700">
                          {dayNames[day]}
                        </label>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={safeSchedule.isClosed || false}
                            onChange={(e) => handleScheduleChange(day, 'isClosed', e.target.checked)}
                            className="mr-2"
                          />
                          <span className="text-xs text-gray-600">Cerrado</span>
                        </label>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="time"
                          value={safeSchedule.start || '09:00'}
                          onChange={(e) => handleScheduleChange(day, 'start', e.target.value)}
                          className="w-full px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                          disabled={safeSchedule.isClosed || false}
                        />
                        <input
                          type="time"
                          value={safeSchedule.end || '18:00'}
                          onChange={(e) => handleScheduleChange(day, 'end', e.target.value)}
                          className="w-full px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                          disabled={safeSchedule.isClosed || false}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Boton de Guardar */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg ${
                isSubmitting 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-emerald-600 hover:bg-emerald-700'
              } text-white font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2`}
            >
              <Save className="w-5 h-5" />
              {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-600">No tienes un comercio asignado.</p>
        </div>
      )}
    </div>
  );
}