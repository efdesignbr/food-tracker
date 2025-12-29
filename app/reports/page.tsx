'use client';

import { useState, useEffect, useMemo } from 'react';
import { getCurrentDateBR, toDateBR } from '@/lib/datetime';
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
  cholesterol_mg?: number;
  saturated_fat_g?: number;
  calcium_mg?: number;
  magnesium_mg?: number;
  phosphorus_mg?: number;
  iron_mg?: number;
  potassium_mg?: number;
  zinc_mg?: number;
  copper_mg?: number;
  manganese_mg?: number;
  vitamin_c_mg?: number;
  vitamin_a_mcg?: number;
  vitamin_b1_mg?: number;
  vitamin_b2_mg?: number;
  vitamin_b3_mg?: number;
  vitamin_b6_mg?: number;
};

type Meal = {
  id: string;
  meal_type: string;
  consumed_at: string;
  foods: Food[];
  location_type?: 'home'|'out'|null;
  restaurant_name?: string | null;
};

type FilterPeriod = 'week' | 'month' | 'all' | 'custom';

type AiAnalysisResult = {
  summary: string;
  caloric_balance: string;
  macronutrient_distribution: string;
  inflammatory_foods: string;
  meal_regularity: string;
  hydration: string;
  suggestions: string[];
};

const mealTypeConfig: Record<string, { label: string; icon: string; color: string }> = {
  breakfast: { label: 'Café da Manhã', icon: '', color: '#f59e0b' },
  lunch: { label: 'Almoço', icon: '', color: '#10b981' },
  dinner: { label: 'Jantar', icon: '', color: '#6366f1' },
  snack: { label: 'Lanche', icon: '', color: '#ec4899' }
};

const periodConfig: Record<FilterPeriod, { label: string; icon: string }> = {
  week: { label: '7 dias', icon: '' },
  month: { label: '30 dias', icon: '' },
  all: { label: 'Tudo', icon: '' },
  custom: { label: 'Personalizado', icon: '' }
};

