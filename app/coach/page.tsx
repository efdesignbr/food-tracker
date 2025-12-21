'use client';

import { useState, useEffect } from 'react';
import { useUserPlan } from '@/hooks/useUserPlan';
import { PaywallModal } from '@/components/subscription';
import { PLAN_LIMITS } from '@/lib/constants';
import { api } from '@/lib/api-client';

interface CoachAnalysis {
  id?: string;
  analysisText: string;
  recommendations: string[];
  insights: string[];
  warnings: string[];
  analysis_date?: string;
}

export default function CoachPage() {
  const { plan, isLoading: isPlanLoading } = useUserPlan();
  const [showPaywall, setShowPaywall] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [hasGoals, setHasGoals] = useState(false);
  const [loadingGoals, setLoadingGoals] = useState(true);
  const [analysis, setAnalysis] = useState<CoachAnalysis | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHistory();
    fetchGoals();
  }, []);

  async function fetchGoals() {
    try {
      const res = await api.get('/api/user/goals');
      const data = await res.json();
      if (res.ok && data.goals && data.goals.goal_type) {
        setHasGoals(true);
      }
    } catch (err) {
      console.error('Erro ao buscar objetivos:', err);
    } finally {
      setLoadingGoals(false);
    }
  }

  async function fetchHistory() {
    try {
      setLoadingHistory(true);
      const res = await api.get('/api/coach/history');
      const data = await res.json();
      if (res.ok) {
        setHistory(data.analyses || []);
        if (data.analyses.length > 0) {
          // Mostrar última análise automaticamente
          setAnalysis({
            analysisText: data.analyses[0].analysis_text,
            recommendations: data.analyses[0].recommendations,
            insights: data.analyses[0].insights,
            warnings: data.analyses[0].warnings,
            analysis_date: data.analyses[0].analysis_date
          });
        }
      }
    } catch (err) {
      console.error('Erro ao buscar histórico:', err);
    } finally {
      setLoadingHistory(false);
    }
  }

  async function handleAnalyze() {
    // Verificar se o plano permite uso do Coach IA
    if (!PLAN_LIMITS[plan].coach_ai) {
      setShowPaywall(true);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/api/coach/analyze', {});
      const data = await res.json();

      if (!res.ok) {
        // Se retornar 403, é bloqueio de plano
        if (res.status === 403 && data.error === 'upgrade_required') {
          setShowPaywall(true);
          return;
        }
        throw new Error(data.message || data.error || 'Erro ao analisar');
      }

      if (res.ok && data.analysis) {
        setAnalysis(data.analysis);
        await fetchHistory(); // Atualizar histórico
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Verificar se há dados suficientes para análise
  const hasMinimumData = !loadingHistory && (history.length > 0 || !analysis);
  const canUseCoach = PLAN_LIMITS[plan].coach_ai;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 24 }}>
      {/* Paywall Modal */}
      <PaywallModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        feature="coach_analysis"
        currentPlan={plan}
      />

      <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 24 }}>
        🤖 Coach IA
      </h1>

      {/* Loading inicial */}
      {isPlanLoading && (
        <div style={{
          background: '#f9fafb',
          border: '2px solid #e5e7eb',
          borderRadius: 16,
          padding: 32,
          textAlign: 'center',
          marginBottom: 24
        }}>
          <div style={{ fontSize: 16, color: '#6b7280' }}>
            ⏳ Carregando informações...
          </div>
        </div>
      )}

      {/* Aviso: Configurar objetivos */}
      {!isPlanLoading && !loadingGoals && !hasGoals && canUseCoach && (
        <div style={{
          background: '#fffbeb',
          border: '2px solid #fbbf24',
          borderRadius: 16,
          padding: 24,
          marginBottom: 24
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
            <div style={{ fontSize: 32 }}>⚙️</div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, color: '#92400e' }}>
                Configure seus objetivos primeiro
              </h3>
              <p style={{ fontSize: 15, color: '#92400e', marginBottom: 16 }}>
                Para receber análises personalizadas e relevantes, você precisa definir seus objetivos (perder/ganhar/manter peso), altura, idade e nível de atividade.
              </p>
              <a
                href="/objetivos"
                style={{
                  display: 'inline-block',
                  padding: '12px 24px',
                  background: '#fbbf24',
                  color: '#92400e',
                  borderRadius: 8,
                  fontWeight: 600,
                  textDecoration: 'none'
                }}
              >
                🎯 Configurar Objetivos Agora
              </a>
            </div>
          </div>
        </div>
      )}

      {/* CTA */}
      {!isPlanLoading && (
        <div style={{
          background: canUseCoach
            ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            : 'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)',
          color: 'white',
          borderRadius: 16,
          padding: 32,
          marginBottom: 32,
          textAlign: 'center',
          position: 'relative'
        }}>
          {!canUseCoach && (
            <div style={{
              position: 'absolute',
              top: 16,
              right: 16,
              background: '#fbbf24',
              color: '#92400e',
              padding: '6px 12px',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 700
            }}>
              🔒 PREMIUM
            </div>
          )}
          <div style={{ fontSize: 48, marginBottom: 16 }}>
            {canUseCoach ? '🎯' : '🔒'}
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>
            {canUseCoach ? 'Análise Personalizada' : 'Recurso Premium'}
          </h2>
          <p style={{ fontSize: 16, marginBottom: 24, opacity: 0.9 }}>
            {canUseCoach
              ? 'Receba insights baseados no seu peso, medidas e alimentação'
              : 'Desbloqueie o Coach IA e receba análises personalizadas ilimitadas'}
          </p>
          <button
            onClick={canUseCoach ? handleAnalyze : () => setShowPaywall(true)}
            disabled={loading || (canUseCoach && loadingHistory)}
            style={{
              padding: '16px 32px',
              background: 'white',
              color: canUseCoach ? '#667eea' : '#64748b',
              border: 'none',
              borderRadius: 12,
              fontSize: 16,
              fontWeight: 700,
              cursor: (loading || loadingHistory) ? 'not-allowed' : 'pointer',
              opacity: (loading || loadingHistory) ? 0.7 : 1
            }}
          >
            {loading
              ? '⏳ Analisando...'
              : canUseCoach
                ? '🚀 Analisar Agora'
                : '🔓 Desbloquear Premium'}
          </button>
        </div>
      )}

      {/* Empty state - Dados insuficientes */}
      {!isPlanLoading && !loadingHistory && !analysis && history.length === 0 && !error && canUseCoach && (
        <div style={{
          background: '#fffbeb',
          border: '2px solid #fbbf24',
          borderRadius: 16,
          padding: 32,
          textAlign: 'center',
          marginBottom: 24
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
          <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, color: '#92400e' }}>
            Dados insuficientes para análise
          </h3>
          <p style={{ fontSize: 16, color: '#92400e', marginBottom: 24 }}>
            Para receber insights personalizados, você precisa ter registrado:
          </p>
          <ul style={{
            listStyle: 'none',
            padding: 0,
            margin: '0 auto',
            maxWidth: 400,
            textAlign: 'left'
          }}>
            <li style={{ padding: '8px 0', fontSize: 15, color: '#92400e' }}>
              📊 Peso atual
            </li>
            <li style={{ padding: '8px 0', fontSize: 15, color: '#92400e' }}>
              📏 Medidas corporais (cintura, quadril, etc.)
            </li>
            <li style={{ padding: '8px 0', fontSize: 15, color: '#92400e' }}>
              🍽️ Refeições recentes
            </li>
          </ul>
          <div style={{ marginTop: 24, display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a
              href="/peso"
              style={{
                padding: '12px 24px',
                background: '#fbbf24',
                color: '#92400e',
                borderRadius: 8,
                fontWeight: 600,
                textDecoration: 'none',
                display: 'inline-block'
              }}
            >
              Registrar Peso/Medidas
            </a>
            <a
              href="/capture"
              style={{
                padding: '12px 24px',
                background: '#fbbf24',
                color: '#92400e',
                borderRadius: 8,
                fontWeight: 600,
                textDecoration: 'none',
                display: 'inline-block'
              }}
            >
              Registrar Refeição
            </a>
          </div>
        </div>
      )}

      {/* Loading skeleton durante análise */}
      {loading && (
        <div style={{
          background: '#f9fafb',
          border: '2px solid #e5e7eb',
          borderRadius: 16,
          padding: 32,
          marginBottom: 24
        }}>
          <div style={{ marginBottom: 24 }}>
            <div style={{
              height: 20,
              background: '#e5e7eb',
              borderRadius: 4,
              marginBottom: 12,
              animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
            }} />
            <div style={{
              height: 20,
              background: '#e5e7eb',
              borderRadius: 4,
              width: '80%',
              animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
            }} />
          </div>
          <div style={{ fontSize: 14, color: '#6b7280', textAlign: 'center' }}>
            🤖 Analisando seus dados e gerando insights...
          </div>
        </div>
      )}

      {/* Erro */}
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

      {/* Resultado */}
      {analysis && (
        <div>
          {/* Data da análise */}
          {analysis.analysis_date && (
            <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 16 }}>
              📅 Análise de {new Date(analysis.analysis_date).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          )}

          {/* Alertas (se houver) */}
          {analysis.warnings && analysis.warnings.length > 0 && (
            <div style={{
              background: '#fef2f2',
              border: '2px solid #ef4444',
              borderRadius: 16,
              padding: 24,
              marginBottom: 24
            }}>
              <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16, color: '#ef4444' }}>
                ⚠️ Alertas Importantes
              </h3>
              <ul style={{ paddingLeft: 20, margin: 0 }}>
                {analysis.warnings.map((warning: string, i: number) => (
                  <li key={i} style={{ fontSize: 16, marginBottom: 12, color: '#991b1b' }}>
                    {warning}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Análise Geral */}
          <div style={{
            background: 'white',
            border: '2px solid #e5e7eb',
            borderRadius: 16,
            padding: 24,
            marginBottom: 24
          }}>
            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>
              📊 Análise Geral
            </h3>
            <div style={{ fontSize: 16, lineHeight: 1.8, color: '#374151', whiteSpace: 'pre-wrap' }}>
              {analysis.analysisText}
            </div>
          </div>

          {/* Insights */}
          {analysis.insights && analysis.insights.length > 0 && (
            <div style={{
              background: 'white',
              border: '2px solid #3b82f6',
              borderRadius: 16,
              padding: 24,
              marginBottom: 24
            }}>
              <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16, color: '#3b82f6' }}>
                💡 Insights Identificados
              </h3>
              <ul style={{ paddingLeft: 20, margin: 0 }}>
                {analysis.insights.map((insight: string, i: number) => (
                  <li key={i} style={{ fontSize: 16, marginBottom: 12, color: '#374151' }}>
                    {insight}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recomendações */}
          {analysis.recommendations && analysis.recommendations.length > 0 && (
            <div style={{
              background: 'white',
              border: '2px solid #10b981',
              borderRadius: 16,
              padding: 24,
              marginBottom: 24
            }}>
              <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16, color: '#10b981' }}>
                ✅ Recomendações Práticas
              </h3>
              <ul style={{ paddingLeft: 20, margin: 0 }}>
                {analysis.recommendations.map((rec: string, i: number) => (
                  <li key={i} style={{ fontSize: 16, marginBottom: 12, color: '#374151' }}>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Histórico */}
      {history.length > 1 && (
        <div style={{
          background: 'white',
          border: '2px solid #e5e7eb',
          borderRadius: 16,
          padding: 24,
          marginTop: 32
        }}>
          <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>
            📜 Histórico de Análises
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {history.slice(1).map((h, i) => (
              <button
                key={i}
                onClick={() => setAnalysis({
                  analysisText: h.analysis_text,
                  recommendations: h.recommendations,
                  insights: h.insights,
                  warnings: h.warnings,
                  analysis_date: h.analysis_date
                })}
                style={{
                  padding: 16,
                  background: '#f9fafb',
                  border: '2px solid #e5e7eb',
                  borderRadius: 12,
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: 14
                }}
              >
                📅 {new Date(h.analysis_date).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
