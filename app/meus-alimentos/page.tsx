'use client';

import { useState, useEffect, useRef } from 'react';
import { useUserPlan } from '@/hooks/useUserPlan';
import { useQuota } from '@/hooks/useQuota';
import { PaywallModal, QuotaCard } from '@/components/subscription';
import { api, apiClient } from '@/lib/api-client';

interface FoodBankItem {
  id: string;
  name: string;
  brand: string | null;
  serving_size: string | null;
  photo_url: string | null;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  fiber: number | null;
  sodium: number | null;
  sugar: number | null;
  saturated_fat: number | null;
  usage_count: number;
  last_used_at: string | null;
  source: string;
  created_at: string;
}

interface NutritionAnalysis {
  name: string;
  brand?: string;
  serving_size?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  sodium?: number;
  sugar?: number;
  saturated_fat?: number;
}

export default function MeusAlimentosPage() {
  // Subscription
  const { plan, quota, isLoading: isPlanLoading } = useUserPlan();
  const { hasQuota } = useQuota(plan, quota);
  const [showPaywall, setShowPaywall] = useState(false);

  const [items, setItems] = useState<FoodBankItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Formulário manual
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualBrand, setManualBrand] = useState('');
  const [manualServingSize, setManualServingSize] = useState('');
  const [manualCalories, setManualCalories] = useState('');
  const [manualProtein, setManualProtein] = useState('');
  const [manualCarbs, setManualCarbs] = useState('');
  const [manualFat, setManualFat] = useState('');
  const [manualFiber, setManualFiber] = useState('');
  const [manualSodium, setManualSodium] = useState('');
  const [manualSugar, setManualSugar] = useState('');
  const [manualSaturatedFat, setManualSaturatedFat] = useState('');

  // Formulário com IA
  const [showAiForm, setShowAiForm] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [analyzedData, setAnalyzedData] = useState<NutritionAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [customName, setCustomName] = useState('');

  // Edição de alimento
  const [editingItem, setEditingItem] = useState<FoodBankItem | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Busca e expansão
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchItems();
  }, []);

  async function fetchItems() {
    try {
      const res = await api.get('/api/food-bank?order_by=usage_count');
      const json = await res.json();
      if (res.ok) {
        setItems(json.items || []);
      }
    } catch (e) {
      console.error('Erro ao buscar alimentos:', e);
    }
  }

  async function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const payload: any = {
        name: manualName,
        source: 'manual'
      };

      if (manualBrand) payload.brand = manualBrand;
      if (manualServingSize) payload.serving_size = manualServingSize;
      if (manualCalories) payload.calories = parseFloat(manualCalories);
      if (manualProtein) payload.protein = parseFloat(manualProtein);
      if (manualCarbs) payload.carbs = parseFloat(manualCarbs);
      if (manualFat) payload.fat = parseFloat(manualFat);
      if (manualFiber) payload.fiber = parseFloat(manualFiber);
      if (manualSodium) payload.sodium = parseFloat(manualSodium);
      if (manualSugar) payload.sugar = parseFloat(manualSugar);
      if (manualSaturatedFat) payload.saturated_fat = parseFloat(manualSaturatedFat);

      const res = await api.post('/api/food-bank', payload);
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || 'Erro ao salvar alimento');
      }

      setSuccess('Alimento cadastrado com sucesso!');
      setManualName('');
      setManualBrand('');
      setManualServingSize('');
      setManualCalories('');
      setManualProtein('');
      setManualCarbs('');
      setManualFat('');
      setManualFiber('');
      setManualSodium('');
      setManualSugar('');
      setManualSaturatedFat('');
      setShowManualForm(false);
      await fetchItems();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedImage(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  async function handleAnalyzeImage() {
    if (!selectedImage) return;

    setError(null);
    setAnalyzing(true);

    try {
      const formData = new FormData();
      formData.append('image', selectedImage);

      const res = await apiClient('/api/food-bank/analyze-label', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        // Se for 403, é bloqueio de plano
        if (res.status === 403) {
          setShowPaywall(true);
          return;
        }

        // Tenta fazer parse do JSON se possível, senão usa mensagem genérica
        let errorMessage = 'Erro ao analisar imagem';
        try {
          const json = await res.json();
          errorMessage = json.error || errorMessage;
        } catch {
          // Se não conseguir fazer parse (ex: erro 413 retorna HTML), usa mensagem baseada no status
          if (res.status === 413) {
            errorMessage = 'Imagem muito grande. Por favor, use uma imagem menor que 5MB.';
          } else {
            errorMessage = `Erro ao analisar imagem (${res.status})`;
          }
        }
        throw new Error(errorMessage);
      }

      const json = await res.json();

      const result = json.result;
      // Limitar casas decimais nos valores nutricionais
      if (result.calories) result.calories = parseFloat(result.calories.toFixed(2));
      if (result.protein) result.protein = parseFloat(result.protein.toFixed(2));
      if (result.carbs) result.carbs = parseFloat(result.carbs.toFixed(2));
      if (result.fat) result.fat = parseFloat(result.fat.toFixed(2));
      if (result.fiber) result.fiber = parseFloat(result.fiber.toFixed(2));
      if (result.sodium) result.sodium = parseFloat(result.sodium.toFixed(2));
      if (result.sugar) result.sugar = parseFloat(result.sugar.toFixed(2));
      if (result.saturated_fat) result.saturated_fat = parseFloat(result.saturated_fat.toFixed(2));

      setAnalyzedData(result);
      setCustomName(result.name || '');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleSaveAnalyzedData() {
    if (!analyzedData) return;

    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const payload: any = {
        name: customName || analyzedData.name,
        source: 'ai_analyzed'
      };

      if (analyzedData.brand) payload.brand = analyzedData.brand;
      if (analyzedData.serving_size) payload.serving_size = analyzedData.serving_size;
      if (analyzedData.calories) payload.calories = analyzedData.calories;
      if (analyzedData.protein) payload.protein = analyzedData.protein;
      if (analyzedData.carbs) payload.carbs = analyzedData.carbs;
      if (analyzedData.fat) payload.fat = analyzedData.fat;
      if (analyzedData.fiber) payload.fiber = analyzedData.fiber;
      if (analyzedData.sodium) payload.sodium = analyzedData.sodium;
      if (analyzedData.sugar) payload.sugar = analyzedData.sugar;
      if (analyzedData.saturated_fat) payload.saturated_fat = analyzedData.saturated_fat;

      const res = await api.post('/api/food-bank', payload);
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || 'Erro ao salvar alimento');
      }

      setSuccess('Alimento analisado e cadastrado com sucesso!');
      setShowAiForm(false);
      setSelectedImage(null);
      setImagePreview(null);
      setAnalyzedData(null);
      setCustomName('');
      await fetchItems();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleEditClick(item: FoodBankItem) {
    setEditingItem(item);
    setShowEditModal(true);
    setError(null);
    setSuccess(null);
  }

  async function handleSaveEdit() {
    if (!editingItem) return;

    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const payload: any = {
        id: editingItem.id,
        name: editingItem.name,
        brand: editingItem.brand || undefined,
        serving_size: editingItem.serving_size || undefined,
        calories: typeof editingItem.calories === 'number' ? editingItem.calories : undefined,
        protein: typeof editingItem.protein === 'number' ? editingItem.protein : undefined,
        carbs: typeof editingItem.carbs === 'number' ? editingItem.carbs : undefined,
        fat: typeof editingItem.fat === 'number' ? editingItem.fat : undefined,
        fiber: typeof editingItem.fiber === 'number' ? editingItem.fiber : undefined,
        sodium: typeof editingItem.sodium === 'number' ? editingItem.sodium : undefined,
        sugar: typeof editingItem.sugar === 'number' ? editingItem.sugar : undefined,
        saturated_fat: typeof editingItem.saturated_fat === 'number' ? editingItem.saturated_fat : undefined
      };

      const res = await api.patch('/api/food-bank', payload);
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || 'Erro ao atualizar alimento');
      }

      setSuccess('Alimento atualizado com sucesso!');
      setShowEditModal(false);
      setEditingItem(null);
      await fetchItems();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Tem certeza que deseja excluir "${name}"?`)) return;

    try {
      const res = await api.delete(`/api/food-bank?id=${id}`);

      if (res.ok) {
        setSuccess('Alimento excluído com sucesso!');
        await fetchItems();
      }
    } catch (err) {
      console.error('Erro ao deletar:', err);
    }
  }

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: 24 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 24 }}> Meus Alimentos</h1>

      {/* Paywall Modal */}
      <PaywallModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        feature="ocr_analysis"
        currentPlan={plan}
      />

      {/* Quota Card - Apenas para PREMIUM */}
      {hasQuota && quota && (
        <QuotaCard
          quotaType="ocr"
          used={quota.ocr_analyses.used}
          limit={quota.ocr_analyses.limit}
          percentage={quota.ocr_analyses.percentage}
          remaining={quota.ocr_analyses.remaining}
          resetDate={quota.resetDate}
        />
      )}

      {/* Mensagens */}
      {error && (
        <div style={{
          padding: 12,
          background: '#fee2e2',
          border: '2px solid #ef4444',
          borderRadius: 8,
          color: '#991b1b',
          marginBottom: 16
        }}>
           {error}
        </div>
      )}

      {success && (
        <div style={{
          padding: 12,
          background: '#d1fae5',
          border: '2px solid #10b981',
          borderRadius: 8,
          color: '#065f46',
          marginBottom: 16
        }}>
           {success}
        </div>
      )}

      {/* Botões de ação */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <button
          onClick={() => {
            setShowManualForm(!showManualForm);
            setShowAiForm(false);
          }}
          style={{
            flex: 1,
            padding: 16,
            background: showManualForm ? '#6b7280' : '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: 12,
            fontSize: 16,
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          {showManualForm ? ' Cancelar' : ' Cadastrar Manualmente'}
        </button>

        <button
          onClick={() => {
            setShowAiForm(!showAiForm);
            setShowManualForm(false);
          }}
          style={{
            flex: 1,
            padding: 16,
            background: showAiForm ? '#6b7280' : '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: 12,
            fontSize: 16,
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          {showAiForm ? ' Cancelar' : ' Analisar com IA'}
        </button>
      </div>

      {/* Formulário Manual */}
      {showManualForm && (
        <form onSubmit={handleManualSubmit} style={{
          background: 'white',
          border: '2px solid #e5e7eb',
          borderRadius: 16,
          padding: 24,
          marginBottom: 24
        }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}> Cadastro Manual</h2>

          <div style={{ display: 'grid', gap: 16 }}>
            {/* Nome, Marca e Porção - Grid responsivo unificado */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14 }}>
                  Nome do Alimento *
                </label>
                <input
                  type="text"
                  value={manualName}
                  onChange={e => setManualName(e.target.value)}
                  placeholder="Ex: Whey Protein"
                  required
                  style={{
                    width: '100%',
                    padding: 10,
                    fontSize: 15,
                    border: '2px solid #e5e7eb',
                    borderRadius: 8,
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14 }}>
                  Marca (opcional)
                </label>
                <input
                  type="text"
                  value={manualBrand}
                  onChange={e => setManualBrand(e.target.value)}
                  placeholder="Ex: Growth"
                  style={{
                    width: '100%',
                    padding: 10,
                    fontSize: 15,
                    border: '2px solid #e5e7eb',
                    borderRadius: 8,
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14 }}>
                  Porção (opcional)
                </label>
                <input
                  type="text"
                  value={manualServingSize}
                  onChange={e => setManualServingSize(e.target.value)}
                  placeholder="Ex: 30g, 1 scoop"
                  style={{
                    width: '100%',
                    padding: 10,
                    fontSize: 15,
                    border: '2px solid #e5e7eb',
                    borderRadius: 8,
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            <h3 style={{
              fontSize: 15,
              fontWeight: 700,
              marginTop: 20,
              marginBottom: 12,
              color: '#374151',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Macronutrientes
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 13 }}>
                  Calorias
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={manualCalories}
                  onChange={e => setManualCalories(e.target.value)}
                  placeholder="kcal"
                  style={{
                    width: '100%',
                    padding: 10,
                    fontSize: 15,
                    border: '2px solid #e5e7eb',
                    borderRadius: 8,
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 13 }}>
                  Proteína (g)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={manualProtein}
                  onChange={e => setManualProtein(e.target.value)}
                  placeholder="g"
                  style={{
                    width: '100%',
                    padding: 10,
                    fontSize: 15,
                    border: '2px solid #e5e7eb',
                    borderRadius: 8,
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 13 }}>
                  Carboidratos (g)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={manualCarbs}
                  onChange={e => setManualCarbs(e.target.value)}
                  placeholder="g"
                  style={{
                    width: '100%',
                    padding: 10,
                    fontSize: 15,
                    border: '2px solid #e5e7eb',
                    borderRadius: 8,
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 13 }}>
                  Gorduras (g)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={manualFat}
                  onChange={e => setManualFat(e.target.value)}
                  placeholder="g"
                  style={{
                    width: '100%',
                    padding: 10,
                    fontSize: 15,
                    border: '2px solid #e5e7eb',
                    borderRadius: 8,
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            <h3 style={{
              fontSize: 15,
              fontWeight: 700,
              marginTop: 20,
              marginBottom: 12,
              color: '#374151',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Detalhes Nutricionais <span style={{ fontSize: 12, color: '#9ca3af', fontWeight: 400 }}>(Opcional)</span>
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 13 }}>
                  Fibras (g)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={manualFiber}
                  onChange={e => setManualFiber(e.target.value)}
                  placeholder="g"
                  style={{
                    width: '100%',
                    padding: 10,
                    fontSize: 15,
                    border: '2px solid #e5e7eb',
                    borderRadius: 8,
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 13 }}>
                  Sódio (mg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={manualSodium}
                  onChange={e => setManualSodium(e.target.value)}
                  placeholder="mg"
                  style={{
                    width: '100%',
                    padding: 10,
                    fontSize: 15,
                    border: '2px solid #e5e7eb',
                    borderRadius: 8,
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 13 }}>
                  Açúcares (g)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={manualSugar}
                  onChange={e => setManualSugar(e.target.value)}
                  placeholder="g"
                  style={{
                    width: '100%',
                    padding: 10,
                    fontSize: 15,
                    border: '2px solid #e5e7eb',
                    borderRadius: 8,
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 13 }}>
                  Gord. Sat. (g)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={manualSaturatedFat}
                  onChange={e => setManualSaturatedFat(e.target.value)}
                  placeholder="g"
                  style={{
                    width: '100%',
                    padding: 10,
                    fontSize: 15,
                    border: '2px solid #e5e7eb',
                    borderRadius: 8,
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                marginTop: 20,
                padding: 14,
                background: loading ? '#9ca3af' : '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: 12,
                fontSize: 16,
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {loading ? ' Salvando...' : ' Salvar Alimento'}
            </button>
          </div>
        </form>
      )}

      {/* Formulário com IA */}
      {showAiForm && (
        <div style={{
          background: 'white',
          border: '2px solid #e5e7eb',
          borderRadius: 16,
          padding: 24,
          marginBottom: 24
        }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}> Analisar Tabela Nutricional com IA</h2>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            style={{ display: 'none' }}
          />

          {!imagePreview ? (
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                width: '100%',
                padding: 48,
                background: '#f3f4f6',
                border: '2px dashed #d1d5db',
                borderRadius: 12,
                fontSize: 16,
                fontWeight: 600,
                color: '#6b7280',
                cursor: 'pointer'
              }}
            >
               Selecionar Foto da Tabela Nutricional
            </button>
          ) : (
            <div>
              <img
                src={imagePreview}
                alt="Preview"
                style={{
                  width: '100%',
                  maxHeight: 300,
                  objectFit: 'contain',
                  borderRadius: 12,
                  marginBottom: 16
                }}
              />

              {!analyzedData ? (
                <button
                  onClick={handleAnalyzeImage}
                  disabled={analyzing}
                  style={{
                    width: '100%',
                    padding: 16,
                    background: analyzing ? '#9ca3af' : '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: 12,
                    fontSize: 16,
                    fontWeight: 600,
                    cursor: analyzing ? 'not-allowed' : 'pointer'
                  }}
                >
                  {analyzing ? ' Analisando...' : ' Analisar com IA'}
                </button>
              ) : (
                <div>
                  <div style={{
                    background: '#f3f4f6',
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 16
                  }}>
                    <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}> Revisar e Editar:</h3>

                    <div style={{ display: 'grid', gap: 16 }}>
                      {/* Nome, Marca e Porção - Grid responsivo unificado */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                        <div>
                          <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14, color: '#374151' }}>
                            Nome do Alimento *
                          </label>
                          <input
                            type="text"
                            value={customName}
                            onChange={e => setCustomName(e.target.value)}
                            placeholder="Ex: Whey Protein"
                            required
                            style={{
                              width: '100%',
                              padding: 10,
                              fontSize: 15,
                              border: '2px solid #d1d5db',
                              borderRadius: 8,
                              background: 'white',
                              boxSizing: 'border-box'
                            }}
                          />
                        </div>

                        <div>
                          <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14, color: '#374151' }}>
                            Marca
                          </label>
                          <input
                            type="text"
                            value={analyzedData.brand || ''}
                            onChange={e => setAnalyzedData({ ...analyzedData, brand: e.target.value })}
                            placeholder="Ex: Growth"
                            style={{
                              width: '100%',
                              padding: 10,
                              fontSize: 15,
                              border: '2px solid #d1d5db',
                              borderRadius: 8,
                              background: 'white',
                              boxSizing: 'border-box'
                            }}
                          />
                        </div>

                        <div>
                          <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14, color: '#374151' }}>
                            Porção
                          </label>
                          <input
                            type="text"
                            value={analyzedData.serving_size || ''}
                            onChange={e => setAnalyzedData({ ...analyzedData, serving_size: e.target.value })}
                            placeholder="Ex: 30g"
                            style={{
                              width: '100%',
                              padding: 10,
                              fontSize: 15,
                              border: '2px solid #d1d5db',
                              borderRadius: 8,
                              background: 'white',
                              boxSizing: 'border-box'
                            }}
                          />
                        </div>
                      </div>

                      {/* Seção de Macros Principais */}
                      <div>
                        <h4 style={{ fontSize: 14, fontWeight: 700, color: '#6b7280', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Macronutrientes
                        </h4>
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                          gap: 12
                        }}>
                          <div>
                            <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 13, color: '#374151' }}>
                              Calorias
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={analyzedData.calories || ''}
                              onChange={e => setAnalyzedData({ ...analyzedData, calories: e.target.value ? parseFloat(e.target.value) : undefined })}
                              placeholder="kcal"
                              style={{
                                width: '100%',
                                padding: 10,
                                fontSize: 15,
                                border: '2px solid #d1d5db',
                                borderRadius: 8,
                                background: 'white',
                                boxSizing: 'border-box'
                              }}
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 13, color: '#374151' }}>
                              Proteína (g)
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={analyzedData.protein || ''}
                              onChange={e => setAnalyzedData({ ...analyzedData, protein: e.target.value ? parseFloat(e.target.value) : undefined })}
                              placeholder="g"
                              style={{
                                width: '100%',
                                padding: 10,
                                fontSize: 15,
                                border: '2px solid #d1d5db',
                                borderRadius: 8,
                                background: 'white',
                                boxSizing: 'border-box'
                              }}
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 13, color: '#374151' }}>
                              Carboidratos (g)
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={analyzedData.carbs || ''}
                              onChange={e => setAnalyzedData({ ...analyzedData, carbs: e.target.value ? parseFloat(e.target.value) : undefined })}
                              placeholder="g"
                              style={{
                                width: '100%',
                                padding: 10,
                                fontSize: 15,
                                border: '2px solid #d1d5db',
                                borderRadius: 8,
                                background: 'white',
                                boxSizing: 'border-box'
                              }}
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 13, color: '#374151' }}>
                              Gorduras (g)
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={analyzedData.fat || ''}
                              onChange={e => setAnalyzedData({ ...analyzedData, fat: e.target.value ? parseFloat(e.target.value) : undefined })}
                              placeholder="g"
                              style={{
                                width: '100%',
                                padding: 10,
                                fontSize: 15,
                                border: '2px solid #d1d5db',
                                borderRadius: 8,
                                background: 'white',
                                boxSizing: 'border-box'
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Seção de Micronutrientes */}
                      <div>
                        <h4 style={{ fontSize: 14, fontWeight: 700, color: '#6b7280', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Detalhes Nutricionais
                        </h4>
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                          gap: 12
                        }}>
                          <div>
                            <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 13, color: '#374151' }}>
                              Fibras (g)
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={analyzedData.fiber || ''}
                              onChange={e => setAnalyzedData({ ...analyzedData, fiber: e.target.value ? parseFloat(e.target.value) : undefined })}
                              placeholder="g"
                              style={{
                                width: '100%',
                                padding: 10,
                                fontSize: 15,
                                border: '2px solid #d1d5db',
                                borderRadius: 8,
                                background: 'white',
                                boxSizing: 'border-box'
                              }}
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 13, color: '#374151' }}>
                              Sódio (mg)
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={analyzedData.sodium || ''}
                              onChange={e => setAnalyzedData({ ...analyzedData, sodium: e.target.value ? parseFloat(e.target.value) : undefined })}
                              placeholder="mg"
                              style={{
                                width: '100%',
                                padding: 10,
                                fontSize: 15,
                                border: '2px solid #d1d5db',
                                borderRadius: 8,
                                background: 'white',
                                boxSizing: 'border-box'
                              }}
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 13, color: '#374151' }}>
                              Açúcares (g)
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={analyzedData.sugar || ''}
                              onChange={e => setAnalyzedData({ ...analyzedData, sugar: e.target.value ? parseFloat(e.target.value) : undefined })}
                              placeholder="g"
                              style={{
                                width: '100%',
                                padding: 10,
                                fontSize: 15,
                                border: '2px solid #d1d5db',
                                borderRadius: 8,
                                background: 'white',
                                boxSizing: 'border-box'
                              }}
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 13, color: '#374151' }}>
                              Gord. Sat. (g)
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={analyzedData.saturated_fat || ''}
                              onChange={e => setAnalyzedData({ ...analyzedData, saturated_fat: e.target.value ? parseFloat(e.target.value) : undefined })}
                              placeholder="g"
                              style={{
                                width: '100%',
                                padding: 10,
                                fontSize: 15,
                                border: '2px solid #d1d5db',
                                borderRadius: 8,
                                background: 'white',
                                boxSizing: 'border-box'
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleSaveAnalyzedData}
                    disabled={loading || !customName.trim()}
                    style={{
                      width: '100%',
                      padding: 16,
                      background: loading || !customName.trim() ? '#9ca3af' : '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: 12,
                      fontSize: 16,
                      fontWeight: 600,
                      cursor: loading || !customName.trim() ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {loading ? ' Salvando...' : ' Salvar no Banco de Alimentos'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Listagem de Alimentos */}
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>
           Alimentos Cadastrados ({items.length})
        </h2>

        {/* Busca rápida */}
        {items.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder=" Buscar alimento..."
              style={{
                width: '100%',
                padding: 12,
                fontSize: 15,
                border: '2px solid #e5e7eb',
                borderRadius: 12,
                boxSizing: 'border-box'
              }}
            />
          </div>
        )}

        {items.length === 0 ? (
          <div style={{
            padding: 32,
            textAlign: 'center',
            color: '#9ca3af',
            border: '2px dashed #d1d5db',
            borderRadius: 12
          }}>
            Nenhum alimento cadastrado ainda
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {items
              .filter((item) =>
                item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (item.brand && item.brand.toLowerCase().includes(searchQuery.toLowerCase()))
              )
              .map((item) => {
                const isExpanded = expandedItemId === item.id;

                return (
                  <div
                    key={item.id}
                    style={{
                      background: 'white',
                      border: isExpanded ? '2px solid #2196F3' : '1px solid #e5e7eb',
                      borderRadius: 12,
                      overflow: 'hidden',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {/* Header clicável */}
                    <div
                      onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: 16,
                        cursor: 'pointer',
                        background: isExpanded ? '#f0f9ff' : 'white'
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 16, fontWeight: 600, color: '#1f2937' }}>
                          {item.name}
                          {item.source === 'ai_analyzed' && (
                            <span style={{ marginLeft: 8, fontSize: 14, color: '#10b981' }}></span>
                          )}
                        </div>
                        {item.brand && (
                          <div style={{ fontSize: 13, color: '#6b7280' }}>{item.brand}</div>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {item.calories && (
                          <span style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>
                            {parseFloat(item.calories.toString()).toFixed(0)} kcal
                          </span>
                        )}
                        <span style={{
                          fontSize: 14,
                          color: '#9ca3af',
                          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 0.2s ease'
                        }}>
                          
                        </span>
                      </div>
                    </div>

                    {/* Detalhes expandidos */}
                    {isExpanded && (
                      <div style={{ padding: '0 16px 16px', borderTop: '1px solid #e5e7eb' }}>
                        {item.serving_size && (
                          <div style={{ fontSize: 13, color: '#6b7280', marginTop: 12, marginBottom: 8 }}>
                            Porção: {item.serving_size}
                          </div>
                        )}

                        {/* Macros em grid */}
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))',
                          gap: 8,
                          marginTop: 12
                        }}>
                          {item.protein !== null && (
                            <div style={{ textAlign: 'center', padding: 8, background: '#fef3c7', borderRadius: 8 }}>
                              <div style={{ fontSize: 14, fontWeight: 700, color: '#d97706' }}>
                                {parseFloat(item.protein.toString()).toFixed(1)}g
                              </div>
                              <div style={{ fontSize: 11, color: '#92400e' }}>Proteína</div>
                            </div>
                          )}
                          {item.carbs !== null && (
                            <div style={{ textAlign: 'center', padding: 8, background: '#dbeafe', borderRadius: 8 }}>
                              <div style={{ fontSize: 14, fontWeight: 700, color: '#2563eb' }}>
                                {parseFloat(item.carbs.toString()).toFixed(1)}g
                              </div>
                              <div style={{ fontSize: 11, color: '#1e40af' }}>Carbos</div>
                            </div>
                          )}
                          {item.fat !== null && (
                            <div style={{ textAlign: 'center', padding: 8, background: '#fce7f3', borderRadius: 8 }}>
                              <div style={{ fontSize: 14, fontWeight: 700, color: '#db2777' }}>
                                {parseFloat(item.fat.toString()).toFixed(1)}g
                              </div>
                              <div style={{ fontSize: 11, color: '#9d174d' }}>Gordura</div>
                            </div>
                          )}
                          {item.fiber !== null && (
                            <div style={{ textAlign: 'center', padding: 8, background: '#d1fae5', borderRadius: 8 }}>
                              <div style={{ fontSize: 14, fontWeight: 700, color: '#059669' }}>
                                {parseFloat(item.fiber.toString()).toFixed(1)}g
                              </div>
                              <div style={{ fontSize: 11, color: '#047857' }}>Fibra</div>
                            </div>
                          )}
                        </div>

                        {/* Detalhes extras */}
                        {(item.sodium || item.sugar || item.saturated_fat) && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12, fontSize: 12, color: '#6b7280' }}>
                            {item.sodium && <span> {parseFloat(item.sodium.toString()).toFixed(0)}mg sódio</span>}
                            {item.sugar && <span> {parseFloat(item.sugar.toString()).toFixed(1)}g açúcar</span>}
                            {item.saturated_fat && <span> {parseFloat(item.saturated_fat.toString()).toFixed(1)}g gord.sat</span>}
                          </div>
                        )}

                        {item.usage_count > 0 && (
                          <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 8 }}>
                            Usado {item.usage_count}x
                          </div>
                        )}

                        {/* Botões de ação */}
                        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleEditClick(item); }}
                            style={{
                              flex: 1,
                              padding: '10px 12px',
                              background: '#dbeafe',
                              color: '#1e40af',
                              border: 'none',
                              borderRadius: 8,
                              cursor: 'pointer',
                              fontSize: 14,
                              fontWeight: 600
                            }}
                          >
                             Editar
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDelete(item.id, item.name); }}
                            style={{
                              flex: 1,
                              padding: '10px 12px',
                              background: '#fee2e2',
                              color: '#dc2626',
                              border: 'none',
                              borderRadius: 8,
                              cursor: 'pointer',
                              fontSize: 14,
                              fontWeight: 600
                            }}
                          >
                             Excluir
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            {/* Mensagem quando busca não encontra resultados */}
            {items.filter((item) =>
              item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              (item.brand && item.brand.toLowerCase().includes(searchQuery.toLowerCase()))
            ).length === 0 && searchQuery && (
              <div style={{
                padding: 24,
                textAlign: 'center',
                color: '#9ca3af',
                background: '#f9fafb',
                borderRadius: 12
              }}>
                Nenhum alimento encontrado para "{searchQuery}"
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal de Edição */}
      {showEditModal && editingItem && (
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
            maxWidth: 800,
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700 }}> Editar Alimento</h2>
              <button
                onClick={() => { setShowEditModal(false); setEditingItem(null); }}
                style={{
                  padding: 8,
                  background: 'transparent',
                  border: 'none',
                  fontSize: 24,
                  cursor: 'pointer',
                  color: '#666'
                }}
              >
                
              </button>
            </div>

            <div style={{ display: 'grid', gap: 16 }}>
              {/* Nome, Marca e Porção */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14 }}>
                    Nome do Alimento *
                  </label>
                  <input
                    type="text"
                    value={editingItem.name}
                    onChange={e => setEditingItem({ ...editingItem, name: e.target.value })}
                    placeholder="Ex: Whey Protein"
                    required
                    style={{
                      width: '100%',
                      padding: 10,
                      fontSize: 15,
                      border: '2px solid #e5e7eb',
                      borderRadius: 8,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14 }}>
                    Marca
                  </label>
                  <input
                    type="text"
                    value={editingItem.brand || ''}
                    onChange={e => setEditingItem({ ...editingItem, brand: e.target.value })}
                    placeholder="Ex: Growth"
                    style={{
                      width: '100%',
                      padding: 10,
                      fontSize: 15,
                      border: '2px solid #e5e7eb',
                      borderRadius: 8,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14 }}>
                    Porção
                  </label>
                  <input
                    type="text"
                    value={editingItem.serving_size || ''}
                    onChange={e => setEditingItem({ ...editingItem, serving_size: e.target.value })}
                    placeholder="Ex: 30g, 1 scoop"
                    style={{
                      width: '100%',
                      padding: 10,
                      fontSize: 15,
                      border: '2px solid #e5e7eb',
                      borderRadius: 8,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              {/* Macronutrientes */}
              <h3 style={{
                fontSize: 15,
                fontWeight: 700,
                marginTop: 20,
                marginBottom: 12,
                color: '#374151',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Macronutrientes
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 13 }}>
                    Calorias
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={editingItem.calories || ''}
                    onChange={e => setEditingItem({ ...editingItem, calories: e.target.value ? parseFloat(e.target.value) : null })}
                    placeholder="kcal"
                    style={{
                      width: '100%',
                      padding: 10,
                      fontSize: 15,
                      border: '2px solid #e5e7eb',
                      borderRadius: 8,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 13 }}>
                    Proteína (g)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={editingItem.protein || ''}
                    onChange={e => setEditingItem({ ...editingItem, protein: e.target.value ? parseFloat(e.target.value) : null })}
                    placeholder="g"
                    style={{
                      width: '100%',
                      padding: 10,
                      fontSize: 15,
                      border: '2px solid #e5e7eb',
                      borderRadius: 8,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 13 }}>
                    Carboidratos (g)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={editingItem.carbs || ''}
                    onChange={e => setEditingItem({ ...editingItem, carbs: e.target.value ? parseFloat(e.target.value) : null })}
                    placeholder="g"
                    style={{
                      width: '100%',
                      padding: 10,
                      fontSize: 15,
                      border: '2px solid #e5e7eb',
                      borderRadius: 8,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 13 }}>
                    Gorduras (g)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={editingItem.fat || ''}
                    onChange={e => setEditingItem({ ...editingItem, fat: e.target.value ? parseFloat(e.target.value) : null })}
                    placeholder="g"
                    style={{
                      width: '100%',
                      padding: 10,
                      fontSize: 15,
                      border: '2px solid #e5e7eb',
                      borderRadius: 8,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              {/* Micronutrientes */}
              <h3 style={{
                fontSize: 15,
                fontWeight: 700,
                marginTop: 20,
                marginBottom: 12,
                color: '#374151',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Detalhes Nutricionais
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 13 }}>
                    Fibras (g)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={editingItem.fiber || ''}
                    onChange={e => setEditingItem({ ...editingItem, fiber: e.target.value ? parseFloat(e.target.value) : null })}
                    placeholder="g"
                    style={{
                      width: '100%',
                      padding: 10,
                      fontSize: 15,
                      border: '2px solid #e5e7eb',
                      borderRadius: 8,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 13 }}>
                    Sódio (mg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={editingItem.sodium || ''}
                    onChange={e => setEditingItem({ ...editingItem, sodium: e.target.value ? parseFloat(e.target.value) : null })}
                    placeholder="mg"
                    style={{
                      width: '100%',
                      padding: 10,
                      fontSize: 15,
                      border: '2px solid #e5e7eb',
                      borderRadius: 8,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 13 }}>
                    Açúcares (g)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={editingItem.sugar || ''}
                    onChange={e => setEditingItem({ ...editingItem, sugar: e.target.value ? parseFloat(e.target.value) : null })}
                    placeholder="g"
                    style={{
                      width: '100%',
                      padding: 10,
                      fontSize: 15,
                      border: '2px solid #e5e7eb',
                      borderRadius: 8,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 13 }}>
                    Gord. Sat. (g)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={editingItem.saturated_fat || ''}
                    onChange={e => setEditingItem({ ...editingItem, saturated_fat: e.target.value ? parseFloat(e.target.value) : null })}
                    placeholder="g"
                    style={{
                      width: '100%',
                      padding: 10,
                      fontSize: 15,
                      border: '2px solid #e5e7eb',
                      borderRadius: 8,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                <button
                  onClick={() => { setShowEditModal(false); setEditingItem(null); }}
                  disabled={loading}
                  style={{
                    flex: 1,
                    padding: 14,
                    background: '#6b7280',
                    color: 'white',
                    border: 'none',
                    borderRadius: 12,
                    fontSize: 16,
                    fontWeight: 600,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.6 : 1
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={loading || !editingItem.name.trim()}
                  style={{
                    flex: 2,
                    padding: 14,
                    background: loading || !editingItem.name.trim() ? '#9ca3af' : '#2196F3',
                    color: 'white',
                    border: 'none',
                    borderRadius: 12,
                    fontSize: 16,
                    fontWeight: 600,
                    cursor: loading || !editingItem.name.trim() ? 'not-allowed' : 'pointer'
                  }}
                >
                  {loading ? ' Salvando...' : ' Salvar Alterações'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
