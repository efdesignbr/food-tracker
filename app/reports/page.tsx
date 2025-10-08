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
  meal_type: string;
  consumed_at: string;
  foods: Food[];
};

export default function ReportsPage() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMeals() {
      try {
        setLoading(true);
        const res = await fetch('/api/meals');
        if (!res.ok) throw new Error('Erro ao buscar refeições');
        const data = await res.json();
        setMeals(data.meals || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchMeals();
  }, []);

  if (loading) {
    return (
      <main style={{ padding: 24, fontFamily: 'system-ui, -apple-system' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Relatórios</h1>
        <p>Carregando...</p>
      </main>
    );
  }

  // Calcular estatísticas
  const totalMeals = meals.length;
  const totalCalories = meals.reduce((sum, meal) => {
    return sum + meal.foods.reduce((s, f) => s + (f.calories || 0), 0);
  }, 0);

  const avgCaloriesPerMeal = totalMeals > 0 ? totalCalories / totalMeals : 0;

  // Calorias por tipo de refeição
  const caloriesByType: Record<string, number> = {};
  const countByType: Record<string, number> = {};

  meals.forEach((meal) => {
    const mealCals = meal.foods.reduce((s, f) => s + (f.calories || 0), 0);
    caloriesByType[meal.meal_type] = (caloriesByType[meal.meal_type] || 0) + mealCals;
    countByType[meal.meal_type] = (countByType[meal.meal_type] || 0) + 1;
  });

  // Alimentos mais consumidos
  const foodFrequency: Record<string, number> = {};
  meals.forEach((meal) => {
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
  meals.forEach((meal) => {
    const date = new Date(meal.consumed_at).toLocaleDateString('pt-BR');
    const mealCals = meal.foods.reduce((s, f) => s + (f.calories || 0), 0);
    caloriesByDay[date] = (caloriesByDay[date] || 0) + mealCals;
  });

  const avgCaloriesPerDay =
    Object.keys(caloriesByDay).length > 0
      ? Object.values(caloriesByDay).reduce((a, b) => a + b, 0) / Object.keys(caloriesByDay).length
      : 0;

  const mealTypeLabels: Record<string, string> = {
    breakfast: 'Café da manhã',
    lunch: 'Almoço',
    dinner: 'Jantar',
    snack: 'Lanche'
  };

  return (
    <main style={{ padding: 24, fontFamily: 'system-ui, -apple-system', maxWidth: 1200, margin: '0 auto' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Relatórios Nutricionais</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16, marginBottom: 32 }}>
        <div style={{ border: '1px solid #e0e0e0', borderRadius: 8, padding: 16, backgroundColor: '#f9f9f9' }}>
          <h3 style={{ margin: 0, fontSize: 14, color: '#666', marginBottom: 8 }}>Total de Refeições</h3>
          <p style={{ margin: 0, fontSize: 32, fontWeight: 700 }}>{totalMeals}</p>
        </div>

        <div style={{ border: '1px solid #e0e0e0', borderRadius: 8, padding: 16, backgroundColor: '#f9f9f9' }}>
          <h3 style={{ margin: 0, fontSize: 14, color: '#666', marginBottom: 8 }}>Calorias Totais</h3>
          <p style={{ margin: 0, fontSize: 32, fontWeight: 700 }}>{totalCalories.toFixed(0)}</p>
        </div>

        <div style={{ border: '1px solid #e0e0e0', borderRadius: 8, padding: 16, backgroundColor: '#f9f9f9' }}>
          <h3 style={{ margin: 0, fontSize: 14, color: '#666', marginBottom: 8 }}>Média por Refeição</h3>
          <p style={{ margin: 0, fontSize: 32, fontWeight: 700 }}>{avgCaloriesPerMeal.toFixed(0)}</p>
        </div>

        <div style={{ border: '1px solid #e0e0e0', borderRadius: 8, padding: 16, backgroundColor: '#f9f9f9' }}>
          <h3 style={{ margin: 0, fontSize: 14, color: '#666', marginBottom: 8 }}>Média por Dia</h3>
          <p style={{ margin: 0, fontSize: 32, fontWeight: 700 }}>{avgCaloriesPerDay.toFixed(0)}</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        <div style={{ border: '1px solid #e0e0e0', borderRadius: 8, padding: 16, backgroundColor: '#fff' }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Calorias por Tipo de Refeição</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e0e0e0' }}>
                <th style={{ textAlign: 'left', padding: '8px 0' }}>Tipo</th>
                <th style={{ textAlign: 'right', padding: '8px 0' }}>Total</th>
                <th style={{ textAlign: 'right', padding: '8px 0' }}>Média</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(caloriesByType).map(([type, cals]) => (
                <tr key={type} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '8px 0' }}>{mealTypeLabels[type] || type}</td>
                  <td style={{ textAlign: 'right', padding: '8px 0' }}>{cals.toFixed(0)} cal</td>
                  <td style={{ textAlign: 'right', padding: '8px 0' }}>
                    {(cals / countByType[type]).toFixed(0)} cal
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ border: '1px solid #e0e0e0', borderRadius: 8, padding: 16, backgroundColor: '#fff' }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Top 10 Alimentos Mais Consumidos</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e0e0e0' }}>
                <th style={{ textAlign: 'left', padding: '8px 0' }}>Alimento</th>
                <th style={{ textAlign: 'right', padding: '8px 0' }}>Vezes</th>
              </tr>
            </thead>
            <tbody>
              {topFoods.map(([food, count]) => (
                <tr key={food} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '8px 0', textTransform: 'capitalize' }}>{food}</td>
                  <td style={{ textAlign: 'right', padding: '8px 0' }}>{count}x</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ border: '1px solid #e0e0e0', borderRadius: 8, padding: 16, backgroundColor: '#fff' }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Calorias por Dia</h2>
        <div style={{ maxHeight: 400, overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ position: 'sticky', top: 0, backgroundColor: '#fff' }}>
              <tr style={{ borderBottom: '2px solid #e0e0e0' }}>
                <th style={{ textAlign: 'left', padding: '8px 0' }}>Data</th>
                <th style={{ textAlign: 'right', padding: '8px 0' }}>Calorias</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(caloriesByDay)
                .sort(([a], [b]) => {
                  const [dA, mA, yA] = a.split('/').map(Number);
                  const [dB, mB, yB] = b.split('/').map(Number);
                  return new Date(yB, mB - 1, dB).getTime() - new Date(yA, mA - 1, dA).getTime();
                })
                .map(([date, cals]) => (
                  <tr key={date} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '8px 0' }}>{date}</td>
                    <td style={{ textAlign: 'right', padding: '8px 0' }}>{cals.toFixed(0)} cal</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
