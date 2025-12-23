'use client';

import { useState } from 'react';
import { useUserPlan } from '@/hooks/useUserPlan';
import { useQuota } from '@/hooks/useQuota';
import { PaywallModal, QuotaCard } from '@/components/subscription';
import { api, apiClient } from '@/lib/api-client';

function nowSaoPauloLocalInput() {
  try {
    const options: Intl.DateTimeFormatOptions = {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    };
    const f = new Intl.DateTimeFormat('sv-SE', options);
    const parts = f.formatToParts(new Date());
    const get = (t: string) => parts.find(p => p.type === t)?.value || '';
    return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`;
  } catch {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
}

const mealTypeLabels: Record<string, string> = {
  breakfast: 'Café da Manhã',
  lunch: 'Almoço',
  dinner: 'Jantar',
  snack: 'Lanche'
};

export default function CapturePage() {
  // Subscription
  const { plan, quota, isLoading: isPlanLoading } = useUserPlan();
  const { hasQuota } = useQuota(plan, quota);
  const [showPaywall, setShowPaywall] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mealType, setMealType] = useState('');
  const [analysis, setAnalysis] = useState<any | null>(null);
  const [consumedAt, setConsumedAt] = useState<string>(() => nowSaoPauloLocalInput());
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  // Local da refeição
  const [locationType, setLocationType] = useState<'home'|'out'>('home');
  const [restaurantQuery, setRestaurantQuery] = useState('');
  const [restaurantResults, setRestaurantResults] = useState<Array<{ id: string; name: string; address?: string|null }>>([]);
  const [restaurantLoading, setRestaurantLoading] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState<{ id: string; name: string } | null>(null);
  // Lista de alimentos montada pelo usuário (antes da análise de IA)
  const [foodList, setFoodList] = useState<any[]>([]);
  // Modais
  const [showFoodBankModal, setShowFoodBankModal] = useState(false);
  const [showNewFoodModal, setShowNewFoodModal] = useState(false);
  // Banco de alimentos
  const [foodBankQuery, setFoodBankQuery] = useState('');
  const [foodBankResults, setFoodBankResults] = useState<any[]>([]);
  const [foodBankLoading, setFoodBankLoading] = useState(false);
  // Novo alimento
  const [newFoodName, setNewFoodName] = useState('');

  async function compressImage(file: File): Promise<File> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          const maxSize = 1024;
          if (width > height && width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          } else if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          let quality = 0.8;
          const tryCompress = () => {
            canvas.toBlob((blob) => {
              if (!blob) {
                reject(new Error('Erro ao comprimir imagem'));
                return;
              }

              if (blob.size < 500 * 1024 || quality < 0.3) {
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now()
                });
                resolve(compressedFile);
              } else {
                quality -= 0.1;
                tryCompress();
              }
            }, 'image/jpeg', quality);
          };

          tryCompress();
        };
        img.onerror = () => reject(new Error('Erro ao carregar imagem'));
      };
      reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
    });
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    // Bloquear para FREE
    if (plan === 'free') {
      setShowPaywall(true);
      e.target.value = ''; // Limpa o input
      return;
    }

    const f = e.target.files?.[0];
    if (f) {
      setLoading(true);
      setError(null);
      try {
        const compressed = await compressImage(f);
        setFile(compressed);
        setPreviewUrl(URL.createObjectURL(compressed));
      } catch (err) {
        setError('Erro ao processar imagem. Tente outra foto.');
      } finally {
        setLoading(false);
      }
    }
  }

  async function searchFoodBank(query: string) {
    if (query.trim().length < 2) {
      setFoodBankResults([]);
      return;
    }

    try {
      setFoodBankLoading(true);
      const res = await api.get(`/api/food-bank?q=${encodeURIComponent(query)}`);
      const json = await res.json();
      if (res.ok) {
        setFoodBankResults(json.items || []);
      }
    } catch (e) {
      console.error('Erro ao buscar alimentos:', e);
    } finally {
      setFoodBankLoading(false);
    }
  }

  async function addFoodFromBank(foodItem: any) {
    const quantityStr = prompt(`Quantas unidades de "${foodItem.name}"?`, '1');
    if (!quantityStr) return;

    const quantity = Number(quantityStr);
    if (isNaN(quantity) || quantity <= 0) {
      alert('Quantidade inválida! Digite um número maior que zero.');
      return;
    }

    // Incrementar contador de uso
    try {
      await api.post(`/api/food-bank/increment-usage`, { id: foodItem.id });
    } catch (e) {
      console.error('Erro ao incrementar uso:', e);
    }

    const newFood = {
      name: foodItem.name,
      quantity: quantity,
      unit: foodItem.serving_size || 'porção',
      calories: foodItem.calories ? foodItem.calories * quantity : undefined,
      protein_g: foodItem.protein ? foodItem.protein * quantity : undefined,
      carbs_g: foodItem.carbs ? foodItem.carbs * quantity : undefined,
      fat_g: foodItem.fat ? foodItem.fat * quantity : undefined,
      fiber_g: foodItem.fiber ? foodItem.fiber * quantity : undefined,
      sodium_mg: foodItem.sodium ? foodItem.sodium * quantity : undefined,
      sugar_g: foodItem.sugar ? foodItem.sugar * quantity : undefined,
      source: 'bank'
    };

    setFoodList([...foodList, newFood]);
    setFoodBankQuery('');
    setFoodBankResults([]);
    setShowFoodBankModal(false);
  }

  function addNewFood() {
    if (!newFoodName.trim()) {
      alert('Digite o nome do alimento!');
      return;
    }

    const newFood = {
      name: newFoodName.trim(),
      quantity: 1,
      unit: 'porção',
      source: 'new'
    };

    setFoodList([...foodList, newFood]);
    setNewFoodName('');
    setShowNewFoodModal(false);
  }

  function removeFood(index: number) {
    const updated = [...foodList];
    updated.splice(index, 1);
    setFoodList(updated);
  }

  async function analyzePhotoOnly() {
    if (!file) {
      setError('Selecione uma foto para analisar!');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('image', file);
      fd.append('context', JSON.stringify({
        location_type: locationType,
        restaurant_name: locationType === 'out' ? selectedRestaurant?.name : undefined
      }));

      const res = await apiClient('/api/meals/analyze-image', {
        method: 'POST',
        body: fd,
      });

      const json = await res.json();
      if (!res.ok) {
        if (res.status === 403) {
          setShowPaywall(true);
          return;
        }
        throw new Error(json.error || 'Erro ao analisar foto');
      }

      // Converter resposta para o formato de analysis
      setAnalysis({
        foods: json.foods || [],
        totals: json.totals || { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao analisar foto');
    } finally {
      setLoading(false);
    }
  }

  async function analyzeWithAI() {
    if (foodList.length === 0) {
      setError('Adicione pelo menos um alimento para analisar!');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const payload: any = {
        foods: foodList.map(f => ({
          name: f.name,
          quantity: f.quantity,
          unit: f.unit,
          // Se já tem valores nutricionais (do banco), envia também
          calories: f.calories,
          protein_g: f.protein_g,
          carbs_g: f.carbs_g,
          fat_g: f.fat_g,
          fiber_g: f.fiber_g,
          sodium_mg: f.sodium_mg,
          sugar_g: f.sugar_g
        })),
        location_type: locationType,
        restaurant_name: locationType === 'out' ? selectedRestaurant?.name : undefined
      };

      // Se tem foto, envia também
      let res: Response;
      if (file) {
        const fd = new FormData();
        fd.append('image', file);
        fd.append('data', JSON.stringify(payload));
        res = await apiClient('/api/meals/analyze-meal', {
          method: 'POST',
          body: fd,
        });
      } else {
        res = await api.post('/api/meals/analyze-meal', payload);
      }

      const json = await res.json();
      if (!res.ok) {
        // Se for 403, é bloqueio de plano
        if (res.status === 403) {
          setShowPaywall(true);
          return;
        }
        throw new Error(json.error || 'Erro ao analisar');
      }
      setAnalysis(json.result);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function saveMeal() {
    if (!analysis) return;

    if (!mealType) {
      setError('Por favor, selecione o tipo de refeição');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      // Garante que o timezone é America/Sao_Paulo ao enviar para o backend
      const consumedAtWithTz = consumedAt + ':00-03:00'; // YYYY-MM-DDTHH:mm:ss-03:00

      const payload: any = {
        meal_type: mealType,
        consumed_at: consumedAtWithTz,
        notes: notes || analysis.notes || '',
        foods: (analysis.foods || []).map((f: any) => ({
          name: f.name,
          quantity: Number(f.quantity)||1,
          unit: f.unit || 'un',
          calories: f.calories,
          protein_g: f.protein_g,
          carbs_g: f.carbs_g,
          fat_g: f.fat_g,
          fiber_g: f.fiber_g,
          sodium_mg: f.sodium_mg,
          sugar_g: f.sugar_g
        }))
      };

      payload.location_type = locationType;
      if (locationType === 'out') {
        if (!selectedRestaurant?.id) {
          throw new Error('Selecione um restaurante para refeições fora de casa');
        }
        payload.restaurant_id = selectedRestaurant.id;
      } else {
        payload.restaurant_id = null;
      }

      let res: Response;
      if (file) {
        const fd = new FormData();
        fd.append('image', file);
        fd.append('payload', JSON.stringify(payload));
        res = await apiClient('/api/meals/approve', {
          method: 'POST',
          body: fd,
        });
      } else {
        res = await api.post('/api/meals/approve', payload);
      }

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erro ao salvar');
      setSuccess(true);

      // Limpar formulário
      setFile(null);
      setPreviewUrl(null);
      setFoodList([]);
      setAnalysis(null);
      setNotes('');
      setConsumedAt(nowSaoPauloLocalInput());
      setLocationType('home');
      setSelectedRestaurant(null);
      setRestaurantQuery('');
      setRestaurantResults([]);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const totalCalories = analysis?.foods?.reduce((sum: number, f: any) => sum + (f.calories || 0), 0) || 0;

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 24 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 24 }}>📸 Capturar Refeição</h1>

      {/* Paywall Modal */}
      <PaywallModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        feature="photo_analysis"
        currentPlan={plan}
      />

      {/* Quota Card - Apenas para PREMIUM */}
      {hasQuota && quota && (
        <QuotaCard
          quotaType="photo"
          used={quota.photo_analyses.used}
          limit={quota.photo_analyses.limit}
          percentage={quota.photo_analyses.percentage}
          remaining={quota.photo_analyses.remaining}
          resetDate={quota.resetDate}
        />
      )}

      {/* Foto (opcional) */}
      <div style={{
        border: plan === 'free' ? '2px dashed #fbbf24' : '2px dashed #d1d5db',
        borderRadius: 16,
        padding: 24,
        textAlign: 'center',
        background: plan === 'free' ? '#fffbeb' : '#f9fafb',
        marginBottom: 24,
        position: 'relative'
      }}>
        {previewUrl ? (
          <div>
            <img src={previewUrl} alt="Preview" style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 12, marginBottom: 12 }} />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => { setFile(null); setPreviewUrl(null); }}
                style={{
                  padding: '8px 16px',
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer'
                }}
              >
                🗑️ Remover Foto
              </button>
              {!analysis && plan !== 'free' && (
                <button
                  onClick={analyzePhotoOnly}
                  disabled={loading}
                  style={{
                    padding: '8px 16px',
                    background: loading ? '#9ca3af' : '#8b5cf6',
                    color: 'white',
                    border: 'none',
                    borderRadius: 8,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontWeight: 600
                  }}
                >
                  {loading ? '🔄 Analisando...' : '✨ Analisar Foto com IA'}
                </button>
              )}
            </div>
          </div>
        ) : (
          <label style={{ cursor: plan === 'free' ? 'not-allowed' : 'pointer' }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>
              {plan === 'free' ? '🔒' : '📷'}
            </div>
            <div style={{ fontSize: 14, color: plan === 'free' ? '#92400e' : '#666', marginBottom: 12 }}>
              {plan === 'free'
                ? '⭐ Análise de foto disponível apenas para usuários PREMIUM'
                : 'Adicionar foto da refeição (opcional)'}
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{ display: 'none' }}
              disabled={plan === 'free'}
            />
            <div
              onClick={(e) => {
                if (plan === 'free') {
                  e.preventDefault();
                  setShowPaywall(true);
                }
              }}
              style={{
                display: 'inline-block',
                padding: '10px 20px',
                background: plan === 'free' ? '#fbbf24' : '#2196F3',
                color: 'white',
                borderRadius: 8,
                fontWeight: 600,
                fontSize: 14,
                cursor: plan === 'free' ? 'pointer' : 'default'
              }}
            >
              {plan === 'free' ? '🔓 Desbloquear Premium' : 'Selecionar Foto'}
            </div>
          </label>
        )}
      </div>

      {/* Botões de adicionar alimentos */}
      {!analysis && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
          <button
            onClick={() => setShowFoodBankModal(true)}
            style={{
              padding: 16,
              background: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: 12,
              fontSize: 16,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            🍎 Adicionar do Banco
          </button>
          <button
            onClick={() => setShowNewFoodModal(true)}
            style={{
              padding: 16,
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: 12,
              fontSize: 16,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            ✏️ Adicionar Novo
          </button>
        </div>
      )}

      {/* Lista de alimentos adicionados (antes da análise) */}
      {!analysis && foodList.length > 0 && (
        <div style={{
          background: '#f0fdf4',
          border: '2px solid #10b981',
          borderRadius: 16,
          padding: 24,
          marginBottom: 24
        }}>
          <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, color: '#065f46' }}>
            Alimentos Adicionados ({foodList.length})
          </h3>
          <div style={{ display: 'grid', gap: 12, marginBottom: 16 }}>
            {foodList.map((food, i) => (
              <div
                key={i}
                style={{
                  padding: 12,
                  background: 'white',
                  borderRadius: 8,
                  border: '1px solid #e5e7eb',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ fontWeight: 600 }}>{food.name}</div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>
                    {food.quantity} {food.unit}
                    {food.source === 'bank' && <span> • Do banco</span>}
                    {food.source === 'new' && <span> • Novo</span>}
                  </div>
                </div>
                <button
                  onClick={() => removeFood(i)}
                  style={{
                    padding: '4px 8px',
                    background: '#fee2e2',
                    color: '#dc2626',
                    border: 'none',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontSize: 12
                  }}
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={analyzeWithAI}
            disabled={loading}
            style={{
              width: '100%',
              padding: 16,
              background: loading ? '#9ca3af' : '#8b5cf6',
              color: 'white',
              border: 'none',
              borderRadius: 12,
              fontSize: 16,
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? '🔄 Analisando com IA...' : '✨ Analisar com IA'}
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{
          padding: 16,
          background: '#fee2e2',
          border: '2px solid #ef4444',
          borderRadius: 12,
          color: '#991b1b',
          marginBottom: 24
        }}>
          ❌ {error}
        </div>
      )}

      {/* Success */}
      {success && (
        <div style={{
          padding: 16,
          background: '#d1fae5',
          border: '2px solid #10b981',
          borderRadius: 12,
          color: '#065f46',
          marginBottom: 24
        }}>
          ✅ Refeição salva com sucesso!
        </div>
      )}

      {/* Análise da IA */}
      {analysis && (
        <div style={{ marginBottom: 32 }}>
          <div style={{
            background: 'white',
            border: '2px solid #e5e7eb',
            borderRadius: 16,
            padding: 24,
            marginBottom: 24
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700 }}>
                Análise da Refeição
              </h2>
              <div style={{
                padding: '8px 16px',
                background: '#dbeafe',
                color: '#1e40af',
                borderRadius: 20,
                fontWeight: 600
              }}>
                {totalCalories} kcal
              </div>
            </div>

            {analysis.notes && (
              <p style={{ color: '#666', fontSize: 14, marginBottom: 16, fontStyle: 'italic' }}>
                {analysis.notes}
              </p>
            )}

            <div style={{ display: 'grid', gap: 12 }}>
              {analysis.foods?.map((food: any, i: number) => (
                <div
                  key={i}
                  style={{
                    padding: 16,
                    background: '#f9fafb',
                    borderRadius: 12,
                    border: '1px solid #e5e7eb'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{ fontWeight: 600, fontSize: 16 }}>{food.name}</span>
                    <span style={{ color: '#666' }}>
                      {food.quantity} {food.unit}
                    </span>
                  </div>

                  {/* Campos editáveis */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 8 }}>
                    <div>
                      <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>
                        🔥 Calorias (kcal)
                      </label>
                      <input
                        type="number"
                        value={food.calories || ''}
                        onChange={e => {
                          const updated = [...analysis.foods];
                          updated[i].calories = Number(e.target.value) || undefined;
                          setAnalysis({ ...analysis, foods: updated });
                        }}
                        style={{
                          width: '100%',
                          padding: '6px 8px',
                          fontSize: 14,
                          border: '1px solid #d1d5db',
                          borderRadius: 6,
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>
                        🥩 Proteína (g)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={food.protein_g || ''}
                        onChange={e => {
                          const updated = [...analysis.foods];
                          updated[i].protein_g = Number(e.target.value) || undefined;
                          setAnalysis({ ...analysis, foods: updated });
                        }}
                        style={{
                          width: '100%',
                          padding: '6px 8px',
                          fontSize: 14,
                          border: '1px solid #d1d5db',
                          borderRadius: 6,
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>
                        🍚 Carboidrato (g)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={food.carbs_g || ''}
                        onChange={e => {
                          const updated = [...analysis.foods];
                          updated[i].carbs_g = Number(e.target.value) || undefined;
                          setAnalysis({ ...analysis, foods: updated });
                        }}
                        style={{
                          width: '100%',
                          padding: '6px 8px',
                          fontSize: 14,
                          border: '1px solid #d1d5db',
                          borderRadius: 6,
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>
                        🧈 Gordura (g)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={food.fat_g || ''}
                        onChange={e => {
                          const updated = [...analysis.foods];
                          updated[i].fat_g = Number(e.target.value) || undefined;
                          setAnalysis({ ...analysis, foods: updated });
                        }}
                        style={{
                          width: '100%',
                          padding: '6px 8px',
                          fontSize: 14,
                          border: '1px solid #d1d5db',
                          borderRadius: 6,
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>
                        🌾 Fibras (g)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={food.fiber_g || ''}
                        onChange={e => {
                          const updated = [...analysis.foods];
                          updated[i].fiber_g = Number(e.target.value) || undefined;
                          setAnalysis({ ...analysis, foods: updated });
                        }}
                        style={{
                          width: '100%',
                          padding: '6px 8px',
                          fontSize: 14,
                          border: '1px solid #d1d5db',
                          borderRadius: 6,
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>
                        🧂 Sódio (mg)
                      </label>
                      <input
                        type="number"
                        step="1"
                        value={food.sodium_mg || ''}
                        onChange={e => {
                          const updated = [...analysis.foods];
                          updated[i].sodium_mg = Number(e.target.value) || undefined;
                          setAnalysis({ ...analysis, foods: updated });
                        }}
                        style={{
                          width: '100%',
                          padding: '6px 8px',
                          fontSize: 14,
                          border: '1px solid #d1d5db',
                          borderRadius: 6,
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>
                        🍬 Açúcar (g)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={food.sugar_g || ''}
                        onChange={e => {
                          const updated = [...analysis.foods];
                          updated[i].sugar_g = Number(e.target.value) || undefined;
                          setAnalysis({ ...analysis, foods: updated });
                        }}
                        style={{
                          width: '100%',
                          padding: '6px 8px',
                          fontSize: 14,
                          border: '1px solid #d1d5db',
                          borderRadius: 6,
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Formulário de aprovação */}
          <div style={{ display: 'grid', gap: 16 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
                🍽️ Tipo de Refeição *
              </label>
              <select
                value={mealType}
                onChange={e => setMealType(e.target.value)}
                style={{
                  width: '100%',
                  padding: 12,
                  fontSize: 16,
                  border: mealType ? '2px solid #e5e7eb' : '2px solid #ef4444',
                  borderRadius: 8,
                  backgroundColor: 'white',
                  boxSizing: 'border-box'
                }}
              >
                <option value="">Selecione o tipo...</option>
                <option value="breakfast">☀️ Café da Manhã</option>
                <option value="lunch">🍽️ Almoço</option>
                <option value="dinner">🌙 Jantar</option>
                <option value="snack">🍿 Lanche</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
                📅 Quando foi consumido?
              </label>
              <input
                type="datetime-local"
                value={consumedAt}
                onChange={e => setConsumedAt(e.target.value)}
                style={{
                  width: '100%',
                  padding: 12,
                  fontSize: 16,
                  border: '2px solid #e5e7eb',
                  borderRadius: 8,
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
                📝 Observações (opcional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Ex: Comi tudo, estava delicioso!"
                style={{
                  width: '100%',
                  padding: 12,
                  fontSize: 16,
                  border: '2px solid #e5e7eb',
                  borderRadius: 8,
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Local da refeição */}
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
                📍 Local da Refeição
              </label>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <button
                  type="button"
                  onClick={() => { setLocationType('home'); setSelectedRestaurant(null); }}
                  style={{
                    flex: 1,
                    padding: 10,
                    borderRadius: 8,
                    border: locationType === 'home' ? '2px solid #10b981' : '2px solid #e5e7eb',
                    background: locationType === 'home' ? '#ecfdf5' : 'white',
                    fontWeight: 600,
                    color: locationType === 'home' ? '#065f46' : '#374151'
                  }}
                >
                  🏠 Casa
                </button>
                <button
                  type="button"
                  onClick={() => setLocationType('out')}
                  style={{
                    flex: 1,
                    padding: 10,
                    borderRadius: 8,
                    border: locationType === 'out' ? '2px solid #f59e0b' : '2px solid #e5e7eb',
                    background: locationType === 'out' ? '#fffbeb' : 'white',
                    fontWeight: 600,
                    color: locationType === 'out' ? '#92400e' : '#374151'
                  }}
                >
                  🍽️ Fora
                </button>
              </div>

              {locationType === 'out' && (
                <div style={{ position: 'relative' }}>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, color: '#92400e' }}>
                    Restaurante (obrigatório)
                  </label>
                  <input
                    type="text"
                    value={restaurantQuery}
                    onChange={async (e) => {
                      const q = e.target.value;
                      setRestaurantQuery(q);
                      // Limpa a seleção quando começar a digitar
                      if (selectedRestaurant) {
                        setSelectedRestaurant(null);
                      }
                      if (q.trim().length < 2) {
                        setRestaurantResults([]);
                        return;
                      }
                      try {
                        setRestaurantLoading(true);
                        const res = await api.get(`/api/restaurants/search?q=${encodeURIComponent(q)}`);
                        const json = await res.json();
                        if (res.ok) {
                          setRestaurantResults(json.restaurants || []);
                        }
                      } finally {
                        setRestaurantLoading(false);
                      }
                    }}
                    placeholder="Digite o nome do restaurante..."
                    style={{
                      width: '100%',
                      padding: 12,
                      fontSize: 16,
                      border: '2px solid #fbbf24',
                      borderRadius: selectedRestaurant ? '8px' : '8px 8px 0 0',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  {!selectedRestaurant && (restaurantLoading || restaurantResults.length > 0 || (restaurantQuery.trim().length >= 2 && restaurantResults.length === 0)) && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      background: 'white',
                      border: '1px solid #e5e7eb',
                      borderTop: 'none',
                      borderRadius: '0 0 8px 8px',
                      maxHeight: 200,
                      overflowY: 'auto',
                      zIndex: 10
                    }}>
                      {restaurantLoading && (
                        <div style={{ padding: 10, fontSize: 14, color: '#6b7280' }}>Carregando...</div>
                      )}
                      {!restaurantLoading && restaurantResults.map(r => (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => { setSelectedRestaurant({ id: r.id, name: r.name }); setRestaurantQuery(r.name); setRestaurantResults([]); }}
                          style={{
                            width: '100%',
                            textAlign: 'left',
                            padding: '10px 12px',
                            border: 'none',
                            background: 'white',
                            cursor: 'pointer',
                            borderBottom: '1px solid #f3f4f6'
                          }}
                        >
                          <div style={{ fontWeight: 600 }}>{r.name}</div>
                          {r.address && <div style={{ fontSize: 12, color: '#6b7280' }}>{r.address}</div>}
                        </button>
                      ))}
                      {!restaurantLoading && restaurantResults.length === 0 && restaurantQuery.trim().length >= 2 && (
                        <div style={{ padding: 10 }}>
                          <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 8 }}>
                            Nenhum restaurante encontrado.
                          </div>
                          <button
                            type="button"
                            onClick={async () => {
                              if (!restaurantQuery.trim()) return;
                              if (!confirm(`Cadastrar o restaurante "${restaurantQuery.trim()}"?`)) return;
                              try {
                                setRestaurantLoading(true);
                                const res = await api.post('/api/restaurants', { name: restaurantQuery.trim() });
                                const json = await res.json();
                                if (res.ok) {
                                  const restaurantName = json.restaurant.name;
                                  setSelectedRestaurant({ id: json.restaurant.id, name: restaurantName });
                                  setRestaurantQuery(restaurantName);
                                  setRestaurantResults([]);
                                } else {
                                  alert(json.error || 'Erro ao cadastrar restaurante');
                                }
                              } catch (e: any) {
                                alert('Erro ao cadastrar restaurante: ' + e.message);
                              } finally {
                                setRestaurantLoading(false);
                              }
                            }}
                            style={{
                              width: '100%',
                              padding: '10px 12px',
                              background: '#10b981',
                              color: 'white',
                              border: 'none',
                              borderRadius: 6,
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            ➕ Cadastrar "{restaurantQuery.trim()}"
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                  {selectedRestaurant && (
                    <div style={{ marginTop: 8, fontSize: 13, color: '#92400e' }}>
                      Selecionado: <strong>{selectedRestaurant.name}</strong>
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={saveMeal}
              disabled={loading}
              style={{
                width: '100%',
                padding: 16,
                background: '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: 12,
                fontSize: 16,
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1
              }}
            >
              {loading ? '💾 Salvando...' : '✅ Salvar Refeição'}
            </button>
          </div>
        </div>
      )}

      {/* Modal: Adicionar do Banco */}
      {showFoodBankModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
          padding: 20
        }}>
          <div style={{
            background: 'white',
            borderRadius: 16,
            padding: 24,
            maxWidth: 500,
            width: '100%',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700 }}>🍎 Adicionar do Banco</h2>
              <button
                onClick={() => { setShowFoodBankModal(false); setFoodBankQuery(''); setFoodBankResults([]); }}
                style={{
                  padding: 8,
                  background: 'transparent',
                  border: 'none',
                  fontSize: 24,
                  cursor: 'pointer',
                  color: '#666'
                }}
              >
                ×
              </button>
            </div>

            <input
              type="text"
              value={foodBankQuery}
              onChange={e => {
                setFoodBankQuery(e.target.value);
                searchFoodBank(e.target.value);
              }}
              placeholder="🔍 Buscar alimento..."
              style={{
                width: '100%',
                padding: 12,
                fontSize: 16,
                border: '2px solid #10b981',
                borderRadius: 8,
                outline: 'none',
                marginBottom: 16,
                boxSizing: 'border-box'
              }}
            />

            {foodBankLoading && <div style={{ textAlign: 'center', color: '#6b7280' }}>Buscando...</div>}

            {!foodBankLoading && foodBankResults.length > 0 && (
              <div style={{ display: 'grid', gap: 8 }}>
                {foodBankResults.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => addFoodFromBank(item)}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: 12,
                      background: '#f9fafb',
                      border: '1px solid #e5e7eb',
                      borderRadius: 8,
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>
                      {item.name}
                      {item.brand && <span style={{ color: '#6b7280', fontWeight: 400 }}> - {item.brand}</span>}
                    </div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>
                      {item.serving_size && <span>Porção: {item.serving_size} | </span>}
                      {item.calories && <span>{item.calories} kcal</span>}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {!foodBankLoading && foodBankQuery.length >= 2 && foodBankResults.length === 0 && (
              <div style={{ textAlign: 'center', color: '#dc2626', padding: 16 }}>
                ❌ Nenhum alimento encontrado. <a href="/meus-alimentos" style={{ color: '#2196F3', textDecoration: 'underline' }}>Cadastre aqui</a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Adicionar Novo Alimento */}
      {showNewFoodModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
          padding: 20
        }}>
          <div style={{
            background: 'white',
            borderRadius: 16,
            padding: 24,
            maxWidth: 400,
            width: '100%'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700 }}>✏️ Adicionar Novo Alimento</h2>
              <button
                onClick={() => { setShowNewFoodModal(false); setNewFoodName(''); }}
                style={{
                  padding: 8,
                  background: 'transparent',
                  border: 'none',
                  fontSize: 24,
                  cursor: 'pointer',
                  color: '#666'
                }}
              >
                ×
              </button>
            </div>

            <input
              type="text"
              value={newFoodName}
              onChange={e => setNewFoodName(e.target.value)}
              placeholder="Ex: Bife de frango grelhado"
              style={{
                width: '100%',
                padding: 12,
                fontSize: 16,
                border: '2px solid #3b82f6',
                borderRadius: 8,
                outline: 'none',
                marginBottom: 16,
                boxSizing: 'border-box'
              }}
              onKeyDown={e => { if (e.key === 'Enter') addNewFood(); }}
              autoFocus
            />

            <button
              onClick={addNewFood}
              style={{
                width: '100%',
                padding: 12,
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                fontSize: 16,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Adicionar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
