'use client';

import { useEffect, useState } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer 
} from 'recharts';
import axios from 'axios';
import { useSearchParams, useRouter } from 'next/navigation';

interface CommerceByCategory {
  category: string;
  count: number;
}

interface UserStats {
  role: string;
  active: number;
  inactive: number;
}

interface UserAnalyticsCommerce {
  commerceId: string;
  name: string;
  totalTimeMs: number;
  visits: number;
  lastVisit: string;
}

interface UserAnalyticsCategory {
  categoryId: string;
  name: string;
  totalTimeMs: number;
  visits: number;
  lastVisit: string;
}

interface UserAnalyticsResponse {
  commerce: UserAnalyticsCommerce[];
  categories: UserAnalyticsCategory[];
  socialClicks: { platform: string; clicks: number }[];
  mapClicks: number;
  contactClicks: { type: string; clicks: number }[];
}

export default function Analytics() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [commerceData, setCommerceData] = useState<CommerceByCategory[]>([]);
  const [userData, setUserData] = useState<UserStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [totals, setTotals] = useState({
    totalCommerces: 0,
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0
  });

  const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444'];

  // Control de paneles
  const [activePanel, setActivePanel] = useState<'admin' | 'category' | 'commerce' | 'users'>('admin');
  const [selectedCategoryView, setSelectedCategoryView] = useState<string>('all');
  const [selectedCommerceId, setSelectedCommerceId] = useState<string>('');
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [userAnalytics, setUserAnalytics] = useState<UserAnalyticsResponse | null>(null);
  const [userLoading, setUserLoading] = useState<boolean>(false);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Opciones de categorías (derivadas de los datos existentes)
  const categoryOptions = Array.from(new Set(commerceData.map(c => c.category)));

  // Datos demo para previsualización de diseño (se conectarán a endpoints reales)
  const sampleVisitsByMonth = [
    { month: 'Ene', visits: 1200 }, { month: 'Feb', visits: 1350 }, { month: 'Mar', visits: 1500 },
    { month: 'Abr', visits: 1420 }, { month: 'May', visits: 1600 }, { month: 'Jun', visits: 1780 }
  ];

  const sampleDeviceDistribution = [
    { name: 'Móvil', value: 65 }, { name: 'Desktop', value: 30 }, { name: 'Tablet', value: 5 }
  ];

  const sampleActionCtr = [
    { action: 'Teléfono', ctr: 8.2 }, 
    { action: 'WhatsApp', ctr: 12.4 },
    { action: 'Email', ctr: 3.1 }, 
    { action: 'Web', ctr: 5.6 }, 
    { action: 'Cómo llegar', ctr: 9.8 }
  ];

  const sampleRetention = [
    { cohort: '7 días', value: 32 }, 
    { cohort: '30 días', value: 18 }
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No token found');

        const [commerceResponse, userResponse] = await Promise.all([
          axios.get('/api/analytics/commerce-by-category', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get('/api/analytics/user-stats', {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        setCommerceData(commerceResponse.data);
        setUserData(userResponse.data);

        // Calcular totales
        const totalCommerces = commerceResponse.data
          .reduce((sum: number, item: CommerceByCategory) => sum + item.count, 0);
        const userTotals = userResponse.data.reduce((acc: any, curr: UserStats) => ({
          total: acc.total + curr.active + curr.inactive,
          active: acc.active + curr.active,
          inactive: acc.inactive + curr.inactive
        }), { total: 0, active: 0, inactive: 0 });

        setTotals({
          totalCommerces,
          totalUsers: userTotals.total,
          activeUsers: userTotals.active,
          inactiveUsers: userTotals.inactive
        });
      } catch (error) {
        console.error('Error al obtener datos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const p = (searchParams?.get('panel') as any) || 'admin';
    if (p !== activePanel) setActivePanel(p);
  }, [searchParams]);

  const setPanel = (p: 'admin' | 'category' | 'commerce' | 'users') => {
    setActivePanel(p);
    const url = new URL(window.location.href);
    url.searchParams.set('panel', p);
    router.replace(url.pathname + '?' + url.searchParams.toString());
  };

  const formatDuration = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    const parts = [h > 0 ? `${h}h` : null, m > 0 ? `${m}m` : null, h === 0 && m === 0 ? `${s}s` : null].filter(Boolean);
    return parts.join(' ');
  };

  const fetchUserAnalytics = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token || !selectedUserId) return;
      setUserLoading(true);
      setUserAnalytics(null);
      const res = await axios.get(`/api/analytics/user/${selectedUserId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserAnalytics(res.data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error al obtener analítica de usuario:', err);
    } finally {
      setUserLoading(false);
    }
  };

  const fetchMyAnalytics = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      setUserLoading(true);
      setUserAnalytics(null);
      const res = await axios.get(`/api/analytics/user`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserAnalytics(res.data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error al obtener mi analítica:', err);
    } finally {
      setUserLoading(false);
    }
  };

  useEffect(() => {
    let interval: any;
    if (autoRefresh) {
      interval = setInterval(() => {
        if (selectedUserId) fetchUserAnalytics();
        else fetchMyAnalytics();
      }, 5000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, selectedUserId]);

  const prepareUserDataForPieChart = () => {
    return userData.map(user => ({
      name: user.role.charAt(0).toUpperCase() + user.role.slice(1),
      value: user.active + user.inactive,
      active: user.active,
      inactive: user.inactive
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      {/* Selector de panel (solo móvil) */}
    <div className="flex w-full justify-center lg:hidden">
      <div className="inline-flex items-center gap-1 rounded-2xl border border-neutral-200 bg-neutral-50/80 p-1.5 shadow-sm backdrop-blur dark:border-neutral-700 dark:bg-neutral-900/70">
        <button
          type="button"
          onClick={() => setPanel('admin')}
          aria-pressed={activePanel === 'admin'}
          className={`px-4 sm:px-5 py-2 text-sm font-medium rounded-xl transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 ${
            activePanel === 'admin'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm'
              : 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800'
          }`}
        >
          Admin
        </button>
        <button
          type="button"
          onClick={() => setPanel('category')}
          aria-pressed={activePanel === 'category'}
          className={`px-4 sm:px-5 py-2 text-sm font-medium rounded-xl transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 ${
            activePanel === 'category'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm'
              : 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800'
          }`}
        >
          Categoría
        </button>
        <button
          type="button"
          onClick={() => setPanel('commerce')}
          aria-pressed={activePanel === 'commerce'}
          className={`px-4 sm:px-5 py-2 text-sm font-medium rounded-xl transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 ${
            activePanel === 'commerce'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm'
              : 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800'
          }`}
        >
          Comercio
        </button>
        <button
          type="button"
          onClick={() => setPanel('users')}
          aria-pressed={activePanel === 'users'}
          className={`px-4 sm:px-5 py-2 text-sm font-medium rounded-xl transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 ${
            activePanel === 'users'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm'
              : 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800'
          }`}
        >
          Usuarios
        </button>
      </div>
    </div>

      {/* Panel ADMIN: visión global, conserva gráficos existentes */}
      {activePanel === 'admin' && (
        <>
          <div className="mb-2">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Panel Admin</h1>
            <p className="text-gray-600">Visión global del ecosistema</p>
          </div>

          {/* KPIs principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Comercios</h3>
              <p className="text-4xl font-bold text-emerald-500">{totals.totalCommerces}</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Usuarios</h3>
              <p className="text-4xl font-bold text-blue-500">{totals.totalUsers}</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Usuarios Activos</h3>
              <p className="text-4xl font-bold text-emerald-500">{totals.activeUsers}</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Usuarios Inactivos</h3>
              <p className="text-4xl font-bold text-red-500">{totals.inactiveUsers}</p>
            </div>
          </div>

          {/* Actividad general (demo) */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h3 className="text-sm font-medium text-gray-700 mb-1">Crecimiento 7 días</h3>
              <p className="text-2xl font-bold text-gray-900">+8%</p>
              <p className="text-xs text-gray-500">Demo</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h3 className="text-sm font-medium text-gray-700 mb-1">Crecimiento 30 días</h3>
              <p className="text-2xl font-bold text-gray-900">+21%</p>
              <p className="text-xs text-gray-500">Demo</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h3 className="text-sm font-medium text-gray-700 mb-1">Nuevos comercios (mes)</h3>
              <p className="text-2xl font-bold text-gray-900">34</p>
              <p className="text-xs text-gray-500">Demo</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h3 className="text-sm font-medium text-gray-700 mb-1">Fichas incompletas</h3>
              <p className="text-2xl font-bold text-gray-900">12%</p>
              <p className="text-xs text-gray-500">Demo</p>
            </div>
          </div>

          {/* Gráfico: Comercios por Categoría (existente) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h2 className="text-xl font-semibold mb-6 text-gray-700">Comercios por Categoría</h2>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={commerceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="category" tick={{ fill: '#4B5563' }} axisLine={{ stroke: '#9CA3AF' }} />
                    <YAxis tick={{ fill: '#4B5563' }} axisLine={{ stroke: '#9CA3AF' }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#FFFFFF', 
                        border: '1px solid #E5E7EB', 
                        borderRadius: '0.5rem', 
                        padding: '0.5rem' 
                      }} 
                    />
                    <Legend />
                    <Bar dataKey="count" fill="#10B981" name="Cantidad" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Gráfico: Estados de Usuarios por Rol (existente) */}
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h2 className="text-xl font-semibold mb-6 text-gray-700">Estados de Usuarios por Rol</h2>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={prepareUserDataForPieChart()}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={150}
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {prepareUserDataForPieChart().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E5E7EB',
                        borderRadius: '0.5rem',
                        padding: '0.5rem'
                      }}
                      formatter={(value: any, name: any, props: any) => {
                        const data = props.payload;
                        return [
                          `Total: ${value}
                          Activos: ${data.active}
                          Inactivos: ${data.inactive}`,
                          name
                        ];
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Operativo / Sistema (demo) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h3 className="text-sm font-semibold text-gray-700">Web Vitals (LCP)</h3>
              <div className="mt-2 h-3 bg-gray-100 rounded">
                <div className="h-3 bg-emerald-500 rounded" style={{ width: '72%' }} />
              </div>
              <p className="text-xs text-gray-500 mt-2">Demo: 2.1s</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h3 className="text-sm font-semibold text-gray-700">Errores por dispositivo</h3>
              <p className="text-2xl font-bold text-gray-900 mt-2">Bajo</p>
              <p className="text-xs text-gray-500">Demo</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h3 className="text-sm font-semibold text-gray-700">Alertas</h3>
              <p className="text-2xl font-bold text-gray-900 mt-2">Sin alertas</p>
              <p className="text-xs text-gray-500">Demo</p>
            </div>
          </div>

          {/* Benchmarking global (demo) */}
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">Top 10 Comercios (Tráfico/Conversión)</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500">
                    <th className="py-2">Comercio</th>
                    <th className="py-2">Categoría</th>
                    <th className="py-2">Visitas</th>
                    <th className="py-2">Conversión</th>
                  </tr>
                </thead>
                <tbody className="text-gray-700">
                  {[...Array(10)].map((_, i) => (
                    <tr key={i} className="border-t">
                      <td className="py-2">Demo Comercio #{i + 1}</td>
                      <td className="py-2">Categoría X</td>
                      <td className="py-2">{(Math.random() * 5000 + 1000).toFixed(0)}</td>
                      <td className="py-2">{(Math.random() * 12 + 3).toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Panel por Categoría */}
      {activePanel === 'category' && (
        <>
          <div className="mb-2">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Métricas por Categoría</h1>
            <p className="text-gray-600">Desempeño de grupos de comercios similares</p>
          </div>

          {/* Filtros */}
          <div className="bg-white p-4 rounded-xl shadow flex flex-wrap gap-4 items-center">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Categoría</label>
              <select
                value={selectedCategoryView}
                onChange={(e) => setSelectedCategoryView(e.target.value)}
                className="px-3 py-2 border rounded-lg"
              >
                <option value="all">Todas</option>
                {categoryOptions.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Periodo</label>
              <select className="px-3 py-2 border rounded-lg" defaultValue="30d">
                <option value="7d">Últimos 7 días</option>
                <option value="30d">Últimos 30 días</option>
                <option value="90d">Últimos 90 días</option>
              </select>
            </div>
          </div>

          {/* Visibilidad y tráfico */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h2 className="text-xl font-semibold mb-6 text-gray-700">Visitas por Mes</h2>
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sampleVisitsByMonth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="month" tick={{ fill: '#4B5563' }} axisLine={{ stroke: '#9CA3AF' }} />
                    <YAxis tick={{ fill: '#4B5563' }} axisLine={{ stroke: '#9CA3AF' }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#FFFFFF', 
                        border: '1px solid #E5E7EB', 
                        borderRadius: '0.5rem', 
                        padding: '0.5rem' 
                      }} 
                    />
                    <Legend />
                    <Bar dataKey="visits" fill="#3B82F6" name="Visitas" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h2 className="text-xl font-semibold mb-6 text-gray-700">Distribución por Dispositivo</h2>
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie 
                      data={sampleDeviceDistribution} 
                      dataKey="value" 
                      nameKey="name" 
                      cx="50%" 
                      cy="50%" 
                      outerRadius={120} 
                      label 
                    />
                    {sampleDeviceDistribution.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#FFFFFF', 
                        border: '1px solid #E5E7EB', 
                        borderRadius: '0.5rem', 
                        padding: '0.5rem' 
                      }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Conversión y Retención */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h2 className="text-xl font-semibold mb-6 text-gray-700">CTR por Acción</h2>
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sampleActionCtr}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="action" tick={{ fill: '#4B5563' }} axisLine={{ stroke: '#9CA3AF' }} />
                    <YAxis tick={{ fill: '#4B5563' }} axisLine={{ stroke: '#9CA3AF' }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#FFFFFF', 
                        border: '1px solid #E5E7EB', 
                        borderRadius: '0.5rem', 
                        padding: '0.5rem' 
                      }} 
                    />
                    <Legend />
                    <Bar dataKey="ctr" fill="#F59E0B" name="CTR (%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h2 className="text-xl font-semibold mb-6 text-gray-700">Retención (Cohortes)</h2>
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sampleRetention}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="cohort" tick={{ fill: '#4B5563' }} axisLine={{ stroke: '#9CA3AF' }} />
                    <YAxis tick={{ fill: '#4B5563' }} axisLine={{ stroke: '#9CA3AF' }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#FFFFFF', 
                        border: '1px solid #E5E7EB', 
                        borderRadius: '0.5rem', 
                        padding: '0.5rem' 
                      }} 
                    />
                    <Legend />
                    <Bar dataKey="value" fill="#10B981" name="Retención (%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Panel por Comercio */}
      {activePanel === 'commerce' && (
        <>
          <div className="mb-2">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Métricas por Comercio</h1>
            <p className="text-gray-600">Informe individual para entregar al comercio</p>
          </div>

          {/* Filtro comercio */}
          <div className="bg-white p-4 rounded-xl shadow flex flex-wrap gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm text-gray-700 mb-1">ID o Nombre del Comercio</label>
              <input
                value={selectedCommerceId}
                onChange={(e) => setSelectedCommerceId(e.target.value)}
                placeholder="Ej: 66f... o 'Panadería Luna'"
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
              Buscar
            </button>
          </div>

          {/* Nota si no hay comercio seleccionado */}
          {!selectedCommerceId && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded mt-4">
              Selecciona un comercio para ver las métricas demo de su ficha.
            </div>
          )}

          {/* Bloques demo de métricas */}
          {selectedCommerceId && (
            <>
              {/* Adquisición de tráfico e Interacción */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
                <div className="bg-white p-6 rounded-xl shadow-lg">
                  <h2 className="text-xl font-semibold mb-6 text-gray-700">Visitas por Mes</h2>
                  <div className="h-[320px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={sampleVisitsByMonth}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                        <XAxis dataKey="month" tick={{ fill: '#4B5563' }} axisLine={{ stroke: '#9CA3AF' }} />
                        <YAxis tick={{ fill: '#4B5563' }} axisLine={{ stroke: '#9CA3AF' }} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#FFFFFF', 
                            border: '1px solid #E5E7EB', 
                            borderRadius: '0.5rem', 
                            padding: '0.5rem' 
                          }} 
                        />
                        <Legend />
                        <Bar dataKey="visits" fill="#3B82F6" name="Visitas" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-lg">
                  <h2 className="text-xl font-semibold mb-6 text-gray-700">Distribución por Dispositivo</h2>
                  <div className="h-[320px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie 
                          data={sampleDeviceDistribution} 
                          dataKey="value" 
                          nameKey="name" 
                          cx="50%" 
                          cy="50%" 
                          outerRadius={120} 
                          label 
                        />
                        {sampleDeviceDistribution.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#FFFFFF', 
                            border: '1px solid #E5E7EB', 
                            borderRadius: '0.5rem', 
                            padding: '0.5rem' 
                          }} 
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Conversión y Embudo */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
                <div className="bg-white p-6 rounded-xl shadow-lg">
                  <h2 className="text-xl font-semibold mb-6 text-gray-700">CTR por Acción</h2>
                  <div className="h-[320px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={sampleActionCtr}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                        <XAxis dataKey="action" tick={{ fill: '#4B5563' }} axisLine={{ stroke: '#9CA3AF' }} />
                        <YAxis tick={{ fill: '#4B5563' }} axisLine={{ stroke: '#9CA3AF' }} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#FFFFFF', 
                            border: '1px solid #E5E7EB', 
                            borderRadius: '0.5rem', 
                            padding: '0.5rem' 
                          }} 
                        />
                        <Legend />
                        <Bar dataKey="ctr" fill="#F59E0B" name="CTR (%)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-lg">
                  <h2 className="text-xl font-semibold mb-6 text-gray-700">Retención (Frecuencia/Recencia)</h2>
                  <div className="h-[320px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={sampleRetention}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                        <XAxis dataKey="cohort" tick={{ fill: '#4B5563' }} axisLine={{ stroke: '#9CA3AF' }} />
                        <YAxis tick={{ fill: '#4B5563' }} axisLine={{ stroke: '#9CA3AF' }} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#FFFFFF', 
                            border: '1px solid #E5E7EB', 
                            borderRadius: '0.5rem', 
                            padding: '0.5rem' 
                          }} 
                        />
                        <Legend />
                        <Bar dataKey="value" fill="#10B981" name="Retención (%)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* KPIs rápidos */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
                <div className="bg-white p-6 rounded-xl shadow-lg">
                  <h3 className="text-sm font-medium text-gray-700 mb-1">Tasa de rebote</h3>
                  <p className="text-2xl font-bold text-gray-900">28%</p>
                  <p className="text-xs text-gray-500">Demo</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-lg">
                  <h3 className="text-sm font-medium text-gray-700 mb-1">Favoritos / visita</h3>
                  <p className="text-2xl font-bold text-gray-900">3.4%</p>
                  <p className="text-xs text-gray-500">Demo</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-lg">
                  <h3 className="text-sm font-medium text-gray-700 mb-1">Conversión total</h3>
                  <p className="text-2xl font-bold text-gray-900">9.7%</p>
                  <p className="text-xs text-gray-500">Demo</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-lg">
                  <h3 className="text-sm font-medium text-gray-700 mb-1">DAU/MAU</h3>
                  <div className="mt-2 h-3 bg-gray-100 rounded">
                    <div className="h-3 bg-blue-500 rounded" style={{ width: '38%' }} />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Demo: 0.38</p>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* Panel Usuarios: generales + búsqueda por usuario */}
      {activePanel === 'users' && (
        <>
          <div className="mb-2">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Usuarios</h1>
            <p className="text-gray-600">Estadísticas generales y por usuario</p>
          </div>

          {/* Generales de usuarios */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Usuarios por rol</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500">
                    <th className="py-1">Rol</th>
                    <th className="py-1">Activos</th>
                    <th className="py-1">Inactivos</th>
                  </tr>
                </thead>
                <tbody className="text-gray-700">
                  {userData.map((u) => (
                    <tr key={u.role} className="border-t">
                      <td className="py-1 capitalize">{u.role}</td>
                      <td className="py-1">{u.active}</td>
                      <td className="py-1">{u.inactive}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Totales</h3>
              <div className="space-y-2 text-gray-800">
                <p>Total usuarios: <span className="font-bold">{totals.totalUsers}</span></p>
                <p>Activos: <span className="font-bold text-emerald-600">{totals.activeUsers}</span></p>
                <p>Inactivos: <span className="font-bold text-red-600">{totals.inactiveUsers}</span></p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Comercios por categoría</h3>
              <div className="max-h-48 overflow-y-auto">
                <ul className="text-sm text-gray-700">
                  {commerceData.map(c => (
                    <li key={c.category} className="flex justify-between py-1 border-b">
                      <span>{c.category}</span>
                      <span className="font-medium">{c.count}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Búsqueda por usuario */}
          <div className="bg-white p-4 rounded-xl shadow flex flex-wrap gap-4 items-end mt-6">
            <div className="flex-1">
              <label className="block text-sm text-gray-700 mb-1">ID de Usuario</label>
              <input
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                placeholder="Ej: 66f..."
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <button
              onClick={fetchUserAnalytics}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Buscar
            </button>
            <button
              onClick={fetchMyAnalytics}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Mi usuario
            </button>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} />
              Auto-actualizar
            </label>
          </div>

          {/* Resultado por usuario */}
          {userLoading && (
            <div className="flex justify-center items-center py-6">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-emerald-500"></div>
            </div>
          )}

          {userAnalytics && !userLoading && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
              {lastUpdated && (
                <div className="col-span-1 lg:col-span-2 text-right text-xs text-gray-500">Actualizado: {lastUpdated.toLocaleTimeString()}</div>
              )}
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <h2 className="text-xl font-semibold mb-4 text-gray-700">Top Comercios por tiempo</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-500">
                        <th className="py-2">Comercio</th>
                        <th className="py-2">Tiempo</th>
                        <th className="py-2">Visitas</th>
                        <th className="py-2">Última visita</th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-700">
                      {userAnalytics.commerce.map((item) => (
                        <tr key={String(item.commerceId)} className="border-t">
                          <td className="py-2">{item.name}</td>
                          <td className="py-2">{formatDuration(item.totalTimeMs)}</td>
                          <td className="py-2">{item.visits}</td>
                          <td className="py-2">{new Date(item.lastVisit).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-lg">
                <h2 className="text-xl font-semibold mb-4 text-gray-700">Top Categorías por tiempo</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-500">
                        <th className="py-2">Categoría</th>
                        <th className="py-2">Tiempo</th>
                        <th className="py-2">Visitas</th>
                        <th className="py-2">Última visita</th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-700">
                      {userAnalytics.categories.map((item) => (
                        <tr key={String(item.categoryId)} className="border-t">
                          <td className="py-2">{item.name}</td>
                          <td className="py-2">{formatDuration(item.totalTimeMs)}</td>
                          <td className="py-2">{item.visits}</td>
                          <td className="py-2">{new Date(item.lastVisit).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-lg">
                <h2 className="text-xl font-semibold mb-4 text-gray-700">Clicks en redes sociales</h2>
                <ul className="text-sm text-gray-700">
                  {userAnalytics.socialClicks.map((s) => (
                    <li key={String(s.platform)} className="flex justify-between py-1 border-b">
                      <span className="capitalize">{String(s.platform)}</span>
                      <span className="font-medium">{s.clicks}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-lg">
                <h2 className="text-xl font-semibold mb-4 text-gray-700">Clicks de contacto y mapa</h2>
                <ul className="text-sm text-gray-700 mb-2">
                  {userAnalytics.contactClicks.map((c) => (
                    <li key={String(c.type)} className="flex justify-between py-1 border-b">
                      <span className="capitalize">{String(c.type)}</span>
                      <span className="font-medium">{c.clicks}</span>
                    </li>
                  ))}
                </ul>
                <div className="text-sm text-gray-700">
                  <span>Mapa (clicks): </span>
                  <span className="font-medium">{userAnalytics.mapClicks}</span>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
