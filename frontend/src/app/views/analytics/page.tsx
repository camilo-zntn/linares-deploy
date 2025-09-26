'use client';

import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
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
        const totalCommerces = commerceResponse.data.reduce((sum: number, item: CommerceByCategory) => sum + item.count, 0);
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Resumen General</h1>
        <p className="text-gray-600">Visualización de estadísticas del sistema</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Gráfico de Comercios por Categoría */}
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-semibold mb-6 text-gray-700">Comercios por Categoría</h2>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={commerceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis 
                  dataKey="category" 
                  tick={{ fill: '#4B5563' }}
                  axisLine={{ stroke: '#9CA3AF' }}
                />
                <YAxis 
                  tick={{ fill: '#4B5563' }}
                  axisLine={{ stroke: '#9CA3AF' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E5E7EB',
                    borderRadius: '0.5rem',
                    padding: '0.5rem'
                  }}
                />
                <Legend />
                <Bar 
                  dataKey="count" 
                  fill="#10B981" 
                  name="Cantidad"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico de Estados de Usuarios por Rol */}
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

      {/* Contadores */}
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
    </div>
  );
}