'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { API_BASE_URL } from '@/config/api'

interface Log {
  _id: string
  userId: string
  username: string
  action: 'CREATE' | 'UPDATE' | 'DELETE'
  resourceType: string
  resourceId: string
  details: string
  createdAt: string
}

export default function LogsViewer() {
  const router = useRouter()
  const [logs, setLogs] = useState<Log[]>([])
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>('ALL')
  const [roleFilter, setRoleFilter] = useState<string>('ALL')

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          router.push('/views/auth/login')
          return
        }

        const response = await fetch(`${API_BASE_URL}/api/logs`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (response.status === 401) {
          localStorage.removeItem('token')
          router.push('/views/auth/login')
          return
        }

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        setLogs(data.logs)
      } catch (error) {
        console.error('Error al obtener logs:', error)
        setError('Error al cargar los logs. Por favor, intente mas tarde.')
      }
    }

    fetchLogs()
    const interval = setInterval(fetchLogs, 30000)
    return () => clearInterval(interval)
  }, [router])

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE': return 'bg-green-500'
      case 'UPDATE': return 'bg-yellow-500'
      case 'DELETE': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return 'Fecha invalida'
    return date.toLocaleString('es-ES', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    })
  }

  const filteredLogs = filter === 'ALL' 
    ? logs 
    : logs.filter(log => log.action === filter)

  const roleFilteredLogs = roleFilter === 'ALL'
    ? filteredLogs
    : roleFilter === 'ADMIN'
      ? filteredLogs.filter(log => log.username === 'admin')
      : filteredLogs.filter(log => log.username !== 'admin')

  return (
    <div className="w-full">
      <div className="max-w-7xl mx-auto space-y-4 ">
        {/* Header */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">Registro de Actividades</h1>
          <p className="mt-1 text-sm text-gray-600">
            Historial de acciones realizadas en el sistema
          </p>

          {/* Barra de filtros */}
          <div className="mt-4 flex items-center gap-4 flex-wrap">
            {/* Filtros de Rol */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-700 font-medium">Usuarios:</span>
              <div className="inline-flex rounded-lg shadow-sm">
                {[
                  { id: 'ALL', icon: '👥', label: 'Todos' },
                  { id: 'ADMIN', icon: '👨‍💼', label: 'Admin' },
                  { id: 'USER', icon: '👤', label: 'Usuario' }
                ].map((role, idx) => (
                  <button
                    key={role.id}
                    onClick={() => setRoleFilter(role.id)}
                    className={`
                      px-3 py-1.5 text-sm font-medium border
                      ${idx === 0 ? 'rounded-l-lg' : ''} 
                      ${idx === 2 ? 'rounded-r-lg' : ''}
                      ${roleFilter === role.id 
                        ? 'bg-blue-50 text-blue-600 border-blue-200 z-10' 
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}
                    `}
                  >
                    <span className="flex items-center gap-1">
                      {role.icon} {role.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            

            {/* Filtros de Accion */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-700 font-medium">Acciones:</span>
              <div className="inline-flex rounded-lg shadow-sm">
                {[
                  { id: 'ALL', label: 'Todas' },
                  { id: 'CREATE', label: 'Crear' },
                  { id: 'UPDATE', label: 'Editar' },
                  { id: 'DELETE', label: 'Borrar' }
                ].map((action, idx) => (
                  <button
                    key={action.id}
                    onClick={() => setFilter(action.id)}
                    className={`
                      px-3 py-1.5 text-sm font-medium border
                      ${idx === 0 ? 'rounded-l-lg' : ''} 
                      ${idx === 3 ? 'rounded-r-lg' : ''}
                      ${filter === action.id 
                        ? `${action.id !== 'ALL' ? getActionColor(action.id) : 'bg-gray-800'} text-white` 
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}
                    `}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Container de logs */}
        {error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {roleFilteredLogs.length === 0 ? (
              <div className="text-gray-500 text-center py-8 text-sm">
                No hay registros disponibles
              </div>
            ) : (
              <div className="h-[560px] sm:h-[620px] md:h-[760px] overflow-y-auto">
                <div className="divide-y divide-gray-200">
                  {roleFilteredLogs.map((log) => (
                    <div key={log._id} className="p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium text-white
                            ${getActionColor(log.action)}`}>
                            {log.action}
                          </span>
                          <span className="font-medium text-gray-900 text-sm">
                            @{log.username}
                          </span>
                        </div>
                        <time className="text-sm text-gray-500">
                          {formatDate(log.createdAt)}
                        </time>
                      </div>
                      <p className="mt-2 text-sm text-gray-900">{log.details}</p>
                      <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                        <span className="font-medium">{log.resourceType}</span>
                        <span>•</span>
                        <code className="font-mono">ID: {log.resourceId}</code>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
