'use client';

import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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
        ? `http://localhost:5000/api/categories/${editingId}`
        : 'http://localhost:5000/api/categories';

      const response = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Error processing category');
      
      toast.success(editingId ? 'Category updated successfully' : 'Category created successfully');
      setIsModalOpen(false);
      setFormData({ name: '', description: '', icon: '', color: '#4F46E5' });
      setEditingId(null);
      fetchCategories();
    } catch (error) {
      toast.error('Error processing category');
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

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/categories/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Error deleting category');
      
      toast.success('Category deleted successfully');
      fetchCategories();
    } catch (error) {
      toast.error('Error deleting category');
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Gestionar Categorias</h1>
        <button
          onClick={() => {
            setEditingId(null);
            setFormData({ name: '', description: '', icon: '', color: '#4F46E5' });
            setIsModalOpen(true);
          }}
          className="flex items-center px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Crear
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {categories.map((category) => (
          <Link 
            href={`/views/category/${category._id}`} // Updated path
            key={category._id}
            className="group relative"
          >
            <div 
              className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 flex flex-col items-center relative overflow-hidden cursor-pointer"
              style={{ 
                background: `linear-gradient(135deg, ${category.color}08, white 50%, ${category.color}08)`
              }}
            >
              <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: category.color }} />
              
              <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    handleEdit(category);
                  }}
                  className="p-1.5 bg-white/80 backdrop-blur-sm text-gray-600 hover:text-blue-600 rounded-lg transition-colors shadow-sm hover:shadow"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    handleDelete(category._id);
                  }}
                  className="p-1.5 bg-white/80 backdrop-blur-sm text-gray-600 hover:text-red-600 rounded-lg transition-colors shadow-sm hover:shadow"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="w-full p-6">
                <div 
                  className="w-16 h-16 mx-auto flex items-center justify-center mb-4 rounded-2xl"
                  style={{ 
                    backgroundColor: `${category.color}15`,
                    color: category.color,
                    boxShadow: `0 4px 6px -1px ${category.color}15`
                  }}
                  dangerouslySetInnerHTML={{ __html: category.icon }}
                />
                
                <div className="text-center">
                  <h3 className="text-base font-semibold text-gray-800 mb-1">{category.name}</h3>
                </div>
              </div>

              <div 
                className="w-full py-3 px-4 bg-gray-50 border-t text-xs text-center group-hover:bg-opacity-80 transition-colors"
                style={{ color: category.color }}
              >
                Ver comercios
              </div>
            </div>
          </Link>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">
              {editingId ? 'Edit Category' : 'Create New Category'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
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
                  Description
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
                  SVG Icon
                </label>
                <textarea
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  className="w-full p-2 border rounded-md font-mono text-sm"
                  placeholder="Paste SVG code here"
                  rows={3}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Color
                </label>
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-full h-10 p-1 border rounded-md"
                />
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-500 text-white rounded-md hover:bg-emerald-600"
                >
                  {editingId ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}