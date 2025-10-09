'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';

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
  image_url: string;
  meal_type: string;
  consumed_at: string;
  notes: string | null;
  foods: Food[];
};

const mealTypeConfig: Record<string, { label: string; icon: string; color: string }> = {
  breakfast: { label: 'Café da Manhã', icon: '☀️', color: '#f59e0b' },
  lunch: { label: 'Almoço', icon: '🍽️', color: '#10b981' },
  dinner: { label: 'Jantar', icon: '🌙', color: '#6366f1' },
  snack: { label: 'Lanche', icon: '🍿', color: '#ec4899' }
};

export default function HomePage() {
  const router = useRouter();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [goals, setGoals] = useState({
    calories: 2000,
    protein: 150,
    carbs: 250,
    fat: 65,
    water: 2000
  });
  const [waterIntake, setWaterIntake] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addingWater, setAddingWater] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);

        // Fetch meals, user profile, and water intake in parallel
        const [mealsRes, profileRes, waterRes] = await Promise.all([
          fetch('/api/meals', { credentials: 'include', cache: 'no-store' }),
          fetch('/api/user/profile', { credentials: 'include', cache: 'no-store' }),
          fetch('/api/water-intake', { credentials: 'include', cache: 'no-store' })
        ]);

        if (!mealsRes.ok) throw new Error('Erro ao buscar refeições');

        const mealsData = await mealsRes.json();
        setMeals(mealsData.meals || []);

        // Load user goals if profile fetch succeeded
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setGoals({
            calories: profileData.user.goals.calories,
            protein: profileData.user.goals.protein,
            carbs: profileData.user.goals.carbs,
            fat: profileData.user.goals.fat,
            water: profileData.user.goals.water || 2000
          });
        }

        // Load water intake
        if (waterRes.ok) {
          const waterData = await waterRes.json();
          setWaterIntake(waterData.total_ml || 0);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Função para adicionar água
  const addWater = async (amount: number) => {
    try {
      setAddingWater(true);
      const res = await fetch('/api/water-intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount_ml: amount }),
        credentials: 'include',
        cache: 'no-store'
      });

      if (res.ok) {
        const data = await res.json();
        setWaterIntake(data.total_today_ml);
      }
    } catch (err) {
      console.error('Erro ao adicionar água:', err);
    } finally {
      setAddingWater(false);
    }
  };

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

    return {
      calories,
      protein,
      carbs,
      fat,
      meals: todayMeals.slice(0, 3) // Last 3 meals
    };
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
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 16 }}>🏠 Início</h1>

      {/* Progresso de Hoje */}
      <div style={{
        background: 'white',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        border: '2px solid #2196F3'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: '#2196F3' }}>
            🎯 Progresso de Hoje
          </h2>
          <span style={{ fontSize: 13, color: '#666' }}>
            {todayStats.meals.length} refeição{todayStats.meals.length !== 1 ? 'ões' : ''}
          </span>
        </div>

        {/* Calorias */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>🔥 Calorias</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: todayStats.calories > goals.calories ? '#ef4444' : '#2196F3' }}>
              {todayStats.calories.toFixed(0)} / {goals.calories} kcal
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
              width: `${Math.min((todayStats.calories / goals.calories) * 100, 100)}%`,
              height: '100%',
              background: todayStats.calories > goals.calories
                ? 'linear-gradient(90deg, #f59e0b 0%, #ef4444 100%)'
                : 'linear-gradient(90deg, #10b981 0%, #2196F3 100%)',
              transition: 'width 0.3s ease'
            }} />
          </div>
          {todayStats.calories > goals.calories && (
            <p style={{ fontSize: 11, color: '#ef4444', margin: '4px 0 0 0' }}>
              ⚠️ Acima da meta em {(todayStats.calories - goals.calories).toFixed(0)} kcal
            </p>
          )}
          {todayStats.calories < goals.calories && todayStats.calories > 0 && (
            <p style={{ fontSize: 11, color: '#10b981', margin: '4px 0 0 0' }}>
              ✅ Restam {(goals.calories - todayStats.calories).toFixed(0)} kcal
            </p>
          )}
        </div>

        {/* Macros Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {/* Proteína */}
          <div>
            <div style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>🥩 Proteína</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#374151' }}>
              {todayStats.protein.toFixed(0)}g
            </div>
            <div style={{ fontSize: 10, color: '#6b7280' }}>
              Meta: {goals.protein}g
            </div>
          </div>

          {/* Carboidratos */}
          <div>
            <div style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>🍚 Carbos</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#374151' }}>
              {todayStats.carbs.toFixed(0)}g
            </div>
            <div style={{ fontSize: 10, color: '#6b7280' }}>
              Meta: {goals.carbs}g
            </div>
          </div>

          {/* Gorduras */}
          <div>
            <div style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>🧈 Gorduras</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#374151' }}>
              {todayStats.fat.toFixed(0)}g
            </div>
            <div style={{ fontSize: 10, color: '#6b7280' }}>
              Meta: {goals.fat}g
            </div>
          </div>
        </div>
      </div>

      {/* Card de Hidratação */}
      <div style={{
        background: 'white',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        border: '2px solid #06b6d4'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: '#06b6d4' }}>
            💧 Hidratação
          </h2>
          <span style={{ fontSize: 13, color: '#666' }}>
            {Math.floor(waterIntake / 250)} {Math.floor(waterIntake / 250) === 1 ? 'copo' : 'copos'}
          </span>
        </div>

        {/* Barra de progresso */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>💦 Água</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: waterIntake >= goals.water ? '#06b6d4' : '#0891b2' }}>
              {waterIntake} / {goals.water} ml
            </span>
          </div>
          <div style={{
            width: '100%',
            height: 8,
            background: '#e0f2fe',
            borderRadius: 4,
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${Math.min((waterIntake / goals.water) * 100, 100)}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #06b6d4 0%, #0891b2 100%)',
              transition: 'width 0.3s ease'
            }} />
          </div>
          {waterIntake >= goals.water && (
            <p style={{ fontSize: 11, color: '#06b6d4', margin: '4px 0 0 0' }}>
              ✅ Meta atingida! Parabéns!
            </p>
          )}
          {waterIntake < goals.water && waterIntake > 0 && (
            <p style={{ fontSize: 11, color: '#0891b2', margin: '4px 0 0 0' }}>
              Faltam {goals.water - waterIntake}ml ({Math.ceil((goals.water - waterIntake) / 250)} copos)
            </p>
          )}
        </div>

        {/* Botões de ação */}
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={() => addWater(250)}
            disabled={addingWater}
            style={{
              flex: 1,
              padding: '14px 16px',
              border: 'none',
              background: addingWater ? '#94a3b8' : 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
              color: 'white',
              borderRadius: 12,
              fontWeight: 600,
              fontSize: 16,
              cursor: addingWater ? 'not-allowed' : 'pointer',
              boxShadow: '0 2px 8px rgba(6, 182, 212, 0.3)',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8
            }}
            onMouseOver={(e) => {
              if (!addingWater) {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(6, 182, 212, 0.4)';
              }
            }}
            onMouseOut={(e) => {
              if (!addingWater) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(6, 182, 212, 0.3)';
              }
            }}
          >
            <span style={{ fontSize: 20 }}>🥤</span>
            <span>+ 250ml</span>
          </button>

          <button
            onClick={() => addWater(500)}
            disabled={addingWater}
            style={{
              flex: 1,
              padding: '14px 16px',
              border: '2px solid #06b6d4',
              background: 'white',
              color: '#06b6d4',
              borderRadius: 12,
              fontWeight: 600,
              fontSize: 16,
              cursor: addingWater ? 'not-allowed' : 'pointer',
              opacity: addingWater ? 0.5 : 1,
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8
            }}
            onMouseOver={(e) => {
              if (!addingWater) {
                e.currentTarget.style.background = '#ecfeff';
              }
            }}
            onMouseOut={(e) => {
              if (!addingWater) {
                e.currentTarget.style.background = 'white';
              }
            }}
          >
            <span style={{ fontSize: 20 }}>🧊</span>
            <span>+ 500ml</span>
          </button>
        </div>
      </div>

      {/* CTA Principal */}
      <button
        onClick={() => router.push('/capture')}
        style={{
          width: '100%',
          padding: '24px 20px',
          border: 'none',
          background: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)',
          color: 'white',
          borderRadius: 16,
          fontWeight: 700,
          fontSize: 20,
          cursor: 'pointer',
          boxShadow: '0 6px 20px rgba(33, 150, 243, 0.4)',
          marginBottom: 24,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
          transition: 'transform 0.2s, box-shadow 0.2s'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(33, 150, 243, 0.5)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 6px 20px rgba(33, 150, 243, 0.4)';
        }}
      >
        <span style={{ fontSize: 40 }}>📸</span>
        <span>Registrar Refeição</span>
      </button>

      {/* Últimas Refeições */}
      {todayStats.meals.length > 0 && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>📊 Últimas Refeições</h3>
            <button
              onClick={() => router.push('/history')}
              style={{
                padding: '6px 12px',
                border: 'none',
                background: '#f0f9ff',
                color: '#2196F3',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Ver Todas →
            </button>
          </div>

          <div style={{ display: 'grid', gap: 12 }}>
            {todayStats.meals.map((meal) => {
              const mealCalories = meal.foods.reduce((s, f) => s + (f.calories || 0), 0);
              const config = mealTypeConfig[meal.meal_type] || mealTypeConfig.lunch;

              return (
                <div
                  key={meal.id}
                  style={{
                    background: 'white',
                    borderRadius: 12,
                    padding: 16,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    border: '1px solid #e5e7eb',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 32 }}>{config.icon}</span>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: config.color }}>
                        {config.label}
                      </div>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>
                        {new Date(meal.consumed_at).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#374151' }}>
                      {mealCalories.toFixed(0)}
                    </div>
                    <div style={{ fontSize: 11, color: '#6b7280' }}>kcal</div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Empty State */}
      {todayStats.meals.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '48px 24px',
          background: '#f9fafb',
          borderRadius: 16,
          border: '2px dashed #d1d5db'
        }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🍽️</div>
          <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
            Nenhuma refeição registrada hoje
          </h3>
          <p style={{ color: '#666', fontSize: 14, marginBottom: 16 }}>
            Comece registrando sua primeira refeição do dia!
          </p>
          <button
            onClick={() => router.push('/capture')}
            style={{
              padding: '12px 24px',
              border: 'none',
              background: '#2196F3',
              color: 'white',
              borderRadius: 12,
              fontWeight: 600,
              fontSize: 14,
              cursor: 'pointer'
            }}
          >
            📸 Registrar Agora
          </button>
        </div>
      )}
    </div>
  );
}
