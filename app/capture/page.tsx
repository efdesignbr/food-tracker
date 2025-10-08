'use client';

import { useState, useMemo } from 'react';

async function compressToWebP(file: File, maxSize = 1024, quality = 0.7): Promise<Blob> {
  const img = document.createElement('img');
  img.src = URL.createObjectURL(file);
  await img.decode();
  const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob>((resolve) => canvas.toBlob(b => resolve(b!), 'image/webp', quality));
  return blob;
}

function nowSaoPauloLocalInput() {
  try {
    const f = new Intl.DateTimeFormat('sv-SE', {
      timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: false
    } as any);
    const parts = f.formatToParts(new Date());
    const get = (t: string) => parts.find(p => p.type === t)?.value || '';
    const s = `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`;
    return s;
  } catch {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
}

export default function CapturePage() {
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState('');
  const [mealType, setMealType] = useState('');
  const [analysis, setAnalysis] = useState<any | null>(null);
  const [consumedAt, setConsumedAt] = useState<string>(() => nowSaoPauloLocalInput());
  const [notes, setNotes] = useState('');

  async function onSubmit(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    if (!file) return;
    setLoading(true);
    setMessage(null);
    try {
      const compressed = await compressToWebP(file);
      const fd = new FormData();
      fd.append('image', new File([compressed], 'meal.webp', { type: 'image/webp' }));
      const res = await fetch('/api/meals/analyze-image', { method: 'POST', body: fd });
      const json = await res.json();
      setAnalysis(json.result || null);
      setMessage(JSON.stringify(json, null, 2));
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function onAnalyzeText(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    if (!text.trim()) return;
    setLoading(true);
    setMessage(null);
    try {
      const body: any = { description: text };
      if (mealType) body.meal_type = mealType;
      const res = await fetch('/api/meals/analyze-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const json = await res.json();
      setAnalysis(json.result || null);
      setMessage(JSON.stringify(json, null, 2));
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function onApprove(ev: React.FormEvent) {
    ev.preventDefault();
    if (!analysis) return;
    setLoading(true);
    setMessage(null);
    try {
      const payload: any = {
        meal_type: analysis.meal_type || mealType || 'lunch',
        consumed_at: new Date(consumedAt).toISOString(),
        notes: notes || analysis.notes || '',
        foods: (analysis.foods || []).map((f: any) => ({
          name: f.name,
          quantity: Number(f.quantity)||1,
          unit: f.unit || 'un',
          calories: typeof f.calories==='number'? f.calories : undefined,
          protein_g: typeof f.protein_g==='number'? f.protein_g : undefined,
          carbs_g: typeof f.carbs_g==='number'? f.carbs_g : undefined,
          fat_g: typeof f.fat_g==='number'? f.fat_g : undefined,
          fiber_g: typeof f.fiber_g==='number'? f.fiber_g : undefined,
          sodium_mg: typeof f.sodium_mg==='number'? f.sodium_mg : undefined,
          sugar_g: typeof f.sugar_g==='number'? f.sugar_g : undefined
        }))
      };
      let res: Response;
      if (file) {
        const fd = new FormData();
        // re-comprime para webp
        const compressed = await compressToWebP(file);
        fd.append('image', new File([compressed], 'meal.webp', { type: 'image/webp' }));
        fd.append('payload', JSON.stringify(payload));
        res = await fetch('/api/meals/approve', { method: 'POST', body: fd, credentials: 'include' as RequestCredentials });
      } else {
        res = await fetch('/api/meals/approve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          credentials: 'include' as RequestCredentials
        });
      }
      const json = await res.json();
      setMessage(JSON.stringify(json, null, 2));
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ padding: 24, fontFamily: 'system-ui, -apple-system' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700 }}>Capturar Refeição</h1>

      <section style={{ marginTop: 16, padding: 12, border: '1px solid #eee', borderRadius: 8 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Analisar por Imagem</h2>
        <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12 }}>
          <input type="file" accept="image/*" onChange={e => setFile(e.target.files?.[0] || null)} />
          <button type="submit" disabled={!file || loading}>
            {loading ? 'Analisando…' : 'Analisar Imagem'}
          </button>
        </form>
      </section>

      <section style={{ marginTop: 16, padding: 12, border: '1px solid #eee', borderRadius: 8 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Analisar por Texto</h2>
        <form onSubmit={onAnalyzeText} style={{ display: 'grid', gap: 12 }}>
          <textarea placeholder="Descreva sua refeição (ex.: arroz, feijão e frango)" value={text} onChange={e => setText(e.target.value)} rows={4} />
          <select value={mealType} onChange={e => setMealType(e.target.value)}>
            <option value="">Tipo (opcional)</option>
            <option value="breakfast">Café da manhã</option>
            <option value="lunch">Almoço</option>
            <option value="dinner">Jantar</option>
            <option value="snack">Lanche</option>
          </select>
          <button type="submit" disabled={loading}>
            {loading ? 'Analisando…' : 'Analisar Texto'}
          </button>
        </form>
      </section>

      {analysis && (
        <section style={{ marginTop: 16, padding: 12, border: '1px solid #eee', borderRadius: 8 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Aprovar e Salvar</h2>
          <form onSubmit={onApprove} style={{ display: 'grid', gap: 12 }}>
            <label>
              Quando foi consumido:
              <input type="datetime-local" value={consumedAt} onChange={e => setConsumedAt(e.target.value)} />
            </label>
            <label>
              Observações:
              <input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Opcional" />
            </label>
            <button type="submit" disabled={loading}>{loading ? 'Salvando…' : 'Aprovar'}</button>
            <small>Dica: precisa estar logado para salvar. Use /login.</small>
          </form>
        </section>
      )}
      {message && (
        <pre style={{ marginTop: 16, background: '#f6f6f6', padding: 12, overflow: 'auto' }}>{message}</pre>
      )}
    </main>
  );
}
