'use client';

import { useState, useEffect } from 'react';

type Food = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  calories?: number;
};

type Meal = {
  id: string;
  image_url: string;
  meal_type: string;
  consumed_at: string;
  notes: string | null;
  foods: Food[];
};

function formatDate(isoDate: string) {
  const d = new Date(isoDate);
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function getMealTypeLabel(type: string) {
  const labels: Record<string, string> = {
    breakfast: 'Café da manhã',
    lunch: 'Almoço',
    dinner: 'Jantar',
    snack: 'Lanche'
  };
  return labels[type] || type;
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
        if (!res.ok) {
          throw new Error('Erro ao buscar refeições');
        }
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

  if (loading) {
    return (
      <main style={{ padding: 24, fontFamily: 'system-ui, -apple-system' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Histórico</h1>
        <p>Carregando...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main style={{ padding: 24, fontFamily: 'system-ui, -apple-system' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Histórico</h1>
        <p style={{ color: 'red' }}>Erro: {error}</p>
      </main>
    );
  }

  const totalCalories = meals.reduce((sum, meal) => {
    const mealCals = meal.foods.reduce((s, f) => s + (f.calories || 0), 0);
    return sum + mealCals;
  }, 0);

  return (
    <main style={{ padding: 24, fontFamily: 'system-ui, -apple-system', maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Histórico de Refeições</h1>
        <div style={{ textAlign: 'right' }}>
          <p style={{ margin: 0, fontSize: 14, color: '#666' }}>Total de refeições: {meals.length}</p>
          <p style={{ margin: 0, fontSize: 14, color: '#666' }}>Calorias totais: {totalCalories.toFixed(0)}</p>
        </div>
      </div>

      {meals.length === 0 ? (
        <p style={{ color: '#666' }}>Nenhuma refeição registrada ainda.</p>
      ) : (
        <div style={{ display: 'grid', gap: 16 }}>
          {meals.map((meal) => {
            const mealCalories = meal.foods.reduce((s, f) => s + (f.calories || 0), 0);

            return (
              <div
                key={meal.id}
                style={{
                  border: '1px solid #e0e0e0',
                  borderRadius: 8,
                  padding: 16,
                  backgroundColor: '#fff'
                }}
              >
                <div style={{ display: 'flex', gap: 16 }}>
                  <img
                    src={meal.image_url}
                    alt="Refeição"
                    style={{
                      width: 120,
                      height: 120,
                      objectFit: 'cover',
                      borderRadius: 8
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>
                        {getMealTypeLabel(meal.meal_type)}
                      </h3>
                      <span style={{ fontSize: 14, color: '#666' }}>
                        {formatDate(meal.consumed_at)}
                      </span>
                    </div>

                    {meal.notes && (
                      <p style={{ margin: '8px 0', fontSize: 14, color: '#666', fontStyle: 'italic' }}>
                        {meal.notes}
                      </p>
                    )}

                    <div style={{ marginTop: 12 }}>
                      <p style={{ margin: '4px 0', fontSize: 14, fontWeight: 600 }}>
                        Alimentos ({meal.foods.length}):
                      </p>
                      <ul style={{ margin: '4px 0', paddingLeft: 20 }}>
                        {meal.foods.map((food) => (
                          <li key={food.id} style={{ fontSize: 14, marginBottom: 4 }}>
                            {food.name} - {food.quantity}{food.unit}
                            {food.calories && ` (${food.calories.toFixed(0)} cal)`}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div style={{ marginTop: 12, padding: '8px 12px', backgroundColor: '#f5f5f5', borderRadius: 4 }}>
                      <strong>Total da refeição: {mealCalories.toFixed(0)} calorias</strong>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
