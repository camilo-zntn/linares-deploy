'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2, Search, Filter, X, Copy } from 'lucide-react';
import toast from 'react-hot-toast';

interface User {
  _id: string;
  rut: string;
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

// Función para validar RUT
const validateRut = (rut: string): { isValid: boolean; message?: string } => {
  if (!rut) return { isValid: false, message: 'RUT es requerido' };
  
  // Limpiar RUT
  const cleanRut = rut.replace(/[^0-9kK]/g, '').toUpperCase();
  
  if (cleanRut.length < 8 || cleanRut.length > 9) {
    return { isValid: false, message: 'RUT debe tener entre 8 y 9 caracteres' };
  }
  
  const body = cleanRut.slice(0, -1);
  const dv = cleanRut.slice(-1);
  
  if (!/^\d+$/.test(body)) {
    return { isValid: false, message: 'RUT contiene caracteres inválidos' };
  }
  
  // Calcular dígito verificador
  let sum = 0;
  let multiplier = 2;
  
  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }
  
  const remainder = sum % 11;
  const calculatedDV = remainder < 2 ? remainder.toString() : (11 - remainder === 10 ? 'K' : (11 - remainder).toString());
  
  if (dv !== calculatedDV) {
    return { isValid: false, message: 'RUT inválido' };
  }
  
  return { isValid: true };
};

// Función para formatear RUT
const formatRut = (rut: string): string => {
  const cleanRut = rut.replace(/[^0-9kK]/g, '').toUpperCase();
  if (cleanRut.length < 2) return cleanRut;
  
  const body = cleanRut.slice(0, -1);
  const dv = cleanRut.slice(-1);
  
  // Agregar puntos cada 3 dígitos desde la derecha
  const formattedBody = body.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
  
  return `${formattedBody}-${dv}`;
};

