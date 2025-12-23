'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';

interface UserGoals {
  goal_type?: string;
  height_cm?: number;
  age?: number;
  gender?: string;
  activity_level?: string;
  target_weight_kg?: number;
  weekly_goal_kg?: number;
  goal_calories?: number;
  goal_protein_g?: number;
  goal_carbs_g?: number;
  goal_fat_g?: number;
}

export default function ObjetivosPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState<UserGoals>({
    goal_type: '',
    height_cm: undefined,
    age: undefined,
    gender: '',
    activity_level: '',
    target_weight_kg: undefined,
    weekly_goal_kg: undefined,
  });

  useEffect(() => {
    fetchGoals();
  }, []);

  async function fetchGoals() {
    try {
      const res = await api.get('/api/user/goals');
      const data = await res.json();
      if (res.ok && data.goals) {
        setFormData(data.goals);
      }
    } catch (err) {
      console.error('Erro ao buscar objetivos:', err);
    } finally {
      setLoading(false);
    }
  }

  function handleChange(field: string, value: any) {
    setFormData(prev => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSaving(true);

    try {
      // Validações básicas
      if (!formData.goal_type) {
        throw new Error('Selecione um objetivo');
      }
      if (!formData.height_cm || formData.height_cm < 100 || formData.height_cm > 250) {
        throw new Error('Altura deve estar entre 100 e 250 cm');
      }
      if (!formData.age || formData.age < 10 || formData.age > 120) {
        throw new Error('Idade deve estar entre 10 e 120 anos');
      }
      if (!formData.gender) {
        throw new Error('Selecione o gênero');
      }
      if (!formData.activity_level) {
        throw new Error('Selecione o nível de atividade');
      }

      // Limpar dados antes de enviar (remover NaN, undefined, strings vazias)
      const cleanData: any = {
        goal_type: formData.goal_type,
        height_cm: formData.height_cm,
        age: formData.age,
        gender: formData.gender,
        activity_level: formData.activity_level,
      };

      // Adicionar campos opcionais apenas se forem números válidos
      if (formData.target_weight_kg && !isNaN(formData.target_weight_kg)) {
        cleanData.target_weight_kg = formData.target_weight_kg;
      }
      if (formData.weekly_goal_kg && !isNaN(formData.weekly_goal_kg)) {
        cleanData.weekly_goal_kg = formData.weekly_goal_kg;
      }

      const res = await api.post('/api/user/goals', cleanData);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao salvar objetivos');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/coach');
      }, 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div style={{ maxWidth: 800, margin: '0 auto', padding: 24 }}>
        <div style={{ textAlign: 'center', padding: 40 }}>
           Carregando...
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 24 }}>
      <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>
         Meus Objetivos
      </h1>
      <p style={{ fontSize: 16, color: '#6b7280', marginBottom: 24 }}>
        Configure seus objetivos para receber análises personalizadas do Coach IA
      </p>

      <form onSubmit={handleSubmit}>
        {/* Objetivo Principal */}
        <div style={{
          background: 'white',
          border: '2px solid #e5e7eb',
          borderRadius: 16,
          padding: 24,
          marginBottom: 24
        }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>
             Objetivo Principal
          </h2>

          <label style={{ display: 'block', marginBottom: 12, fontWeight: 600 }}>
            O que você deseja? *
          </label>
          <select
            value={formData.goal_type || ''}
            onChange={e => handleChange('goal_type', e.target.value)}
            required
            style={{
              width: '100%',
              padding: 12,
              fontSize: 16,
              border: '2px solid #e5e7eb',
              borderRadius: 8,
              marginBottom: 16
            }}
          >
            <option value="">Selecione...</option>
            <option value="lose_weight"> Perder Peso (Emagrecimento)</option>
            <option value="gain_weight"> Ganhar Peso (Ganho de Massa)</option>
            <option value="maintain_weight"> Manter Peso (Manutenção)</option>
          </select>

          {formData.goal_type && formData.goal_type !== 'maintain_weight' && (
            <>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
                Peso Alvo (kg)
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.target_weight_kg || ''}
                onChange={e => {
                  const val = parseFloat(e.target.value);
                  handleChange('target_weight_kg', isNaN(val) ? undefined : val);
                }}
                placeholder="Ex: 75.0"
                style={{
                  width: '100%',
                  padding: 12,
                  fontSize: 16,
                  border: '2px solid #e5e7eb',
                  borderRadius: 8,
                  marginBottom: 16
                }}
              />

              <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
                Meta Semanal (kg/semana)
              </label>
              <select
                value={formData.weekly_goal_kg || ''}
                onChange={e => {
                  const val = parseFloat(e.target.value);
                  handleChange('weekly_goal_kg', isNaN(val) ? undefined : val);
                }}
                style={{
                  width: '100%',
                  padding: 12,
                  fontSize: 16,
                  border: '2px solid #e5e7eb',
                  borderRadius: 8
                }}
              >
                <option value="">Selecione...</option>
                {formData.goal_type === 'lose_weight' ? (
                  <>
                    <option value="-0.25">-0.25 kg/semana (lento e sustentável)</option>
                    <option value="-0.5">-0.5 kg/semana (recomendado)</option>
                    <option value="-0.75">-0.75 kg/semana (agressivo)</option>
                    <option value="-1.0">-1.0 kg/semana (muito agressivo)</option>
                  </>
                ) : (
                  <>
                    <option value="0.25">+0.25 kg/semana (lean bulk)</option>
                    <option value="0.5">+0.5 kg/semana (recomendado)</option>
                    <option value="0.75">+0.75 kg/semana (bulk)</option>
                    <option value="1.0">+1.0 kg/semana (dirty bulk)</option>
                  </>
                )}
              </select>
            </>
          )}
        </div>

        {/* Dados Pessoais */}
        <div style={{
          background: 'white',
          border: '2px solid #e5e7eb',
          borderRadius: 16,
          padding: 24,
          marginBottom: 24
        }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>
             Dados Pessoais
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
                Altura (cm) *
              </label>
              <input
                type="number"
                value={formData.height_cm || ''}
                onChange={e => {
                  const val = parseInt(e.target.value);
                  handleChange('height_cm', isNaN(val) ? undefined : val);
                }}
                placeholder="Ex: 175"
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

            <div>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
                Idade (anos) *
              </label>
              <input
                type="number"
                value={formData.age || ''}
                onChange={e => {
                  const val = parseInt(e.target.value);
                  handleChange('age', isNaN(val) ? undefined : val);
                }}
                placeholder="Ex: 30"
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

            <div>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
                Gênero *
              </label>
              <select
                value={formData.gender || ''}
                onChange={e => handleChange('gender', e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: 12,
                  fontSize: 16,
                  border: '2px solid #e5e7eb',
                  borderRadius: 8
                }}
              >
                <option value="">Selecione...</option>
                <option value="male">Masculino</option>
                <option value="female">Feminino</option>
                <option value="other">Outro</option>
              </select>
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
              Nível de Atividade *
            </label>
            <select
              value={formData.activity_level || ''}
              onChange={e => handleChange('activity_level', e.target.value)}
              required
              style={{
                width: '100%',
                padding: 12,
                fontSize: 16,
                border: '2px solid #e5e7eb',
                borderRadius: 8
              }}
            >
              <option value="">Selecione...</option>
              <option value="sedentary">Sedentário (pouco ou nenhum exercício)</option>
              <option value="light">Leve (exercício 1-3 dias/semana)</option>
              <option value="moderate">Moderado (exercício 3-5 dias/semana)</option>
              <option value="active">Ativo (exercício 6-7 dias/semana)</option>
              <option value="very_active">Muito Ativo (exercício 2x/dia ou trabalho físico)</option>
            </select>
          </div>
        </div>

        {/* Mensagens */}
        {error && (
          <div style={{
            padding: 16,
            background: '#fee2e2',
            border: '2px solid #ef4444',
            borderRadius: 12,
            color: '#991b1b',
            marginBottom: 16
          }}>
             {error}
          </div>
        )}

        {success && (
          <div style={{
            padding: 16,
            background: '#d1fae5',
            border: '2px solid #10b981',
            borderRadius: 12,
            color: '#065f46',
            marginBottom: 16
          }}>
             Objetivos salvos com sucesso! Redirecionando...
          </div>
        )}

        {/* Botões */}
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            type="button"
            onClick={() => router.back()}
            style={{
              padding: '16px 24px',
              background: '#f3f4f6',
              color: '#374151',
              border: 'none',
              borderRadius: 12,
              fontSize: 16,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            style={{
              flex: 1,
              padding: '16px 24px',
              background: saving ? '#9ca3af' : '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: 12,
              fontSize: 16,
              fontWeight: 600,
              cursor: saving ? 'not-allowed' : 'pointer'
            }}
          >
            {saving ? ' Salvando...' : ' Salvar Objetivos'}
          </button>
        </div>
      </form>
    </div>
  );
}
