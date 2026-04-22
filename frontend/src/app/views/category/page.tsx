'use client';

import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { API_BASE_URL } from '@/config/api';

interface Category {
  _id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

export default function CategoryPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '',
    color: '#4F46E5'
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/views/auth/login');
        return;
      }

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
    fetchCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/views/auth/login');
        return;
      }

      const url = editingId 
        ? `${API_BASE_URL}/api/categories/${editingId}`
        : `${API_BASE_URL}/api/categories`;

      const response = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Error processing category');
      
      toast.success(editingId ? 'Categoria actualizada exitosamente' : 'Categoria creada exitosamente');
      setIsModalOpen(false);
      setFormData({ name: '', description: '', icon: '', color: '#4F46E5' });
      setEditingId(null);
      fetchCategories();
    } catch (error) {
      toast.error('Error al procesar la categoria');
    }
  };

  const handleEdit = (category: Category) => {
    setFormData({
      name: category.name,
      description: category.description,
      icon: category.icon,
      color: category.color
    });
    setEditingId(category._id);
    setIsModalOpen(true);
  };

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/categories/${categoryToDelete}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Error deleting category');
      
      toast.success('Categoria eliminada exitosamente');
      fetchCategories();
    } catch (error) {
      toast.error('Error al eliminar la categoria');
    } finally {
      setIsDeleteModalOpen(false);
      setCategoryToDelete(null);
    }
  };

  return (
    <div className="p-6 sm:p-6">
      <div className="flex flex-row justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Categorias</h1>
        <button
          onClick={() => {
            setEditingId(null);
            setFormData({ name: '', description: '', icon: '', color: '#4F46E5' });
            setIsModalOpen(true);
          }}
          className="flex items-center px-2 py-1.5 sm:px-4 sm:py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors text-sm sm:text-base"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
          Crear
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4 md:gap-6">
        {categories.map((category) => (
          <div key={category._id} className="group relative">
            <Link 
              href={`/views/category/${category._id}`}
              className="block"
            >
              <div 
                className="bg-white rounded-xl sm:rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 flex flex-col items-center relative overflow-hidden cursor-pointer aspect-square sm:aspect-auto sm:min-h-[140px]"
                style={{ 
                  background: `linear-gradient(135deg, ${category.color}08, white 50%, ${category.color}08)`
                }}
              >
                <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: category.color }} />
                
                <div className="w-full p-3 sm:p-4 md:p-6 flex flex-col items-center justify-center h-full">
                  <div 
                    className="w-12 h-12 sm:w-12 sm:h-12 md:w-16 md:h-16 mx-auto flex items-center justify-center mb-3 sm:mb-3 md:mb-4 rounded-xl sm:rounded-2xl"
                    style={{ 
                      backgroundColor: `${category.color}15`,
                      color: category.color,
                      boxShadow: `0 4px 6px -1px ${category.color}15`
                    }}
                    dangerouslySetInnerHTML={{ __html: category.icon }}
                  />
                  
                  <div className="text-center">
                    <h3 className="text-sm sm:text-sm md:text-base font-semibold text-gray-800 leading-tight">
                      {category.name}
                    </h3>
                  </div>
                </div>
              </div>
            </Link>
            
            {/* Botones de acción - Basurero arriba, lápiz abajo */}
            <div className="absolute top-2 right-2 flex flex-col gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity z-10">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  setCategoryToDelete(category._id);
                  setIsDeleteModalOpen(true);
                }}
                className="p-1 sm:p-1.5 bg-white/90 backdrop-blur-sm text-gray-600 hover:text-red-600 rounded-md sm:rounded-lg transition-colors shadow-sm hover:shadow"
              >
                <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  handleEdit(category);
                }}
                className="p-1 sm:p-1.5 bg-white/90 backdrop-blur-sm text-gray-600 hover:text-blue-600 rounded-md sm:rounded-lg transition-colors shadow-sm hover:shadow"
              >
                <Pencil className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de confirmacion de eliminacion */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Confirmar eliminacion
              </h3>
              <p className="text-gray-600 mb-6">
                ¿Estas seguro de que quieres eliminar esta categoria? Esta accion no se puede deshacer.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setCategoryToDelete(null);
                  }}
                  className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteCategory}
                  className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de creacion/edicion */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-6 text-gray-800">
                {editingId ? 'Editar Categoria' : 'Crear Nueva Categoria'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                    required
                    placeholder="Nombre de la categoria"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Icono SVG
                  </label>
                  <textarea
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                    placeholder="Pega aqui el codigo SVG"
                    rows={4}
                    required
                  />
                  {formData.icon && (
                    <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-600 mb-2">Vista previa:</p>
                      <div 
                        className="w-8 h-8 flex items-center justify-center"
                        style={{ color: formData.color }}
                        dangerouslySetInnerHTML={{ __html: formData.icon }}
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Color
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="w-12 h-10 border border-gray-300 rounded-lg cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="#4F46E5"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-6 border-t">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
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