const UsersPage = () => {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [commerces, setCommerces] = useState<Commerce[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  
  // Estados para filtros
  const [searchRut, setSearchRut] = useState('');
  const [searchName, setSearchName] = useState('');
  const [searchEmail, setSearchEmail] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [commerceFilter, setCommerceFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [rutError, setRutError] = useState('');

  useEffect(() => {
    fetchUsers();
    fetchCommerces();
  }, []);

  // Validar RUT en tiempo real
  useEffect(() => {
    if (searchRut) {
      const validation = validateRut(searchRut);
      setRutError(validation.isValid ? '' : validation.message || 'RUT inválido');
    } else {
      setRutError('');
    }
  }, [searchRut]);

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

  const updateUserRole = async (userId: string, newRole: string) => {
    const previousUsers = [...users];
    
    setUsers(prevUsers => 
      prevUsers.map(user => 
        user._id === userId 
          ? { ...user, role: newRole as 'admin' | 'commerce' | 'user', commerceId: newRole !== 'commerce' ? undefined : user.commerceId }
          : user
      )
    );

    try {
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
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al actualizar rol');
      }

      toast.success('Rol actualizado correctamente');
    } catch (error) {
      setUsers(previousUsers);
      toast.error(error instanceof Error ? error.message : 'Error al actualizar rol');
    }
  };

  const updateUserCommerce = async (userId: string, commerceId: string) => {
    const previousUsers = [...users];
    
    setUsers(prevUsers => 
      prevUsers.map(user => 
        user._id === userId 
          ? { ...user, commerceId: commerceId || undefined }
          : user
      )
    );

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

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al asignar comercio');
      }

      toast.success(commerceId ? 'Comercio asignado correctamente' : 'Comercio removido correctamente');
    } catch (error) {
      setUsers(previousUsers);
      toast.error(error instanceof Error ? error.message : 'Error al asignar comercio');
    }
  };

  const updateUserStatus = async (userId: string, newStatus: string) => {
    const previousUsers = [...users];
    
    setUsers(prevUsers => 
      prevUsers.map(user => 
        user._id === userId 
          ? { ...user, status: newStatus as 'pending' | 'active' | 'deleted' }
          : user
      )
    );

    try {
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
        throw new Error('Error al actualizar estado');
      }

      toast.success('Estado actualizado correctamente');
    } catch (error) {
      setUsers(previousUsers);
      toast.error('Error al actualizar estado');
    }
  };

  const updateUserInfo = async (userId: string, name: string, email: string) => {
    const previousUsers = [...users];
    
    setUsers(prevUsers => 
      prevUsers.map(user => 
        user._id === userId 
          ? { ...user, name, email }
          : user
      )
    );

    try {
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
        throw new Error('Error al actualizar usuario');
      }

      setShowEditModal(false);
      toast.success('Usuario actualizado correctamente');
    } catch (error) {
      setUsers(previousUsers);
      toast.error('Error al actualizar usuario');
    }
  };

  const deleteUser = async (userId: string) => {
    const previousUsers = [...users];
    
    setUsers(prevUsers => prevUsers.filter(user => user._id !== userId));

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al eliminar usuario');
      }

      setShowDeleteModal(false);
      setUserToDelete(null);
      toast.success('Usuario eliminado correctamente');
    } catch (error) {
      setUsers(previousUsers);
      toast.error('Error al eliminar usuario');
    }
  };

  const clearFilters = () => {
    setSearchRut('');
    setSearchName('');
    setSearchEmail('');
    setRoleFilter('all');
    setCommerceFilter('all');
    setStatusFilter('all');
    setRutError('');
  };

  const copyRut = (user: User) => {
    const value = `${formatRut(user.rut || '')} | ${user._id}`;
    navigator.clipboard.writeText(value)
      .then(() => toast.success('Copiado'))
      .catch(() => toast.error('No se pudo copiar'));
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
    const matchesRut = !searchRut || (user.rut && user.rut.toLowerCase().includes(searchRut.toLowerCase()));
    const matchesName = user.name.toLowerCase().includes(searchName.toLowerCase());
    const matchesEmail = user.email.toLowerCase().includes(searchEmail.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    const matchesCommerce = commerceFilter === 'all' || user.commerceId === commerceFilter;

    return matchesRut && matchesName && matchesEmail && matchesRole && matchesStatus && matchesCommerce;
  });

  return (
    <div className="p-4 lg:p-6 max-w-screen-2xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Gestionar Usuarios</h1>
        
        {/* Botón de filtros para móvil */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="lg:hidden flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
        >
          <Filter className="w-4 h-4" />
          Filtros
        </button>
      </div>
      
      {/* Panel de filtros */}
      <div className={`bg-white rounded-xl p-4 lg:p-6 mb-6 transition-all duration-300 ${
        showFilters || window.innerWidth >= 1024 ? 'block' : 'hidden lg:block'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-700">Filtros de búsqueda</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={clearFilters}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Limpiar filtros
            </button>
            <button
              onClick={() => setShowFilters(false)}
              className="lg:hidden text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {/* Filtro RUT */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">RUT</label>
            <div className="relative">
              <input
                type="text"
                value={searchRut}
                onChange={(e) => setSearchRut(e.target.value)}
                className={`w-full rounded-lg border shadow-sm focus:ring-2 focus:ring-emerald-500 pl-10 pr-4 py-2.5 transition-all duration-200 bg-white hover:bg-gray-50 ${
                  rutError ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-emerald-500'
                }`}
                placeholder="12.345.678-9"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
            {rutError && (
              <p className="text-xs text-red-600 mt-1">{rutError}</p>
            )}
          </div>
          
          {/* Filtro Nombre */}
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
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </div>
          
          {/* Filtro Email */}
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
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </div>
          
          {/* Filtro Rol */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Rol</label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 px-4 py-2.5 bg-white hover:bg-gray-50 transition-all duration-200"
            >
              <option value="all">Todos los roles</option>
              <option value="admin">Administrador</option>
              <option value="commerce">Comercio</option>
              <option value="user">Usuario</option>
            </select>
          </div>
          
          {/* Filtro Comercio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Comercio</label>
            <select
              value={commerceFilter}
              onChange={(e) => setCommerceFilter(e.target.value)}
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 px-4 py-2.5 bg-white hover:bg-gray-50 transition-all duration-200"
            >
              <option value="all">Todos los comercios</option>
              {commerces.map((commerce) => (
                <option key={commerce._id} value={commerce._id}>{commerce.name}</option>
              ))}
            </select>
          </div>
          
          {/* Filtro Estado */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 px-4 py-2.5 bg-white hover:bg-gray-50 transition-all duration-200"
            >
              <option value="all">Todos los estados</option>
              <option value="active">Activo</option>
              <option value="pending">Pendiente</option>
              <option value="deleted">Eliminado</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Tabla responsive */}
      <div className="bg-white rounded-lg overflow-hidden">
        {/* Vista móvil - Cards */}
        <div className="lg:hidden">
          {filteredUsers.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No se encontraron usuarios
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <div key={user._id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <button
                          onClick={() => copyRut(user)}
                          className="p-1.5 rounded-md border border-gray-300 hover:bg-gray-50 text-gray-600"
                          title="Copiar"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <span className="text-sm font-medium text-gray-900 truncate">
                          {formatRut(user.rut || '')}
                        </span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          user.status === 'active' ? 'bg-green-100 text-green-800' :
                          user.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {user.status === 'active' ? 'Activo' :
                           user.status === 'pending' ? 'Pendiente' : 'Eliminado'}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                      <p className="text-sm text-gray-500 truncate">{user.email}</p>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <button
                        onClick={() => {
                          setEditingUser(user);
                          setShowEditModal(true);
                        }}
                        className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setUserToDelete(user);
                          setShowDeleteModal(true);
                        }}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-2">
                    <div>
                      <label className="text-xs text-gray-500">Rol</label>
                      <select
                        value={user.role}
                        onChange={(e) => updateUserRole(user._id, e.target.value)}
                        className="w-full text-sm border border-gray-300 rounded px-2 py-1 mt-1"
                      >
                        <option value="user">Usuario</option>
                        <option value="commerce">Comercio</option>
                        <option value="admin">Administrador</option>
                      </select>
                    </div>
                    
                    {user.role === 'commerce' && (
                      <div>
                        <label className="text-xs text-gray-500">Comercio</label>
                        <div className="flex items-center gap-2 mt-1">
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
                            className="flex-1 text-sm border border-gray-300 rounded px-2 py-1"
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
                              className="p-1 text-red-500 hover:text-red-700 transition-colors"
                              title="Quitar comercio"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Agregar esta nueva sección para el estado */}
                    <div>
                      <label className="text-xs text-gray-500">Estado</label>
                      <select
                        value={user.status}
                        onChange={(e) => updateUserStatus(user._id, e.target.value)}
                        className="w-full text-sm border border-gray-300 rounded px-2 py-1 mt-1"
                      >
                        <option value="pending">Pendiente</option>
                        <option value="active">Activo</option>
                        <option value="deleted">Eliminado</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Vista desktop - Tabla */}
        <div className="hidden lg:block">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">RUT</th>
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
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => copyRut(user)}
                        className="p-1.5 rounded-md border border-gray-300 hover:bg-gray-50 text-gray-600"
                        title="Copiar"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <div className="text-sm font-medium text-gray-900">
                        {formatRut(user.rut || '')}
                      </div>
                    </div>
                  </td>
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
                            title="Quitar comercio"
                          >
                            <X className="w-5 h-5" />
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
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setEditingUser(user);
                          setShowEditModal(true);
                        }}
                        className="text-emerald-600 hover:text-emerald-900 transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setUserToDelete(user);
                          setShowDeleteModal(true);
                        }}
                        className="text-red-600 hover:text-red-900 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de edición */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Editar Usuario</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const name = formData.get('name') as string;
                const email = formData.get('email') as string;
                updateUserInfo(editingUser._id, name, email);
              }}
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                  <input
                    type="text"
                    name="name"
                    defaultValue={editingUser.name}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    defaultValue={editingUser.email}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de confirmación de eliminación */}
      {showDeleteModal && userToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Confirmar Eliminación</h3>
            <p className="text-gray-600 mb-6">
              ¿Estás seguro de que quieres eliminar al usuario <strong>{userToDelete.name}</strong>?
              Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => deleteUser(userToDelete._id)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;