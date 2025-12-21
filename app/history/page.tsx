'use client';

import { useState, useEffect } from 'react';
import CalendarView from '@/components/CalendarView';
import ExportMealsButton from '@/components/ExportMealsButton';
import { api } from '@/lib/api-client';

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
  location_type?: 'home'|'out'|null;
  restaurant_name?: string | null;
};

type WaterRecord = {
  date: string;
  total_ml: number;
};

export default function HistoryPage() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [waterRecords, setWaterRecords] = useState<WaterRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
          api.get('/api/meals'),
          api.get('/api/user/profile'),
          api.get('/api/water-intake?history=true')
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

      {/* Export Button */}
      <div style={{ marginBottom: 16 }}>
        <ExportMealsButton />
      </div>

      {/* Info Card */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        color: 'white',
        boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
      }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>📅</div>
        <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, marginBottom: 4 }}>
          Navegue pelo calendário
        </h2>
        <p style={{ fontSize: 13, opacity: 0.9, margin: 0 }}>
          Toque em um dia para ver todas as refeições e detalhes nutricionais completos
        </p>
      </div>

      {/* Calendar View */}
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
            Nenhuma refeição registrada ainda
          </h3>
          <p style={{ color: '#666', fontSize: 14 }}>
            Comece registrando sua primeira refeição!
          </p>
        </div>
      ) : (
        <CalendarView
          meals={meals}
          waterRecords={waterRecords}
          calorieGoal={goals.calories}
          proteinGoal={goals.protein}
          carbsGoal={goals.carbs}
          fatGoal={goals.fat}
          waterGoal={goals.water}
        />
      )}
    </div>
  );
}
