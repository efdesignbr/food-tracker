'use client';

import { useState, useEffect } from 'react';

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

function formatDate(isoDate: string) {
  const d = new Date(isoDate);
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export default function HistoryPage() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const totalCalories = meals.reduce((sum, meal) =>
    sum + meal.foods.reduce((s, f) => s + (f.calories || 0), 0), 0
  );

  if (loading) {
    return (
      <div style={{ padding: 24, maxWidth: 800, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
          <p style={{ color: '#666', fontSize: 16 }}>Carregando histórico...</p>
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
    <div style={{ padding: '16px', maxWidth: 800, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 16 }}>📋 Histórico</h1>

        {meals.length > 0 && (
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
              <div style={{ fontSize: 14, opacity: 0.9 }}>Total</div>
              <div style={{ fontSize: 24, fontWeight: 700 }}>{meals.length}</div>
              <div style={{ fontSize: 12, opacity: 0.8 }}>refeições</div>
            </div>
            <div style={{
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              padding: 16,
              borderRadius: 12,
              color: 'white'
            }}>
              <div style={{ fontSize: 14, opacity: 0.9 }}>Calorias</div>
              <div style={{ fontSize: 24, fontWeight: 700 }}>{totalCalories.toFixed(0)}</div>
              <div style={{ fontSize: 12, opacity: 0.8 }}>kcal total</div>
            </div>
          </div>
        )}
      </div>

      {/* Empty State */}
      {meals.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '48px 24px',
          background: '#f9fafb',
          borderRadius: 16,
          border: '2px dashed #d1d5db'
        }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🍽️</div>
          <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
            Nenhuma refeição ainda
          </h3>
          <p style={{ color: '#666', fontSize: 14 }}>
            Comece capturando sua primeira refeição!
          </p>
        </div>
      ) : (
        /* Meals List */
        <div style={{ display: 'grid', gap: 16 }}>
          {meals.map((meal) => {
            const mealCalories = meal.foods.reduce((s, f) => s + (f.calories || 0), 0);
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
                {/* Image */}
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

                {/* Content */}
                <div style={{ padding: 16 }}>
                  {/* Header */}
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <span style={{ fontSize: 24 }}>{config.icon}</span>
                      <h3 style={{
                        margin: 0,
                        fontSize: 18,
                        fontWeight: 700,
                        color: config.color
                      }}>
                        {config.label}
                      </h3>
                    </div>
                    <div style={{
                      fontSize: 14,
                      color: '#666',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6
                    }}>
                      <span>🕐</span>
                      {formatDate(meal.consumed_at)}
                    </div>
                  </div>

                  {/* Notes */}
                  {meal.notes && (
                    <div style={{
                      padding: 12,
                      background: '#f9fafb',
                      borderRadius: 8,
                      marginBottom: 12,
                      borderLeft: '3px solid ' + config.color
                    }}>
                      <p style={{
                        margin: 0,
                        fontSize: 14,
                        color: '#374151',
                        fontStyle: 'italic'
                      }}>
                        "{meal.notes}"
                      </p>
                    </div>
                  )}

                  {/* Foods */}
                  <div style={{ marginBottom: 12 }}>
                    <div style={{
                      fontSize: 12,
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
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '8px 12px',
                            background: '#f9fafb',
                            borderRadius: 8,
                            fontSize: 14
                          }}
                        >
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, marginBottom: 2 }}>
                              {food.name}
                            </div>
                            <div style={{ fontSize: 12, color: '#666' }}>
                              {food.quantity}{food.unit}
                              {food.calories && ` • ${food.calories.toFixed(0)} kcal`}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Total */}
                  <div style={{
                    padding: 12,
                    background: config.color,
                    borderRadius: 8,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    color: 'white'
                  }}>
                    <span style={{ fontWeight: 600 }}>Total da Refeição</span>
                    <span style={{ fontSize: 18, fontWeight: 700 }}>
                      {mealCalories.toFixed(0)} kcal
                    </span>
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
