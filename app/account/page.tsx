'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

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

  // Expanded sections
  const [expandedSection, setExpandedSection] = useState<string | null>('personal');

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    try {
      setLoading(true);
      const res = await fetch('/api/user/profile');
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
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSavePersonal() {
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone: phone || null }),
      });

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

      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goals: {
            calories: goalCalories,
            protein: goalProtein,
            carbs: goalCarbs,
            fat: goalFat,
          },
        }),
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

  if (loading) {
    return (
      <div style={{ padding: 24, maxWidth: 800, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
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
          <div style={{ fontSize: 48, marginBottom: 8 }}>⚠️</div>
          <p style={{ color: '#991b1b', margin: 0 }}>{error || 'Perfil não encontrado'}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 16, maxWidth: 800, margin: '0 auto', paddingBottom: 80 }}>
      {/* Header */}
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 16 }}>⚙️ Minha Conta</h1>

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
          ✅ Dados salvos com sucesso!
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
          ⚠️ {error}
        </div>
      )}

      {/* Accordion Sections */}
      <div style={{ display: 'grid', gap: 12 }}>
        {/* 1. Dados Pessoais */}
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
            <span>👤 Dados Pessoais</span>
            <span style={{ fontSize: 20 }}>{expandedSection === 'personal' ? '▼' : '▶'}</span>
          </button>

          {expandedSection === 'personal' && (
            <div style={{ padding: 20, borderTop: '1px solid #e5e7eb' }}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6, color: '#374151' }}>
                  📧 Email
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
                  👤 Nome
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
                  📞 Telefone
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
                {saving ? '💾 Salvando...' : '💾 Salvar Dados'}
              </button>
            </div>
          )}
        </div>

        {/* 2. Metas Diárias */}
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
            <span>🎯 Metas Diárias</span>
            <span style={{ fontSize: 20 }}>{expandedSection === 'goals' ? '▼' : '▶'}</span>
          </button>

          {expandedSection === 'goals' && (
            <div style={{ padding: 20, borderTop: '1px solid #e5e7eb' }}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6, color: '#374151' }}>
                  🔥 Calorias (kcal)
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
                  🥩 Proteína (g)
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
                  🍚 Carboidratos (g)
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

              <div style={{ marginBottom: 20 }}>
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
                {saving ? '💾 Salvando...' : '💾 Salvar Metas'}
              </button>
            </div>
          )}
        </div>

        {/* 3. Informações da Conta */}
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
            <span>ℹ️ Informações da Conta</span>
            <span style={{ fontSize: 20 }}>{expandedSection === 'info' ? '▼' : '▶'}</span>
          </button>

          {expandedSection === 'info' && (
            <div style={{ padding: 20, borderTop: '1px solid #e5e7eb' }}>
              <div style={{ display: 'grid', gap: 12 }}>
                <div>
                  <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase' }}>
                    Perfil
                  </span>
                  <p style={{ fontSize: 14, color: '#374151', margin: '4px 0 0 0', fontWeight: 600 }}>
                    {profile.role === 'owner' ? '👑 Proprietário' : profile.role === 'admin' ? '🛡️ Administrador' : '👤 Membro'}
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
      </div>
    </div>
  );
}
