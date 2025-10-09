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

type FilterPeriod = 'week' | 'month' | 'all';

const mealTypeConfig: Record<string, { label: string; icon: string; color: string }> = {
  breakfast: { label: 'Café da Manhã', icon: '☀️', color: '#f59e0b' },
  lunch: { label: 'Almoço', icon: '🍽️', color: '#10b981' },
  dinner: { label: 'Jantar', icon: '🌙', color: '#6366f1' },
  snack: { label: 'Lanche', icon: '🍿', color: '#ec4899' }
};

const periodConfig: Record<FilterPeriod, { label: string; icon: string }> = {
  week: { label: '7 dias', icon: '📊' },
  month: { label: '30 dias', icon: '📈' },
  all: { label: 'Tudo', icon: '🗂️' }
};

function filterMealsByPeriod(meals: Meal[], period: FilterPeriod): Meal[] {
  if (period === 'all') return meals;

  const now = new Date();
  const cutoff = new Date();

  switch (period) {
    case 'week':
      cutoff.setDate(cutoff.getDate() - 7);
      break;
    case 'month':
      cutoff.setDate(cutoff.getDate() - 30);
      break;
  }

  return meals.filter(meal => new Date(meal.consumed_at) >= cutoff);
}

type WaterRecord = {
  date: string;
  total_ml: number;
};

