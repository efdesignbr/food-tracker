'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '@/lib/api-client';
import { useRouter } from 'next/navigation';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  LineChart, Line
} from 'recharts';

// Cores para os gráficos
const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6'];
// Cores específicas para mercados no gráfico de evolução (máximo 5)
const STORE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

interface ShoppingStats {
  monthly: { month: string; total: number }[];
  byStore: { storeName: string; total: number }[];
  topItemsPriceHistory: {
    itemName: string;
    history: { date: string; price: number }[];
  }[];
}

interface ProductListItem {
  name: string;
  displayName: string;
  purchaseCount: number;
}

interface PriceByStore {
  storeName: string;
  avgPrice: number;
  lastPrice: number;
  purchaseCount: number;
}

interface PriceHistoryItem {
  date: string;
  price: number;
  storeName: string;
}

interface ProductPriceAnalysis {
  products: ProductListItem[];
  pricesByStore: PriceByStore[];
  priceHistory: PriceHistoryItem[];
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

        {/* Card 3: Análise de Preços */}
        <PriceAnalysisCard />

      </div>
    </div>
  );
}

// Componente de Análise de Preços
function PriceAnalysisCard() {
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [productData, setProductData] = useState<{ pricesByStore: PriceByStore[], priceHistory: PriceHistoryItem[] } | null>(null);
  const [storeFilter, setStoreFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [loadingProduct, setLoadingProduct] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const cardRef = useRef<HTMLDivElement>(null);

  // Carregar lista de produtos
  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    try {
      setLoading(true);
      const res = await api.get('/api/shopping-lists/price-analysis');
      const json = await res.json();
      if (res.ok && json.analysis) {
        setProducts(json.analysis.products || []);
      }
    } catch (e) {
      console.error('Erro ao carregar produtos:', e);
    } finally {
      setLoading(false);
    }
  }

  async function fetchProductAnalysis(productName: string) {
    try {
      setLoadingProduct(true);
      const res = await api.get(`/api/shopping-lists/price-analysis?product=${encodeURIComponent(productName)}`);
      const json = await res.json();
      if (res.ok && json.analysis) {
        setProductData({
          pricesByStore: json.analysis.pricesByStore || [],
          priceHistory: json.analysis.priceHistory || []
        });
      }
    } catch (e) {
      console.error('Erro ao carregar análise:', e);
    } finally {
      setLoadingProduct(false);
    }
  }

  function handleSelectProduct(productName: string) {
    setSelectedProduct(productName);
    setStoreFilter('all');
    fetchProductAnalysis(productName);
    // Scroll suave para o card
    setTimeout(() => {
      cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }

  function handleBack() {
    setSelectedProduct(null);
    setProductData(null);
    setSearchQuery('');
  }

  function formatPrice(value: number) {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  function formatDateShort(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  }

  // Filtrar produtos pela busca
  const filteredProducts = products.filter(p =>
    p.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Preparar dados do gráfico de evolução
  const getChartData = () => {
    if (!productData) return { data: [], stores: [] };

    const history = productData.priceHistory;
    const stores = [...new Set(history.map(h => h.storeName))].slice(0, 5); // Max 5 mercados

    if (storeFilter !== 'all') {
      // Filtrar por mercado específico
      const filtered = history.filter(h => h.storeName === storeFilter);
      return {
        data: filtered.map(h => ({ date: h.date, price: h.price })),
        stores: [storeFilter]
      };
    }

    // Agrupar por data e mercado para múltiplas linhas
    const dateMap = new Map<string, any>();
    history.forEach(h => {
      if (!stores.includes(h.storeName)) return;
      const dateKey = h.date;
      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, { date: dateKey });
      }
      dateMap.get(dateKey)[h.storeName] = h.price;
    });

    return { data: Array.from(dateMap.values()), stores };
  };

  const { data: chartData, stores: chartStores } = getChartData();

  // Calcular economia
  const getSavings = () => {
    if (!productData || productData.pricesByStore.length < 2) return null;
    const cheapest = productData.pricesByStore[0];
    const mostExpensive = productData.pricesByStore[productData.pricesByStore.length - 1];
    return {
      store: cheapest.storeName,
      amount: mostExpensive.lastPrice - cheapest.lastPrice
    };
  };

  const savings = getSavings();

  return (
    <div
      ref={cardRef}
      style={{
        background: 'white',
        borderRadius: 16,
        padding: 20,
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        gridColumn: '1 / -1'
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        {selectedProduct && (
          <button
            onClick={handleBack}
            style={{
              padding: '8px 12px',
              background: '#f3f4f6',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 600,
              color: '#374151'
            }}
          >
            ←
          </button>
        )}
        <h2 style={{ fontSize: 18, fontWeight: 600, color: '#1f2937', margin: 0 }}>
          {selectedProduct
            ? selectedProduct.charAt(0).toUpperCase() + selectedProduct.slice(1)
            : 'Análise de Preços'
          }
        </h2>
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>
          Carregando...
        </div>
      ) : !selectedProduct ? (
        /* Estado inicial: Seleção de produto */
        <div>
          {/* Campo de busca */}
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar produto..."
            style={{
              width: '100%',
              padding: 12,
              border: '1px solid #e5e7eb',
              borderRadius: 10,
              fontSize: 16,
              marginBottom: 16,
              fontFamily: 'inherit'
            }}
          />

          {/* Pills dos produtos mais comprados */}
          {products.length > 0 ? (
            <>
              <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 12 }}>
                {searchQuery ? 'Resultados:' : 'Mais comprados:'}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {filteredProducts.slice(0, 15).map((product) => (
                  <button
                    key={product.name}
                    onClick={() => handleSelectProduct(product.name)}
                    style={{
                      padding: '10px 16px',
                      background: '#f3f4f6',
                      border: '1px solid #e5e7eb',
                      borderRadius: 20,
                      fontSize: 14,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      fontFamily: 'inherit',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {product.displayName}
                  </button>
                ))}
              </div>
              {filteredProducts.length === 0 && searchQuery && (
                <p style={{ color: '#9ca3af', textAlign: 'center', padding: 20 }}>
                  Nenhum produto encontrado
                </p>
              )}
            </>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: 40,
              color: '#9ca3af'
            }}>
              <p style={{ marginBottom: 8, fontWeight: 500 }}>Sem dados de preços</p>
              <p style={{ fontSize: 13 }}>
                Registre compras com <strong>preço unitário</strong> para ver a análise.
              </p>
            </div>
          )}
        </div>
      ) : loadingProduct ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>
          Carregando análise...
        </div>
      ) : productData ? (
        /* Produto selecionado: Visualização completa */
        <div>
          {/* Seção 1: Comparação entre mercados */}
          {productData.pricesByStore.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: '#6b7280', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Onde está mais barato
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {productData.pricesByStore.map((store, index) => {
                  const maxPrice = productData.pricesByStore[productData.pricesByStore.length - 1].lastPrice;
                  const percentage = (store.lastPrice / maxPrice) * 100;
                  const isCheapest = index === 0;

                  return (
                    <div key={store.storeName}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <span style={{ fontSize: 14, fontWeight: 500, color: '#374151' }}>
                          {store.storeName}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 15, fontWeight: 600, color: isCheapest ? '#059669' : '#374151' }}>
                            {formatPrice(store.lastPrice)}
                          </span>
                          {isCheapest && (
                            <span style={{
                              background: '#d1fae5',
                              color: '#059669',
                              padding: '2px 8px',
                              borderRadius: 12,
                              fontSize: 11,
                              fontWeight: 600
                            }}>
                              menor
                            </span>
                          )}
                        </div>
                      </div>
                      {/* Barra de progresso */}
                      <div style={{
                        width: '100%',
                        height: 8,
                        backgroundColor: '#f3f4f6',
                        borderRadius: 4,
                        overflow: 'hidden'
                      }}>
                        <div
                          style={{
                            width: `${percentage}%`,
                            height: '100%',
                            backgroundColor: isCheapest ? '#10b981' : '#d1d5db',
                            borderRadius: 4,
                            transition: 'width 0.3s ease'
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Card de economia */}
              {savings && savings.amount > 0 && (
                <div style={{
                  marginTop: 16,
                  padding: 12,
                  background: '#fef3c7',
                  borderRadius: 10,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}>
                  <span style={{ fontSize: 18 }}>💡</span>
                  <span style={{ fontSize: 13, color: '#92400e' }}>
                    Você economiza <strong>{formatPrice(savings.amount)}</strong> comprando no {savings.store}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Seção 2: Evolução do preço */}
          {productData.priceHistory.length > 1 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: '#6b7280', margin: 0, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Evolução do preço
                </h3>

                {/* Filtro de mercado */}
                {chartStores.length > 1 && (
                  <select
                    value={storeFilter}
                    onChange={(e) => setStoreFilter(e.target.value)}
                    style={{
                      padding: '6px 10px',
                      border: '1px solid #e5e7eb',
                      borderRadius: 8,
                      fontSize: 13,
                      fontFamily: 'inherit',
                      background: 'white',
                      color: '#374151'
                    }}
                  >
                    <option value="all">Todos</option>
                    {[...new Set(productData.priceHistory.map(h => h.storeName))].slice(0, 5).map(store => (
                      <option key={store} value={store}>{store}</option>
                    ))}
                  </select>
                )}
              </div>

              <div style={{ height: 200, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={formatDateShort}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#6b7280', fontSize: 11 }}
                      dy={8}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#6b7280', fontSize: 11 }}
                      tickFormatter={(val) => `R$${val}`}
                      width={50}
                    />
                    <RechartsTooltip
                      labelFormatter={(label) => formatDateShort(label as string)}
                      formatter={(value: any, name: any) => [formatPrice(Number(value)), storeFilter === 'all' ? (name || 'Preço') : 'Preço']}
                      contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', fontSize: 13 }}
                    />
                    {storeFilter === 'all' ? (
                      chartStores.map((store, index) => (
                        <Line
                          key={store}
                          type="monotone"
                          dataKey={store}
                          name={store}
                          stroke={STORE_COLORS[index % STORE_COLORS.length]}
                          strokeWidth={2.5}
                          dot={{ r: 5, strokeWidth: 2 }}
                          activeDot={{ r: 7 }}
                          connectNulls
                        />
                      ))
                    ) : (
                      <Line
                        type="monotone"
                        dataKey="price"
                        stroke={STORE_COLORS[0]}
                        strokeWidth={2.5}
                        dot={{ r: 5, strokeWidth: 2 }}
                        activeDot={{ r: 7 }}
                        connectNulls
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Legenda compacta */}
              {storeFilter === 'all' && chartStores.length > 1 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 12, justifyContent: 'center' }}>
                  {chartStores.map((store, index) => (
                    <div key={store} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <div style={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        backgroundColor: STORE_COLORS[index % STORE_COLORS.length]
                      }} />
                      <span style={{ fontSize: 12, color: '#6b7280' }}>{store}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Mensagem se só tiver um ponto no histórico */}
          {productData.priceHistory.length === 1 && (
            <div style={{
              padding: 20,
              background: '#f9fafb',
              borderRadius: 10,
              textAlign: 'center',
              color: '#6b7280'
            }}>
              <p style={{ fontSize: 13 }}>
                Apenas 1 registro de preço. O gráfico de evolução aparecerá após mais compras.
              </p>
            </div>
          )}

          {/* Mensagem se não tiver dados */}
          {productData.pricesByStore.length === 0 && productData.priceHistory.length === 0 && (
            <div style={{
              padding: 40,
              textAlign: 'center',
              color: '#9ca3af'
            }}>
              <p>Nenhum dado encontrado para este produto.</p>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
