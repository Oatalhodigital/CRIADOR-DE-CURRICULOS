'use client'

import { useState, useEffect } from 'react';
import { Lock, Users, DollarSign, TrendingUp, RefreshCw } from 'lucide-react';

interface ResumeEntry {
  id: string;
  fullName: string;
  email: string;
  paid: boolean;
  paymentId: string | null;
  updatedAt: string | null;
}

interface AdminStats {
  totalResumes: number;
  totalRevenue: number;
  paidCount: number;
  conversionRate: string;
}

export default function AdminPage() {
  const [email, setEmail] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [resumes, setResumes] = useState<ResumeEntry[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async (adminEmail: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/resumes', {
        headers: { 'x-admin-email': adminEmail },
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Falha ao carregar dados.');
      }
      const data = await res.json();
      setResumes(data.resumes);
      setStats(data.stats);
      setAuthenticated(true);
      sessionStorage.setItem('adminEmail', adminEmail);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido.');
      setAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const saved = sessionStorage.getItem('adminEmail');
    if (saved) {
      setEmail(saved);
      fetchData(saved);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData(email);
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <form
          onSubmit={handleLogin}
          className="bg-white border border-gray-200 rounded-2xl p-8 shadow-lg max-w-md w-full"
        >
          <div className="flex items-center gap-3 mb-6">
            <Lock className="w-6 h-6 text-emerald-600" />
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          </div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            E-mail de administrador
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-emerald-600 outline-none"
          />
          {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700 disabled:opacity-50"
          >
            {loading ? 'Verificando...' : 'Entrar'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">Dashboard Admin</h1>
          <button
            onClick={() => fetchData(email)}
            disabled={loading}
            className="flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-700"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {stats && (
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <Users className="w-5 h-5 text-emerald-600" />
                <span className="text-sm text-gray-600">Total de Currículos</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">{stats.totalResumes}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <DollarSign className="w-5 h-5 text-emerald-600" />
                <span className="text-sm text-gray-600">Faturamento</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">R$ {stats.totalRevenue.toFixed(2)}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
                <span className="text-sm text-gray-600">Taxa de Conversão</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">{stats.conversionRate}%</p>
            </div>
          </div>
        )}

        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">Últimos Currículos</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-6 py-3 font-semibold text-gray-600">Nome</th>
                  <th className="text-left px-6 py-3 font-semibold text-gray-600">E-mail</th>
                  <th className="text-left px-6 py-3 font-semibold text-gray-600">Status</th>
                  <th className="text-left px-6 py-3 font-semibold text-gray-600">Atualizado</th>
                </tr>
              </thead>
              <tbody>
                {resumes.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                      Nenhum currículo encontrado.
                    </td>
                  </tr>
                ) : (
                  resumes.map((r) => (
                    <tr key={r.id} className="border-t border-gray-100">
                      <td className="px-6 py-3">{r.fullName || '—'}</td>
                      <td className="px-6 py-3">{r.email}</td>
                      <td className="px-6 py-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            r.paid
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {r.paid ? 'Pago' : 'Pendente'}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-gray-500">
                        {r.updatedAt ? new Date(r.updatedAt).toLocaleDateString('pt-BR') : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