export default function ReportsPage() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [waterRecords, setWaterRecords] = useState<WaterRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<FilterPeriod>('week');
  const [goals, setGoals] = useState({
    calories: 2000,
    protein: 150,
    carbs: 250,
    fat: 65,
    water: 2000
  });

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [mealsRes, profileRes, waterRes] = await Promise.all([
          fetch('/api/meals', { credentials: 'include', cache: 'no-store' }),
          fetch('/api/user/profile', { credentials: 'include', cache: 'no-store' }),
          fetch('/api/water-intake?history=true', { credentials: 'include', cache: 'no-store' })
        ]);

        if (!mealsRes.ok) throw new Error('Erro ao buscar refeições');

        const mealsData = await mealsRes.json();
        setMeals(mealsData.meals || []);

        // Load water history
        if (waterRes.ok) {
          const waterData = await waterRes.json();
          setWaterRecords(waterData.history || []);
        }

        // Load user goals if profile fetch succeeded
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setGoals(profileData.user.goals);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const filteredMeals = useMemo(() => filterMealsByPeriod(meals, period), [meals, period]);

  // Filtrar água pelo período
  const filteredWater = useMemo(() => {
    if (period === 'all') return waterRecords;

    const cutoff = new Date();
    if (period === 'week') cutoff.setDate(cutoff.getDate() - 7);
    else if (period === 'month') cutoff.setDate(cutoff.getDate() - 30);

    return waterRecords.filter(record => new Date(record.date) >= cutoff);
  }, [waterRecords, period]);

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
        let key = food.name
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/\b(natural|desnatado|integral|light|zero|diet)\b/gi, '')
          .replace(/\s+/g, ' ')
          .trim();

        if (key.endsWith('s') && !key.endsWith('ss')) {
          key = key.slice(0, -1);
        }

        foodFrequency[key] = (foodFrequency[key] || 0) + 1;
      });
    });

    const topFoods = Object.entries(foodFrequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10);

    // Calorias por dia (últimos 7 dias para o gráfico)
    const caloriesByDay: { date: string; calories: number; dateObj: Date }[] = [];
    const daysMap = new Map<string, number>();

    filteredMeals.forEach((meal) => {
      const date = new Date(meal.consumed_at);
      const dateKey = date.toLocaleDateString('pt-BR');
      const mealCals = meal.foods.reduce((s, f) => s + (f.calories || 0), 0);
      daysMap.set(dateKey, (daysMap.get(dateKey) || 0) + mealCals);
    });

    // Pega os últimos 7 dias para o gráfico
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateKey = date.toLocaleDateString('pt-BR');
      last7Days.push({
        date: dateKey,
        dateObj: date,
        calories: daysMap.get(dateKey) || 0
      });
    }

    const avgCaloriesPerDay =
      daysMap.size > 0
        ? Array.from(daysMap.values()).reduce((a, b) => a + b, 0) / daysMap.size
        : 0;

    // Estatísticas de água
    const totalWater = filteredWater.reduce((sum, record) => sum + record.total_ml, 0);
    const avgWaterPerDay = filteredWater.length > 0 ? totalWater / filteredWater.length : 0;
    const daysWithWater = filteredWater.filter(r => r.total_ml > 0).length;

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
      last7Days,
      totalWater,
      avgWaterPerDay,
      daysWithWater
    };
  }, [filteredMeals, filteredWater]);

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
        gridTemplateColumns: 'repeat(3, 1fr)',
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
            <div style={{
              background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
              padding: 16,
              borderRadius: 12,
              color: 'white'
            }}>
              <div style={{ fontSize: 12, opacity: 0.9 }}>💧 Água Total</div>
              <div style={{ fontSize: 28, fontWeight: 700 }}>{(stats.totalWater / 1000).toFixed(1)}L</div>
              <div style={{ fontSize: 11, opacity: 0.8 }}>{stats.daysWithWater} dias</div>
            </div>
          </div>

          {/* Nutrientes Detalhados */}
          <div style={{
            background: 'white',
            borderRadius: 16,
            padding: 20,
            marginBottom: 24,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            border: '2px solid #2196F3'
          }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, color: '#2196F3' }}>
              🎯 Nutrientes no Período
            </h2>

            {/* Proteína */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>🥩 Proteína</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#ef4444' }}>
                  {stats.totalProtein.toFixed(1)}g total
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
                  width: `${Math.min((stats.totalProtein / (goals.protein * stats.last7Days.length)) * 100, 100)}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #ef4444 0%, #f97316 100%)',
                  transition: 'width 0.3s ease'
                }} />
              </div>
            </div>

            {/* Carboidratos */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>🍚 Carboidratos</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#f59e0b' }}>
                  {stats.totalCarbs.toFixed(1)}g total
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
                  width: `${Math.min((stats.totalCarbs / (goals.carbs * stats.last7Days.length)) * 100, 100)}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%)',
                  transition: 'width 0.3s ease'
                }} />
              </div>
            </div>

            {/* Gorduras */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>🧈 Gorduras</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#8b5cf6' }}>
                  {stats.totalFat.toFixed(1)}g total
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
                  width: `${Math.min((stats.totalFat / (goals.fat * stats.last7Days.length)) * 100, 100)}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #8b5cf6 0%, #a78bfa 100%)',
                  transition: 'width 0.3s ease'
                }} />
              </div>
            </div>

            {/* Água */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>💧 Água</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#06b6d4' }}>
                  {(stats.totalWater / 1000).toFixed(1)}L total • {stats.avgWaterPerDay.toFixed(0)}ml/dia
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
                  width: `${Math.min((stats.avgWaterPerDay / goals.water) * 100, 100)}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #06b6d4 0%, #22d3ee 100%)',
                  transition: 'width 0.3s ease'
                }} />
              </div>
            </div>
          </div>

          {/* Gráfico de Calorias (Últimos 7 dias) */}
          <div style={{
            background: 'white',
            borderRadius: 16,
            padding: 20,
            marginBottom: 24,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            border: '1px solid #e5e7eb'
          }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, color: '#374151' }}>
              📈 Evolução (Últimos 7 dias)
            </h2>
            <div style={{ position: 'relative', height: 200 }}>
              {/* Linha de Meta */}
              <div style={{
                position: 'absolute',
                top: '30%',
                left: 0,
                right: 0,
                borderTop: '2px dashed #2196F3',
                opacity: 0.3
              }} />
              <div style={{
                position: 'absolute',
                top: 'calc(30% - 20px)',
                left: 8,
                fontSize: 11,
                color: '#2196F3',
                fontWeight: 600
              }}>
                Meta: {goals.calories} kcal
              </div>

              {/* Barras */}
              <div style={{
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'space-around',
                height: '100%',
                paddingTop: 24
              }}>
                {stats.last7Days.map((day, idx) => {
                  const maxCal = Math.max(...stats.last7Days.map(d => d.calories), goals.calories);
                  const heightPercent = maxCal > 0 ? (day.calories / maxCal) * 100 : 0;
                  const isOverGoal = day.calories > goals.calories;

                  return (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        flex: 1,
                        marginRight: idx < stats.last7Days.length - 1 ? 4 : 0
                      }}
                    >
                      {day.calories > 0 && (
                        <div style={{
                          fontSize: 10,
                          fontWeight: 600,
                          color: isOverGoal ? '#ef4444' : '#10b981',
                          marginBottom: 4
                        }}>
                          {day.calories.toFixed(0)}
                        </div>
                      )}
                      <div
                        style={{
                          width: '100%',
                          height: `${heightPercent}%`,
                          background: day.calories === 0
                            ? '#e5e7eb'
                            : isOverGoal
                            ? 'linear-gradient(180deg, #f59e0b 0%, #ef4444 100%)'
                            : 'linear-gradient(180deg, #10b981 0%, #2196F3 100%)',
                          borderRadius: '4px 4px 0 0',
                          minHeight: day.calories > 0 ? 20 : 10,
                          transition: 'height 0.3s ease'
                        }}
                      />
                      <div style={{
                        fontSize: 9,
                        color: '#6b7280',
                        marginTop: 6,
                        textAlign: 'center',
                        whiteSpace: 'nowrap'
                      }}>
                        {day.dateObj.toLocaleDateString('pt-BR', { weekday: 'short' })}
                      </div>
                    </div>
                  );
                })}
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
