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
import { ChevronLeft, ChevronRight, Search, ArrowUpDown, X } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import axios from 'axios';

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

  // Top Comercios State
  const [topCommerces, setTopCommerces] = useState<any[]>([]);
  const [topCommercesLoading, setTopCommercesLoading] = useState(false);
  const [topCommercesPage, setTopCommercesPage] = useState(1);
  const [topCommercesTotalPages, setTopCommercesTotalPages] = useState(1);
  const [topCommercesSortBy, setTopCommercesSortBy] = useState('visits');
  const [topCommercesSortOrder, setTopCommercesSortOrder] = useState<'asc' | 'desc'>('desc');
  const [topCommercesSearch, setTopCommercesSearch] = useState('');
  const [debouncedSearch] = useDebounce(topCommercesSearch, 500);

  // Category Analytics State
  const [categoryAnalytics, setCategoryAnalytics] = useState<any>(null);
  const [categoryAnalyticsLoading, setCategoryAnalyticsLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');

  // Commerce Analytics State
  const [commerceAnalytics, setCommerceAnalytics] = useState<any>(null);
  const [commerceAnalyticsLoading, setCommerceAnalyticsLoading] = useState(false);
  
  // Commerce Search State
  const [commerceSearchTerm, setCommerceSearchTerm] = useState('');
  const [debouncedCommerceSearch] = useDebounce(commerceSearchTerm, 300);
  const [commerceSuggestions, setCommerceSuggestions] = useState<any[]>([]);
  const [showCommerceSuggestions, setShowCommerceSuggestions] = useState(false);
  const [selectedCommerceName, setSelectedCommerceName] = useState('');
  const [selectedCommerceCategory, setSelectedCommerceCategory] = useState('');

  // Fetch suggestions when debounced search changes
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!debouncedCommerceSearch || debouncedCommerceSearch.length < 2) {
        setCommerceSuggestions([]);
        return;
      }
      
      try {
        const token = localStorage.getItem('token');
        // Using top-commerces endpoint for search as it supports search param
        const res = await axios.get('/api/analytics/top-commerces', {
          params: {
            search: debouncedCommerceSearch,
            limit: 5 // Limit suggestions
          },
          headers: { Authorization: `Bearer ${token}` }
        });
        setCommerceSuggestions(res.data.data || []);
        setShowCommerceSuggestions(true);
      } catch (err) {
        console.error('Error fetching suggestions:', err);
      }
    };

    fetchSuggestions();
  }, [debouncedCommerceSearch]);

  const handleSelectCommerce = (commerce: any) => {
    setSelectedCommerceId(commerce._id);
    setSelectedCommerceName(commerce.name);
    setSelectedCommerceCategory(commerce.category);
    setCommerceSearchTerm(commerce.name); // Set input to name
    setShowCommerceSuggestions(false);
  };

  const clearCommerceSearch = () => {
    setCommerceSearchTerm('');
    setSelectedCommerceId('');
    setSelectedCommerceName('');
    setSelectedCommerceCategory('');
    setCommerceAnalytics(null);
    setCommerceSuggestions([]);
    setShowCommerceSuggestions(false);
  };

  const fetchCommerceAnalytics = async () => {
    try {
      setCommerceAnalyticsLoading(true);
      setCommerceAnalytics(null);
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/analytics/commerce-analytics', {
        params: {
          commerceId: selectedCommerceId,
          period: selectedPeriod
        },
        headers: { Authorization: `Bearer ${token}` }
      });
      setCommerceAnalytics(res.data);
    } catch (err) {
      console.error('Error fetching commerce analytics:', err);
    } finally {
      setCommerceAnalyticsLoading(false);
    }
  };

  useEffect(() => {
    if (activePanel === 'commerce' && selectedCommerceId) {
      fetchCommerceAnalytics();
    }
  }, [activePanel, selectedCommerceId, selectedPeriod]);

  const fetchCategoryAnalytics = async () => {
    try {
      setCategoryAnalyticsLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/analytics/category-analytics', {
        params: {
          category: selectedCategoryView,
          period: selectedPeriod
        },
        headers: { Authorization: `Bearer ${token}` }
      });
      setCategoryAnalytics(res.data);
    } catch (err) {
      console.error('Error fetching category analytics:', err);
    } finally {
      setCategoryAnalyticsLoading(false);
    }
  };

  useEffect(() => {
    if (activePanel === 'category') {
      fetchCategoryAnalytics();
    }
  }, [activePanel, selectedCategoryView, selectedPeriod]);

  const fetchTopCommerces = async () => {
    try {
      setTopCommercesLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/analytics/top-commerces', {
        params: {
          page: topCommercesPage,
          limit: 10,
          sortBy: topCommercesSortBy,
          sortOrder: topCommercesSortOrder,
          search: debouncedSearch
        },
        headers: { Authorization: `Bearer ${token}` }
      });
      setTopCommerces(res.data.data);
      setTopCommercesTotalPages(res.data.pages);
    } catch (err) {
      console.error('Error fetching top commerces:', err);
    } finally {
      setTopCommercesLoading(false);
    }
  };

  useEffect(() => {
    if (activePanel === 'admin') {
      fetchTopCommerces();
    }
  }, [activePanel, topCommercesPage, topCommercesSortBy, topCommercesSortOrder, debouncedSearch]);

  const handleSort = (field: string) => {
    if (topCommercesSortBy === field) {
      setTopCommercesSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setTopCommercesSortBy(field);
      setTopCommercesSortOrder('desc');
    }
  };

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
    <div className="md:p-6 space-y-6 md:space-y-8">
      {/* Pestañas de panel */}
    <div className="flex w-full justify-start md:justify-center overflow-x-auto pb-2">
      <div className="inline-flex items-center gap-1 rounded-2xl border border-neutral-200 bg-neutral-50/80 p-1.5 shadow-sm backdrop-blur dark:border-neutral-700 dark:bg-neutral-900/70 min-w-max">
        <button
          type="button"
          onClick={() => setActivePanel('admin')}
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
          onClick={() => setActivePanel('category')}
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
          onClick={() => setActivePanel('commerce')}
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
          onClick={() => setActivePanel('users')}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <div className="bg-white p-4 md:p-6 rounded-xl shadow-lg">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Comercios</h3>
              <p className="text-4xl font-bold text-emerald-500">{totals.totalCommerces}</p>
            </div>
            <div className="bg-white p-4 md:p-6 rounded-xl shadow-lg">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Usuarios</h3>
              <p className="text-4xl font-bold text-blue-500">{totals.totalUsers}</p>
            </div>
            <div className="bg-white p-4 md:p-6 rounded-xl shadow-lg">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Usuarios Activos</h3>
              <p className="text-4xl font-bold text-emerald-500">{totals.activeUsers}</p>
            </div>
            <div className="bg-white p-4 md:p-6 rounded-xl shadow-lg">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Usuarios Inactivos</h3>
              <p className="text-4xl font-bold text-red-500">{totals.inactiveUsers}</p>
            </div>
          </div>

          {/* Actividad general (demo) */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6">
            <div className="bg-white p-4 md:p-6 rounded-xl shadow-lg">
              <h3 className="text-sm font-medium text-gray-700 mb-1">Crecimiento 7 días</h3>
              <p className="text-2xl font-bold text-gray-900">+8%</p>
              <p className="text-xs text-gray-500">Demo</p>
            </div>
            <div className="bg-white p-4 md:p-6 rounded-xl shadow-lg">
              <h3 className="text-sm font-medium text-gray-700 mb-1">Crecimiento 30 días</h3>
              <p className="text-2xl font-bold text-gray-900">+21%</p>
              <p className="text-xs text-gray-500">Demo</p>
            </div>
            <div className="bg-white p-4 md:p-6 rounded-xl shadow-lg">
              <h3 className="text-sm font-medium text-gray-700 mb-1">Nuevos comercios (mes)</h3>
              <p className="text-2xl font-bold text-gray-900">34</p>
              <p className="text-xs text-gray-500">Demo</p>
            </div>
            <div className="bg-white p-4 md:p-6 rounded-xl shadow-lg">
              <h3 className="text-sm font-medium text-gray-700 mb-1">Fichas incompletas</h3>
              <p className="text-2xl font-bold text-gray-900">12%</p>
              <p className="text-xs text-gray-500">Demo</p>
            </div>
          </div>

          {/* Gráfico: Comercios por Categoría (existente) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
            <div className="bg-white p-4 md:p-6 rounded-xl shadow-lg">
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
            <div className="bg-white p-4 md:p-6 rounded-xl shadow-lg">
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            <div className="bg-white p-4 md:p-6 rounded-xl shadow-lg">
              <h3 className="text-sm font-semibold text-gray-700">Web Vitals (LCP)</h3>
              <div className="mt-2 h-3 bg-gray-100 rounded">
                <div className="h-3 bg-emerald-500 rounded" style={{ width: '72%' }} />
              </div>
              <p className="text-xs text-gray-500 mt-2">Demo: 2.1s</p>
            </div>
            <div className="bg-white p-4 md:p-6 rounded-xl shadow-lg">
              <h3 className="text-sm font-semibold text-gray-700">Errores por dispositivo</h3>
              <p className="text-2xl font-bold text-gray-900 mt-2">Bajo</p>
              <p className="text-xs text-gray-500">Demo</p>
            </div>
            <div className="bg-white p-4 md:p-6 rounded-xl shadow-lg">
              <h3 className="text-sm font-semibold text-gray-700">Alertas</h3>
              <p className="text-2xl font-bold text-gray-900 mt-2">Sin alertas</p>
              <p className="text-xs text-gray-500">Demo</p>
            </div>
          </div>

          {/* Top Comercios Real Data */}
          <div className="bg-white p-4 md:p-6 rounded-xl shadow-lg">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
              <h2 className="text-xl font-semibold text-gray-700">Top Comercios</h2>
              <div className="relative w-full md:w-64">
                <input
                  type="text"
                  placeholder="Buscar comercio..."
                  value={topCommercesSearch}
                  onChange={(e) => setTopCommercesSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
                <thead>
                  <tr className="text-left text-gray-500 border-b">
                    <th 
                      className="py-3 px-4 cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('name')}
                    >
                      <div className="flex items-center gap-1">
                        Comercio
                        <ArrowUpDown className="h-4 w-4" />
                      </div>
                    </th>
                    <th className="py-3 px-4">Categoría</th>
                    <th 
                      className="py-3 px-4 cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('visits')}
                    >
                      <div className="flex items-center gap-1">
                        Visitas
                        <ArrowUpDown className="h-4 w-4" />
                      </div>
                    </th>
                    <th 
                      className="py-3 px-4 cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('totalTimeMs')}
                    >
                      <div className="flex items-center gap-1">
                        Tiempo en página
                        <ArrowUpDown className="h-4 w-4" />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="text-gray-700">
                  {topCommercesLoading ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center">
                        <div className="flex justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
                        </div>
                      </td>
                    </tr>
                  ) : topCommerces.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-gray-500">
                        No se encontraron comercios
                      </td>
                    </tr>
                  ) : (
                    topCommerces.map((commerce) => (
                      <tr key={commerce._id} className="border-t hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4 font-medium text-gray-900">{commerce.name}</td>
                        <td className="py-3 px-4 text-gray-600">{commerce.category}</td>
                        <td className="py-3 px-4 text-gray-600">{commerce.visits}</td>
                        <td className="py-3 px-4 text-gray-600">{formatDuration(commerce.totalTimeMs)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="mt-4 flex items-center justify-between border-t pt-4">
              <div className="text-sm text-gray-500">
                Página {topCommercesPage} de {topCommercesTotalPages}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setTopCommercesPage(p => Math.max(1, p - 1))}
                  disabled={topCommercesPage === 1 || topCommercesLoading}
                  className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setTopCommercesPage(p => Math.min(topCommercesTotalPages, p + 1))}
                  disabled={topCommercesPage === topCommercesTotalPages || topCommercesLoading}
                  className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Panel por Categoría */}
      {activePanel === 'category' && (
        <>
          <div className="mb-2">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Estadísticas por Categoría</h1>
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
              <select 
                className="px-3 py-2 border rounded-lg" 
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
              >
                <option value="7d">Últimos 7 días</option>
                <option value="30d">Últimos 30 días</option>
                <option value="90d">Últimos 90 días</option>
              </select>
            </div>
          </div>

          {categoryAnalyticsLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
            </div>
          ) : (
            <>
              {/* Visibilidad y tráfico */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
                <div className="bg-white p-6 rounded-xl shadow-lg">
                  <h2 className="text-xl font-semibold mb-6 text-gray-700">Visitas por Mes</h2>
                  <div className="h-[320px] flex items-center justify-center">
                    {(!categoryAnalytics?.visitsByMonth || categoryAnalytics.visitsByMonth.length === 0) ? (
                      <p className="text-gray-500">No hay datos históricos disponibles</p>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={categoryAnalytics.visitsByMonth}>
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
                    )}
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-lg">
                  <h2 className="text-xl font-semibold mb-6 text-gray-700">Distribución por Dispositivo</h2>
                  <div className="h-[320px] flex items-center justify-center">
                    {(!categoryAnalytics?.deviceDistribution || categoryAnalytics.deviceDistribution.length === 0) ? (
                      <p className="text-gray-500">No hay datos de dispositivos disponibles</p>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie 
                            data={categoryAnalytics.deviceDistribution} 
                            dataKey="value" 
                            nameKey="name" 
                            cx="50%" 
                            cy="50%" 
                            outerRadius={120} 
                            label 
                          />
                          {categoryAnalytics.deviceDistribution.map((_: any, i: number) => (
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
                    )}
                  </div>
                </div>
              </div>

              {/* Conversión y Retención */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
                <div className="bg-white p-6 rounded-xl shadow-lg">
                  <h2 className="text-xl font-semibold mb-6 text-gray-700">CTR por Acción</h2>
                  <div className="h-[320px] flex items-center justify-center">
                    {(!categoryAnalytics?.clicks || categoryAnalytics.clicks.length === 0) ? (
                      <p className="text-gray-500">No hay datos de clicks disponibles</p>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={categoryAnalytics.clicks}>
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
                          <Bar dataKey="ctr" fill="#F59E0B" name="Clicks" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
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
          <div className="bg-white p-4 rounded-xl shadow flex flex-wrap gap-4 items-end z-10 relative">
            <div className="flex-1 relative">
              <label className="block text-sm text-gray-700 mb-1">Buscar Comercio</label>
              <div className="relative">
                <input
                  value={commerceSearchTerm}
                  onChange={(e) => {
                    setCommerceSearchTerm(e.target.value);
                    if (!e.target.value) {
                      setShowCommerceSuggestions(false);
                    }
                  }}
                  onFocus={() => {
                    if (commerceSuggestions.length > 0) setShowCommerceSuggestions(true);
                  }}
                  placeholder="Escribe el nombre del comercio..."
                  className="w-full pl-10 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                {commerceSearchTerm && (
                  <button
                    onClick={clearCommerceSearch}
                    className="absolute right-2 top-2 p-1 bg-gray-100 hover:bg-red-100 text-gray-500 hover:text-red-500 rounded-full transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Sugerencias */}
              {showCommerceSuggestions && commerceSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto z-50">
                  {commerceSuggestions.map((commerce) => (
                    <button
                      key={commerce._id}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b last:border-b-0 transition-colors flex flex-col"
                      onClick={() => handleSelectCommerce(commerce)}
                    >
                      <span className="font-medium text-gray-800">{commerce.name}</span>
                      <span className="text-xs text-gray-500">{commerce.category}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Periodo</label>
              <select 
                className="px-3 py-2 border rounded-lg" 
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
              >
                <option value="7d">Últimos 7 días</option>
                <option value="30d">Últimos 30 días</option>
                <option value="90d">Últimos 90 días</option>
              </select>
            </div>
          </div>

          {/* Nota si no hay comercio seleccionado */}
          {!selectedCommerceId && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded mt-4">
              Busca y selecciona un comercio para ver sus métricas detalladas.
            </div>
          )}

          {commerceAnalyticsLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
            </div>
          ) : selectedCommerceId && (
            <>
              <div className="mb-6 mt-6 p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
                 <h2 className="text-2xl font-bold text-gray-800 flex items-center flex-wrap gap-2">
                   <span className="text-emerald-600">Reporte de:</span> 
                   <span>{selectedCommerceName}</span>
                   <span className="text-sm font-normal text-gray-500 bg-white px-3 py-1 rounded-full border border-gray-200 shadow-sm">
                     {selectedCommerceCategory}
                   </span>
                 </h2>
              </div>

              {/* Adquisición de tráfico e Interacción */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
                <div className="bg-white p-6 rounded-xl shadow-lg">
                  <h2 className="text-xl font-semibold mb-6 text-gray-700">Visitas por Mes</h2>
                  <div className="h-[320px] flex items-center justify-center">
                    {(!commerceAnalytics?.visitsByMonth || commerceAnalytics.visitsByMonth.length === 0) ? (
                      <p className="text-gray-500">No hay datos históricos disponibles</p>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={commerceAnalytics.visitsByMonth}>
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
                    )}
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-lg">
                  <h2 className="text-xl font-semibold mb-6 text-gray-700">Distribución por Dispositivo</h2>
                  <div className="h-[320px] flex items-center justify-center">
                    {(!commerceAnalytics?.deviceDistribution || commerceAnalytics.deviceDistribution.length === 0) ? (
                      <p className="text-gray-500">No hay datos de dispositivos disponibles</p>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie 
                            data={commerceAnalytics.deviceDistribution} 
                            dataKey="value" 
                            nameKey="name" 
                            cx="50%" 
                            cy="50%" 
                            outerRadius={120} 
                            label 
                          />
                          {commerceAnalytics.deviceDistribution.map((_: any, i: number) => (
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
                    )}
                  </div>
                </div>
              </div>

              {/* Conversión y Embudo */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
                <div className="bg-white p-6 rounded-xl shadow-lg">
                  <h2 className="text-xl font-semibold mb-6 text-gray-700">CTR por Acción</h2>
                  <div className="h-[320px] flex items-center justify-center">
                    {(!commerceAnalytics?.clicks || commerceAnalytics.clicks.length === 0) ? (
                      <p className="text-gray-500">No hay datos de clicks disponibles</p>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={commerceAnalytics.clicks}>
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
                          <Bar dataKey="ctr" fill="#F59E0B" name="Clicks" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
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
            <div className="bg-white p-4 md:p-6 rounded-xl shadow-lg overflow-hidden">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Usuarios por rol</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[200px]">
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
            </div>
            <div className="bg-white p-4 md:p-6 rounded-xl shadow-lg">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Totales</h3>
              <div className="space-y-2 text-gray-800">
                <p>Total usuarios: <span className="font-bold">{totals.totalUsers}</span></p>
                <p>Activos: <span className="font-bold text-emerald-600">{totals.activeUsers}</span></p>
                <p>Inactivos: <span className="font-bold text-red-600">{totals.inactiveUsers}</span></p>
              </div>
            </div>
            <div className="bg-white p-4 md:p-6 rounded-xl shadow-lg">
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
          <div className="bg-white p-4 rounded-xl shadow flex flex-col md:flex-row gap-4 md:items-end mt-6">
            <div className="w-full md:flex-1">
              <label className="block text-sm text-gray-700 mb-1">ID de Usuario</label>
              <input
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                placeholder="Ej: 66f..."
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <button
                onClick={fetchUserAnalytics}
                className="flex-1 md:flex-none px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-center"
              >
                Buscar
              </button>
              <button
                onClick={fetchMyAnalytics}
                className="flex-1 md:flex-none px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-center"
              >
                Mi usuario
              </button>
            </div>
            <div className="flex items-center gap-2 mt-2 md:mt-0 md:mb-2 w-full md:w-auto justify-start">
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} />
                Auto-actualizar
              </label>
            </div>
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
              <div className="bg-white p-4 md:p-6 rounded-xl shadow-lg overflow-hidden">
                <h2 className="text-xl font-semibold mb-4 text-gray-700">Top Comercios por tiempo</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[500px]">
                    <thead>
                      <tr className="text-left text-gray-500">
                        <th className="py-2 pr-4">Comercio</th>
                        <th className="py-2 pr-4">Tiempo</th>
                        <th className="py-2 pr-4">Visitas</th>
                        <th className="py-2">Última visita</th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-700">
                      {userAnalytics.commerce.map((item) => (
                        <tr key={String(item.commerceId)} className="border-t">
                          <td className="py-2 pr-4 font-medium">{item.name}</td>
                          <td className="py-2 pr-4">{formatDuration(item.totalTimeMs)}</td>
                          <td className="py-2 pr-4">{item.visits}</td>
                          <td className="py-2 text-gray-500 text-xs sm:text-sm">{new Date(item.lastVisit).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-white p-4 md:p-6 rounded-xl shadow-lg overflow-hidden">
                <h2 className="text-xl font-semibold mb-4 text-gray-700">Top Categorías por tiempo</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[500px]">
                    <thead>
                      <tr className="text-left text-gray-500">
                        <th className="py-2 pr-4">Categoría</th>
                        <th className="py-2 pr-4">Tiempo</th>
                        <th className="py-2 pr-4">Visitas</th>
                        <th className="py-2">Última visita</th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-700">
                      {userAnalytics.categories.map((item) => (
                        <tr key={String(item.categoryId)} className="border-t">
                          <td className="py-2 pr-4 font-medium">{item.name}</td>
                          <td className="py-2 pr-4">{formatDuration(item.totalTimeMs)}</td>
                          <td className="py-2 pr-4">{item.visits}</td>
                          <td className="py-2 text-gray-500 text-xs sm:text-sm">{new Date(item.lastVisit).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-white p-4 md:p-6 rounded-xl shadow-lg">
                <h2 className="text-xl font-semibold mb-4 text-gray-700">Clicks en redes sociales</h2>
                <ul className="text-sm text-gray-700">
                  {userAnalytics.socialClicks.map((s) => (
                    <li key={String(s.platform)} className="flex justify-between py-2 border-b last:border-0">
                      <span className="capitalize flex items-center gap-2">
                        {String(s.platform)}
                      </span>
                      <span className="font-medium bg-gray-100 px-2 py-0.5 rounded">{s.clicks}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-white p-4 md:p-6 rounded-xl shadow-lg">
                <h2 className="text-xl font-semibold mb-4 text-gray-700">Clicks de contacto y mapa</h2>
                <ul className="text-sm text-gray-700 mb-4">
                  {userAnalytics.contactClicks.map((c) => (
                    <li key={String(c.type)} className="flex justify-between py-2 border-b last:border-0">
                      <span className="capitalize">{String(c.type)}</span>
                      <span className="font-medium bg-gray-100 px-2 py-0.5 rounded">{c.clicks}</span>
                    </li>
                  ))}
                </ul>
                <div className="text-sm text-gray-700 pt-2 border-t flex justify-between items-center">
                  <span>Mapa (clicks)</span>
                  <span className="font-medium bg-gray-100 px-2 py-0.5 rounded">{userAnalytics.mapClicks}</span>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}