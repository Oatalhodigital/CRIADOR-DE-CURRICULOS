import React, { useState, useEffect } from 'react';
import { BarChart3, DollarSign, Users, TrendingUp, ArrowLeft, Shield, Zap, Lock } from 'lucide-react';
import { auth } from '../config/firebase';
import { isAdminUser, getAdminMetrics } from '../services/firebase';

interface AdminProps {
  onBack: () => void;
}

const Admin: React.FC<AdminProps> = ({ onBack }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    conversionRate: 0,
    totalTransactions: 0,
    paidTransactions: 0,
    totalDrafts: 0,
    recentTransactions: [] as any[],
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = auth.currentUser;
        if (user && isAdminUser(user.email)) {
          setIsAuthenticated(true);
          await fetchMetrics();
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Auth error:', error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const fetchMetrics = async () => {
    try {
      const metrics = await getAdminMetrics();
      setStats(metrics);
    } catch (error) {
      console.error('Error fetching metrics:', error);
    }
  };

  const StatCard: React.FC<{ 
    title: string; 
    value: string | number; 
    icon: React.ReactNode; 
    gradient: string;
    glow: string;
  }> = ({ title, value, icon, gradient, glow }) => (
    <div className={`relative overflow-hidden rounded-2xl p-6 ${gradient} ${glow} backdrop-blur-sm border border-white/10`}>
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-xl bg-white/20 backdrop-blur-sm`}>{icon}</div>
        </div>
        <p className="text-white/80 text-sm font-medium mb-1">{title}</p>
        <p className="text-white text-3xl font-bold">{value}</p>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white text-lg">Verificando acesso...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 shadow-2xl">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Lock className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">Acesso Restrito</h1>
              <p className="text-white/70">
                Esta área é exclusiva para administradores autorizados da LS Soluções Digitais.
              </p>
            </div>
            <button
              onClick={onBack}
              className="w-full bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl transition font-medium flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              Voltar ao Site
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900">
      {/* Header */}
      <header className="bg-black/30 backdrop-blur-lg border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/50">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">LS Admin</h1>
              <p className="text-xs text-purple-300">Dashboard Premium</p>
            </div>
          </div>
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition font-medium"
          >
            <ArrowLeft className="w-5 h-5" />
            Sair
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Dashboard Administrativo</h2>
          <p className="text-purple-300">Métricas em tempo real do Gerador de Currículos Premium</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Faturamento Total"
            value={`R$ ${stats.totalRevenue.toFixed(2)}`}
            icon={<DollarSign className="w-6 h-6 text-white" />}
            gradient="bg-gradient-to-br from-green-500 to-emerald-600"
            glow="shadow-lg shadow-green-500/30"
          />
          <StatCard
            title="Taxa de Conversão"
            value={`${stats.conversionRate.toFixed(1)}%`}
            icon={<TrendingUp className="w-6 h-6 text-white" />}
            gradient="bg-gradient-to-br from-blue-500 to-cyan-600"
            glow="shadow-lg shadow-blue-500/30"
          />
          <StatCard
            title="Transações Pagas"
            value={stats.paidTransactions}
            icon={<Users className="w-6 h-6 text-white" />}
            gradient="bg-gradient-to-br from-purple-500 to-pink-600"
            glow="shadow-lg shadow-purple-500/30"
          />
          <StatCard
            title="Rascunhos Criados"
            value={stats.totalDrafts}
            icon={<BarChart3 className="w-6 h-6 text-white" />}
            gradient="bg-gradient-to-br from-orange-500 to-red-600"
            glow="shadow-lg shadow-orange-500/30"
          />
        </div>

        {/* Recent Transactions */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
          <div className="p-6 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Zap className="w-5 h-5 text-purple-400" />
              <h2 className="text-xl font-bold text-white">Últimas Transações</h2>
            </div>
            <button
              onClick={fetchMetrics}
              className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-lg transition text-sm font-medium"
            >
              Atualizar
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-black/30">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-purple-300 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-purple-300 uppercase tracking-wider">
                    Valor
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-purple-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-purple-300 uppercase tracking-wider">
                    Data
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {stats.recentTransactions.length > 0 ? (
                  stats.recentTransactions.map((tx, index) => (
                    <tr key={index} className="hover:bg-white/5 transition">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        {tx.userEmail}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-400 font-medium">
                        R$ {tx.amount?.toFixed(2) || '0.00'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 text-xs font-bold rounded-full ${
                            tx.status === 'pago'
                              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                              : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                          }`}
                        >
                          {tx.status === 'pago' ? 'PAGO' : 'PENDENTE'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white/70">
                        {tx.createdAt?.toDate?.() 
                          ? new Date(tx.createdAt.toDate()).toLocaleDateString('pt-BR')
                          : 'N/A'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-white/50">
                      Nenhuma transação encontrada
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-white/40 text-sm">
            © 2026 LS Soluções Digitais - Sistema Administrativo Premium
          </p>
        </div>
      </div>
    </div>
  );
};

export default Admin;
