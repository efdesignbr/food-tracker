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
};

type Meal = {
  id: string;
  meal_type: string;
  consumed_at: string;
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

export default function ReportsPage() {
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
    const totalMeals = filteredMeals.length;
    const totalCalories = filteredMeals.reduce((sum, meal) =>
      sum + meal.foods.reduce((s, f) => s + (f.calories || 0), 0), 0
    );
    const totalProtein = filteredMeals.reduce((sum, meal) =>
      sum + meal.foods.reduce((s, f) => s + (f.protein_g || 0), 0), 0
    );
    const totalCarbs = filteredMeals.reduce((sum, meal) =>
      sum + meal.foods.reduce((s, f) => s + (f.carbs_g || 0), 0), 0
    );
    const totalFat = filteredMeals.reduce((sum, meal) =>
      sum + meal.foods.reduce((s, f) => s + (f.fat_g || 0), 0), 0
    );

    const avgCaloriesPerMeal = totalMeals > 0 ? totalCalories / totalMeals : 0;

    // Calorias por tipo de refeição
    const caloriesByType: Record<string, { total: number; count: number }> = {};
    filteredMeals.forEach((meal) => {
      const mealCals = meal.foods.reduce((s, f) => s + (f.calories || 0), 0);
      if (!caloriesByType[meal.meal_type]) {
        caloriesByType[meal.meal_type] = { total: 0, count: 0 };
      }
      caloriesByType[meal.meal_type].total += mealCals;
      caloriesByType[meal.meal_type].count += 1;
    });

    // Alimentos mais consumidos
    const foodFrequency: Record<string, number> = {};
    filteredMeals.forEach((meal) => {
      meal.foods.forEach((food) => {
        const key = food.name.toLowerCase();
        foodFrequency[key] = (foodFrequency[key] || 0) + 1;
      });
    });

    const topFoods = Object.entries(foodFrequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10);

    // Calorias por dia
    const caloriesByDay: Record<string, number> = {};
    filteredMeals.forEach((meal) => {
      const date = new Date(meal.consumed_at).toLocaleDateString('pt-BR');
      const mealCals = meal.foods.reduce((s, f) => s + (f.calories || 0), 0);
      caloriesByDay[date] = (caloriesByDay[date] || 0) + mealCals;
    });

    const avgCaloriesPerDay =
      Object.keys(caloriesByDay).length > 0
        ? Object.values(caloriesByDay).reduce((a, b) => a + b, 0) / Object.keys(caloriesByDay).length
        : 0;

    return {
      totalMeals,
      totalCalories,
      totalProtein,
      totalCarbs,
      totalFat,
      avgCaloriesPerMeal,
      avgCaloriesPerDay,
      caloriesByType,
      topFoods,
      caloriesByDay
    };
  }, [filteredMeals]);

  if (loading) {
    return (
      <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
          <p style={{ color: '#666', fontSize: 16 }}>Carregando...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
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
    <div style={{ padding: 16, maxWidth: 1200, margin: '0 auto', paddingBottom: 80 }}>
      {/* Header */}
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 16 }}>📊 Relatórios</h1>

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

      {/* Main Stats Cards */}
      {filteredMeals.length > 0 ? (
        <>
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
              <div style={{ fontSize: 28, fontWeight: 700 }}>{stats.totalMeals}</div>
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
              <div style={{ fontSize: 12, opacity: 0.9 }}>Média/Ref</div>
              <div style={{ fontSize: 28, fontWeight: 700 }}>{stats.avgCaloriesPerMeal.toFixed(0)}</div>
              <div style={{ fontSize: 11, opacity: 0.8 }}>kcal</div>
            </div>
            <div style={{
              background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
              padding: 16,
              borderRadius: 12,
              color: 'white'
            }}>
              <div style={{ fontSize: 12, opacity: 0.9 }}>Média/Dia</div>
              <div style={{ fontSize: 28, fontWeight: 700 }}>{stats.avgCaloriesPerDay.toFixed(0)}</div>
              <div style={{ fontSize: 11, opacity: 0.8 }}>kcal</div>
            </div>
          </div>

          {/* Macronutrients Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
            gap: 12,
            marginBottom: 24
          }}>
            <div style={{
              background: 'white',
              padding: 16,
              borderRadius: 12,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              border: '2px solid #ef4444'
            }}>
              <div style={{ fontSize: 24, marginBottom: 4 }}>🥩</div>
              <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Proteína</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#ef4444' }}>
                {stats.totalProtein.toFixed(0)}g
              </div>
            </div>
            <div style={{
              background: 'white',
              padding: 16,
              borderRadius: 12,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              border: '2px solid #f59e0b'
            }}>
              <div style={{ fontSize: 24, marginBottom: 4 }}>🍚</div>
              <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Carboidratos</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#f59e0b' }}>
                {stats.totalCarbs.toFixed(0)}g
              </div>
            </div>
            <div style={{
              background: 'white',
              padding: 16,
              borderRadius: 12,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              border: '2px solid #8b5cf6'
            }}>
              <div style={{ fontSize: 24, marginBottom: 4 }}>🧈</div>
              <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Gorduras</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#8b5cf6' }}>
                {stats.totalFat.toFixed(0)}g
              </div>
            </div>
          </div>

          {/* Charts Grid */}
          <div style={{ display: 'grid', gap: 16, marginBottom: 24 }}>
            {/* Calories by Meal Type */}
            <div style={{
              background: 'white',
              borderRadius: 16,
              padding: 20,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              border: '1px solid #e5e7eb'
            }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, color: '#374151' }}>
                🍽️ Calorias por Tipo de Refeição
              </h2>
              <div style={{ display: 'grid', gap: 12 }}>
                {Object.entries(stats.caloriesByType).map(([type, data]) => {
                  const config = mealTypeConfig[type] || mealTypeConfig.lunch;
                  const avg = data.total / data.count;
                  return (
                    <div
                      key={type}
                      style={{
                        padding: 16,
                        background: '#f9fafb',
                        borderRadius: 12,
                        border: '1px solid #e5e7eb',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontSize: 24 }}>{config.icon}</span>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 16, color: config.color }}>
                            {config.label}
                          </div>
                          <div style={{ fontSize: 12, color: '#666' }}>
                            {data.count} refeições
                          </div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 20, fontWeight: 700, color: config.color }}>
                          {data.total.toFixed(0)} kcal
                        </div>
                        <div style={{ fontSize: 12, color: '#666' }}>
                          ~{avg.toFixed(0)} kcal/ref
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top Foods */}
            {stats.topFoods.length > 0 && (
              <div style={{
                background: 'white',
                borderRadius: 16,
                padding: 20,
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                border: '1px solid #e5e7eb'
              }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, color: '#374151' }}>
                  🏆 Top 10 Alimentos Mais Consumidos
                </h2>
                <div style={{ display: 'grid', gap: 8 }}>
                  {stats.topFoods.map(([food, count], index) => (
                    <div
                      key={food}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '12px 16px',
                        background: index < 3 ? '#fef3c7' : '#f9fafb',
                        borderRadius: 8,
                        border: index < 3 ? '1px solid #fbbf24' : '1px solid #e5e7eb'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{
                          fontSize: 18,
                          fontWeight: 700,
                          color: index < 3 ? '#f59e0b' : '#9ca3af',
                          minWidth: 24
                        }}>
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
                        </span>
                        <span style={{
                          fontWeight: 600,
                          fontSize: 15,
                          textTransform: 'capitalize',
                          color: '#374151'
                        }}>
                          {food}
                        </span>
                      </div>
                      <span style={{
                        fontSize: 16,
                        fontWeight: 700,
                        color: index < 3 ? '#f59e0b' : '#6b7280'
                      }}>
                        {count}x
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Calories per Day */}
            {Object.keys(stats.caloriesByDay).length > 0 && (
              <div style={{
                background: 'white',
                borderRadius: 16,
                padding: 20,
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                border: '1px solid #e5e7eb'
              }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, color: '#374151' }}>
                  📅 Calorias por Dia
                </h2>
                <div style={{ maxHeight: 400, overflow: 'auto' }}>
                  <div style={{ display: 'grid', gap: 8 }}>
                    {Object.entries(stats.caloriesByDay)
                      .sort(([a], [b]) => {
                        const [dA, mA, yA] = a.split('/').map(Number);
                        const [dB, mB, yB] = b.split('/').map(Number);
                        return new Date(yB, mB - 1, dB).getTime() - new Date(yA, mA - 1, dA).getTime();
                      })
                      .map(([date, cals]) => (
                        <div
                          key={date}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            padding: '12px 16px',
                            background: '#f9fafb',
                            borderRadius: 8,
                            border: '1px solid #e5e7eb'
                          }}
                        >
                          <span style={{ fontWeight: 600, color: '#374151' }}>{date}</span>
                          <span style={{ fontWeight: 700, color: '#2196F3' }}>
                            {cals.toFixed(0)} kcal
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <div style={{
          textAlign: 'center',
          padding: '48px 24px',
          background: '#f9fafb',
          borderRadius: 16,
          border: '2px dashed #d1d5db'
        }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>📊</div>
          <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
            Nenhum dado neste período
          </h3>
          <p style={{ color: '#666', fontSize: 14 }}>
            Tente selecionar outro período ou capture uma refeição!
          </p>
        </div>
      )}
    </div>
  );
}
