import React, { useState, useEffect } from 'react';
import { BarChart3, DollarSign, Users, TrendingUp, ArrowLeft } from 'lucide-react';

interface AdminProps {
  onBack: () => void;
}

const Admin: React.FC<AdminProps> = ({ onBack }) => {
  // Mock data - In production, this would come from Firestore
  const [stats, setStats] = useState({
    totalResumes: 0,
    totalRevenue: 0,
    conversionRate: 0,
    recentUsers: [] as Array<{ name: string; email: string; status: string; date: string }>,
  });

  useEffect(() => {
    // Simulate fetching data from Firestore
    setStats({
      totalResumes: 156,
      totalRevenue: 1402.88,
      conversionRate: 23.5,
      recentUsers: [
        { name: 'João Silva', email: 'joao@email.com', status: 'paid', date: '2026-07-08' },
        { name: 'Maria Santos', email: 'maria@email.com', status: 'pending', date: '2026-07-08' },
        { name: 'Pedro Oliveira', email: 'pedro@email.com', status: 'paid', date: '2026-07-07' },
        { name: 'Ana Costa', email: 'ana@email.com', status: 'paid', date: '2026-07-07' },
        { name: 'Carlos Lima', email: 'carlos@email.com', status: 'pending', date: '2026-07-06' },
      ],
    });
  }, []);

  const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; color: string }> = ({
    title,
    value,
    icon,
    color,
  }) => (
    <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${color}`}>{icon}</div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4 transition"
            >
              <ArrowLeft className="w-5 h-5" />
              Voltar
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard Administrativo</h1>
            <p className="text-gray-600">Acompanhe as métricas do seu gerador de currículos</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total de Currículos"
            value={stats.totalResumes}
            icon={<Users className="w-6 h-6 text-white" />}
            color="bg-purple-600"
          />
          <StatCard
            title="Faturamento Total"
            value={`R$ ${stats.totalRevenue.toFixed(2)}`}
            icon={<DollarSign className="w-6 h-6 text-white" />}
            color="bg-green-600"
          />
          <StatCard
            title="Taxa de Conversão"
            value={`${stats.conversionRate}%`}
            icon={<TrendingUp className="w-6 h-6 text-white" />}
            color="bg-blue-600"
          />
          <StatCard
            title="Receita Mensal"
            value={`R$ ${(stats.totalRevenue / 30).toFixed(2)}`}
            icon={<BarChart3 className="w-6 h-6 text-white" />}
            color="bg-orange-600"
          />
        </div>

        {/* Recent Users Table */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Últimos Usuários</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nome
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {stats.recentUsers.map((user, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {user.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          user.status === 'paid'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {user.status === 'paid' ? 'Pago' : 'Pendente'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {user.date}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Note */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Nota:</strong> Este é um dashboard de demonstração com dados mockados.
            Em produção, os dados serão buscados do Firestore em tempo real.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Admin;
