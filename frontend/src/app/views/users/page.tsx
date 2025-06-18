'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil } from 'lucide-react';
import toast from 'react-hot-toast';

interface User {
  _id: string;
  name: string;
  email: string;
  username: string;
  status: 'pending' | 'active' | 'deleted';
  role: 'admin' | 'commerce' | 'user';
  createdAt: string;
  commerceId?: string;
}

interface Commerce {
  _id: string;
  name: string;
}

const UsersPage = () => {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [commerces, setCommerces] = useState<Commerce[]>([]);
  
  // Nuevos estados para filtros
  const [searchName, setSearchName] = useState('');
  const [searchEmail, setSearchEmail] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [commerceFilter, setCommerceFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchUsers();
    fetchCommerces();
  }, []);

  const fetchCommerces = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/commerces', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Error al cargar comercios');
      const data = await response.json();
      setCommerces(data.commerces);
    } catch (error) {
      toast.error('Error al cargar comercios');
    }
  };

  const updateUserCommerce = async (userId: string, commerceId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/users/${userId}/commerce`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ commerceId })
      });

      if (response.status === 404) {
        throw new Error('Usuario o comercio no encontrado');
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al asignar comercio');
      }

      await fetchUsers();
      toast.success('Comercio asignado correctamente');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al asignar comercio');
      console.error('Error asignando comercio:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      if (!token) {
        router.push('/views/auth/login');
        return;
      }

      const response = await fetch('http://localhost:5000/api/users/all', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Error al cargar usuarios');
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      toast.error('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      // Actualización optimista inicial
      const updatedUsers = users.map(user =>
        user._id === userId ? {
          ...user,
          role: newRole as User['role'], // Aseguramos que el tipo sea correcto
          commerceId: newRole !== 'commerce' ? undefined : user.commerceId
        } : user
      );
      setUsers(updatedUsers);

      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role: newRole })
      });

      if (!response.ok) {
        setUsers(users); // Revertir cambios si hay error
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al actualizar rol');
      }

      // Si el nuevo rol no es 'commerce', limpiamos el comercio asignado en el backend
      if (newRole !== 'commerce') {
        const updatedUsersWithoutCommerce = updatedUsers.map(user =>
          user._id === userId ? { ...user, commerceId: undefined } : user
        );
        setUsers(updatedUsersWithoutCommerce);
        await updateUserCommerce(userId, '');
      }

      toast.success('Rol actualizado correctamente');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al actualizar rol');
    }
  };

  const updateUserStatus = async (userId: string, newStatus: string) => {
    try {
      // Actualización optimista
      const updatedUsers = users.map(user =>
        user._id === userId ? { ...user, status: newStatus as User['status'] } : user
      );
      setUsers(updatedUsers);

      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/users/${userId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        setUsers(users); // Revertir cambios si hay error
        throw new Error('Error al actualizar estado');
      }

      toast.success('Estado actualizado correctamente');
    } catch (error) {
      toast.error('Error al actualizar estado');
    }
  };

  const updateUserInfo = async (userId: string, name: string, email: string) => {
    try {
      // Actualización optimista
      const updatedUsers = users.map(user =>
        user._id === userId ? { ...user, name, email } : user
      );
      setUsers(updatedUsers);

      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, email })
      });

      if (!response.ok) {
        // Revertir cambios si hay error
        setUsers(users);
        throw new Error('Error al actualizar usuario');
      }

      setShowEditModal(false);
      toast.success('Usuario actualizado correctamente');
    } catch (error) {
      toast.error('Error al actualizar usuario');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Función para filtrar usuarios
  const filteredUsers = users.filter(user => {
    const matchesName = user.name.toLowerCase().includes(searchName.toLowerCase());
    const matchesEmail = user.email.toLowerCase().includes(searchEmail.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    const matchesCommerce = commerceFilter === 'all' || user.commerceId === commerceFilter;

    return matchesName && matchesEmail && matchesRole && matchesStatus && matchesCommerce;
  });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Gestionar Usuarios</h1>
      
      {/* Panel de filtros */}
      <div className="bg-white rounded-xl p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Filtros de búsqueda</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nombre</label>
            <div className="relative">
              <input
                type="text"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 pl-10 pr-4 py-2.5 transition-all duration-200 bg-white hover:bg-gray-50"
                placeholder="Buscar por nombre..."
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Correo</label>
            <div className="relative">
              <input
                type="text"
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 pl-10 pr-4 py-2.5 transition-all duration-200 bg-white hover:bg-gray-50"
                placeholder="Buscar por correo..."
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Rol</label>
            <div className="relative">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 pl-4 pr-10 py-2.5 appearance-none bg-white hover:bg-gray-50 transition-all duration-200"
              >
                <option value="all">Todos los roles</option>
                <option value="admin">Administrador</option>
                <option value="commerce">Comercio</option>
                <option value="user">Usuario</option>
              </select>
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Comercio</label>
            <div className="relative">
              <select
                value={commerceFilter}
                onChange={(e) => setCommerceFilter(e.target.value)}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 pl-4 pr-10 py-2.5 appearance-none bg-white hover:bg-gray-50 transition-all duration-200"
              >
                <option value="all">Todos los comercios</option>
                {commerces.map((commerce) => (
                  <option key={commerce._id} value={commerce._id}>{commerce.name}</option>
                ))}
              </select>
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 pl-4 pr-10 py-2.5 appearance-none bg-white hover:bg-gray-50 transition-all duration-200"
              >
                <option value="all">Todos los estados</option>
                <option value="active">Activo</option>
                <option value="pending">Pendiente</option>
                <option value="deleted">Eliminado</option>
              </select>
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Correo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Comercio</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{user.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={user.role}
                      onChange={(e) => updateUserRole(user._id, e.target.value)}
                      className="text-sm text-gray-500 border rounded-md px-2 py-1"
                    >
                      <option value="user">Usuario</option>
                      <option value="commerce">Comercio</option>
                      <option value="admin">Administrador</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.role === 'commerce' ? (
                      <div className="flex items-center gap-2">
                        <select
                          value={user.commerceId || ''}
                          onChange={(e) => {
                            const selectedCommerceId = e.target.value;
                            if (selectedCommerceId === '') {
                              toast('Por favor selecciona un comercio válido', {
                                icon: '⚠️',
                                style: {
                                  background: '#FEF3C7',
                                  color: '#92400E'
                                }
                              });
                              return;
                            }
                            updateUserCommerce(user._id, selectedCommerceId);
                          }}
                          className="text-sm text-gray-500 border rounded-md px-2 py-1"
                        >
                          <option value="">Seleccionar comercio</option>
                          {commerces.map((commerce) => (
                            <option key={commerce._id} value={commerce._id}>
                              {commerce.name}
                            </option>
                          ))}
                        </select>
                        {user.commerceId && (
                          <button
                            onClick={() => updateUserCommerce(user._id, '')}
                            className="text-red-500 hover:text-red-700 transition-colors"
                          >
                            <svg 
                              xmlns="http://www.w3.org/2000/svg" 
                              className="h-5 w-5" 
                              viewBox="0 0 20 20" 
                              fill="currentColor"
                            >
                              <path 
                                fillRule="evenodd" 
                                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" 
                                clipRule="evenodd" 
                              />
                            </svg>
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500">-</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={user.status}
                      onChange={(e) => updateUserStatus(user._id, e.target.value)}
                      className="text-sm border rounded-md px-2 py-1"
                      style={{
                        backgroundColor: 
                          user.status === 'active' ? '#10B981' : 
                          user.status === 'pending' ? '#F59E0B' : '#EF4444',
                        color: 'white'
                      }}
                    >
                      <option value="active">Activo</option>
                      <option value="pending">Pendiente</option>
                      <option value="deleted">Eliminado</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => {
                        setEditingUser(user);
                        setShowEditModal(true);
                      }}
                      className="text-emerald-600 hover:text-emerald-900"
                    >
                      <Pencil className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de edición */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium mb-4">Editar Usuario</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              updateUserInfo(
                editingUser._id,
                formData.get('name') as string,
                formData.get('email') as string
              );
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nombre</label>
                  <input
                    type="text"
                    name="name"
                    defaultValue={editingUser.name}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Correo</label>
                  <input
                    type="email"
                    name="email"
                    defaultValue={editingUser.email}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 rounded-md"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;

