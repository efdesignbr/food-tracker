'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { PlanBadge, UpgradeButton, QuotaCard } from '@/components/subscription';
import { useUserPlan } from '@/hooks/useUserPlan';
import { useQuota } from '@/hooks/useQuota';
import { api } from '@/lib/api-client';
import { Capacitor } from '@capacitor/core';

type UserProfile = {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: string;
  goals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    water: number;
  };
  createdAt: string;
};

export default function AccountPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [goalCalories, setGoalCalories] = useState(2000);
  const [goalProtein, setGoalProtein] = useState(150);
  const [goalCarbs, setGoalCarbs] = useState(250);
  const [goalFat, setGoalFat] = useState(65);
  const [goalWater, setGoalWater] = useState(2000);

  // Expanded sections
  const [expandedSection, setExpandedSection] = useState<string | null>('plan');

  // Health goals state
  const [healthGoals, setHealthGoals] = useState<any>(null);
  const [loadingGoals, setLoadingGoals] = useState(false);

  // Delete account states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteAgreed, setDeleteAgreed] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Subscription hooks
  const { plan, quota, isLoading: planLoading } = useUserPlan();
  const { canUseFeature, getQuotaInfo, hasQuota } = useQuota(plan, quota);
  const [managingSub, setManagingSub] = useState(false);

  useEffect(() => {
    fetchProfile();
    fetchHealthGoals();
  }, []);

  async function fetchProfile() {
    try {
      setLoading(true);
      const res = await api.get('/api/user/profile');
      if (!res.ok) throw new Error('Erro ao carregar perfil');

      const data = await res.json();
      setProfile(data.user);

      // Populate form
      setName(data.user.name);
      setPhone(data.user.phone || '');
      setGoalCalories(data.user.goals.calories);
      setGoalProtein(data.user.goals.protein);
      setGoalCarbs(data.user.goals.carbs);
      setGoalFat(data.user.goals.fat);
      setGoalWater(data.user.goals.water || 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function fetchHealthGoals() {
    try {
      setLoadingGoals(true);
      const res = await api.get('/api/user/goals');
      if (!res.ok) return;

      const data = await res.json();
      setHealthGoals(data.goals);
    } catch (err) {
      console.error('Erro ao carregar objetivos:', err);
    } finally {
      setLoadingGoals(false);
    }
  }

  async function handleSavePersonal() {
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      const res = await api.patch('/api/user/profile', { name, phone: phone || null });

      if (!res.ok) throw new Error('Erro ao salvar dados');

      const data = await res.json();
      setProfile(data.user);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveGoals() {
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      const res = await api.patch('/api/user/profile', {
        goals: {
          calories: goalCalories,
          protein: goalProtein,
          carbs: goalCarbs,
          fat: goalFat,
          water: goalWater,
        },
      });

      if (!res.ok) throw new Error('Erro ao salvar metas');

      const data = await res.json();
      setProfile(data.user);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function toggleSection(section: string) {
    setExpandedSection(expandedSection === section ? null : section);
  }

  function openDeleteModal() {
    setShowDeleteModal(true);
    setShowDeleteConfirm(false);
    setDeletePassword('');
    setDeleteConfirmText('');
    setDeleteAgreed(false);
    setDeleteError(null);
  }

  function closeDeleteModal() {
    setShowDeleteModal(false);
    setShowDeleteConfirm(false);
    setDeletePassword('');
    setDeleteConfirmText('');
    setDeleteAgreed(false);
    setDeleteError(null);
  }

  function proceedToConfirmation() {
    setShowDeleteConfirm(true);
  }

  async function handleDeleteAccount() {
    if (!deletePassword || !deleteConfirmText || !deleteAgreed) {
      setDeleteError('Por favor, preencha todos os campos e confirme');
      return;
    }

    if (deleteConfirmText !== 'EXCLUIR') {
      setDeleteError('Digite exatamente: EXCLUIR');
      return;
    }

    try {
      setDeleting(true);
      setDeleteError(null);

      const res = await api.post('/api/account/delete', {
        password: deletePassword,
        confirmText: deleteConfirmText,
      });

      const data = await res.json();

      if (!res.ok) {
        setDeleteError(data.error || 'Erro ao excluir conta');
        setDeleting(false);
        return;
      }

      // Logout e redirecionar
      await signOut({ redirect: false });
      router.push('/signup?deleted=true');
    } catch (err: any) {
      setDeleteError('Erro ao excluir conta. Tente novamente.');
      setDeleting(false);
    }
  }

  // Abrir gerenciamento de assinatura para cancelar (voltar ao FREE)
  async function handleManageSubscription() {
    try {
      setManagingSub(true);
      const isMobile = Capacitor.isNativePlatform();

      if (isMobile) {
        try {
          const { Purchases } = await import('@revenuecat/purchases-capacitor');
          // Tenta abrir a tela nativa de gerenciamento de assinatura, se disponível
          const maybeFn: any = (Purchases as any).showManageSubscriptions;
          if (typeof maybeFn === 'function') {
            await maybeFn();
          } else {
            // Fallback: abre a página de assinaturas da Apple diretamente
            window.location.href = 'https://apps.apple.com/account/subscriptions';
          }

          // Ao retornar, sincroniza estado com RevenueCat
          try {
            const { Purchases } = await import('@revenuecat/purchases-capacitor');
            const { customerInfo } = await Purchases.getCustomerInfo();
            await api.post('/api/subscription/sync', { customerInfo });
          } catch (syncErr) {
            console.warn('[Account] Sync after manage subscription failed:', syncErr);
          }
        } catch (e) {
          console.error('[Account] Manage subscription error:', e);
        }
      } else {
        // Web: orientar o usuário e abrir página da Apple (irá abrir no navegador do sistema)
        window.open('https://apps.apple.com/account/subscriptions', '_blank');
      }

      // Atualiza UI
      await fetchProfile();
    } finally {
      setManagingSub(false);
    }
  }

  if (loading) {
    return (
      <div style={{ padding: 24, maxWidth: 800, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}></div>
          <p style={{ color: '#666', fontSize: 16 }}>Carregando...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div style={{ padding: 24, maxWidth: 800, margin: '0 auto' }}>
        <div style={{
          padding: 24,
          background: '#fee2e2',
          border: '2px solid #ef4444',
          borderRadius: 12,
          textAlign: 'center'
        }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}></div>
          <p style={{ color: '#991b1b', margin: 0 }}>{error || 'Perfil não encontrado'}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 16, maxWidth: 800, margin: '0 auto', paddingBottom: 80 }}>
      {/* Header */}
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 16 }}> Minha Conta</h1>

      {/* Success Message */}
      {success && (
        <div style={{
          padding: 16,
          background: '#d1fae5',
          border: '2px solid #10b981',
          borderRadius: 12,
          marginBottom: 16,
          color: '#065f46',
          fontWeight: 600
        }}>
           Dados salvos com sucesso!
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div style={{
          padding: 16,
          background: '#fee2e2',
          border: '2px solid #ef4444',
          borderRadius: 12,
          marginBottom: 16,
          color: '#991b1b',
          fontWeight: 600
        }}>
           {error}
        </div>
      )}

      {/* Accordion Sections */}
      <div style={{ display: 'grid', gap: 12 }}>
        {/* 0. Plano Atual */}
        <div style={{
          background: 'white',
          borderRadius: 16,
          overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          border: expandedSection === 'plan' ? '2px solid #8b5cf6' : '1px solid #e5e7eb'
        }}>
          <button
            onClick={() => toggleSection('plan')}
            style={{
              width: '100%',
              padding: 20,
              border: 'none',
              background: expandedSection === 'plan' ? '#f5f3ff' : 'white',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontWeight: 700,
              fontSize: 16,
              color: expandedSection === 'plan' ? '#8b5cf6' : '#374151'
            }}
          >
            <span>Plano Atual</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: expandedSection === 'plan' ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </button>

          {expandedSection === 'plan' && (
            <div style={{ padding: 20, borderTop: '1px solid #e5e7eb' }}>
              {planLoading ? (
                <div style={{ textAlign: 'center', padding: 32 }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}></div>
                  <p style={{ color: '#6b7280', fontSize: 14 }}>Carregando informações do plano...</p>
                </div>
              ) : (
                <div>
                  {/* Badge do Plano */}
                  <div style={{ marginBottom: 24, textAlign: 'center' }}>
                    <div style={{ marginBottom: 12 }}>
                      <PlanBadge plan={plan} size="lg" />
                    </div>
                    <p style={{ fontSize: 14, color: '#6b7280' }}>
                      {plan === 'free' && 'Plano gratuito com recursos básicos'}
                      {plan === 'premium' && 'Plano pago com recursos avançados'}
                      {plan === 'unlimited' && 'Acesso ilimitado a todos os recursos'}
                    </p>
                  </div>

                  {/* Conteúdo baseado no plano */}
                  {plan === 'free' && (
                    <div>
                      <div style={{
                        padding: 16,
                        background: '#fef3c7',
                        border: '2px solid #fbbf24',
                        borderRadius: 12,
                        marginBottom: 16
                      }}>
                        <p style={{ fontSize: 14, color: '#92400e', margin: 0, fontWeight: 600 }}>
                           Desbloqueie recursos premium como análise de fotos e OCR de nutrição!
                        </p>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <UpgradeButton currentPlan={plan} size="lg" />
                      </div>
                    </div>
                  )}

                  {plan === 'premium' && hasQuota && quota && (
                    <div>
                      <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: '#374151' }}>
                         Uso Mensal
                      </h3>
                      <div style={{ display: 'grid', gap: 12 }}>
                        <QuotaCard
                          quotaType="photo"
                          used={getQuotaInfo('photo').used}
                          limit={getQuotaInfo('photo').limit}
                          percentage={getQuotaInfo('photo').percentage}
                          remaining={getQuotaInfo('photo').remaining}
                          resetDate={quota.resetDate}
                        />
                        <QuotaCard
                          quotaType="ocr"
                          used={getQuotaInfo('ocr').used}
                          limit={getQuotaInfo('ocr').limit}
                          percentage={getQuotaInfo('ocr').percentage}
                          remaining={getQuotaInfo('ocr').remaining}
                          resetDate={quota.resetDate}
                        />
                        <QuotaCard
                          quotaType="text"
                          used={getQuotaInfo('text').used}
                          limit={getQuotaInfo('text').limit}
                          percentage={getQuotaInfo('text').percentage}
                          remaining={getQuotaInfo('text').remaining}
                          resetDate={quota.resetDate}
                        />
                      </div>

                      {/* Gerenciar assinatura (cancelar / voltar ao FREE) */}
                      <div style={{ marginTop: 16 }}>
                        <button
                          onClick={handleManageSubscription}
                          disabled={managingSub}
                          style={{
                            width: '100%',
                            padding: 12,
                            border: 'none',
                            background: managingSub ? '#9ca3af' : '#ef4444',
                            color: 'white',
                            borderRadius: 10,
                            fontWeight: 700,
                            fontSize: 14,
                            cursor: managingSub ? 'not-allowed' : 'pointer',
                            boxShadow: managingSub ? 'none' : '0 4px 12px rgba(239, 68, 68, 0.3)'
                          }}
                        >
                          {managingSub ? 'Abrindo gerenciamento…' : 'Cancelar assinatura (voltar ao FREE)'}
                        </button>
                        <p style={{ fontSize: 12, color: '#6b7280', marginTop: 8, textAlign: 'center' }}>
                          Você será redirecionado à App Store para gerenciar sua assinatura.
                        </p>
                      </div>
                    </div>
                  )}

                  {plan === 'unlimited' && (
                    <div style={{
                      padding: 20,
                      background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
                      borderRadius: 12,
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: 48, marginBottom: 8 }}></div>
                      <h3 style={{ fontSize: 18, fontWeight: 700, color: 'white', marginBottom: 8 }}>
                        Acesso Ilimitado
                      </h3>
                      <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.9)', margin: 0 }}>
                        Você tem acesso ilimitado a todos os recursos sem restrições
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 1. Objetivos de Saúde */}
        <div style={{
          background: 'white',
          borderRadius: 16,
          overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          border: expandedSection === 'health' ? '2px solid #f59e0b' : '1px solid #e5e7eb'
        }}>
          <button
            onClick={() => toggleSection('health')}
            style={{
              width: '100%',
              padding: 20,
              border: 'none',
              background: expandedSection === 'health' ? '#fffbeb' : 'white',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontWeight: 700,
              fontSize: 16,
              color: expandedSection === 'health' ? '#f59e0b' : '#374151'
            }}
          >
            <span>Objetivos de Saúde</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: expandedSection === 'health' ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </button>

          {expandedSection === 'health' && (
            <div style={{ padding: 20, borderTop: '1px solid #e5e7eb' }}>
              {loadingGoals ? (
                <div style={{ textAlign: 'center', padding: 32 }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}></div>
                  <p style={{ color: '#6b7280', fontSize: 14 }}>Carregando objetivos...</p>
                </div>
              ) : !healthGoals || !healthGoals.goal_type ? (
                <div>
                  <div style={{
                    padding: 16,
                    background: '#fef3c7',
                    border: '2px solid #fbbf24',
                    borderRadius: 12,
                    marginBottom: 16,
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}></div>
                    <p style={{ fontSize: 14, color: '#92400e', margin: '0 0 8px 0', fontWeight: 600 }}>
                      Configure seus objetivos de saúde
                    </p>
                    <p style={{ fontSize: 12, color: '#92400e', margin: 0 }}>
                      Defina seu objetivo, altura, idade e nível de atividade para receber análises personalizadas do Coach IA
                    </p>
                  </div>
                  <button
                    onClick={() => router.push('/objetivos')}
                    style={{
                      width: '100%',
                      padding: 14,
                      border: 'none',
                      background: '#f59e0b',
                      color: 'white',
                      borderRadius: 12,
                      fontWeight: 700,
                      fontSize: 16,
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
                    }}
                  >
                     Configurar Objetivos
                  </button>
                </div>
              ) : (
                <div>
                  <div style={{ display: 'grid', gap: 16, marginBottom: 20 }}>
                    {/* Objetivo Principal */}
                    <div style={{
                      padding: 16,
                      background: '#f0fdf4',
                      border: '2px solid #86efac',
                      borderRadius: 12
                    }}>
                      <div style={{ fontSize: 12, color: '#166534', fontWeight: 600, marginBottom: 4 }}>
                        OBJETIVO PRINCIPAL
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: '#15803d' }}>
                        {healthGoals.goal_type === 'lose_weight' && 'Perder Peso (Emagrecimento)'}
                        {healthGoals.goal_type === 'gain_weight' && 'Ganhar Peso (Ganho de Massa)'}
                        {healthGoals.goal_type === 'maintain_weight' && 'Manter Peso (Manutenção)'}
                      </div>
                      {healthGoals.target_weight_kg && (
                        <div style={{ fontSize: 13, color: '#166534', marginTop: 8 }}>
                          Peso alvo: <strong>{healthGoals.target_weight_kg} kg</strong>
                        </div>
                      )}
                      {healthGoals.weekly_goal_kg && (
                        <div style={{ fontSize: 13, color: '#166534', marginTop: 4 }}>
                          Meta semanal: <strong>{healthGoals.weekly_goal_kg > 0 ? '+' : ''}{healthGoals.weekly_goal_kg} kg/semana</strong>
                        </div>
                      )}
                    </div>

                    {/* Dados Pessoais */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                      <div>
                        <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 600, marginBottom: 4 }}>
                          ALTURA
                        </div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: '#374151' }}>
                          {healthGoals.height_cm} cm
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 600, marginBottom: 4 }}>
                          IDADE
                        </div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: '#374151' }}>
                          {healthGoals.age} anos
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 600, marginBottom: 4 }}>
                          GÊNERO
                        </div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: '#374151' }}>
                          {healthGoals.gender === 'male' && 'Masculino'}
                          {healthGoals.gender === 'female' && 'Feminino'}
                          {healthGoals.gender === 'other' && 'Outro'}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 600, marginBottom: 4 }}>
                          ATIVIDADE
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>
                          {healthGoals.activity_level === 'sedentary' && 'Sedentário'}
                          {healthGoals.activity_level === 'light' && 'Leve'}
                          {healthGoals.activity_level === 'moderate' && 'Moderado'}
                          {healthGoals.activity_level === 'active' && 'Ativo'}
                          {healthGoals.activity_level === 'very_active' && 'Muito Ativo'}
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => router.push('/objetivos')}
                    style={{
                      width: '100%',
                      padding: 14,
                      border: '2px solid #f59e0b',
                      background: 'white',
                      color: '#f59e0b',
                      borderRadius: 12,
                      fontWeight: 700,
                      fontSize: 16,
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#f59e0b';
                      e.currentTarget.style.color = 'white';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'white';
                      e.currentTarget.style.color = '#f59e0b';
                    }}
                  >
                     Editar Objetivos
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 1.5 Restricoes Alimentares */}
        <div style={{
          background: 'white',
          borderRadius: 16,
          overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          border: expandedSection === 'restrictions' ? '2px solid #ef4444' : '1px solid #e5e7eb'
        }}>
          <button
            onClick={() => toggleSection('restrictions')}
            style={{
              width: '100%',
              padding: 20,
              border: 'none',
              background: expandedSection === 'restrictions' ? '#fef2f2' : 'white',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontWeight: 700,
              fontSize: 16,
              color: expandedSection === 'restrictions' ? '#ef4444' : '#374151'
            }}
          >
            <span>Restricoes Alimentares</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: expandedSection === 'restrictions' ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </button>

          {expandedSection === 'restrictions' && (
            <div style={{ padding: 20, borderTop: '1px solid #e5e7eb' }}>
              <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 16 }}>
                Configure alergias, intolerancias, dietas e outras restricoes para receber recomendacoes personalizadas do Coach IA.
              </p>
              <button
                onClick={() => router.push('/restricoes')}
                style={{
                  width: '100%',
                  padding: 14,
                  border: 'none',
                  background: '#ef4444',
                  color: 'white',
                  borderRadius: 12,
                  fontWeight: 700,
                  fontSize: 16,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
                }}
              >
                Gerenciar Restricoes
              </button>
            </div>
          )}
        </div>

        {/* 2. Dados Pessoais */}
        <div style={{
          background: 'white',
          borderRadius: 16,
          overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          border: expandedSection === 'personal' ? '2px solid #2196F3' : '1px solid #e5e7eb'
        }}>
          <button
            onClick={() => toggleSection('personal')}
            style={{
              width: '100%',
              padding: 20,
              border: 'none',
              background: expandedSection === 'personal' ? '#f0f9ff' : 'white',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontWeight: 700,
              fontSize: 16,
              color: expandedSection === 'personal' ? '#2196F3' : '#374151'
            }}
          >
            <span>Dados Pessoais</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: expandedSection === 'personal' ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </button>

          {expandedSection === 'personal' && (
            <div style={{ padding: 20, borderTop: '1px solid #e5e7eb' }}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6, color: '#374151' }}>
                   Email
                </label>
                <input
                  type="email"
                  value={profile.email}
                  disabled
                  style={{
                    width: '100%',
                    padding: 12,
                    border: '1px solid #d1d5db',
                    borderRadius: 8,
                    fontSize: 14,
                    background: '#f9fafb',
                    color: '#6b7280',
                    cursor: 'not-allowed'
                  }}
                />
                <p style={{ fontSize: 12, color: '#6b7280', margin: '4px 0 0 0' }}>
                  Email não pode ser alterado
                </p>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6, color: '#374151' }}>
                   Nome
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: 12,
                    border: '2px solid #e5e7eb',
                    borderRadius: 8,
                    fontSize: 14,
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#2196F3'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6, color: '#374151' }}>
                   Telefone
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(11) 98765-4321"
                  style={{
                    width: '100%',
                    padding: 12,
                    border: '2px solid #e5e7eb',
                    borderRadius: 8,
                    fontSize: 14,
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#2196F3'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>

              <button
                onClick={handleSavePersonal}
                disabled={saving}
                style={{
                  width: '100%',
                  padding: 14,
                  border: 'none',
                  background: saving ? '#9ca3af' : '#2196F3',
                  color: 'white',
                  borderRadius: 12,
                  fontWeight: 700,
                  fontSize: 16,
                  cursor: saving ? 'not-allowed' : 'pointer',
                  boxShadow: saving ? 'none' : '0 4px 12px rgba(33, 150, 243, 0.3)'
                }}
              >
                {saving ? ' Salvando...' : ' Salvar Dados'}
              </button>
            </div>
          )}
        </div>

        {/* 3. Metas Diárias */}
        <div style={{
          background: 'white',
          borderRadius: 16,
          overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          border: expandedSection === 'goals' ? '2px solid #10b981' : '1px solid #e5e7eb'
        }}>
          <button
            onClick={() => toggleSection('goals')}
            style={{
              width: '100%',
              padding: 20,
              border: 'none',
              background: expandedSection === 'goals' ? '#f0fdf4' : 'white',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontWeight: 700,
              fontSize: 16,
              color: expandedSection === 'goals' ? '#10b981' : '#374151'
            }}
          >
            <span>Metas Diárias</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: expandedSection === 'goals' ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </button>

          {expandedSection === 'goals' && (
            <div style={{ padding: 20, borderTop: '1px solid #e5e7eb' }}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6, color: '#374151' }}>
                   Calorias (kcal)
                </label>
                <input
                  type="number"
                  value={goalCalories}
                  onChange={(e) => setGoalCalories(Number(e.target.value))}
                  min="500"
                  max="10000"
                  style={{
                    width: '100%',
                    padding: 12,
                    border: '2px solid #e5e7eb',
                    borderRadius: 8,
                    fontSize: 14,
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#10b981'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6, color: '#374151' }}>
                   Proteína (g)
                </label>
                <input
                  type="number"
                  value={goalProtein}
                  onChange={(e) => setGoalProtein(Number(e.target.value))}
                  min="0"
                  max="500"
                  style={{
                    width: '100%',
                    padding: 12,
                    border: '2px solid #e5e7eb',
                    borderRadius: 8,
                    fontSize: 14,
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#10b981'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6, color: '#374151' }}>
                   Carboidratos (g)
                </label>
                <input
                  type="number"
                  value={goalCarbs}
                  onChange={(e) => setGoalCarbs(Number(e.target.value))}
                  min="0"
                  max="1000"
                  style={{
                    width: '100%',
                    padding: 12,
                    border: '2px solid #e5e7eb',
                    borderRadius: 8,
                    fontSize: 14,
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#10b981'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6, color: '#374151' }}>
                  🧈 Gorduras (g)
                </label>
                <input
                  type="number"
                  value={goalFat}
                  onChange={(e) => setGoalFat(Number(e.target.value))}
                  min="0"
                  max="300"
                  style={{
                    width: '100%',
                    padding: 12,
                    border: '2px solid #e5e7eb',
                    borderRadius: 8,
                    fontSize: 14,
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#10b981'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6, color: '#374151' }}>
                   Água (ml)
                </label>
                <input
                  type="number"
                  value={goalWater}
                  onChange={(e) => setGoalWater(Number(e.target.value))}
                  min="500"
                  max="5000"
                  step="100"
                  style={{
                    width: '100%',
                    padding: 12,
                    border: '2px solid #e5e7eb',
                    borderRadius: 8,
                    fontSize: 14,
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#10b981'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
                <p style={{ fontSize: 12, color: '#6b7280', margin: '4px 0 0 0' }}>
                  Meta diária de hidratação (ex: 2000ml = 8 copos)
                </p>
              </div>

              <button
                onClick={handleSaveGoals}
                disabled={saving}
                style={{
                  width: '100%',
                  padding: 14,
                  border: 'none',
                  background: saving ? '#9ca3af' : '#10b981',
                  color: 'white',
                  borderRadius: 12,
                  fontWeight: 700,
                  fontSize: 16,
                  cursor: saving ? 'not-allowed' : 'pointer',
                  boxShadow: saving ? 'none' : '0 4px 12px rgba(16, 185, 129, 0.3)'
                }}
              >
                {saving ? ' Salvando...' : ' Salvar Metas'}
              </button>
            </div>
          )}
        </div>

        {/* 4. Informações da Conta */}
        <div style={{
          background: 'white',
          borderRadius: 16,
          overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          border: expandedSection === 'info' ? '2px solid #6366f1' : '1px solid #e5e7eb'
        }}>
          <button
            onClick={() => toggleSection('info')}
            style={{
              width: '100%',
              padding: 20,
              border: 'none',
              background: expandedSection === 'info' ? '#f5f3ff' : 'white',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontWeight: 700,
              fontSize: 16,
              color: expandedSection === 'info' ? '#6366f1' : '#374151'
            }}
          >
            <span>Informações da Conta</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: expandedSection === 'info' ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </button>

          {expandedSection === 'info' && (
            <div style={{ padding: 20, borderTop: '1px solid #e5e7eb' }}>
              <div style={{ display: 'grid', gap: 12 }}>
                <div>
                  <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase' }}>
                    Perfil
                  </span>
                  <p style={{ fontSize: 14, color: '#374151', margin: '4px 0 0 0', fontWeight: 600 }}>
                    {profile.role === 'owner' ? ' Proprietário' : profile.role === 'admin' ? ' Administrador' : ' Membro'}
                  </p>
                </div>
                <div>
                  <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase' }}>
                    Cadastrado em
                  </span>
                  <p style={{ fontSize: 14, color: '#374151', margin: '4px 0 0 0' }}>
                    {new Date(profile.createdAt).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 5. Zona de Perigo - Excluir Conta */}
        <div style={{
          background: 'white',
          borderRadius: 16,
          overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          border: expandedSection === 'danger' ? '2px solid #ef4444' : '1px solid #e5e7eb'
        }}>
          <button
            onClick={() => toggleSection('danger')}
            style={{
              width: '100%',
              padding: 20,
              border: 'none',
              background: expandedSection === 'danger' ? '#fef2f2' : 'white',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontWeight: 700,
              fontSize: 16,
              color: expandedSection === 'danger' ? '#ef4444' : '#374151'
            }}
          >
            <span>Excluir Minha Conta</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: expandedSection === 'danger' ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </button>

          {expandedSection === 'danger' && (
            <div style={{ padding: 20, borderTop: '1px solid #e5e7eb' }}>
              <div style={{
                padding: 16,
                background: '#fef2f2',
                border: '2px solid #fca5a5',
                borderRadius: 12,
                marginBottom: 16
              }}>
                <p style={{ fontSize: 14, color: '#991b1b', margin: 0, fontWeight: 600 }}>
                   Atenção: Excluir sua conta é uma ação permanente e irreversível!
                </p>
              </div>

              <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 16, lineHeight: 1.6 }}>
                Ao excluir sua conta, os seguintes dados serão <strong>perdidos permanentemente</strong>:
              </p>

              <ul style={{ fontSize: 14, color: '#6b7280', marginBottom: 20, paddingLeft: 20 }}>
                <li>Todos os seus dados pessoais</li>
                <li>Todas as suas refeições registradas</li>
                <li>Todos os seus alimentos cadastrados</li>
                <li>Todo o histórico de água</li>
                <li>Suas metas e configurações</li>
              </ul>

              <button
                onClick={openDeleteModal}
                style={{
                  width: '100%',
                  padding: 14,
                  border: '2px solid #ef4444',
                  background: 'white',
                  color: '#ef4444',
                  borderRadius: 12,
                  fontWeight: 700,
                  fontSize: 16,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#ef4444';
                  e.currentTarget.style.color = 'white';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'white';
                  e.currentTarget.style.color = '#ef4444';
                }}
              >
                 Excluir minha conta permanentemente
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Confirmação - Passo 1 */}
      {showDeleteModal && !showDeleteConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 16
        }}>
          <div style={{
            background: 'white',
            borderRadius: 16,
            maxWidth: 500,
            width: '100%',
            padding: 32,
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }}>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: '#ef4444', marginBottom: 16 }}>
               Tem certeza absoluta?
            </h2>

            <p style={{ fontSize: 16, color: '#374151', marginBottom: 20, lineHeight: 1.6 }}>
              Esta ação irá <strong>deletar permanentemente</strong>:
            </p>

            <ul style={{ fontSize: 14, color: '#6b7280', marginBottom: 24, paddingLeft: 20 }}>
              <li> Todos os seus dados pessoais</li>
              <li> Todas as suas refeições registradas</li>
              <li> Todos os seus alimentos cadastrados</li>
              <li> Todo o histórico de água</li>
              <li> Suas metas e configurações</li>
            </ul>

            <div style={{
              padding: 16,
              background: '#fef2f2',
              border: '2px solid #fca5a5',
              borderRadius: 12,
              marginBottom: 24
            }}>
              <p style={{ fontSize: 14, color: '#991b1b', margin: 0, fontWeight: 700, textAlign: 'center' }}>
                 ESTA AÇÃO É IRREVERSÍVEL E PERMANENTE!
              </p>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={closeDeleteModal}
                style={{
                  flex: 1,
                  padding: 14,
                  border: '2px solid #e5e7eb',
                  background: 'white',
                  color: '#374151',
                  borderRadius: 12,
                  fontWeight: 700,
                  fontSize: 16,
                  cursor: 'pointer'
                }}
              >
                Cancelar
              </button>
              <button
                onClick={proceedToConfirmation}
                style={{
                  flex: 1,
                  padding: 14,
                  border: 'none',
                  background: '#ef4444',
                  color: 'white',
                  borderRadius: 12,
                  fontWeight: 700,
                  fontSize: 16,
                  cursor: 'pointer'
                }}
              >
                Sim, continuar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação - Passo 2 (Confirmação Final) */}
      {showDeleteModal && showDeleteConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 16
        }}>
          <div style={{
            background: 'white',
            borderRadius: 16,
            maxWidth: 500,
            width: '100%',
            padding: 32,
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }}>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: '#ef4444', marginBottom: 16 }}>
              🔐 Confirmação Final
            </h2>

            <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 20 }}>
              Para confirmar a exclusão permanente da sua conta, preencha os campos abaixo:
            </p>

            {deleteError && (
              <div style={{
                padding: 12,
                background: '#fef2f2',
                border: '2px solid #ef4444',
                borderRadius: 8,
                marginBottom: 16,
                color: '#991b1b',
                fontSize: 14,
                fontWeight: 600
              }}>
                 {deleteError}
              </div>
            )}

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6, color: '#374151' }}>
                Digite sua senha atual:
              </label>
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="Sua senha"
                disabled={deleting}
                style={{
                  width: '100%',
                  padding: 12,
                  border: '2px solid #e5e7eb',
                  borderRadius: 8,
                  fontSize: 14,
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6, color: '#374151' }}>
                Digite <strong>EXCLUIR</strong> (em maiúsculas):
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="EXCLUIR"
                disabled={deleting}
                style={{
                  width: '100%',
                  padding: 12,
                  border: '2px solid #e5e7eb',
                  borderRadius: 8,
                  fontSize: 14,
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 8,
                cursor: 'pointer',
                fontSize: 14,
                color: '#374151'
              }}>
                <input
                  type="checkbox"
                  checked={deleteAgreed}
                  onChange={(e) => setDeleteAgreed(e.target.checked)}
                  disabled={deleting}
                  style={{ marginTop: 2 }}
                />
                <span>
                  Entendo que perderei <strong>todos os meus dados permanentemente</strong> e que esta ação não pode ser desfeita.
                </span>
              </label>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={closeDeleteModal}
                disabled={deleting}
                style={{
                  flex: 1,
                  padding: 14,
                  border: '2px solid #e5e7eb',
                  background: 'white',
                  color: '#374151',
                  borderRadius: 12,
                  fontWeight: 700,
                  fontSize: 16,
                  cursor: deleting ? 'not-allowed' : 'pointer',
                  opacity: deleting ? 0.5 : 1
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleting || !deletePassword || !deleteConfirmText || !deleteAgreed}
                style={{
                  flex: 1,
                  padding: 14,
                  border: 'none',
                  background: (deleting || !deletePassword || !deleteConfirmText || !deleteAgreed) ? '#9ca3af' : '#ef4444',
                  color: 'white',
                  borderRadius: 12,
                  fontWeight: 700,
                  fontSize: 16,
                  cursor: (deleting || !deletePassword || !deleteConfirmText || !deleteAgreed) ? 'not-allowed' : 'pointer'
                }}
              >
                {deleting ? ' Excluindo...' : ' Excluir permanentemente'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
