'use client';

import { useState, useEffect, useMemo } from 'react';

type Food = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  calories?: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  fiber_g?: number;
  sodium_mg?: number;
  sugar_g?: number;
};

type Meal = {
  id: string;
  image_url: string;
  meal_type: string;
  consumed_at: string;
  notes: string | null;
  foods: Food[];
};

type FilterPeriod = 'today' | 'week' | 'month' | 'all';

const mealTypeConfig: Record<string, { label: string; icon: string; color: string }> = {
  breakfast: { label: 'Café da Manhã', icon: '☀️', color: '#f59e0b' },
  lunch: { label: 'Almoço', icon: '🍽️', color: '#10b981' },
  dinner: { label: 'Jantar', icon: '🌙', color: '#6366f1' },
  snack: { label: 'Lanche', icon: '🍿', color: '#ec4899' }
};

const periodConfig: Record<FilterPeriod, { label: string; icon: string }> = {
  today: { label: 'Hoje', icon: '📅' },
  week: { label: '7 dias', icon: '📊' },
  month: { label: '30 dias', icon: '📈' },
  all: { label: 'Tudo', icon: '🗂️' }
};

function formatDate(isoDate: string) {
  const d = new Date(isoDate);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const isToday = d.toDateString() === today.toDateString();
  const isYesterday = d.toDateString() === yesterday.toDateString();

  if (isToday) return `Hoje, ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
  if (isYesterday) return `Ontem, ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;

  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function filterMealsByPeriod(meals: Meal[], period: FilterPeriod): Meal[] {
  if (period === 'all') return meals;

  const now = new Date();
  const cutoff = new Date();

  switch (period) {
    case 'today':
      cutoff.setHours(0, 0, 0, 0);
      break;
    case 'week':
      cutoff.setDate(cutoff.getDate() - 7);
      break;
    case 'month':
      cutoff.setDate(cutoff.getDate() - 30);
      break;
  }

  return meals.filter(meal => new Date(meal.consumed_at) >= cutoff);
}

export default function HistoryPage() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<FilterPeriod>('week');

  useEffect(() => {
    async function fetchMeals() {
      try {
        setLoading(true);
        const res = await fetch('/api/meals');
        if (!res.ok) throw new Error('Erro ao buscar refeições');
        const data = await res.json();
        setMeals(data.meals || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchMeals();
  }, []);

  const filteredMeals = useMemo(() => filterMealsByPeriod(meals, period), [meals, period]);

  const stats = useMemo(() => {
    const totalCalories = filteredMeals.reduce((sum, meal) =>
      sum + meal.foods.reduce((s, f) => s + (f.calories || 0), 0), 0
    );
    const avgCaloriesPerMeal = filteredMeals.length > 0 ? totalCalories / filteredMeals.length : 0;

    return { totalCalories, avgCaloriesPerMeal };
  }, [filteredMeals]);

  // Stats do dia atual
  const todayStats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayMeals = meals.filter(meal => {
      const mealDate = new Date(meal.consumed_at);
      return mealDate >= today;
    });

    const calories = todayMeals.reduce((sum, meal) =>
      sum + meal.foods.reduce((s, f) => s + (f.calories || 0), 0), 0
    );
    const protein = todayMeals.reduce((sum, meal) =>
      sum + meal.foods.reduce((s, f) => s + (f.protein_g || 0), 0), 0
    );
    const carbs = todayMeals.reduce((sum, meal) =>
      sum + meal.foods.reduce((s, f) => s + (f.carbs_g || 0), 0), 0
    );
    const fat = todayMeals.reduce((sum, meal) =>
      sum + meal.foods.reduce((s, f) => s + (f.fat_g || 0), 0), 0
    );

    return { calories, protein, carbs, fat, mealsCount: todayMeals.length };
  }, [meals]);

  if (loading) {
    return (
      <div style={{ padding: 24, maxWidth: 800, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
          <p style={{ color: '#666', fontSize: 16 }}>Carregando...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 24, maxWidth: 800, margin: '0 auto' }}>
        <div style={{
          padding: 24,
          background: '#fee2e2',
          border: '2px solid #ef4444',
          borderRadius: 12,
          textAlign: 'center'
        }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>⚠️</div>
          <p style={{ color: '#991b1b', margin: 0 }}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 16, maxWidth: 800, margin: '0 auto', paddingBottom: 80 }}>
      {/* Header */}
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 16 }}>📋 Histórico</h1>

      {/* Daily Tracker - Hoje */}
      {todayStats.mealsCount > 0 && (
        <div style={{
          background: 'white',
          borderRadius: 16,
          padding: 20,
          marginBottom: 24,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          border: '2px solid #2196F3'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: '#2196F3' }}>
              🎯 Progresso de Hoje
            </h2>
            <span style={{ fontSize: 13, color: '#666' }}>
              {todayStats.mealsCount} refeição{todayStats.mealsCount !== 1 ? 'ões' : ''}
            </span>
          </div>

          {/* Calorias */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>🔥 Calorias</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: todayStats.calories > 2000 ? '#ef4444' : '#2196F3' }}>
                {todayStats.calories.toFixed(0)} / 2000 kcal
              </span>
            </div>
            <div style={{
              width: '100%',
              height: 8,
              background: '#e5e7eb',
              borderRadius: 4,
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${Math.min((todayStats.calories / 2000) * 100, 100)}%`,
                height: '100%',
                background: todayStats.calories > 2000
                  ? 'linear-gradient(90deg, #f59e0b 0%, #ef4444 100%)'
                  : 'linear-gradient(90deg, #10b981 0%, #2196F3 100%)',
                transition: 'width 0.3s ease'
              }} />
            </div>
            {todayStats.calories > 2000 && (
              <p style={{ fontSize: 11, color: '#ef4444', margin: '4px 0 0 0' }}>
                ⚠️ Acima da meta em {(todayStats.calories - 2000).toFixed(0)} kcal
              </p>
            )}
            {todayStats.calories < 2000 && todayStats.calories > 0 && (
              <p style={{ fontSize: 11, color: '#10b981', margin: '4px 0 0 0' }}>
                ✅ Restam {(2000 - todayStats.calories).toFixed(0)} kcal
              </p>
            )}
          </div>

          {/* Proteína */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>🥩 Proteína</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: todayStats.protein > 150 ? '#ef4444' : '#2196F3' }}>
                {todayStats.protein.toFixed(1)} / 150 g
              </span>
            </div>
            <div style={{
              width: '100%',
              height: 8,
              background: '#e5e7eb',
              borderRadius: 4,
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${Math.min((todayStats.protein / 150) * 100, 100)}%`,
                height: '100%',
                background: todayStats.protein > 150
                  ? 'linear-gradient(90deg, #f59e0b 0%, #ef4444 100%)'
                  : 'linear-gradient(90deg, #ef4444 0%, #f97316 100%)',
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>

          {/* Carboidratos */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>🍚 Carboidratos</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: todayStats.carbs > 250 ? '#ef4444' : '#2196F3' }}>
                {todayStats.carbs.toFixed(1)} / 250 g
              </span>
            </div>
            <div style={{
              width: '100%',
              height: 8,
              background: '#e5e7eb',
              borderRadius: 4,
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${Math.min((todayStats.carbs / 250) * 100, 100)}%`,
                height: '100%',
                background: todayStats.carbs > 250
                  ? 'linear-gradient(90deg, #f59e0b 0%, #ef4444 100%)'
                  : 'linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%)',
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>

          {/* Gorduras */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>🧈 Gorduras</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: todayStats.fat > 65 ? '#ef4444' : '#2196F3' }}>
                {todayStats.fat.toFixed(1)} / 65 g
              </span>
            </div>
            <div style={{
              width: '100%',
              height: 8,
              background: '#e5e7eb',
              borderRadius: 4,
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${Math.min((todayStats.fat / 65) * 100, 100)}%`,
                height: '100%',
                background: todayStats.fat > 65
                  ? 'linear-gradient(90deg, #f59e0b 0%, #ef4444 100%)'
                  : 'linear-gradient(90deg, #8b5cf6 0%, #a78bfa 100%)',
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>
        </div>
      )}

      {/* Period Filter */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 8,
        marginBottom: 24
      }}>
        {(Object.keys(periodConfig) as FilterPeriod[]).map(p => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            style={{
              padding: '12px 8px',
              border: 'none',
              background: period === p ? '#2196F3' : 'white',
              color: period === p ? 'white' : '#666',
              borderRadius: 12,
              fontWeight: 600,
              fontSize: 14,
              cursor: 'pointer',
              boxShadow: period === p ? '0 4px 12px rgba(33, 150, 243, 0.3)' : '0 2px 4px rgba(0,0,0,0.1)',
              transition: 'all 0.2s',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4
            }}
          >
            <span style={{ fontSize: 18 }}>{periodConfig[p].icon}</span>
            <span>{periodConfig[p].label}</span>
          </button>
        ))}
      </div>

      {/* Stats Cards */}
      {filteredMeals.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 12,
          marginBottom: 24
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: 16,
            borderRadius: 12,
            color: 'white'
          }}>
            <div style={{ fontSize: 12, opacity: 0.9 }}>Refeições</div>
            <div style={{ fontSize: 28, fontWeight: 700 }}>{filteredMeals.length}</div>
          </div>
          <div style={{
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            padding: 16,
            borderRadius: 12,
            color: 'white'
          }}>
            <div style={{ fontSize: 12, opacity: 0.9 }}>Total</div>
            <div style={{ fontSize: 28, fontWeight: 700 }}>{stats.totalCalories.toFixed(0)}</div>
            <div style={{ fontSize: 11, opacity: 0.8 }}>kcal</div>
          </div>
          <div style={{
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            padding: 16,
            borderRadius: 12,
            color: 'white'
          }}>
            <div style={{ fontSize: 12, opacity: 0.9 }}>Média</div>
            <div style={{ fontSize: 28, fontWeight: 700 }}>{stats.avgCaloriesPerMeal.toFixed(0)}</div>
            <div style={{ fontSize: 11, opacity: 0.8 }}>kcal/refeição</div>
          </div>
        </div>
      )}

      {/* Meals List */}
      {filteredMeals.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '48px 24px',
          background: '#f9fafb',
          borderRadius: 16,
          border: '2px dashed #d1d5db'
        }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🍽️</div>
          <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
            Nenhuma refeição neste período
          </h3>
          <p style={{ color: '#666', fontSize: 14 }}>
            Tente selecionar outro período ou capture uma refeição!
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 16 }}>
          {filteredMeals.map((meal) => {
            const mealCalories = meal.foods.reduce((s, f) => s + (f.calories || 0), 0);
            const mealProtein = meal.foods.reduce((s, f) => s + (f.protein_g || 0), 0);
            const mealCarbs = meal.foods.reduce((s, f) => s + (f.carbs_g || 0), 0);
            const mealFat = meal.foods.reduce((s, f) => s + (f.fat_g || 0), 0);
            const config = mealTypeConfig[meal.meal_type] || mealTypeConfig.lunch;

            return (
              <div
                key={meal.id}
                style={{
                  background: 'white',
                  borderRadius: 16,
                  overflow: 'hidden',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  border: '1px solid #e5e7eb'
                }}
              >
                {meal.image_url && meal.image_url !== 'https://via.placeholder.com/400x300.png?text=Meal+Image' && (
                  <img
                    src={meal.image_url}
                    alt="Refeição"
                    style={{
                      width: '100%',
                      height: 200,
                      objectFit: 'cover'
                    }}
                  />
                )}

                <div style={{ padding: 16 }}>
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <span style={{ fontSize: 24 }}>{config.icon}</span>
                      <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: config.color }}>
                        {config.label}
                      </h3>
                    </div>
                    <div style={{ fontSize: 14, color: '#666', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>🕐</span>
                      {formatDate(meal.consumed_at)}
                    </div>
                  </div>

                  {meal.notes && (
                    <div style={{
                      padding: 12,
                      background: '#f9fafb',
                      borderRadius: 8,
                      marginBottom: 12,
                      borderLeft: '3px solid ' + config.color
                    }}>
                      <p style={{ margin: 0, fontSize: 14, color: '#374151', fontStyle: 'italic' }}>
                        "{meal.notes}"
                      </p>
                    </div>
                  )}

                  <div style={{ marginBottom: 12 }}>
                    <div style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: '#666',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      marginBottom: 8
                    }}>
                      Alimentos ({meal.foods.length})
                    </div>
                    <div style={{ display: 'grid', gap: 8 }}>
                      {meal.foods.map((food) => (
                        <div
                          key={food.id}
                          style={{
                            padding: '10px 12px',
                            background: '#f9fafb',
                            borderRadius: 8,
                            fontSize: 13,
                            border: '1px solid #e5e7eb'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                            <span style={{ fontWeight: 600, color: '#374151' }}>{food.name}</span>
                            <span style={{ color: '#666', fontSize: 12 }}>
                              {food.quantity}{food.unit}
                            </span>
                          </div>
                          {(food.calories || food.protein_g || food.carbs_g || food.fat_g) && (
                            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 11, color: '#666' }}>
                              {food.calories && <span>🔥 {food.calories.toFixed(0)} kcal</span>}
                              {food.protein_g && <span>🥩 {food.protein_g.toFixed(1)}g prot</span>}
                              {food.carbs_g && <span>🍚 {food.carbs_g.toFixed(1)}g carb</span>}
                              {food.fat_g && <span>🧈 {food.fat_g.toFixed(1)}g gord</span>}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{
                    padding: 14,
                    background: config.color,
                    borderRadius: 8,
                    color: 'white'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontWeight: 600 }}>Total</span>
                      <span style={{ fontSize: 20, fontWeight: 700 }}>{mealCalories.toFixed(0)} kcal</span>
                    </div>
                    {(mealProtein > 0 || mealCarbs > 0 || mealFat > 0) && (
                      <div style={{
                        display: 'flex',
                        gap: 12,
                        fontSize: 12,
                        opacity: 0.95,
                        paddingTop: 8,
                        borderTop: '1px solid rgba(255,255,255,0.3)'
                      }}>
                        {mealProtein > 0 && <span>🥩 {mealProtein.toFixed(1)}g</span>}
                        {mealCarbs > 0 && <span>🍚 {mealCarbs.toFixed(1)}g</span>}
                        {mealFat > 0 && <span>🧈 {mealFat.toFixed(1)}g</span>}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
