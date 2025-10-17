'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface WeightLog {
  id: string;
  weight: number;
  log_date: string;
  log_time: string;
  notes: string | null;
  created_at: string;
}

export default function WeightPage() {
  const [weight, setWeight] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [logs, setLogs] = useState<WeightLog[]>([]);
  const [latest, setLatest] = useState<WeightLog | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchLogs();
    fetchLatest();
  }, []);

  async function fetchLatest() {
    try {
      const res = await fetch('/api/weight?latest=true', {
        credentials: 'include',
        cache: 'no-store'
      });
      const json = await res.json();
      if (res.ok && json.weightLog) {
        setLatest(json.weightLog);
      }
    } catch (e) {
      console.error('Erro ao buscar último peso:', e);
    }
  }

  async function fetchLogs() {
    try {
      const res = await fetch('/api/weight', {
        credentials: 'include',
        cache: 'no-store'
      });
      const json = await res.json();
      if (res.ok) {
        setLogs(json.logs || []);
      }
    } catch (e) {
      console.error('Erro ao buscar registros:', e);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    try {
      const weightNum = parseFloat(weight);
      if (isNaN(weightNum) || weightNum <= 0) {
        setError('Peso inválido');
        return;
      }

      const now = new Date();
      const logDate = now.toISOString().split('T')[0];
      const logTime = now.toTimeString().split(' ')[0];

      const res = await fetch('/api/weight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weight: weightNum,
          log_date: logDate,
          log_time: logTime,
          notes: notes || undefined
        }),
        credentials: 'include',
        cache: 'no-store'
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || 'Erro ao salvar peso');
      }

      setSuccess(true);
      setWeight('');
      setNotes('');
      await fetchLogs();
      await fetchLatest();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja excluir este registro?')) return;

    try {
      const res = await fetch(`/api/weight?id=${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (res.ok) {
        await fetchLogs();
        await fetchLatest();
      }
    } catch (err) {
      console.error('Erro ao deletar:', err);
    }
  }

  const weightDiff = latest && logs.length > 1
    ? (parseFloat(weight || latest.weight.toString()) - latest.weight).toFixed(1)
    : null;

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 24 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 24 }}>⚖️ Registro de Peso</h1>

      {/* Último peso registrado */}
      {latest && (
        <div style={{
          background: '#dbeafe',
          border: '2px solid #3b82f6',
          borderRadius: 12,
          padding: 16,
          marginBottom: 24
        }}>
          <div style={{ fontSize: 14, color: '#1e40af', marginBottom: 4 }}>Último registro</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#1e40af' }}>
            {latest.weight} kg
          </div>
          <div style={{ fontSize: 12, color: '#60a5fa' }}>
            {new Date(latest.log_date).toLocaleDateString('pt-BR')} às {latest.log_time}
          </div>
        </div>
      )}

      {/* Formulário */}
      <form onSubmit={handleSubmit} style={{
        background: 'white',
        border: '2px solid #e5e7eb',
        borderRadius: 16,
        padding: 24,
        marginBottom: 24
      }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Novo Registro</h2>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
            ⚖️ Peso (kg) *
          </label>
          <input
            type="number"
            step="0.1"
            value={weight}
            onChange={e => setWeight(e.target.value)}
            placeholder="Ex: 75.5"
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

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
            📝 Observações (opcional)
          </label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Ex: Após o almoço, com roupa..."
            rows={3}
            style={{
              width: '100%',
              padding: 12,
              fontSize: 16,
              border: '2px solid #e5e7eb',
              borderRadius: 8,
              resize: 'vertical',
              fontFamily: 'inherit'
            }}
          />
        </div>

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
            ✅ Peso registrado com sucesso!
          </div>
        )}

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
          {loading ? '💾 Salvando...' : '✅ Salvar Peso'}
        </button>
      </form>

      {/* Timeline de Evolução */}
      {logs.length > 1 && (
        <div style={{
          background: 'white',
          border: '2px solid #e5e7eb',
          borderRadius: 16,
          padding: 24,
          marginBottom: 24
        }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>📈 Evolução do Peso</h2>

          <div style={{ position: 'relative', paddingLeft: 40 }}>
            {/* Linha vertical da timeline */}
            <div style={{
              position: 'absolute',
              left: 16,
              top: 0,
              bottom: 0,
              width: 2,
              background: 'linear-gradient(to bottom, #3b82f6, #10b981)'
            }} />

            {logs.map((log, index) => {
              const prevLog = logs[index + 1];
              const diff = prevLog ? (log.weight - prevLog.weight) : 0;
              const isGain = diff > 0;
              const isLoss = diff < 0;
              const isFirst = index === 0;

              return (
                <div
                  key={log.id}
                  style={{
                    position: 'relative',
                    marginBottom: index === logs.length - 1 ? 0 : 24,
                    paddingLeft: 32
                  }}
                >
                  {/* Bolinha na timeline */}
                  <div style={{
                    position: 'absolute',
                    left: 7,
                    top: 8,
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    background: isFirst ? '#3b82f6' : (isLoss ? '#10b981' : isGain ? '#ef4444' : '#6b7280'),
                    border: '3px solid white',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    zIndex: 1
                  }} />

                  {/* Conteúdo */}
                  <div style={{
                    background: isFirst ? '#eff6ff' : 'white',
                    border: `2px solid ${isFirst ? '#3b82f6' : '#e5e7eb'}`,
                    borderRadius: 12,
                    padding: 16
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: 8
                    }}>
                      <div>
                        <div style={{
                          fontSize: 28,
                          fontWeight: 700,
                          color: isFirst ? '#1e40af' : '#1f2937',
                          marginBottom: 4
                        }}>
                          {log.weight} kg
                        </div>
                        <div style={{ fontSize: 14, color: '#6b7280' }}>
                          {new Date(log.log_date).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric'
                          })} às {log.log_time}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {!isFirst && diff !== 0 && (
                          <div style={{
                            padding: '6px 12px',
                            background: isLoss ? '#d1fae5' : '#fee2e2',
                            color: isLoss ? '#065f46' : '#991b1b',
                            borderRadius: 8,
                            fontSize: 14,
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4
                          }}>
                            {isLoss ? '↓' : '↑'} {Math.abs(diff).toFixed(1)} kg
                          </div>
                        )}
                        {isFirst && (
                          <div style={{
                            padding: '6px 12px',
                            background: '#dbeafe',
                            color: '#1e40af',
                            borderRadius: 8,
                            fontSize: 12,
                            fontWeight: 600
                          }}>
                            Mais recente
                          </div>
                        )}
                        <button
                          onClick={() => handleDelete(log.id)}
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

                    {log.notes && (
                      <div style={{
                        fontSize: 14,
                        color: '#6b7280',
                        marginTop: 8,
                        fontStyle: 'italic',
                        padding: 12,
                        background: '#f9fafb',
                        borderRadius: 8,
                        borderLeft: '3px solid #d1d5db'
                      }}>
                        💬 {log.notes}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Estatísticas no final */}
            {logs.length > 1 && (
              <div style={{
                marginTop: 24,
                padding: 16,
                background: '#f9fafb',
                borderRadius: 12,
                border: '2px dashed #d1d5db'
              }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#6b7280', marginBottom: 12 }}>
                  📊 Resumo do período
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 12, color: '#9ca3af' }}>Variação total</div>
                    <div style={{
                      fontSize: 20,
                      fontWeight: 700,
                      color: logs[0].weight - logs[logs.length - 1].weight < 0 ? '#10b981' : '#ef4444'
                    }}>
                      {(logs[0].weight - logs[logs.length - 1].weight > 0 ? '+' : '')}
                      {(logs[0].weight - logs[logs.length - 1].weight).toFixed(1)} kg
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: '#9ca3af' }}>Peso inicial</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#6b7280' }}>
                      {logs[logs.length - 1].weight} kg
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: '#9ca3af' }}>Peso atual</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#1e40af' }}>
                      {logs[0].weight} kg
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Histórico Compacto */}
      {logs.length === 0 && (
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>📊 Histórico</h2>
          <div style={{
            padding: 32,
            textAlign: 'center',
            color: '#9ca3af',
            border: '2px dashed #d1d5db',
            borderRadius: 12
          }}>
            Nenhum registro encontrado
          </div>
        </div>
      )}
    </div>
  );
}
