'use client';

import { useState, useEffect, useRef } from 'react';

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

  // Formulário com IA
  const [showAiForm, setShowAiForm] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [analyzedData, setAnalyzedData] = useState<NutritionAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchItems();
  }, []);

  async function fetchItems() {
    try {
      const res = await fetch('/api/food-bank?order_by=usage_count', {
        credentials: 'include',
        cache: 'no-store'
      });
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

      const res = await fetch('/api/food-bank', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include',
        cache: 'no-store'
      });

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

      const res = await fetch('/api/food-bank/analyze-label', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || 'Erro ao analisar imagem');
      }

      setAnalyzedData(json.result);
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
        name: analyzedData.name,
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

      const res = await fetch('/api/food-bank', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include'
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || 'Erro ao salvar alimento');
      }

      setSuccess('Alimento analisado e cadastrado com sucesso!');
      setShowAiForm(false);
      setSelectedImage(null);
      setImagePreview(null);
      setAnalyzedData(null);
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
      const res = await fetch(`/api/food-bank?id=${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

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
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 24 }}>🍎 Meus Alimentos</h1>

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
          ❌ {error}
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
          ✅ {success}
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
          {showManualForm ? '❌ Cancelar' : '✍️ Cadastrar Manualmente'}
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
          {showAiForm ? '❌ Cancelar' : '📸 Analisar com IA'}
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
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>✍️ Cadastro Manual</h2>

          <div style={{ display: 'grid', gap: 16 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
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
                  padding: 12,
                  fontSize: 16,
                  border: '2px solid #e5e7eb',
                  borderRadius: 8
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
                  Marca (opcional)
                </label>
                <input
                  type="text"
                  value={manualBrand}
                  onChange={e => setManualBrand(e.target.value)}
                  placeholder="Ex: Growth"
                  style={{
                    width: '100%',
                    padding: 12,
                    fontSize: 16,
                    border: '2px solid #e5e7eb',
                    borderRadius: 8
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
                  Porção (opcional)
                </label>
                <input
                  type="text"
                  value={manualServingSize}
                  onChange={e => setManualServingSize(e.target.value)}
                  placeholder="Ex: 30g, 1 scoop"
                  style={{
                    width: '100%',
                    padding: 12,
                    fontSize: 16,
                    border: '2px solid #e5e7eb',
                    borderRadius: 8
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
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
                    padding: 12,
                    fontSize: 16,
                    border: '2px solid #e5e7eb',
                    borderRadius: 8
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
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
                    padding: 12,
                    fontSize: 16,
                    border: '2px solid #e5e7eb',
                    borderRadius: 8
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
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
                    padding: 12,
                    fontSize: 16,
                    border: '2px solid #e5e7eb',
                    borderRadius: 8
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
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
                    padding: 12,
                    fontSize: 16,
                    border: '2px solid #e5e7eb',
                    borderRadius: 8
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: 16,
                background: loading ? '#9ca3af' : '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: 12,
                fontSize: 16,
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? '💾 Salvando...' : '✅ Salvar Alimento'}
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
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>📸 Analisar Tabela Nutricional com IA</h2>

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
              📷 Selecionar Foto da Tabela Nutricional
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
                  {analyzing ? '🔍 Analisando...' : '🤖 Analisar com IA'}
                </button>
              ) : (
                <div>
                  <div style={{
                    background: '#f3f4f6',
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 16
                  }}>
                    <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Resultado da Análise:</h3>
                    <div style={{ fontSize: 14, color: '#374151' }}>
                      <div><strong>Nome:</strong> {analyzedData.name}</div>
                      {analyzedData.brand && <div><strong>Marca:</strong> {analyzedData.brand}</div>}
                      {analyzedData.serving_size && <div><strong>Porção:</strong> {analyzedData.serving_size}</div>}
                      {analyzedData.calories && <div><strong>Calorias:</strong> {analyzedData.calories} kcal</div>}
                      {analyzedData.protein && <div><strong>Proteína:</strong> {analyzedData.protein}g</div>}
                      {analyzedData.carbs && <div><strong>Carboidratos:</strong> {analyzedData.carbs}g</div>}
                      {analyzedData.fat && <div><strong>Gorduras:</strong> {analyzedData.fat}g</div>}
                      {analyzedData.fiber && <div><strong>Fibras:</strong> {analyzedData.fiber}g</div>}
                      {analyzedData.sodium && <div><strong>Sódio:</strong> {analyzedData.sodium}mg</div>}
                      {analyzedData.sugar && <div><strong>Açúcar:</strong> {analyzedData.sugar}g</div>}
                    </div>
                  </div>

                  <button
                    onClick={handleSaveAnalyzedData}
                    disabled={loading}
                    style={{
                      width: '100%',
                      padding: 16,
                      background: loading ? '#9ca3af' : '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: 12,
                      fontSize: 16,
                      fontWeight: 600,
                      cursor: loading ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {loading ? '💾 Salvando...' : '✅ Salvar no Banco de Alimentos'}
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
          📋 Alimentos Cadastrados ({items.length})
        </h2>

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
            {items.map((item) => (
              <div
                key={item.id}
                style={{
                  background: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: 12,
                  padding: 16
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#1f2937', marginBottom: 4 }}>
                      {item.name}
                      {item.source === 'ai_analyzed' && (
                        <span style={{ marginLeft: 8, fontSize: 14, color: '#10b981' }}>🤖</span>
                      )}
                    </div>
                    {item.brand && (
                      <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 4 }}>
                        Marca: {item.brand}
                      </div>
                    )}
                    {item.serving_size && (
                      <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 8 }}>
                        Porção: {item.serving_size}
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: 16, fontSize: 14, color: '#374151' }}>
                      {item.calories && <span>⚡ {item.calories} kcal</span>}
                      {item.protein && <span>🥩 {item.protein}g prot</span>}
                      {item.carbs && <span>🍞 {item.carbs}g carb</span>}
                      {item.fat && <span>🥑 {item.fat}g gord</span>}
                    </div>
                    {item.usage_count > 0 && (
                      <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 8 }}>
                        Usado {item.usage_count}x
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => handleDelete(item.id, item.name)}
                    style={{
                      padding: '8px 12px',
                      background: '#fee2e2',
                      color: '#dc2626',
                      border: 'none',
                      borderRadius: 8,
                      cursor: 'pointer',
                      fontSize: 14,
                      fontWeight: 600
                    }}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
