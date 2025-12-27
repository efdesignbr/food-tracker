'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { useRouter } from 'next/navigation';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  LineChart, Line
} from 'recharts';

// Cores para os gráficos
const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6'];

interface ShoppingStats {
  monthly: { month: string; total: number }[];
  byStore: { storeName: string; total: number }[];
  topItemsPriceHistory: {
    itemName: string;
    history: { date: string; price: number }[];
  }[];
}

export default function ShoppingDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<ShoppingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    try {
      setLoading(true);
      const res = await api.get('/api/shopping-lists/stats');
      const json = await res.json();
      if (res.ok) {
        setStats(json.stats);
      } else {
        setError(json.error || 'Erro ao carregar dados');
      }
    } catch (e: any) {
      setError(e.message || 'Erro de conexão');
    } finally {
      setLoading(false);
    }
  }

  function formatPrice(value: number) {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  function formatMonth(monthStr: string) {
    // "2023-12" -> "Dez/23"
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  }

  if (loading) {
    return (
      <div style={{ padding: 32, textAlign: 'center', color: '#6b7280' }}>
        Carregando estatísticas...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 32, textAlign: 'center', color: '#ef4444' }}>
        Erro: {error}
        <br />
        <button 
          onClick={fetchStats}
          style={{
            marginTop: 16,
            padding: '8px 16px',
            background: '#f3f4f6',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer'
          }}
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: 24, paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
        <button
          onClick={() => router.back()}
          style={{
            padding: '8px 16px',
            background: '#f3f4f6',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 600,
            color: '#374151'
          }}
        >
          ← Voltar
        </button>
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>Painel de Gastos</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
        
        {/* Card 1: Gastos Mensais */}
        <div style={{ 
          background: 'white', 
          borderRadius: 16, 
          padding: 24,
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          gridColumn: '1 / -1' // Ocupa largura total
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 24, color: '#1f2937' }}>
            Evolução de Gastos (Últimos 12 meses)
          </h2>
          <div style={{ height: 300, width: '100%' }}>
            {stats.monthly.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.monthly}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="month" 
                    tickFormatter={formatMonth} 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    tickFormatter={(val) => `R$${val}`}
                  />
                  <RechartsTooltip 
                    cursor={{ fill: '#f3f4f6' }}
                    formatter={(value: any) => [formatPrice(Number(value)), 'Total']}
                    labelFormatter={(label) => formatMonth(label as string)}
                    contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  />
                  <Bar dataKey="total" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={60} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
                Sem dados suficientes
              </div>
            )}
          </div>
        </div>

        {/* Card 2: Distribuição por Loja */}
        <div style={{ 
          background: 'white', 
          borderRadius: 16, 
          padding: 24,
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 24, color: '#1f2937' }}>
            Onde você compra
          </h2>
          <div style={{ height: 300, width: '100%' }}>
            {stats.byStore.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.byStore}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="total"
                    nameKey="storeName"
                  >
                    {stats.byStore.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    formatter={(value: any, name: any) => [formatPrice(Number(value)), name]}
                    contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  />
                  <Legend 
                    layout="horizontal" 
                    verticalAlign="bottom" 
                    align="center"
                    wrapperStyle={{ fontSize: 12, paddingTop: 20 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
                Sem dados suficientes
              </div>
            )}
          </div>
        </div>

        {/* Card 3: Histórico de Preços */}
        <div style={{ 
          background: 'white', 
          borderRadius: 16, 
          padding: 24,
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          gridColumn: '1 / -1' // Ocupa largura total se estiver no mobile, ou ajusta no grid
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: '#1f2937' }}>
            Histórico de Preços (Top 10 Itens)
          </h2>
          <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 24 }}>
            Variação do preço unitário dos seus itens mais frequentes
          </p>
          <div style={{ height: 300, width: '100%' }}>
            {stats.topItemsPriceHistory.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="date" 
                    type="category" 
                    allowDuplicatedCategory={false}
                    tickFormatter={formatDate}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    tickFormatter={(val) => `R$${val}`}
                  />
                  <RechartsTooltip 
                    labelFormatter={(label) => formatDate(label as string)}
                    formatter={(value: any) => [formatPrice(Number(value)), 'Preço Unit.']}
                    contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  />
                  <Legend />
                  {stats.topItemsPriceHistory.map((item, index) => (
                    <Line
                      key={item.itemName}
                      data={item.history}
                      name={item.itemName}
                      type="monotone"
                      dataKey="price"
                      stroke={COLORS[index % COLORS.length]}
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                      connectNulls
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center', 
                justifyContent: 'center', 
                color: '#9ca3af',
                textAlign: 'center',
                padding: 20
              }}>
                <p style={{ marginBottom: 8, fontWeight: 500 }}>Sem dados suficientes para exibir o gráfico</p>
                <p style={{ fontSize: 13, maxWidth: 300 }}>
                  O histórico aparecerá a partir da <strong>segunda compra</strong> do mesmo item onde você informar o <strong>preço unitário</strong>.
                </p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