function filterMealsByPeriod(
  meals: Meal[],
  period: FilterPeriod,
  customStart?: Date,
  customEnd?: Date
): Meal[] {
  if (period === 'all') return meals;

  if (period === 'custom' && customStart && customEnd) {
    return meals.filter(meal => {
      const mealDate = new Date(meal.consumed_at);
      return mealDate >= customStart && mealDate <= customEnd;
    });
  }

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

// Parse 'YYYY-MM-DD' as a local Date (avoid UTC shift)
function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
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
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [goals, setGoals] = useState({
    calories: 2000,
    protein: 150,
    carbs: 250,
    fat: 65,
    water: 2000
  });

  // AI Analysis states
  const [aiAnalysis, setAiAnalysis] = useState<AiAnalysisResult | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [showAiAnalysis, setShowAiAnalysis] = useState(false);

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

  const filteredMeals = useMemo(() => {
    const start = customStartDate ? parseLocalDate(customStartDate) : undefined;
    const end = customEndDate ? parseLocalDate(customEndDate) : undefined;
    return filterMealsByPeriod(meals, period, start, end);
  }, [meals, period, customStartDate, customEndDate]);

  // Filtrar água pelo período
  const filteredWater = useMemo(() => {
    if (period === 'all') return waterRecords;

    if (period === 'custom' && customStartDate && customEndDate) {
      // Compare date-only strings lexicographically (YYYY-MM-DD)
      return waterRecords.filter(record => record.date >= customStartDate && record.date <= customEndDate);
    }

    const cutoff = new Date();
    if (period === 'week') cutoff.setDate(cutoff.getDate() - 7);
    else if (period === 'month') cutoff.setDate(cutoff.getDate() - 30);

    // Compare using date-only strings in BR timezone
    return waterRecords.filter(record => record.date >= toDateBR(cutoff));
  }, [waterRecords, period, customStartDate, customEndDate]);

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
    const totalFiber = filteredMeals.reduce((sum, meal) =>
      sum + meal.foods.reduce((s, f) => s + (f.fiber_g || 0), 0), 0
    );
    const totalSodium = filteredMeals.reduce((sum, meal) =>
      sum + meal.foods.reduce((s, f) => s + (f.sodium_mg || 0), 0), 0
    );
    const totalSugar = filteredMeals.reduce((sum, meal) =>
      sum + meal.foods.reduce((s, f) => s + (f.sugar_g || 0), 0), 0
    );

    // Micronutrientes
    const totalCholesterol = filteredMeals.reduce((sum, meal) =>
      sum + meal.foods.reduce((s, f) => s + (f.cholesterol_mg || 0), 0), 0
    );
    const totalSaturatedFat = filteredMeals.reduce((sum, meal) =>
      sum + meal.foods.reduce((s, f) => s + (f.saturated_fat_g || 0), 0), 0
    );
    const totalCalcium = filteredMeals.reduce((sum, meal) =>
      sum + meal.foods.reduce((s, f) => s + (f.calcium_mg || 0), 0), 0
    );
    const totalMagnesium = filteredMeals.reduce((sum, meal) =>
      sum + meal.foods.reduce((s, f) => s + (f.magnesium_mg || 0), 0), 0
    );
    const totalPhosphorus = filteredMeals.reduce((sum, meal) =>
      sum + meal.foods.reduce((s, f) => s + (f.phosphorus_mg || 0), 0), 0
    );
    const totalIron = filteredMeals.reduce((sum, meal) =>
      sum + meal.foods.reduce((s, f) => s + (f.iron_mg || 0), 0), 0
    );
    const totalPotassium = filteredMeals.reduce((sum, meal) =>
      sum + meal.foods.reduce((s, f) => s + (f.potassium_mg || 0), 0), 0
    );
    const totalZinc = filteredMeals.reduce((sum, meal) =>
      sum + meal.foods.reduce((s, f) => s + (f.zinc_mg || 0), 0), 0
    );
    const totalCopper = filteredMeals.reduce((sum, meal) =>
      sum + meal.foods.reduce((s, f) => s + (f.copper_mg || 0), 0), 0
    );
    const totalManganese = filteredMeals.reduce((sum, meal) =>
      sum + meal.foods.reduce((s, f) => s + (f.manganese_mg || 0), 0), 0
    );
    const totalVitaminC = filteredMeals.reduce((sum, meal) =>
      sum + meal.foods.reduce((s, f) => s + (f.vitamin_c_mg || 0), 0), 0
    );
    const totalVitaminA = filteredMeals.reduce((sum, meal) =>
      sum + meal.foods.reduce((s, f) => s + (f.vitamin_a_mcg || 0), 0), 0
    );
    const totalVitaminB1 = filteredMeals.reduce((sum, meal) =>
      sum + meal.foods.reduce((s, f) => s + (f.vitamin_b1_mg || 0), 0), 0
    );
    const totalVitaminB2 = filteredMeals.reduce((sum, meal) =>
      sum + meal.foods.reduce((s, f) => s + (f.vitamin_b2_mg || 0), 0), 0
    );
    const totalVitaminB3 = filteredMeals.reduce((sum, meal) =>
      sum + meal.foods.reduce((s, f) => s + (f.vitamin_b3_mg || 0), 0), 0
    );
    const totalVitaminB6 = filteredMeals.reduce((sum, meal) =>
      sum + meal.foods.reduce((s, f) => s + (f.vitamin_b6_mg || 0), 0), 0
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

    // Calorias por dia para o gráfico (baseado no período filtrado)
    const daysMap = new Map<string, number>();

    filteredMeals.forEach((meal) => {
      const date = new Date(meal.consumed_at);
      const dateKey = date.toLocaleDateString('pt-BR');
      const mealCals = meal.foods.reduce((s, f) => s + (f.calories || 0), 0);
      daysMap.set(dateKey, (daysMap.get(dateKey) || 0) + mealCals);
    });

    // Gerar array de dias do período filtrado
    const periodDays = [];

    // Determinar início e fim do período para o gráfico
    let startDate: Date;
    let endDate = new Date();

    if (period === 'custom' && customStartDate && customEndDate) {
      startDate = parseLocalDate(customStartDate);
      endDate = parseLocalDate(customEndDate);
    } else if (period === 'week') {
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 6); // 7 dias incluindo hoje
    } else if (period === 'month') {
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 29); // 30 dias incluindo hoje
    } else {
      // Para 'all', pega os últimos 7 dias por padrão
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 6);
    }

    // Gerar dias do período
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const numDays = Math.min(daysDiff + 1, 30); // Máximo 30 dias no gráfico

    for (let i = numDays - 1; i >= 0; i--) {
      const date = new Date(endDate);
      date.setDate(date.getDate() - i);
      const dateKey = date.toLocaleDateString('pt-BR');
      periodDays.push({
        date: dateKey,
        dateObj: date,
        calories: daysMap.get(dateKey) || 0
      });
    }

    const last7Days = periodDays; // Manter nome para compatibilidade

    const avgCaloriesPerDay =
      daysMap.size > 0
        ? Array.from(daysMap.values()).reduce((a, b) => a + b, 0) / daysMap.size
        : 0;

    // Estatísticas de água
    const totalWater = filteredWater.reduce((sum, record) => sum + record.total_ml, 0);
    const avgWaterPerDay = filteredWater.length > 0 ? totalWater / filteredWater.length : 0;
    const daysWithWater = filteredWater.filter(r => r.total_ml > 0).length;

    // Locais das refeições
    const locationCounts = { home: 0, out: 0 };
    const restaurantsMap: Record<string, number> = {};
    filteredMeals.forEach((meal) => {
      if (meal.location_type === 'out') {
        locationCounts.out += 1;
        if (meal.restaurant_name) {
          restaurantsMap[meal.restaurant_name] = (restaurantsMap[meal.restaurant_name] || 0) + 1;
        }
      } else {
        locationCounts.home += 1;
      }
    });
    const topRestaurants = Object.entries(restaurantsMap).sort((a, b) => b[1] - a[1]).slice(0, 5);

    return {
      totalMeals,
      totalCalories,
      totalProtein,
      totalCarbs,
      totalFat,
      totalFiber,
      totalSodium,
      totalSugar,
      avgCaloriesPerMeal,
      avgCaloriesPerDay,
      caloriesByType,
      topFoods,
      last7Days,
      totalWater,
      avgWaterPerDay,
      daysWithWater,
      locationCounts,
      topRestaurants,
      // Micronutrientes
      totalCholesterol,
      totalSaturatedFat,
      totalCalcium,
      totalMagnesium,
      totalPhosphorus,
      totalIron,
      totalPotassium,
      totalZinc,
      totalCopper,
      totalManganese,
      totalVitaminC,
      totalVitaminA,
      totalVitaminB1,
      totalVitaminB2,
      totalVitaminB3,
      totalVitaminB6
    };
  }, [filteredMeals, filteredWater, period, customStartDate, customEndDate]);

  // Função para solicitar análise de IA
  const requestAiAnalysis = async () => {
    if (filteredMeals.length === 0) {
      setAiError('Nenhuma refeição disponível para análise');
      return;
    }

    try {
      setAiLoading(true);
      setAiError(null);

      // Determinar datas do período
      let start_date: string;
      let end_date: string;

      if (period === 'custom' && customStartDate && customEndDate) {
        start_date = customStartDate;
        end_date = customEndDate;
      } else {
        const now = new Date();
        const startDate = new Date();

        switch (period) {
          case 'week':
            startDate.setDate(startDate.getDate() - 7);
            break;
          case 'month':
            startDate.setDate(startDate.getDate() - 30);
            break;
          case 'all':
            // Pega a data da refeição mais antiga
            if (meals.length > 0) {
              const oldestMeal = meals.reduce((oldest, meal) =>
                new Date(meal.consumed_at) < new Date(oldest.consumed_at) ? meal : oldest
              );
              startDate.setTime(new Date(oldestMeal.consumed_at).getTime());
            }
            break;
        }

        start_date = toDateBR(startDate);
        end_date = getCurrentDateBR();
      }

      const response = await api.post('/api/reports/analysis', {
        start_date,
        end_date,
        goals
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao analisar período');
      }

      const data = await response.json();
      setAiAnalysis(data.analysis);
      setShowAiAnalysis(true);
    } catch (err: any) {
      setAiError(err.message || 'Erro ao solicitar análise');
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}></div>
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
          <div style={{ fontSize: 48, marginBottom: 8 }}></div>
          <p style={{ color: '#991b1b', margin: 0 }}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 16, maxWidth: 1200, margin: '0 auto', paddingBottom: 80 }}>
      {/* Header */}
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 16 }}> Relatórios</h1>

      {/* Period Filter */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 8,
        marginBottom: 16
      }}>
        {(Object.keys(periodConfig) as FilterPeriod[]).map(p => (
          <button
            key={p}
            onClick={() => {
              setPeriod(p);
              if (p !== 'custom') {
                setShowAiAnalysis(false);
                setAiAnalysis(null);
              }
            }}
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

      {/* Custom Date Range Picker */}
      {period === 'custom' && (
        <div style={{
          background: 'white',
          borderRadius: 12,
          padding: 16,
          marginBottom: 16,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          border: '2px solid #2196F3'
        }}>
          <div style={{ marginBottom: 12, fontWeight: 600, color: '#374151', fontSize: 14 }}>
             Selecione o Período
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ width: '100%' }}>
              <label style={{ display: 'block', fontSize: 12, color: '#666', marginBottom: 4 }}>
                Data Inicial
              </label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                style={{
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  display: 'block',
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '10px 12px',
                  margin: 0,
                  borderRadius: 8,
                  border: '1px solid #d1d5db',
                  backgroundColor: 'white',
                  fontSize: 16,
                  color: '#374151',
                  minHeight: 44
                }}
              />
            </div>
            <div style={{ width: '100%' }}>
              <label style={{ display: 'block', fontSize: 12, color: '#666', marginBottom: 4 }}>
                Data Final
              </label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                style={{
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  display: 'block',
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '10px 12px',
                  margin: 0,
                  borderRadius: 8,
                  border: '1px solid #d1d5db',
                  backgroundColor: 'white',
                  fontSize: 16,
                  color: '#374151',
                  minHeight: 44
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* AI Analysis Button */}
      {filteredMeals.length > 0 && (
        <button
          onClick={requestAiAnalysis}
          disabled={aiLoading}
          style={{
            width: '100%',
            padding: '16px',
            border: 'none',
            background: aiLoading
              ? '#9ca3af'
              : 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
            color: 'white',
            borderRadius: 12,
            fontWeight: 700,
            fontSize: 16,
            cursor: aiLoading ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
            transition: 'all 0.2s',
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8
          }}
        >
          {aiLoading ? (
            <>
              <span></span>
              <span>Analisando com IA...</span>
            </>
          ) : (
            <>
              <span></span>
              <span>Analisar Período com IA</span>
            </>
          )}
        </button>
      )}

      {/* AI Analysis Error */}
      {aiError && (
        <div style={{
          padding: 16,
          background: '#fee2e2',
          border: '2px solid #ef4444',
          borderRadius: 12,
          marginBottom: 24,
          color: '#991b1b',
          fontSize: 14
        }}>
           {aiError}
        </div>
      )}

      {/* AI Analysis Result */}
      {showAiAnalysis && aiAnalysis && (
        <div style={{
          background: 'white',
          borderRadius: 16,
          padding: 20,
          marginBottom: 24,
          boxShadow: '0 4px 16px rgba(139, 92, 246, 0.2)',
          border: '2px solid #8b5cf6'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16
          }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#8b5cf6', margin: 0 }}>
               Análise da IA
            </h2>
            <button
              onClick={() => setShowAiAnalysis(false)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: 20,
                cursor: 'pointer',
                color: '#9ca3af',
                padding: 4
              }}
            >
              
            </button>
          </div>

          {/* Summary */}
          <div style={{
            padding: 16,
            background: '#f3f4f6',
            borderRadius: 12,
            marginBottom: 16,
            borderLeft: '4px solid #8b5cf6'
          }}>
            <div style={{ fontWeight: 600, fontSize: 14, color: '#374151', marginBottom: 8 }}>
               Resumo
            </div>
            <p style={{ margin: 0, fontSize: 14, color: '#4b5563', lineHeight: 1.6 }}>
              {aiAnalysis.summary}
            </p>
          </div>

          {/* Sections Grid */}
          <div style={{ display: 'grid', gap: 12, marginBottom: 16 }}>
            <div style={{ padding: 14, background: '#fef3c7', borderRadius: 8 }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: '#92400e', marginBottom: 6 }}>
                 Balanço Calórico
              </div>
              <p style={{ margin: 0, fontSize: 13, color: '#78350f', lineHeight: 1.5 }}>
                {aiAnalysis.caloric_balance}
              </p>
            </div>

            <div style={{ padding: 14, background: '#dbeafe', borderRadius: 8 }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: '#1e40af', marginBottom: 6 }}>
                 Macronutrientes
              </div>
              <p style={{ margin: 0, fontSize: 13, color: '#1e3a8a', lineHeight: 1.5 }}>
                {aiAnalysis.macronutrient_distribution}
              </p>
            </div>

            <div style={{ padding: 14, background: '#fee2e2', borderRadius: 8 }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: '#991b1b', marginBottom: 6 }}>
                 Alimentos Inflamatórios
              </div>
              <p style={{ margin: 0, fontSize: 13, color: '#7f1d1d', lineHeight: 1.5 }}>
                {aiAnalysis.inflammatory_foods}
              </p>
            </div>

            <div style={{ padding: 14, background: '#dcfce7', borderRadius: 8 }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: '#166534', marginBottom: 6 }}>
                 Regularidade das Refeições
              </div>
              <p style={{ margin: 0, fontSize: 13, color: '#14532d', lineHeight: 1.5 }}>
                {aiAnalysis.meal_regularity}
              </p>
            </div>

            <div style={{ padding: 14, background: '#e0f2fe', borderRadius: 8 }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: '#075985', marginBottom: 6 }}>
                 Hidratação
              </div>
              <p style={{ margin: 0, fontSize: 13, color: '#0c4a6e', lineHeight: 1.5 }}>
                {aiAnalysis.hydration}
              </p>
            </div>
          </div>

          {/* Suggestions */}
          <div style={{
            padding: 16,
            background: '#f0fdf4',
            borderRadius: 12,
            border: '2px solid #10b981'
          }}>
            <div style={{ fontWeight: 600, fontSize: 14, color: '#166534', marginBottom: 10 }}>
               Sugestões de Melhoria
            </div>
            <ul style={{
              margin: 0,
              paddingLeft: 20,
              fontSize: 13,
              color: '#14532d',
              lineHeight: 1.7
            }}>
              {aiAnalysis.suggestions.map((suggestion, idx) => (
                <li key={idx} style={{ marginBottom: 6 }}>
                  {suggestion}
                </li>
              ))}
            </ul>
          </div>

          {/* Disclaimer IA */}
          <p style={{
            margin: '16px 0 0 0',
            fontSize: 11,
            color: '#9ca3af',
            textAlign: 'center',
            lineHeight: 1.5
          }}>
            Analise gerada por inteligencia artificial. Nao substitui orientacao de profissionais de saude.
          </p>
        </div>
      )}

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
              <div style={{ fontSize: 12, opacity: 0.9 }}> Água Total</div>
              <div style={{ fontSize: 28, fontWeight: 700 }}>{(stats.totalWater / 1000).toFixed(1)}L</div>
              <div style={{ fontSize: 11, opacity: 0.8 }}>{stats.daysWithWater} dias</div>
            </div>
          </div>

          {/* Nutrientes + Calorias por Tipo lado a lado */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24, alignItems: 'stretch' }}>
            {/* Nutrientes */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, color: '#374151' }}>
                 Nutrientes no Período
              </h2>

              {/* Grid de Nutrientes - 2 linhas x 3 colunas */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 12, flex: 1 }}>
                {/* Proteína */}
                <div style={{
                  background: `linear-gradient(to top, #4d7c0f ${Math.min((stats.totalProtein / (goals.protein * stats.last7Days.length)) * 100, 100)}%, #ef4444 ${Math.min((stats.totalProtein / (goals.protein * stats.last7Days.length)) * 100, 100)}%)`,
                  borderRadius: 10,
                  padding: 12,
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: 11, color: 'white', marginBottom: 4, fontWeight: 600 }}>Proteína</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: 'white' }}>
                    {stats.totalProtein.toFixed(0)}g
                  </div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)' }}>
                    Meta: {goals.protein * stats.last7Days.length}g
                  </div>
                </div>

                {/* Carboidratos */}
                <div style={{
                  background: `linear-gradient(to top, #4d7c0f ${Math.min((stats.totalCarbs / (goals.carbs * stats.last7Days.length)) * 100, 100)}%, #ef4444 ${Math.min((stats.totalCarbs / (goals.carbs * stats.last7Days.length)) * 100, 100)}%)`,
                  borderRadius: 10,
                  padding: 12,
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: 11, color: 'white', marginBottom: 4, fontWeight: 600 }}>Carbos</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: 'white' }}>
                    {stats.totalCarbs.toFixed(0)}g
                  </div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)' }}>
                    Meta: {goals.carbs * stats.last7Days.length}g
                  </div>
                </div>

                {/* Gorduras */}
                <div style={{
                  background: `linear-gradient(to top, #4d7c0f ${Math.min((stats.totalFat / (goals.fat * stats.last7Days.length)) * 100, 100)}%, #ef4444 ${Math.min((stats.totalFat / (goals.fat * stats.last7Days.length)) * 100, 100)}%)`,
                  borderRadius: 10,
                  padding: 12,
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: 11, color: 'white', marginBottom: 4, fontWeight: 600 }}>Gorduras</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: 'white' }}>
                    {stats.totalFat.toFixed(0)}g
                  </div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)' }}>
                    Meta: {goals.fat * stats.last7Days.length}g
                  </div>
                </div>

                {/* Fibra */}
                <div style={{
                  background: `linear-gradient(to top, #4d7c0f ${Math.min((stats.totalFiber / (25 * stats.last7Days.length)) * 100, 100)}%, #ef4444 ${Math.min((stats.totalFiber / (25 * stats.last7Days.length)) * 100, 100)}%)`,
                  borderRadius: 10,
                  padding: 12,
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: 11, color: 'white', marginBottom: 4, fontWeight: 600 }}>Fibras</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: 'white' }}>
                    {stats.totalFiber.toFixed(0)}g
                  </div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)' }}>
                    Meta: {25 * stats.last7Days.length}g
                  </div>
                </div>

                {/* Açúcar */}
                <div style={{
                  background: `linear-gradient(to top, #ef4444 ${Math.min((stats.totalSugar / (50 * stats.last7Days.length)) * 100, 100)}%, #4d7c0f ${Math.min((stats.totalSugar / (50 * stats.last7Days.length)) * 100, 100)}%)`,
                  borderRadius: 10,
                  padding: 12,
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: 11, color: 'white', marginBottom: 4, fontWeight: 600 }}>Açúcar</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: 'white' }}>
                    {stats.totalSugar.toFixed(0)}g
                  </div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)' }}>
                    Limite: {50 * stats.last7Days.length}g
                  </div>
                </div>

                {/* Sódio */}
                <div style={{
                  background: `linear-gradient(to top, #ef4444 ${Math.min((stats.totalSodium / (2300 * stats.last7Days.length)) * 100, 100)}%, #4d7c0f ${Math.min((stats.totalSodium / (2300 * stats.last7Days.length)) * 100, 100)}%)`,
                  borderRadius: 10,
                  padding: 12,
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: 11, color: 'white', marginBottom: 4, fontWeight: 600 }}>Sódio</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: 'white' }}>
                    {(stats.totalSodium / 1000).toFixed(1)}g
                  </div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)' }}>
                    Limite: {((2300 * stats.last7Days.length) / 1000).toFixed(1)}g
                  </div>
                </div>
              </div>

              {/* Água */}
              <div style={{
                background: `linear-gradient(to top, #0891b2 ${Math.min((stats.avgWaterPerDay / goals.water) * 100, 100)}%, #9ca3af ${Math.min((stats.avgWaterPerDay / goals.water) * 100, 100)}%)`,
                borderRadius: 10,
                padding: 12
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 11, color: 'white', marginBottom: 4, fontWeight: 600 }}>Água</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: 'white' }}>
                      {(stats.totalWater / 1000).toFixed(1)}L total
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'white' }}>
                      {stats.avgWaterPerDay.toFixed(0)}ml/dia
                    </div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)' }}>
                      Meta: {goals.water}ml/dia
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Calorias por Tipo de Refeição */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, color: '#374151' }}>
                 Calorias por Tipo de Refeição
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1, justifyContent: 'space-between' }}>
                {Object.entries(stats.caloriesByType).map(([type, data]) => {
                  const config = mealTypeConfig[type] || mealTypeConfig.lunch;
                  const avg = data.total / data.count;
                  return (
                    <div
                      key={type}
                      style={{
                        padding: 14,
                        background: '#f9fafb',
                        borderRadius: 10,
                        border: '1px solid #e5e7eb',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 22 }}>{config.icon}</span>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14, color: config.color }}>
                            {config.label}
                          </div>
                          <div style={{ fontSize: 11, color: '#6b7280' }}>
                            {data.count} refeições
                          </div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 18, fontWeight: 700, color: config.color }}>
                          {data.total.toFixed(0)} kcal
                        </div>
                        <div style={{ fontSize: 11, color: '#6b7280' }}>
                          ~{avg.toFixed(0)} kcal/ref
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Gráfico de Evolução */}
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4, color: '#374151' }}>
               Evolução ({stats.last7Days.length} dias)
            </h2>
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 16 }}>
              Meta: {goals.calories} kcal/dia
            </div>
            <div style={{ position: 'relative', height: 200 }}>
              {/* Linha de Meta */}
              <div style={{
                position: 'absolute',
                bottom: 140 + 24,
                left: 0,
                right: 0,
                borderTop: '2px dashed #9ca3af',
                opacity: 0.6
              }} />

              {/* Barras */}
              <div style={{
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'space-between',
                height: '100%',
                paddingBottom: 24,
                gap: 4
              }}>
                {stats.last7Days.map((day, idx) => {
                  const barHeight = goals.calories > 0 ? Math.round((day.calories / goals.calories) * 140) : 0;
                  const isOverGoal = day.calories > goals.calories;

                  return (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        flex: 1
                      }}
                    >
                      {day.calories > 0 && (
                        <div style={{
                          fontSize: 9,
                          fontWeight: 600,
                          color: isOverGoal ? '#ef4444' : '#10b981',
                          marginBottom: 2
                        }}>
                          {day.calories.toFixed(0)}
                        </div>
                      )}
                      <div
                        style={{
                          width: '100%',
                          height: Math.min(barHeight, 160),
                          background: day.calories === 0
                            ? '#e5e7eb'
                            : isOverGoal
                            ? '#ef4444'
                            : '#10b981',
                          borderRadius: '3px 3px 0 0',
                          minHeight: day.calories > 0 ? 8 : 4
                        }}
                      />
                      <div style={{
                        fontSize: 9,
                        color: '#6b7280',
                        marginTop: 4,
                        textAlign: 'center',
                        fontWeight: 500
                      }}>
                        {day.dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Micronutrientes no Período */}
          {(stats.totalCalcium > 0 || stats.totalIron > 0 || stats.totalVitaminC > 0 ||
            stats.totalMagnesium > 0 || stats.totalPotassium > 0 || stats.totalZinc > 0) && (
            <div style={{
              background: 'white',
              borderRadius: 16,
              padding: 20,
              marginBottom: 24,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              border: '1px solid #e5e7eb'
            }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, color: '#374151' }}>
                Micronutrientes no Período
              </h2>

              {/* Minerais */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 8 }}>Minerais</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                  {stats.totalCalcium > 0 && (
                    <div style={{ background: '#fef3c7', padding: 10, borderRadius: 8, textAlign: 'center' }}>
                      <div style={{ fontSize: 10, color: '#92400e', marginBottom: 2 }}>Cálcio</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: '#b45309' }}>{stats.totalCalcium.toFixed(0)}mg</div>
                      <div style={{ fontSize: 9, color: '#92400e' }}>Meta: {1000 * stats.last7Days.length}mg</div>
                    </div>
                  )}
                  {stats.totalIron > 0 && (
                    <div style={{ background: '#fee2e2', padding: 10, borderRadius: 8, textAlign: 'center' }}>
                      <div style={{ fontSize: 10, color: '#991b1b', marginBottom: 2 }}>Ferro</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: '#dc2626' }}>{stats.totalIron.toFixed(1)}mg</div>
                      <div style={{ fontSize: 9, color: '#991b1b' }}>Meta: {14 * stats.last7Days.length}mg</div>
                    </div>
                  )}
                  {stats.totalMagnesium > 0 && (
                    <div style={{ background: '#d1fae5', padding: 10, borderRadius: 8, textAlign: 'center' }}>
                      <div style={{ fontSize: 10, color: '#065f46', marginBottom: 2 }}>Magnésio</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: '#059669' }}>{stats.totalMagnesium.toFixed(0)}mg</div>
                      <div style={{ fontSize: 9, color: '#065f46' }}>Meta: {400 * stats.last7Days.length}mg</div>
                    </div>
                  )}
                  {stats.totalPhosphorus > 0 && (
                    <div style={{ background: '#e0e7ff', padding: 10, borderRadius: 8, textAlign: 'center' }}>
                      <div style={{ fontSize: 10, color: '#3730a3', marginBottom: 2 }}>Fósforo</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: '#4f46e5' }}>{stats.totalPhosphorus.toFixed(0)}mg</div>
                      <div style={{ fontSize: 9, color: '#3730a3' }}>Meta: {700 * stats.last7Days.length}mg</div>
                    </div>
                  )}
                  {stats.totalPotassium > 0 && (
                    <div style={{ background: '#fce7f3', padding: 10, borderRadius: 8, textAlign: 'center' }}>
                      <div style={{ fontSize: 10, color: '#9d174d', marginBottom: 2 }}>Potássio</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: '#db2777' }}>{(stats.totalPotassium / 1000).toFixed(1)}g</div>
                      <div style={{ fontSize: 9, color: '#9d174d' }}>Meta: {(3500 * stats.last7Days.length / 1000).toFixed(1)}g</div>
                    </div>
                  )}
                  {stats.totalZinc > 0 && (
                    <div style={{ background: '#cffafe', padding: 10, borderRadius: 8, textAlign: 'center' }}>
                      <div style={{ fontSize: 10, color: '#155e75', marginBottom: 2 }}>Zinco</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: '#0891b2' }}>{stats.totalZinc.toFixed(1)}mg</div>
                      <div style={{ fontSize: 9, color: '#155e75' }}>Meta: {11 * stats.last7Days.length}mg</div>
                    </div>
                  )}
                  {stats.totalCopper > 0 && (
                    <div style={{ background: '#fed7aa', padding: 10, borderRadius: 8, textAlign: 'center' }}>
                      <div style={{ fontSize: 10, color: '#9a3412', marginBottom: 2 }}>Cobre</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: '#ea580c' }}>{stats.totalCopper.toFixed(2)}mg</div>
                      <div style={{ fontSize: 9, color: '#9a3412' }}>Meta: {0.9 * stats.last7Days.length}mg</div>
                    </div>
                  )}
                  {stats.totalManganese > 0 && (
                    <div style={{ background: '#f5d0fe', padding: 10, borderRadius: 8, textAlign: 'center' }}>
                      <div style={{ fontSize: 10, color: '#86198f', marginBottom: 2 }}>Manganês</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: '#a21caf' }}>{stats.totalManganese.toFixed(2)}mg</div>
                      <div style={{ fontSize: 9, color: '#86198f' }}>Meta: {2.3 * stats.last7Days.length}mg</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Vitaminas */}
              {(stats.totalVitaminC > 0 || stats.totalVitaminA > 0 || stats.totalVitaminB1 > 0 ||
                stats.totalVitaminB2 > 0 || stats.totalVitaminB3 > 0 || stats.totalVitaminB6 > 0) && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 8 }}>Vitaminas</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                    {stats.totalVitaminA > 0 && (
                      <div style={{ background: '#ffedd5', padding: 10, borderRadius: 8, textAlign: 'center' }}>
                        <div style={{ fontSize: 10, color: '#9a3412', marginBottom: 2 }}>Vitamina A</div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: '#ea580c' }}>{stats.totalVitaminA.toFixed(0)}mcg</div>
                        <div style={{ fontSize: 9, color: '#9a3412' }}>Meta: {900 * stats.last7Days.length}mcg</div>
                      </div>
                    )}
                    {stats.totalVitaminC > 0 && (
                      <div style={{ background: '#fef9c3', padding: 10, borderRadius: 8, textAlign: 'center' }}>
                        <div style={{ fontSize: 10, color: '#854d0e', marginBottom: 2 }}>Vitamina C</div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: '#ca8a04' }}>{stats.totalVitaminC.toFixed(0)}mg</div>
                        <div style={{ fontSize: 9, color: '#854d0e' }}>Meta: {90 * stats.last7Days.length}mg</div>
                      </div>
                    )}
                    {stats.totalVitaminB1 > 0 && (
                      <div style={{ background: '#ecfccb', padding: 10, borderRadius: 8, textAlign: 'center' }}>
                        <div style={{ fontSize: 10, color: '#3f6212', marginBottom: 2 }}>Vitamina B1</div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: '#65a30d' }}>{stats.totalVitaminB1.toFixed(2)}mg</div>
                        <div style={{ fontSize: 9, color: '#3f6212' }}>Meta: {1.2 * stats.last7Days.length}mg</div>
                      </div>
                    )}
                    {stats.totalVitaminB2 > 0 && (
                      <div style={{ background: '#d9f99d', padding: 10, borderRadius: 8, textAlign: 'center' }}>
                        <div style={{ fontSize: 10, color: '#365314', marginBottom: 2 }}>Vitamina B2</div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: '#4d7c0f' }}>{stats.totalVitaminB2.toFixed(2)}mg</div>
                        <div style={{ fontSize: 9, color: '#365314' }}>Meta: {1.3 * stats.last7Days.length}mg</div>
                      </div>
                    )}
                    {stats.totalVitaminB3 > 0 && (
                      <div style={{ background: '#a7f3d0', padding: 10, borderRadius: 8, textAlign: 'center' }}>
                        <div style={{ fontSize: 10, color: '#14532d', marginBottom: 2 }}>Vitamina B3</div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: '#16a34a' }}>{stats.totalVitaminB3.toFixed(1)}mg</div>
                        <div style={{ fontSize: 9, color: '#14532d' }}>Meta: {16 * stats.last7Days.length}mg</div>
                      </div>
                    )}
                    {stats.totalVitaminB6 > 0 && (
                      <div style={{ background: '#99f6e4', padding: 10, borderRadius: 8, textAlign: 'center' }}>
                        <div style={{ fontSize: 10, color: '#134e4a', marginBottom: 2 }}>Vitamina B6</div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: '#0d9488' }}>{stats.totalVitaminB6.toFixed(2)}mg</div>
                        <div style={{ fontSize: 9, color: '#134e4a' }}>Meta: {1.7 * stats.last7Days.length}mg</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Outros (Colesterol e Gordura Saturada) */}
              {(stats.totalCholesterol > 0 || stats.totalSaturatedFat > 0) && (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 8 }}>Limites de Atenção</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                    {stats.totalCholesterol > 0 && (
                      <div style={{
                        background: stats.totalCholesterol > 300 * stats.last7Days.length ? '#fecaca' : '#f3f4f6',
                        padding: 10,
                        borderRadius: 8,
                        textAlign: 'center',
                        border: stats.totalCholesterol > 300 * stats.last7Days.length ? '2px solid #ef4444' : '1px solid #e5e7eb'
                      }}>
                        <div style={{ fontSize: 10, color: '#991b1b', marginBottom: 2 }}>Colesterol</div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: stats.totalCholesterol > 300 * stats.last7Days.length ? '#ef4444' : '#374151' }}>
                          {stats.totalCholesterol.toFixed(0)}mg
                        </div>
                        <div style={{ fontSize: 9, color: '#991b1b' }}>Limite: {300 * stats.last7Days.length}mg</div>
                      </div>
                    )}
                    {stats.totalSaturatedFat > 0 && (
                      <div style={{
                        background: stats.totalSaturatedFat > 22 * stats.last7Days.length ? '#fecaca' : '#f3f4f6',
                        padding: 10,
                        borderRadius: 8,
                        textAlign: 'center',
                        border: stats.totalSaturatedFat > 22 * stats.last7Days.length ? '2px solid #ef4444' : '1px solid #e5e7eb'
                      }}>
                        <div style={{ fontSize: 10, color: '#9f1239', marginBottom: 2 }}>G. Saturada</div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: stats.totalSaturatedFat > 22 * stats.last7Days.length ? '#ef4444' : '#374151' }}>
                          {stats.totalSaturatedFat.toFixed(1)}g
                        </div>
                        <div style={{ fontSize: 9, color: '#9f1239' }}>Limite: {22 * stats.last7Days.length}g</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Charts Grid */}
          <div style={{ display: 'grid', gap: 16, marginBottom: 24 }}>
            {/* Locations summary */}
            <div style={{
              background: 'white',
              borderRadius: 16,
              padding: 20,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              border: '1px solid #e5e7eb'
            }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, color: '#374151' }}>
                 Locais das Refeições
              </h2>
              <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                <div style={{ flex: 1, background: '#ecfdf5', border: '1px solid #d1fae5', borderRadius: 12, padding: 12 }}>
                  <div style={{ fontSize: 12, color: '#065f46', marginBottom: 4 }}> Casa</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#10b981' }}>{stats.locationCounts.home}</div>
                </div>
                <div style={{ flex: 1, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, padding: 12 }}>
                  <div style={{ fontSize: 12, color: '#92400e', marginBottom: 4 }}> Fora</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#f59e0b' }}>{stats.locationCounts.out}</div>
                </div>
              </div>
              {stats.topRestaurants.length > 0 && (
                <div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}>Top Restaurantes</div>
                  <div style={{ display: 'grid', gap: 6 }}>
                    {stats.topRestaurants.map(([name, count]) => (
                      <div key={name} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8 }}>
                        <span style={{ fontSize: 14, color: '#374151' }}>{name}</span>
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#6b7280' }}>{count}x</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
          <div style={{ fontSize: 64, marginBottom: 16 }}></div>
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
