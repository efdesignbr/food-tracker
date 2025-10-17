'use client';

import { useState, useMemo } from 'react';

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
  location_type?: 'home'|'out'|null;
  restaurant_name?: string | null;
};

type DayData = {
  date: Date;
  dateString: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  meals: Meal[];
  waterIntake: number; // ml
  isCurrentMonth: boolean;
  isToday: boolean;
};

const mealTypeConfig: Record<string, { label: string; icon: string; color: string }> = {
  breakfast: { label: 'Café da Manhã', icon: '☀️', color: '#f59e0b' },
  lunch: { label: 'Almoço', icon: '🍽️', color: '#10b981' },
  dinner: { label: 'Jantar', icon: '🌙', color: '#6366f1' },
  snack: { label: 'Lanche', icon: '🍿', color: '#ec4899' }
};

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

type WaterRecord = {
  date: string; // YYYY-MM-DD
  total_ml: number;
};

interface CalendarViewProps {
  meals: Meal[];
  waterRecords?: WaterRecord[];
  calorieGoal?: number;
  proteinGoal?: number;
  carbsGoal?: number;
  fatGoal?: number;
  waterGoal?: number;
}

export default function CalendarView({
  meals,
  waterRecords = [],
  calorieGoal = 2000,
  proteinGoal = 150,
  carbsGoal = 250,
  fatGoal = 65,
  waterGoal = 2000
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<DayData | null>(null);

  // Gera os dias do calendário
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Primeiro dia do mês
    const firstDay = new Date(year, month, 1);
    // Último dia do mês
    const lastDay = new Date(year, month + 1, 0);

    // Começa do domingo anterior ao primeiro dia
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    // Termina no sábado após o último dia
    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()));

    const days: DayData[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Agrupa refeições por dia
    const mealsByDay = new Map<string, Meal[]>();
    meals.forEach(meal => {
      const mealDate = new Date(meal.consumed_at);
      const key = `${mealDate.getFullYear()}-${mealDate.getMonth()}-${mealDate.getDate()}`;
      if (!mealsByDay.has(key)) {
        mealsByDay.set(key, []);
      }
      mealsByDay.get(key)!.push(meal);
    });

    // Agrupa água por dia
    const waterByDay = new Map<string, number>();
    waterRecords.forEach(record => {
      const [year, month, day] = record.date.split('-').map(Number);
      const key = `${year}-${month - 1}-${day}`; // month - 1 porque JS usa 0-indexed
      waterByDay.set(key, record.total_ml);
    });

    // Gera todos os dias
    const current = new Date(startDate);
    while (current <= endDate) {
      const dateKey = `${current.getFullYear()}-${current.getMonth()}-${current.getDate()}`;
      const dayMeals = mealsByDay.get(dateKey) || [];
      const dayWater = waterByDay.get(dateKey) || 0;

      // Calcula totais
      const calories = dayMeals.reduce((sum, meal) =>
        sum + meal.foods.reduce((s, f) => s + (f.calories || 0), 0), 0
      );
      const protein = dayMeals.reduce((sum, meal) =>
        sum + meal.foods.reduce((s, f) => s + (f.protein_g || 0), 0), 0
      );
      const carbs = dayMeals.reduce((sum, meal) =>
        sum + meal.foods.reduce((s, f) => s + (f.carbs_g || 0), 0), 0
      );
      const fat = dayMeals.reduce((sum, meal) =>
        sum + meal.foods.reduce((s, f) => s + (f.fat_g || 0), 0), 0
      );

      const dayDate = new Date(current);
      dayDate.setHours(0, 0, 0, 0);

      days.push({
        date: new Date(current),
        dateString: current.toLocaleDateString('pt-BR'),
        calories,
        protein,
        carbs,
        fat,
        meals: dayMeals,
        waterIntake: dayWater,
        isCurrentMonth: current.getMonth() === month,
        isToday: dayDate.getTime() === today.getTime()
      });

      current.setDate(current.getDate() + 1);
    }

    return days;
  }, [currentDate, meals, waterRecords]);

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    setSelectedDay(null);
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    setSelectedDay(null);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDay(null);
  };

  return (
    <div>
      {/* Header do Calendário */}
      <div style={{
        background: 'white',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        border: '1px solid #e5e7eb'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16
        }}>
          <button
            onClick={goToPreviousMonth}
            style={{
              padding: '8px 12px',
              border: 'none',
              background: '#f3f4f6',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 18,
              color: '#374151'
            }}
          >
            ←
          </button>

          <div style={{ textAlign: 'center' }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: '#2196F3' }}>
              {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <button
              onClick={goToToday}
              style={{
                marginTop: 4,
                padding: '4px 12px',
                border: 'none',
                background: 'transparent',
                color: '#6b7280',
                fontSize: 12,
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              Ir para hoje
            </button>
          </div>

          <button
            onClick={goToNextMonth}
            style={{
              padding: '8px 12px',
              border: 'none',
              background: '#f3f4f6',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 18,
              color: '#374151'
            }}
          >
            →
          </button>
        </div>

        {/* Legenda das barras de nutrientes */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 12,
          marginBottom: 8,
          padding: '8px 12px',
          background: '#f9fafb',
          borderRadius: 8,
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{
              width: 4,
              height: 12,
              borderRadius: 2,
              background: '#2196F3'
            }} />
            <span style={{ fontSize: 10, color: '#6b7280' }}>Calorias</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{
              width: 4,
              height: 12,
              borderRadius: 2,
              background: '#ef4444'
            }} />
            <span style={{ fontSize: 10, color: '#6b7280' }}>Proteína</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{
              width: 4,
              height: 12,
              borderRadius: 2,
              background: '#f59e0b'
            }} />
            <span style={{ fontSize: 10, color: '#6b7280' }}>Carboidratos</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{
              width: 4,
              height: 12,
              borderRadius: 2,
              background: '#8b5cf6'
            }} />
            <span style={{ fontSize: 10, color: '#6b7280' }}>Gorduras</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{
              width: 4,
              height: 12,
              borderRadius: 2,
              background: '#06b6d4'
            }} />
            <span style={{ fontSize: 10, color: '#6b7280' }}>Água</span>
          </div>
        </div>

        {/* Legenda das cores de fundo */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 8,
          marginBottom: 12,
          padding: '6px 8px',
          background: '#fefce8',
          borderRadius: 8,
          flexWrap: 'wrap',
          border: '1px solid #fde047'
        }}>
          <span style={{ fontSize: 9, color: '#6b7280', fontWeight: 600 }}>Meta:</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: '#dcfce7', border: '1px solid #86efac' }} />
            <span style={{ fontSize: 9, color: '#6b7280' }}>90-110%</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: '#f0fdf4', border: '1px solid #bbf7d0' }} />
            <span style={{ fontSize: 9, color: '#6b7280' }}>70-89%</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: '#fef9c3', border: '1px solid #fde047' }} />
            <span style={{ fontSize: 9, color: '#6b7280' }}>50-69%</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: '#fee2e2', border: '1px solid #fca5a5' }} />
            <span style={{ fontSize: 9, color: '#6b7280' }}>&gt;110%</span>
          </div>
        </div>

        {/* Dias da Semana */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: 4,
          marginBottom: 8
        }}>
          {WEEKDAYS.map(day => (
            <div
              key={day}
              style={{
                textAlign: 'center',
                fontSize: 11,
                fontWeight: 600,
                color: '#6b7280',
                padding: '4px 0'
              }}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Grid de Dias */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: 3
        }}>
          {calendarDays.map((day, idx) => {
            const hasData = day.meals.length > 0;
            const isSelected = selectedDay?.dateString === day.dateString;

            // Calcula o percentual da meta atingido
            const percentOfGoal = hasData ? (day.calories / calorieGoal) * 100 : 0;

            let bgColor = '#fff';
            let borderColor = '#e5e7eb';

            if (isSelected) {
              bgColor = '#2196F3';
            } else if (day.isToday) {
              bgColor = '#e3f2fd';
              borderColor = '#2196F3';
            } else if (!day.isCurrentMonth) {
              bgColor = '#f9fafb';
            } else if (hasData) {
              // Sistema de cores baseado no progresso da meta
              if (percentOfGoal >= 110) {
                // Passou muito da meta (>110%) - Vermelho
                bgColor = '#fee2e2';
                borderColor = '#fca5a5';
              } else if (percentOfGoal >= 90 && percentOfGoal <= 110) {
                // Dentro da meta (90-110%) - Verde escuro
                bgColor = '#dcfce7';
                borderColor = '#86efac';
              } else if (percentOfGoal >= 70 && percentOfGoal < 90) {
                // Faltando um pouco (70-89%) - Verde claro
                bgColor = '#f0fdf4';
                borderColor = '#bbf7d0';
              } else if (percentOfGoal >= 50 && percentOfGoal < 70) {
                // Faltando bastante (50-69%) - Amarelo
                bgColor = '#fef9c3';
                borderColor = '#fde047';
              } else {
                // Muito abaixo da meta (<50%) - Laranja claro
                bgColor = '#ffedd5';
                borderColor = '#fed7aa';
              }
            }

            return (
              <button
                key={idx}
                onClick={() => setSelectedDay(isSelected ? null : day)}
                disabled={!hasData && !day.isCurrentMonth}
                style={{
                  aspectRatio: '1',
                  border: `1.5px solid ${borderColor}`,
                  background: bgColor,
                  borderRadius: 6,
                  cursor: hasData ? 'pointer' : 'default',
                  opacity: day.isCurrentMonth ? 1 : 0.5,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '3px 2px',
                  transition: 'all 0.2s',
                  position: 'relative'
                }}
              >
                <div style={{
                  fontSize: 11,
                  fontWeight: day.isToday ? 700 : 600,
                  color: isSelected ? '#fff' : (day.isCurrentMonth ? '#374151' : '#9ca3af'),
                  lineHeight: 1
                }}>
                  {day.date.getDate()}
                </div>

                {/* Barras de progresso verticais */}
                <div style={{
                  display: 'flex',
                  gap: 1.5,
                  height: 24,
                  alignItems: 'flex-end',
                  justifyContent: 'center'
                }}>
                  {hasData && (
                    <>
                      {/* Barra Calorias */}
                      <div style={{
                        width: 7,
                        height: '100%',
                        background: isSelected ? 'rgba(255,255,255,0.2)' : '#dbeafe',
                        borderRadius: 2,
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'flex-end'
                      }}>
                        <div style={{
                          height: `${Math.min((day.calories / calorieGoal) * 100, 100)}%`,
                          width: '100%',
                          background: isSelected ? 'rgba(255,255,255,0.9)' : '#2196F3',
                          transition: 'height 0.3s ease',
                          borderRadius: 2
                        }} />
                      </div>

                      {/* Barra Proteína */}
                      <div style={{
                        width: 7,
                        height: '100%',
                        background: isSelected ? 'rgba(255,255,255,0.2)' : '#fee2e2',
                        borderRadius: 2,
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'flex-end'
                      }}>
                        <div style={{
                          height: `${Math.min((day.protein / proteinGoal) * 100, 100)}%`,
                          width: '100%',
                          background: isSelected ? 'rgba(255,255,255,0.9)' : '#ef4444',
                          transition: 'height 0.3s ease',
                          borderRadius: 2
                        }} />
                      </div>

                      {/* Barra Carboidratos */}
                      <div style={{
                        width: 7,
                        height: '100%',
                        background: isSelected ? 'rgba(255,255,255,0.2)' : '#fef3c7',
                        borderRadius: 2,
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'flex-end'
                      }}>
                        <div style={{
                          height: `${Math.min((day.carbs / carbsGoal) * 100, 100)}%`,
                          width: '100%',
                          background: isSelected ? 'rgba(255,255,255,0.9)' : '#f59e0b',
                          transition: 'height 0.3s ease',
                          borderRadius: 2
                        }} />
                      </div>

                      {/* Barra Gorduras */}
                      <div style={{
                        width: 7,
                        height: '100%',
                        background: isSelected ? 'rgba(255,255,255,0.2)' : '#ede9fe',
                        borderRadius: 2,
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'flex-end'
                      }}>
                        <div style={{
                          height: `${Math.min((day.fat / fatGoal) * 100, 100)}%`,
                          width: '100%',
                          background: isSelected ? 'rgba(255,255,255,0.9)' : '#8b5cf6',
                          transition: 'height 0.3s ease',
                          borderRadius: 2
                        }} />
                      </div>

                      {/* Barra Água */}
                      {day.waterIntake > 0 && (
                        <div style={{
                          width: 7,
                          height: '100%',
                          background: isSelected ? 'rgba(255,255,255,0.2)' : '#cffafe',
                          borderRadius: 2,
                          overflow: 'hidden',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'flex-end'
                        }}>
                          <div style={{
                            height: `${Math.min((day.waterIntake / waterGoal) * 100, 100)}%`,
                            width: '100%',
                            background: isSelected ? 'rgba(255,255,255,0.9)' : '#06b6d4',
                            transition: 'height 0.3s ease',
                            borderRadius: 2
                          }} />
                        </div>
                      )}
                    </>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Detalhes do Dia Selecionado */}
      {selectedDay && selectedDay.meals.length > 0 && (
        <div style={{
          background: 'white',
          borderRadius: 16,
          padding: 20,
          marginBottom: 16,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          border: '2px solid #2196F3',
          animation: 'slideDown 0.3s ease'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
            paddingBottom: 12,
            borderBottom: '2px solid #e5e7eb'
          }}>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: '#2196F3' }}>
                📅 {selectedDay.dateString}
              </h3>
              <p style={{ fontSize: 13, color: '#6b7280', margin: '4px 0 0 0' }}>
                {selectedDay.meals.length} refeição{selectedDay.meals.length !== 1 ? 'ões' : ''}
              </p>
            </div>
            <button
              onClick={() => setSelectedDay(null)}
              style={{
                padding: '6px 12px',
                border: 'none',
                background: '#f3f4f6',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 14,
                color: '#6b7280'
              }}
            >
              ✕
            </button>
          </div>

          {/* Resumo Nutricional do Dia */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 12,
            marginBottom: 20,
            padding: 16,
            background: '#f9fafb',
            borderRadius: 12
          }}>
            <div>
              <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>🔥 Calorias</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#2196F3' }}>
                {selectedDay.calories.toFixed(0)}
              </div>
              <div style={{ fontSize: 10, color: '#9ca3af' }}>Meta: {calorieGoal}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>🥩 Proteína</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#ef4444' }}>
                {selectedDay.protein.toFixed(0)}g
              </div>
              <div style={{ fontSize: 10, color: '#9ca3af' }}>Meta: {proteinGoal}g</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>🍚 Carboidratos</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#f59e0b' }}>
                {selectedDay.carbs.toFixed(0)}g
              </div>
              <div style={{ fontSize: 10, color: '#9ca3af' }}>Meta: {carbsGoal}g</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>🧈 Gorduras</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#8b5cf6' }}>
                {selectedDay.fat.toFixed(0)}g
              </div>
              <div style={{ fontSize: 10, color: '#9ca3af' }}>Meta: {fatGoal}g</div>
            </div>
            <div style={{
              gridColumn: '1 / -1',
              background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
              borderRadius: 8,
              padding: 12,
              color: 'white'
            }}>
              <div style={{ fontSize: 11, opacity: 0.9, marginBottom: 4 }}>💧 Água</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 700 }}>
                  {selectedDay.waterIntake}ml
                </div>
                <div style={{ fontSize: 11, opacity: 0.9 }}>
                  {Math.floor(selectedDay.waterIntake / 250)} copos • Meta: {waterGoal}ml
                </div>
              </div>
              {selectedDay.waterIntake > 0 && (
                <div style={{
                  marginTop: 8,
                  height: 6,
                  background: 'rgba(255,255,255,0.3)',
                  borderRadius: 3,
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${Math.min((selectedDay.waterIntake / waterGoal) * 100, 100)}%`,
                    height: '100%',
                    background: 'white',
                    borderRadius: 3,
                    transition: 'width 0.3s ease'
                  }} />
                </div>
              )}
            </div>
          </div>

          {/* Lista de Refeições */}
          <div style={{ display: 'grid', gap: 12 }}>
            {selectedDay.meals.map((meal) => {
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
                    borderRadius: 12,
                    overflow: 'hidden',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    border: '1px solid #e5e7eb'
                  }}
                >
                  {meal.image_url && meal.image_url !== 'https://via.placeholder.com/400x300.png?text=Meal+Image' && (
                    <img
                      src={meal.image_url}
                      alt="Refeição"
                      style={{
                        width: '100%',
                        height: 150,
                        objectFit: 'cover'
                      }}
                    />
                  )}

                  <div style={{ padding: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 20 }}>{config.icon}</span>
                        <div>
                          <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: config.color }}>
                            {config.label}
                          </h4>
                          <div style={{ fontSize: 12, color: '#6b7280' }}>
                            {new Date(meal.consumed_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            {meal.location_type && (
                              <>
                                {' • '}
                                {meal.location_type === 'home' ? '🏠 Casa' : `🍽️ ${meal.restaurant_name || 'Fora'}`}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={async () => {
                          if (!confirm('Tem certeza que deseja deletar esta refeição?')) return;
                          try {
                            const res = await fetch(`/api/meals/${meal.id}`, {
                              method: 'DELETE',
                              credentials: 'include'
                            });
                            if (res.ok) {
                              window.location.reload();
                            } else {
                              const data = await res.json();
                              alert(data.error || 'Erro ao deletar refeição');
                            }
                          } catch (e) {
                            alert('Erro ao deletar refeição');
                          }
                        }}
                        style={{
                          padding: '6px 10px',
                          background: '#fee2e2',
                          border: '1px solid #fca5a5',
                          borderRadius: 6,
                          cursor: 'pointer',
                          fontSize: 16,
                          color: '#dc2626',
                          flexShrink: 0
                        }}
                        title="Deletar refeição"
                      >
                        🗑️
                      </button>
                    </div>

                    {meal.notes && (
                      <div style={{
                        padding: 10,
                        background: '#f9fafb',
                        borderRadius: 8,
                        marginBottom: 10,
                        borderLeft: '3px solid ' + config.color
                      }}>
                        <p style={{ margin: 0, fontSize: 13, color: '#374151', fontStyle: 'italic' }}>
                          "{meal.notes}"
                        </p>
                      </div>
                    )}

                    {/* Alimentos */}
                    <div style={{ marginBottom: 10 }}>
                      <div style={{
                        fontSize: 10,
                        fontWeight: 600,
                        color: '#6b7280',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        marginBottom: 6
                      }}>
                        Alimentos ({meal.foods.length})
                      </div>
                      <div style={{ display: 'grid', gap: 6 }}>
                        {meal.foods.map((food) => (
                          <div
                            key={food.id}
                            style={{
                              padding: '8px 10px',
                              background: '#f9fafb',
                              borderRadius: 6,
                              fontSize: 12,
                              border: '1px solid #e5e7eb'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                              <span style={{ fontWeight: 600, color: '#374151' }}>{food.name}</span>
                              <span style={{ color: '#6b7280', fontSize: 11 }}>
                                {food.quantity}{food.unit}
                              </span>
                            </div>
                            {(food.calories || food.protein_g || food.carbs_g || food.fat_g) && (
                              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: 10, color: '#6b7280' }}>
                                {food.calories && <span>🔥 {food.calories.toFixed(0)} kcal</span>}
                                {food.protein_g && <span>🥩 {food.protein_g.toFixed(1)}g</span>}
                                {food.carbs_g && <span>🍚 {food.carbs_g.toFixed(1)}g</span>}
                                {food.fat_g && <span>🧈 {food.fat_g.toFixed(1)}g</span>}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Total da Refeição */}
                    <div style={{
                      padding: 12,
                      background: config.color,
                      borderRadius: 8,
                      color: 'white'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <span style={{ fontWeight: 600, fontSize: 13 }}>Total</span>
                        <span style={{ fontSize: 18, fontWeight: 700 }}>{mealCalories.toFixed(0)} kcal</span>
                      </div>
                      {(mealProtein > 0 || mealCarbs > 0 || mealFat > 0) && (
                        <div style={{
                          display: 'flex',
                          gap: 10,
                          fontSize: 11,
                          opacity: 0.95,
                          paddingTop: 6,
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
        </div>
      )}
    </div>
  );
}
