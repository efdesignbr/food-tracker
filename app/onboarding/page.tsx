'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';

interface OnboardingData {
  goal_type: string;
  height_cm: number | undefined;
  age: number | undefined;
  gender: string;
  activity_level: string;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [data, setData] = useState<OnboardingData>({
    goal_type: '',
    height_cm: undefined,
    age: undefined,
    gender: '',
    activity_level: '',
  });

  function handleChange(field: keyof OnboardingData, value: any) {
    setData(prev => ({ ...prev, [field]: value }));
  }

  function nextStep() {
    setStep(prev => prev + 1);
  }

  function prevStep() {
    setStep(prev => prev - 1);
  }

  async function handleFinish() {
    setError(null);
    setSaving(true);

    try {
      const res = await api.post('/api/user/goals', {
        goal_type: data.goal_type,
        height_cm: data.height_cm,
        age: data.age,
        gender: data.gender,
        activity_level: data.activity_level,
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || 'Erro ao salvar');
      }

      router.push('/');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setSaving(false);
    }
  }

  const totalSteps = 3;

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#f5f5f5'
    }}>
      {/* Progress bar */}
      <div style={{ padding: '24px 24px 0' }}>
        <div style={{
          display: 'flex',
          gap: 8,
          marginBottom: 8
        }}>
          {[1, 2, 3].map(i => (
            <div
              key={i}
              style={{
                flex: 1,
                height: 4,
                borderRadius: 2,
                backgroundColor: i <= step ? '#2196F3' : '#e0e0e0'
              }}
            />
          ))}
        </div>
        <p style={{ fontSize: 14, color: '#666', textAlign: 'center' }}>
          Passo {step} de {totalSteps}
        </p>
      </div>

      {/* Content */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24
      }}>
        <div style={{
          width: '100%',
          maxWidth: 400,
          backgroundColor: '#fff',
          borderRadius: 16,
          padding: 32,
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>

          {/* Step 1: Objetivo */}
          {step === 1 && (
            <>
              <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, textAlign: 'center' }}>
                Qual seu objetivo?
              </h1>
              <p style={{ fontSize: 14, color: '#666', marginBottom: 24, textAlign: 'center' }}>
                Isso nos ajuda a personalizar sua experiencia
              </p>

              <div style={{ display: 'grid', gap: 12 }}>
                {[
                  { value: 'lose_weight', label: 'Perder peso', icon: '⬇️' },
                  { value: 'maintain_weight', label: 'Manter peso', icon: '⚖️' },
                  { value: 'gain_weight', label: 'Ganhar massa', icon: '💪' },
                ].map(option => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      handleChange('goal_type', option.value);
                      nextStep();
                    }}
                    style={{
                      padding: 16,
                      fontSize: 16,
                      fontWeight: 600,
                      border: '2px solid #e5e7eb',
                      borderRadius: 12,
                      backgroundColor: 'white',
                      cursor: 'pointer',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12
                    }}
                  >
                    <span style={{ fontSize: 24 }}>{option.icon}</span>
                    {option.label}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Step 2: Dados pessoais */}
          {step === 2 && (
            <>
              <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, textAlign: 'center' }}>
                Seus dados
              </h1>
              <p style={{ fontSize: 14, color: '#666', marginBottom: 24, textAlign: 'center' }}>
                Informacoes basicas para calcular suas metas
              </p>

              <div style={{ display: 'grid', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                    Altura (cm)
                  </label>
                  <input
                    type="number"
                    placeholder="Ex: 175"
                    value={data.height_cm || ''}
                    onChange={e => handleChange('height_cm', parseInt(e.target.value) || undefined)}
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
                  <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                    Idade
                  </label>
                  <input
                    type="number"
                    placeholder="Ex: 30"
                    value={data.age || ''}
                    onChange={e => handleChange('age', parseInt(e.target.value) || undefined)}
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
                  <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                    Genero
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                    {[
                      { value: 'male', label: 'Masculino' },
                      { value: 'female', label: 'Feminino' },
                      { value: 'other', label: 'Outro' },
                    ].map(option => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => handleChange('gender', option.value)}
                        style={{
                          padding: 12,
                          fontSize: 14,
                          fontWeight: 600,
                          border: data.gender === option.value ? '2px solid #2196F3' : '2px solid #e5e7eb',
                          borderRadius: 8,
                          backgroundColor: data.gender === option.value ? '#e3f2fd' : 'white',
                          cursor: 'pointer'
                        }}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                <button
                  type="button"
                  onClick={prevStep}
                  style={{
                    padding: 12,
                    fontSize: 16,
                    fontWeight: 600,
                    border: '2px solid #e5e7eb',
                    borderRadius: 8,
                    backgroundColor: 'white',
                    cursor: 'pointer'
                  }}
                >
                  Voltar
                </button>
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={!data.height_cm || !data.age || !data.gender}
                  style={{
                    flex: 1,
                    padding: 12,
                    fontSize: 16,
                    fontWeight: 600,
                    border: 'none',
                    borderRadius: 8,
                    backgroundColor: (!data.height_cm || !data.age || !data.gender) ? '#ccc' : '#2196F3',
                    color: 'white',
                    cursor: (!data.height_cm || !data.age || !data.gender) ? 'not-allowed' : 'pointer'
                  }}
                >
                  Continuar
                </button>
              </div>
            </>
          )}

          {/* Step 3: Nivel de atividade */}
          {step === 3 && (
            <>
              <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, textAlign: 'center' }}>
                Nivel de atividade
              </h1>
              <p style={{ fontSize: 14, color: '#666', marginBottom: 24, textAlign: 'center' }}>
                Quanto voce se exercita por semana?
              </p>

              <div style={{ display: 'grid', gap: 12 }}>
                {[
                  { value: 'sedentary', label: 'Sedentario', desc: 'Pouco ou nenhum exercicio' },
                  { value: 'light', label: 'Leve', desc: '1-3 dias por semana' },
                  { value: 'moderate', label: 'Moderado', desc: '3-5 dias por semana' },
                  { value: 'active', label: 'Ativo', desc: '6-7 dias por semana' },
                  { value: 'very_active', label: 'Muito ativo', desc: '2x por dia ou trabalho fisico' },
                ].map(option => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleChange('activity_level', option.value)}
                    style={{
                      padding: 16,
                      fontSize: 16,
                      fontWeight: 600,
                      border: data.activity_level === option.value ? '2px solid #2196F3' : '2px solid #e5e7eb',
                      borderRadius: 12,
                      backgroundColor: data.activity_level === option.value ? '#e3f2fd' : 'white',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    <div>{option.label}</div>
                    <div style={{ fontSize: 12, fontWeight: 400, color: '#666', marginTop: 4 }}>
                      {option.desc}
                    </div>
                  </button>
                ))}
              </div>

              {error && (
                <div style={{
                  marginTop: 16,
                  padding: 12,
                  backgroundColor: '#fee2e2',
                  color: '#991b1b',
                  borderRadius: 8,
                  fontSize: 14
                }}>
                  {error}
                </div>
              )}

              <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                <button
                  type="button"
                  onClick={prevStep}
                  style={{
                    padding: 12,
                    fontSize: 16,
                    fontWeight: 600,
                    border: '2px solid #e5e7eb',
                    borderRadius: 8,
                    backgroundColor: 'white',
                    cursor: 'pointer'
                  }}
                >
                  Voltar
                </button>
                <button
                  type="button"
                  onClick={handleFinish}
                  disabled={!data.activity_level || saving}
                  style={{
                    flex: 1,
                    padding: 12,
                    fontSize: 16,
                    fontWeight: 600,
                    border: 'none',
                    borderRadius: 8,
                    backgroundColor: (!data.activity_level || saving) ? '#ccc' : '#10b981',
                    color: 'white',
                    cursor: (!data.activity_level || saving) ? 'not-allowed' : 'pointer'
                  }}
                >
                  {saving ? 'Salvando...' : 'Comecar a usar'}
                </button>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
