'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
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
};

const mealTypeConfig: Record<string, { label: string; icon: string; color: string }> = {
  breakfast: { label: 'Café da Manhã', icon: '', color: '#f59e0b' },
  lunch: { label: 'Almoço', icon: '', color: '#10b981' },
  dinner: { label: 'Jantar', icon: '', color: '#6366f1' },
  snack: { label: 'Lanche', icon: '', color: '#ec4899' }
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
  const [bowelMovementsCount, setBowelMovementsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addingWater, setAddingWater] = useState(false);
  const [showBowelForm, setShowBowelForm] = useState(false);
  const [selectedBristol, setSelectedBristol] = useState<number | null>(null);
  const [bowelNotes, setBowelNotes] = useState('');
  const [hadBlood, setHadBlood] = useState(false);
  const [addingBowel, setAddingBowel] = useState(false);
  const [expandedMealId, setExpandedMealId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);

        // Fetch meals, user profile, water intake, and bowel movements in parallel
        const [mealsRes, profileRes, waterRes, bowelRes] = await Promise.all([
          api.get('/api/meals'),
          api.get('/api/user/profile'),
          api.get('/api/water-intake'),
          api.get('/api/bowel-movements')
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

        // Load bowel movements
        if (bowelRes.ok) {
          const bowelData = await bowelRes.json();
          setBowelMovementsCount(bowelData.count || 0);
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
      const res = await api.post('/api/water-intake', { amount_ml: amount });

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

  // Função para adicionar evacuação
  const addBowelMovement = async (bristolType: number) => {
    try {
      setAddingBowel(true);

      // Monta as observações
      let notes = bowelNotes.trim();
      if (hadBlood) {
        notes = notes ? `SANGUE: Sim\n${notes}` : 'SANGUE: Sim';
      }

      const res = await api.post('/api/bowel-movements', {
        bristol_type: bristolType,
        notes: notes || null
      });

      if (res.ok) {
        const data = await res.json();
        setBowelMovementsCount(data.count_today);
        setShowBowelForm(false);
        setSelectedBristol(null);
        setBowelNotes('');
        setHadBlood(false);
      }
    } catch (err) {
      console.error('Erro ao adicionar evacuação:', err);
    } finally {
      setAddingBowel(false);
    }
  };

  // Stats do dia atual (America/Sao_Paulo)
  const todayStats = useMemo(() => {
    const now = new Date();
    const todayString = now.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });

    const todayMeals = meals.filter(meal => {
      const mealDate = new Date(meal.consumed_at);
      const mealDateString = mealDate.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
      return mealDateString === todayString;
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
    const fiber = todayMeals.reduce((sum, meal) =>
      sum + meal.foods.reduce((s, f) => s + (f.fiber_g || 0), 0), 0
    );
    const sodium = todayMeals.reduce((sum, meal) =>
      sum + meal.foods.reduce((s, f) => s + (f.sodium_mg || 0), 0), 0
    );
    const sugar = todayMeals.reduce((sum, meal) =>
      sum + meal.foods.reduce((s, f) => s + (f.sugar_g || 0), 0), 0
    );

    return {
      calories,
      protein,
      carbs,
      fat,
      fiber,
      sodium,
      sugar,
      meals: todayMeals.slice(0, 3) // Last 3 meals
    };
  }, [meals]);

  if (loading) {
    return (
      <div style={{ padding: 24, maxWidth: 800, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}></div>
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
          <div style={{ fontSize: 48, marginBottom: 8 }}></div>
          <p style={{ color: '#991b1b', margin: 0 }}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 16, paddingTop: 24, maxWidth: 800, margin: '0 auto', paddingBottom: 80 }}>
      {/* Layout em duas colunas */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 20,
        marginBottom: 20
      }}>
        {/* Coluna Esquerda: Progresso de Hoje */}
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, color: '#2196F3' }}>
            Progresso de Hoje
          </h2>
          {/* Calorias */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>Calorias</span>
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
                Acima da meta em {(todayStats.calories - goals.calories).toFixed(0)} kcal
              </p>
            )}
            {todayStats.calories < goals.calories && todayStats.calories > 0 && (
              <p style={{ fontSize: 11, color: '#10b981', margin: '4px 0 0 0' }}>
                Restam {(goals.calories - todayStats.calories).toFixed(0)} kcal
              </p>
            )}
          </div>

          {/* Nutrientes Grid - 2 linhas x 3 colunas */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, flex: 1 }}>
            {/* Proteína */}
            <div style={{
              background: `linear-gradient(to top, #4d7c0f ${Math.min((todayStats.protein / goals.protein) * 100, 100)}%, #ef4444 ${Math.min((todayStats.protein / goals.protein) * 100, 100)}%)`,
              borderRadius: 10,
              padding: 12,
              textAlign: 'center'
            }}>
              <div style={{ fontSize: 11, color: 'white', marginBottom: 4, fontWeight: 600 }}>Proteína</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'white' }}>
                {todayStats.protein.toFixed(0)}g
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)' }}>
                Meta: {goals.protein}g
              </div>
            </div>

            {/* Carboidratos */}
            <div style={{
              background: `linear-gradient(to top, #4d7c0f ${Math.min((todayStats.carbs / goals.carbs) * 100, 100)}%, #ef4444 ${Math.min((todayStats.carbs / goals.carbs) * 100, 100)}%)`,
              borderRadius: 10,
              padding: 12,
              textAlign: 'center'
            }}>
              <div style={{ fontSize: 11, color: 'white', marginBottom: 4, fontWeight: 600 }}>Carbos</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'white' }}>
                {todayStats.carbs.toFixed(0)}g
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)' }}>
                Meta: {goals.carbs}g
              </div>
            </div>

            {/* Gorduras */}
            <div style={{
              background: `linear-gradient(to top, #4d7c0f ${Math.min((todayStats.fat / goals.fat) * 100, 100)}%, #ef4444 ${Math.min((todayStats.fat / goals.fat) * 100, 100)}%)`,
              borderRadius: 10,
              padding: 12,
              textAlign: 'center'
            }}>
              <div style={{ fontSize: 11, color: 'white', marginBottom: 4, fontWeight: 600 }}>Gorduras</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'white' }}>
                {todayStats.fat.toFixed(0)}g
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)' }}>
                Meta: {goals.fat}g
              </div>
            </div>

            {/* Fibras */}
            <div style={{
              background: `linear-gradient(to top, #4d7c0f ${Math.min((todayStats.fiber / 25) * 100, 100)}%, #ef4444 ${Math.min((todayStats.fiber / 25) * 100, 100)}%)`,
              borderRadius: 10,
              padding: 12,
              textAlign: 'center'
            }}>
              <div style={{ fontSize: 11, color: 'white', marginBottom: 4, fontWeight: 600 }}>Fibras</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'white' }}>
                {todayStats.fiber.toFixed(0)}g
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)' }}>
                Meta: 25g
              </div>
            </div>

            {/* Açúcar - lógica invertida: começa verde e fica vermelho ao passar do limite */}
            <div style={{
              background: `linear-gradient(to top, #4d7c0f ${Math.max(100 - (todayStats.sugar / 50) * 100, 0)}%, #ef4444 ${Math.max(100 - (todayStats.sugar / 50) * 100, 0)}%)`,
              borderRadius: 10,
              padding: 12,
              textAlign: 'center'
            }}>
              <div style={{ fontSize: 11, color: 'white', marginBottom: 4, fontWeight: 600 }}>Açúcar</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'white' }}>
                {todayStats.sugar.toFixed(0)}g
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)' }}>
                Limite: 50g
              </div>
            </div>

            {/* Sódio - lógica invertida: começa verde e fica vermelho ao passar do limite */}
            <div style={{
              background: `linear-gradient(to top, #4d7c0f ${Math.max(100 - (todayStats.sodium / 2300) * 100, 0)}%, #ef4444 ${Math.max(100 - (todayStats.sodium / 2300) * 100, 0)}%)`,
              borderRadius: 10,
              padding: 12,
              textAlign: 'center'
            }}>
              <div style={{ fontSize: 11, color: 'white', marginBottom: 4, fontWeight: 600 }}>Sódio</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'white' }}>
                {todayStats.sodium.toFixed(0)}
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)' }}>
                Limite: 2300mg
              </div>
            </div>
          </div>
        </div>

        {/* Coluna Direita: Hidratação + Evacuação */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Card de Hidratação */}
          <div style={{
            background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
            borderRadius: 16,
            padding: 20,
            boxShadow: '0 2px 8px rgba(6, 182, 212, 0.3)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: 'white' }}>
                Hidratação
              </h2>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>
                {Math.floor(waterIntake / 250)} {Math.floor(waterIntake / 250) === 1 ? 'copo' : 'copos'}
              </span>
            </div>

            {/* Barra de progresso */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: 'white' }}>Água</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'white' }}>
                  {waterIntake} / {goals.water} ml
                </span>
              </div>
              <div style={{
                width: '100%',
                height: 8,
                background: 'rgba(255,255,255,0.3)',
                borderRadius: 4,
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${Math.min((waterIntake / goals.water) * 100, 100)}%`,
                  height: '100%',
                  background: 'white',
                  transition: 'width 0.3s ease'
                }} />
              </div>
              {waterIntake >= goals.water && (
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.9)', margin: '4px 0 0 0' }}>
                  Meta atingida!
                </p>
              )}
              {waterIntake < goals.water && waterIntake > 0 && (
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', margin: '4px 0 0 0' }}>
                  Faltam {goals.water - waterIntake}ml
                </p>
              )}
            </div>

            {/* Botões de ação */}
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => addWater(250)}
                disabled={addingWater}
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  border: 'none',
                  background: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  borderRadius: 8,
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: addingWater ? 'not-allowed' : 'pointer'
                }}
              >
                +250ml
              </button>
              <button
                onClick={() => addWater(500)}
                disabled={addingWater}
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  border: 'none',
                  background: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  borderRadius: 8,
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: addingWater ? 'not-allowed' : 'pointer'
                }}
              >
                +500ml
              </button>
            </div>
          </div>

          {/* Card de Saúde Intestinal */}
          <div style={{
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            borderRadius: 16,
            padding: 20,
            boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: 'white' }}>
                Saúde Intestinal
              </h2>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>
                {bowelMovementsCount} {bowelMovementsCount === 1 ? 'vez' : 'vezes'} hoje
              </span>
            </div>

            {!showBowelForm ? (
              <button
                onClick={() => setShowBowelForm(true)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: 'none',
                  background: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  borderRadius: 8,
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: 'pointer'
                }}
              >
                Registrar Evacuação
              </button>
            ) : (
              <div>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.9)', marginBottom: 12 }}>
                  Selecione o tipo (Escala de Bristol):
                </p>

            <div style={{ display: 'grid', gap: 8, marginBottom: 16 }}>
              {[
                { type: 1, emoji: '🟤', color: '#78350f', desc: 'Pedaços duros separados' },
                { type: 2, emoji: '🟤', color: '#92400e', desc: 'Formato de salsicha irregular' },
                { type: 3, emoji: '🟢', color: '#166534', desc: 'Salsicha com rachaduras (normal)' },
                { type: 4, emoji: '✅', color: '#15803d', desc: 'Salsicha lisa e macia (ideal)' },
                { type: 5, emoji: '🟡', color: '#a16207', desc: 'Pedaços macios' },
                { type: 6, emoji: '🟠', color: '#c2410c', desc: 'Pedaços moles irregulares' },
                { type: 7, emoji: '🔴', color: '#dc2626', desc: 'Aquoso, líquido' }
              ].map((item) => (
                <button
                  key={item.type}
                  onClick={() => setSelectedBristol(item.type)}
                  style={{
                    padding: '12px 16px',
                    border: selectedBristol === item.type ? '2px solid #f59e0b' : '2px solid #e5e7eb',
                    background: selectedBristol === item.type ? '#fffbeb' : 'white',
                    borderRadius: 10,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    textAlign: 'left'
                  }}
                >
                  <span style={{ fontSize: 24 }}>{item.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: item.color }}>
                      Tipo {item.type}
                    </div>
                    <div style={{ fontSize: 11, color: '#6b7280' }}>
                      {item.desc}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Campo de presença de sangue */}
            <div style={{
              padding: '12px 16px',
              background: hadBlood ? '#fef2f2' : '#f9fafb',
              border: `2px solid ${hadBlood ? '#ef4444' : '#e5e7eb'}`,
              borderRadius: 10,
              marginBottom: 12
            }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 600,
                color: hadBlood ? '#991b1b' : '#374151'
              }}>
                <input
                  type="checkbox"
                  checked={hadBlood}
                  onChange={(e) => setHadBlood(e.target.checked)}
                  style={{
                    width: 20,
                    height: 20,
                    cursor: 'pointer'
                  }}
                />
                <span>🩸 Presença de sangue</span>
              </label>
              {hadBlood && (
                <p style={{
                  fontSize: 11,
                  color: '#dc2626',
                  margin: '8px 0 0 32px',
                  lineHeight: '1.4'
                }}>
                   Sangue nas fezes pode indicar problemas sérios. Consulte um médico.
                </p>
              )}
            </div>

            {/* Campo de observações adicionais */}
            <div style={{ marginBottom: 16 }}>
              <label style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 600,
                color: '#374151',
                marginBottom: 8
              }}>
                Observações adicionais (opcional):
              </label>
              <textarea
                value={bowelNotes}
                onChange={(e) => setBowelNotes(e.target.value)}
                placeholder="Ex: dor, urgência, cor anormal, etc."
                maxLength={200}
                style={{
                  width: '100%',
                  minHeight: 60,
                  padding: 12,
                  fontSize: 14,
                  border: '2px solid #e5e7eb',
                  borderRadius: 10,
                  resize: 'vertical',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box'
                }}
              />
              <div style={{
                fontSize: 11,
                color: '#9ca3af',
                textAlign: 'right',
                marginTop: 4
              }}>
                {bowelNotes.length}/200
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => {
                  setShowBowelForm(false);
                  setSelectedBristol(null);
                  setBowelNotes('');
                  setHadBlood(false);
                }}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  border: '2px solid #e5e7eb',
                  background: 'white',
                  color: '#6b7280',
                  borderRadius: 10,
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: 'pointer'
                }}
              >
                Cancelar
              </button>
              <button
                onClick={() => selectedBristol && addBowelMovement(selectedBristol)}
                disabled={!selectedBristol || addingBowel}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  border: 'none',
                  background: !selectedBristol || addingBowel ? '#94a3b8' : '#f59e0b',
                  color: 'white',
                  borderRadius: 10,
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: !selectedBristol || addingBowel ? 'not-allowed' : 'pointer'
                }}
              >
                {addingBowel ? 'Salvando...' : 'Salvar'}
              </button>
              </div>
            </div>
          )}
          </div>
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
        <span style={{ fontSize: 40 }}></span>
        <span>Registrar Refeição</span>
      </button>

      {/* Últimas Refeições */}
      {todayStats.meals.length > 0 && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}> Últimas Refeições</h3>
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
              Ver Todas 
            </button>
          </div>

          <div style={{ display: 'grid', gap: 12 }}>
            {todayStats.meals.map((meal) => {
              const mealCalories = meal.foods.reduce((s, f) => s + (f.calories || 0), 0);
              const mealProtein = meal.foods.reduce((s, f) => s + (f.protein_g || 0), 0);
              const mealCarbs = meal.foods.reduce((s, f) => s + (f.carbs_g || 0), 0);
              const mealFat = meal.foods.reduce((s, f) => s + (f.fat_g || 0), 0);
              const config = mealTypeConfig[meal.meal_type] || mealTypeConfig.lunch;
              const isExpanded = expandedMealId === meal.id;

              return (
                <div
                  key={meal.id}
                  onClick={() => setExpandedMealId(isExpanded ? null : meal.id)}
                  style={{
                    background: 'white',
                    borderRadius: 12,
                    padding: 16,
                    boxShadow: isExpanded ? '0 4px 12px rgba(0,0,0,0.15)' : '0 2px 4px rgba(0,0,0,0.1)',
                    border: isExpanded ? `2px solid ${config.color}` : '1px solid #e5e7eb',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {/* Header do card */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 18, fontWeight: 700, color: '#374151' }}>
                          {mealCalories.toFixed(0)}
                        </div>
                        <div style={{ fontSize: 11, color: '#6b7280' }}>kcal</div>
                      </div>
                      <span style={{
                        fontSize: 16,
                        color: '#9ca3af',
                        transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s ease'
                      }}>
                        
                      </span>
                    </div>
                  </div>

                  {/* Detalhes expandidos */}
                  {isExpanded && (
                    <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #e5e7eb' }}>
                      {/* Macros */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: 12,
                        marginBottom: 16
                      }}>
                        <div style={{ textAlign: 'center', padding: 8, background: '#fef3c7', borderRadius: 8 }}>
                          <div style={{ fontSize: 16, fontWeight: 700, color: '#d97706' }}>{mealProtein.toFixed(0)}g</div>
                          <div style={{ fontSize: 11, color: '#92400e' }}>Proteína</div>
                        </div>
                        <div style={{ textAlign: 'center', padding: 8, background: '#dbeafe', borderRadius: 8 }}>
                          <div style={{ fontSize: 16, fontWeight: 700, color: '#2563eb' }}>{mealCarbs.toFixed(0)}g</div>
                          <div style={{ fontSize: 11, color: '#1e40af' }}>Carbos</div>
                        </div>
                        <div style={{ textAlign: 'center', padding: 8, background: '#fce7f3', borderRadius: 8 }}>
                          <div style={{ fontSize: 16, fontWeight: 700, color: '#db2777' }}>{mealFat.toFixed(0)}g</div>
                          <div style={{ fontSize: 11, color: '#9d174d' }}>Gordura</div>
                        </div>
                      </div>

                      {/* Lista de alimentos */}
                      {meal.foods.length > 0 && (
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 8 }}>
                            Alimentos ({meal.foods.length})
                          </div>
                          <div style={{ display: 'grid', gap: 6 }}>
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
                                  fontSize: 13
                                }}
                              >
                                <span style={{ color: '#374151' }}>
                                  {food.name}
                                  <span style={{ color: '#9ca3af', marginLeft: 4 }}>
                                    ({food.quantity} {food.unit})
                                  </span>
                                </span>
                                <span style={{ fontWeight: 600, color: '#6b7280' }}>
                                  {(food.calories || 0).toFixed(0)} kcal
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Notas */}
                      {meal.notes && (
                        <div style={{ marginTop: 12, padding: 12, background: '#fffbeb', borderRadius: 8 }}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: '#92400e', marginBottom: 4 }}>Notas</div>
                          <div style={{ fontSize: 13, color: '#78350f' }}>{meal.notes}</div>
                        </div>
                      )}
                    </div>
                  )}
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
          <div style={{ fontSize: 64, marginBottom: 16 }}></div>
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
             Registrar Agora
          </button>
        </div>
      )}
    </div>
  );
}
