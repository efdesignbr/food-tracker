'use client';

import { useState } from 'react';

function nowSaoPauloLocalInput() {
  try {
    const f = new Intl.DateTimeFormat('sv-SE', {
      timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: false
    } as any);
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
  const [mode, setMode] = useState<'photo' | 'text'>('photo');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState('');
  const [mealType, setMealType] = useState('');
  const [analysis, setAnalysis] = useState<any | null>(null);
  const [consumedAt, setConsumedAt] = useState<string>(() => nowSaoPauloLocalInput());
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setPreviewUrl(URL.createObjectURL(f));
      setAnalysis(null);
      setError(null);
    }
  }

  async function analyzeImage() {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await fetch('/api/meals/analyze-image', { method: 'POST', body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erro ao analisar');
      setAnalysis(json.result);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function analyzeText() {
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const body: any = { description: text };
      if (mealType) body.meal_type = mealType;
      const res = await fetch('/api/meals/analyze-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erro ao analisar');
      setAnalysis(json.result);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function saveMeal() {
    if (!analysis) return;
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const payload: any = {
        meal_type: analysis.meal_type || 'lunch',
        consumed_at: new Date(consumedAt).toISOString(),
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
      let res: Response;
      if (file) {
        const fd = new FormData();
        fd.append('image', file);
        fd.append('payload', JSON.stringify(payload));
        res = await fetch('/api/meals/approve', { method: 'POST', body: fd });
      } else {
        res = await fetch('/api/meals/approve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erro ao salvar');
      setSuccess(true);
      // Limpar formulário
      setFile(null);
      setPreviewUrl(null);
      setText('');
      setAnalysis(null);
      setNotes('');
      setConsumedAt(nowSaoPauloLocalInput());
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

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, borderBottom: '2px solid #e5e7eb' }}>
        <button
          onClick={() => { setMode('photo'); setText(''); setAnalysis(null); }}
          style={{
            padding: '12px 24px',
            border: 'none',
            background: mode === 'photo' ? '#2196F3' : 'transparent',
            color: mode === 'photo' ? 'white' : '#666',
            fontWeight: 600,
            cursor: 'pointer',
            borderRadius: '8px 8px 0 0'
          }}
        >
          📷 Foto
        </button>
        <button
          onClick={() => { setMode('text'); setFile(null); setPreviewUrl(null); setAnalysis(null); }}
          style={{
            padding: '12px 24px',
            border: 'none',
            background: mode === 'text' ? '#2196F3' : 'transparent',
            color: mode === 'text' ? 'white' : '#666',
            fontWeight: 600,
            cursor: 'pointer',
            borderRadius: '8px 8px 0 0'
          }}
        >
          ✍️ Texto
        </button>
      </div>

      {/* Foto Mode */}
      {mode === 'photo' && (
        <div style={{ marginBottom: 32 }}>
          <div style={{
            border: '2px dashed #d1d5db',
            borderRadius: 16,
            padding: 32,
            textAlign: 'center',
            background: '#f9fafb'
          }}>
            {previewUrl ? (
              <div>
                <img src={previewUrl} alt="Preview" style={{ maxWidth: '100%', maxHeight: 300, borderRadius: 12, marginBottom: 16 }} />
                <button
                  onClick={() => { setFile(null); setPreviewUrl(null); setAnalysis(null); }}
                  style={{
                    padding: '8px 16px',
                    background: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: 8,
                    cursor: 'pointer'
                  }}
                >
                  🗑️ Remover
                </button>
              </div>
            ) : (
              <label style={{ cursor: 'pointer' }}>
                <div style={{ fontSize: 48, marginBottom: 8 }}>📸</div>
                <div style={{ fontSize: 16, color: '#666', marginBottom: 16 }}>
                  Toque para tirar uma foto ou selecionar da galeria
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
                <div style={{
                  display: 'inline-block',
                  padding: '12px 24px',
                  background: '#2196F3',
                  color: 'white',
                  borderRadius: 8,
                  fontWeight: 600
                }}>
                  Selecionar Foto
                </div>
              </label>
            )}
          </div>

          {file && !analysis && (
            <button
              onClick={analyzeImage}
              disabled={loading}
              style={{
                width: '100%',
                marginTop: 16,
                padding: 16,
                background: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: 12,
                fontSize: 16,
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1
              }}
            >
              {loading ? '🔄 Analisando...' : '✨ Analisar Foto'}
            </button>
          )}
        </div>
      )}

      {/* Texto Mode */}
      {mode === 'text' && (
        <div style={{ marginBottom: 32 }}>
          <textarea
            placeholder="Descreva sua refeição... Ex: Arroz, feijão, frango grelhado e salada"
            value={text}
            onChange={e => setText(e.target.value)}
            rows={5}
            style={{
              width: '100%',
              padding: 16,
              fontSize: 16,
              border: '2px solid #e5e7eb',
              borderRadius: 12,
              resize: 'vertical',
              fontFamily: 'inherit'
            }}
          />
          <select
            value={mealType}
            onChange={e => setMealType(e.target.value)}
            style={{
              width: '100%',
              marginTop: 12,
              padding: 16,
              fontSize: 16,
              border: '2px solid #e5e7eb',
              borderRadius: 12
            }}
          >
            <option value="">Tipo de refeição (opcional)</option>
            <option value="breakfast">☀️ Café da Manhã</option>
            <option value="lunch">🍽️ Almoço</option>
            <option value="dinner">🌙 Jantar</option>
            <option value="snack">🍿 Lanche</option>
          </select>

          {!analysis && (
            <button
              onClick={analyzeText}
              disabled={loading || !text.trim()}
              style={{
                width: '100%',
                marginTop: 16,
                padding: 16,
                background: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: 12,
                fontSize: 16,
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading || !text.trim() ? 0.6 : 1
              }}
            >
              {loading ? '🔄 Analisando...' : '✨ Analisar Texto'}
            </button>
          )}
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

      {/* Analysis Result */}
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
                {mealTypeLabels[analysis.meal_type] || 'Refeição'}
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontWeight: 600, fontSize: 16 }}>{food.name}</span>
                    <span style={{ color: '#666' }}>
                      {food.quantity} {food.unit}
                    </span>
                  </div>
                  {food.calories && (
                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 14, color: '#666' }}>
                      <span>🔥 {food.calories} kcal</span>
                      {food.protein_g && <span>🥩 {food.protein_g}g prot</span>}
                      {food.carbs_g && <span>🍚 {food.carbs_g}g carb</span>}
                      {food.fat_g && <span>🧈 {food.fat_g}g gord</span>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Approve Form */}
          <div style={{ display: 'grid', gap: 16 }}>
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
                  borderRadius: 8
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
                  borderRadius: 8
                }}
              />
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
    </div>
  );
}
