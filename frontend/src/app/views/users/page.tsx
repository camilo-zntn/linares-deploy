'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Check, X, RotateCcw } from 'lucide-react';

interface User {
  _id: string;
  name: string;
  email: string;
  username: string;
  status: 'pending' | 'active' | 'deleted';
  role: 'admin' | 'funcionario';
}

const UsersPage = () => {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);


  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      if (!token) {
        router.push('/views/auth/login');
        return;
      }

      const response = await fetch('http://localhost:5000/api/users/all', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        router.push('/views/auth/login');
        return;
      }

      if (!response.ok) {
        throw new Error('Error al cargar usuarios');
      }

      const data = await response.json();
      setUsers(data);

    } catch (err) {
      console.error('Error:', err);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const updateUserStatus = async (userId: string, newStatus: string) => {
    try {
      const token = localStorage.getItem('token');

      if (!token) {
        router.push('/views/auth/login');
        return;
      }

      const response = await fetch(`http://localhost:5000/api/users/${userId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        router.push('/views/auth/login');
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al actualizar estado');
      }

      await fetchUsers(); // Recargar usuarios
      
    } catch (err) {
      console.error('Error:', err);
      setError((err as Error).message);
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      const token = localStorage.getItem('token');
  
      if (!token) {
        router.push('/views/auth/login');
        return;
      }
  
      const response = await fetch(`http://localhost:5000/api/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
  
      if (response.status === 401) {
        localStorage.removeItem('token');
        router.push('/views/auth/login');
        return;
      }
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al eliminar usuario');
      }
  
      // Actualizar la lista de usuarios
      await fetchUsers();
      
    } catch (err) {
      console.error('Error:', err);
      setError((err as Error).message);
    }
  };

  // Modificar la funcion handleDelete
  const handleDelete = (userId: string) => {
    setUserToDelete(userId);
    setShowDeleteModal(true);
  };

  // Agregar la funcion confirmDelete
  const confirmDelete = async () => {
    if (!userToDelete) return;
    
    try {
      const token = localStorage.getItem('token');

      if (!token) {
        router.push('/views/auth/login');
        return;
      }

      const response = await fetch(`http://localhost:5000/api/users/${userToDelete}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al eliminar usuario');
      }

      await fetchUsers();
      setShowDeleteModal(false);
      setUserToDelete(null);
      
    } catch (err) {
      console.error('Error:', err);
      setError((err as Error).message);
    }
  };

  // Filtrar usuarios por estado
  const pendingUsers = users.filter(user => user.status === 'pending');
  const activeUsers = users.filter(user => user.status === 'active');
  const deletedUsers = users.filter(user => user.status === 'deleted');

  if (loading) {
    return (
      <div className="container mx-auto px-4 mt-8">
        <div className="flex justify-center">
          <div className="w-8 h-8 border-t-2 border-b-2 border-emerald-500 rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Columna 1: Usuarios Pendientes */}
        <div className="bg-secondary/40 backdrop-blur-sm rounded-xl p-4 lg:h-[calc(100vh-8rem)] flex flex-col border border-gray-100/20">
          <h2 className="text-lg sm:text-xl font-semibold text-primary mb-3 flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-yellow-400 animate-pulse"></span>
            Pendientes ({pendingUsers.length})
          </h2>
          <div className="overflow-x-auto flex-1 -mx-4 px-4">
            <div className="flex lg:flex-col gap-2.5 lg:gap-3 pb-2 lg:pb-0">
              {pendingUsers.map(user => (
                <div 
                  key={user._id} 
                  className="bg-gray-50 p-3 rounded-xl shadow-sm hover:shadow-md transition-all w-[170px] lg:w-auto flex-shrink-0 border border-gray-100/10 hover:border-gray-200/20"
                >
                  <div className="flex flex-col h-full">
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-primary text-sm leading-none truncate mb-1">{user.name}</h3>
                          <p className="text-[11px] text-gray-500/90 leading-none truncate">{user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="h-4 w-4 rounded-full bg-yellow-400/10 flex items-center justify-center">
                          <div className="h-1.5 w-1.5 rounded-full bg-yellow-400"></div>
                        </div>
                        <p className="text-[10px] text-yellow-500/80 leading-none font-medium">Pendiente</p>
                      </div>
                    </div>
                    <div className="flex gap-1 mt-2.5"> 
                      <button
                        onClick={() => updateUserStatus(user._id, 'active')}
                        className="flex-1 flex items-center justify-center bg-emerald-500/90 hover:bg-emerald-600/90 text-white rounded-lg transition-colors py-3.5 px-2"
                        title="Aceptar usuario"
                      >
                        <Check size={13} className="stroke-[2.5]" />
                      </button>
                      <button
                        onClick={() => handleDelete(user._id)}
                        className="flex-1 flex items-center justify-center bg-red-500/90 hover:bg-red-600/90 text-white rounded-lg transition-colors py-3.5 px-2"
                        title="Eliminar usuario"
                      >
                        <X size={13} className="stroke-[2.5]" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {pendingUsers.length === 0 && (
                <div className="w-full text-center py-8">
                  <p className="text-sm text-gray-400">No hay usuarios pendientes</p>
                </div>
              )}
            </div>
          </div>
        </div>
  
        {/* Columna 2: Usuarios Activos */}
        <div className="bg-secondary/40 backdrop-blur-sm rounded-xl p-4 lg:h-[calc(100vh-8rem)] flex flex-col border border-gray-100/20">
          <h2 className="text-lg sm:text-xl font-semibold text-primary mb-3 flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400"></span>
            Activos ({activeUsers.length})
          </h2>
          <div className="overflow-x-auto flex-1 -mx-4 px-4">
            <div className="flex lg:flex-col gap-2.5 lg:gap-3 pb-2 lg:pb-0">
              {activeUsers.map(user => (
                <div 
                  key={user._id} 
                  className="bg-gray-50 p-3 rounded-xl shadow-sm hover:shadow-md transition-all w-[170px] lg:w-auto flex-shrink-0 border border-gray-100/10 hover:border-gray-200/20"
                >
                  <div className="flex flex-col h-full">
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-primary text-sm leading-none truncate mb-1">{user.name}</h3>
                          <p className="text-[11px] text-gray-500/90 leading-none truncate">{user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="h-4 w-4 rounded-full bg-emerald-400/10 flex items-center justify-center">
                          <div className="h-1.5 w-1.5 rounded-full bg-emerald-400"></div>
                        </div>
                        <p className="text-[10px] text-emerald-500/80 leading-none font-medium">Activo</p>
                      </div>
                    </div>
                    <div className="flex mt-2.5"> 
                      <button
                        onClick={() => updateUserStatus(user._id, 'deleted')}
                        className="flex-1 flex items-center justify-center bg-red-500/90 hover:bg-red-600/90 text-white rounded-lg transition-colors py-3.5 px-2"
                        title="Eliminar usuario"
                      >
                        <X size={13} className="stroke-[2.5]" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {activeUsers.length === 0 && (
                <div className="w-full text-center py-8">
                  <p className="text-sm text-gray-400">No hay usuarios activos</p>
                </div>
              )}
            </div>
          </div>
        </div>
  
        {/* Columna 3: Usuarios Eliminados */}
        <div className="bg-secondary/40 backdrop-blur-sm rounded-xl p-4 lg:h-[calc(100vh-8rem)] flex flex-col border border-gray-100/20">
          <h2 className="text-lg sm:text-xl font-semibold text-primary mb-3 flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400"></span>
            Eliminados ({deletedUsers.length})
          </h2>
          <div className="overflow-x-auto flex-1 -mx-4 px-4">
            <div className="flex lg:flex-col gap-2.5 lg:gap-3 pb-2 lg:pb-0">
              {deletedUsers.map(user => (
                <div 
                  key={user._id} 
                  className="bg-gray-50 p-3 rounded-xl shadow-sm hover:shadow-md transition-all w-[170px] lg:w-auto flex-shrink-0 border border-gray-100/10 hover:border-gray-200/20"
                >
                  <div className="flex flex-col h-full">
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-primary text-sm leading-none truncate mb-1">{user.name}</h3>
                          <p className="text-[11px] text-gray-500/90 leading-none truncate">{user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="h-4 w-4 rounded-full bg-red-400/10 flex items-center justify-center">
                          <div className="h-1.5 w-1.5 rounded-full bg-red-400"></div>
                        </div>
                        <p className="text-[10px] text-red-500/80 leading-none font-medium">Eliminado</p>
                      </div>
                    </div>
                    <div className="flex gap-1 mt-2.5"> 
                      <button
                        onClick={() => updateUserStatus(user._id, 'active')}
                        className="flex-1 flex items-center justify-center bg-emerald-500/90 hover:bg-emerald-600/90 text-white rounded-lg transition-colors py-3.5 px-2"
                        title="Reactivar usuario"
                      >
                        <RotateCcw size={13} className="stroke-[2.5]" />
                      </button>
                      <button
                        onClick={() => handleDelete(user._id)}
                        className="flex-1 flex items-center justify-center bg-red-500/90 hover:bg-red-600/90 text-white rounded-lg transition-colors py-3.5 px-2"
                        title="Eliminar usuario"
                      >
                        <X size={13} className="stroke-[2.5]" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {deletedUsers.length === 0 && (
                <div className="w-full text-center py-8">
                  <p className="text-sm text-gray-400">No hay usuarios eliminados</p>
                </div>
              )}
            </div>
          </div>
        </div>
  
        {/* Modal de confirmacion de eliminacion */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-primary p-6 rounded-lg w-full max-w-md">
              <h3 className="text-lg font-semibold text-primary mb-4">
                Confirmar eliminacion
              </h3>
              <p className="text-gray-500 mb-6">
                ¿Esta seguro que desea eliminar este usuario? Esta accion no se puede deshacer.
              </p>
              <div className="flex flex-col sm:flex-row justify-end gap-4">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setUserToDelete(null);
                  }}
                  className="px-4 py-2 text-gray-500 hover:text-gray-700 transition-colors order-2 sm:order-1"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors order-1 sm:order-2"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UsersPage;

