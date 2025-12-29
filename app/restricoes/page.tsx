'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';
import {
  RESTRICTION_TYPES,
  PREDEFINED_RESTRICTIONS,
  SEVERITY_LEVELS,
  RestrictionType,
  Severity,
  DietaryRestriction
} from '@/lib/constants/dietary-restrictions';

type TabType = RestrictionType;

export default function RestricoesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [restrictions, setRestrictions] = useState<DietaryRestriction[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('allergy');
  const [error, setError] = useState<string | null>(null);

  // Modal para adicionar restricao customizada
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customValue, setCustomValue] = useState('');
  const [customSeverity, setCustomSeverity] = useState<Severity>('moderate');

  // Modal para editar severidade (alergias)
  const [showSeverityModal, setShowSeverityModal] = useState(false);
  const [editingRestriction, setEditingRestriction] = useState<DietaryRestriction | null>(null);
  const [editSeverity, setEditSeverity] = useState<Severity>('moderate');

  useEffect(() => {
    fetchRestrictions();
  }, []);

  async function fetchRestrictions() {
    try {
      setLoading(true);
      const res = await api.get('/api/dietary-restrictions');
      const json = await res.json();
      if (res.ok) {
        setRestrictions(json.restrictions || []);
      }
    } catch (e) {
      console.error('Erro ao buscar restricoes:', e);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddRestriction(value: string, severity?: Severity) {
    try {
      setSaving(true);
      const res = await api.post('/api/dietary-restrictions', {
        restriction_type: activeTab,
        restriction_value: value,
        severity: severity || (activeTab === 'allergy' ? 'moderate' : undefined)
      });

      if (res.ok) {
        await fetchRestrictions();
      }
    } catch (e) {
      console.error('Erro ao adicionar restricao:', e);
    } finally {
      setSaving(false);
    }
  }

  async function handleRemoveRestriction(id: string) {
    try {
      setSaving(true);
      const res = await api.delete(`/api/dietary-restrictions?id=${id}`);
      if (res.ok) {
        setRestrictions(prev => prev.filter(r => r.id !== id));
      }
    } catch (e) {
      console.error('Erro ao remover restricao:', e);
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateSeverity() {
    if (!editingRestriction) return;

    try {
      setSaving(true);
      const res = await api.patch('/api/dietary-restrictions', {
        id: editingRestriction.id,
        severity: editSeverity
      });

      if (res.ok) {
        await fetchRestrictions();
        setShowSeverityModal(false);
        setEditingRestriction(null);
      }
    } catch (e) {
      console.error('Erro ao atualizar severidade:', e);
    } finally {
      setSaving(false);
    }
  }

  function openSeverityModal(restriction: DietaryRestriction) {
    setEditingRestriction(restriction);
    setEditSeverity(restriction.severity);
    setShowSeverityModal(true);
  }

  function handleAddCustom(e: React.FormEvent) {
    e.preventDefault();
    if (!customValue.trim()) return;

    handleAddRestriction(customValue.trim().toLowerCase(), customSeverity);
    setShowCustomModal(false);
    setCustomValue('');
    setCustomSeverity('moderate');
  }

  function isSelected(value: string): boolean {
    return restrictions.some(r => r.restriction_type === activeTab && r.restriction_value === value);
  }

  function getRestrictionId(value: string): string | undefined {
    const r = restrictions.find(r => r.restriction_type === activeTab && r.restriction_value === value);
    return r?.id;
  }

  function getRestriction(value: string): DietaryRestriction | undefined {
    return restrictions.find(r => r.restriction_type === activeTab && r.restriction_value === value);
  }

  function toggleRestriction(value: string) {
    if (isSelected(value)) {
      const id = getRestrictionId(value);
      if (id) handleRemoveRestriction(id);
    } else {
      handleAddRestriction(value);
    }
  }

  const activeRestrictions = restrictions.filter(r => r.restriction_type === activeTab);
  const predefinedOptions = PREDEFINED_RESTRICTIONS[activeTab] || [];
  const customRestrictions = activeRestrictions.filter(
    r => !predefinedOptions.some(p => p.value === r.restriction_value)
  );

  const tabConfig = RESTRICTION_TYPES[activeTab];

  if (loading) {
    return (
      <div style={{ padding: 24, maxWidth: 800, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', padding: 48 }}>
          <p style={{ color: '#666', fontSize: 16 }}>Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 16, maxWidth: 800, margin: '0 auto', paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button
          onClick={() => router.back()}
          style={{
            padding: '8px 16px',
            background: '#f3f4f6',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 600
          }}
        >
          Voltar
        </button>
        <h1 style={{ fontSize: 24, fontWeight: 700, flex: 1 }}>Restricoes Alimentares</h1>
      </div>

      {/* Info */}
      <div style={{
        padding: 16,
        background: '#f0f9ff',
        borderRadius: 12,
        marginBottom: 24,
        fontSize: 14,
        color: '#0369a1'
      }}>
        Configure suas restricoes alimentares para receber recomendacoes personalizadas do Coach IA.
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: 8,
        overflowX: 'auto',
        paddingBottom: 8,
        marginBottom: 24,
        WebkitOverflowScrolling: 'touch'
      }}>
        {(Object.keys(RESTRICTION_TYPES) as TabType[]).map(type => {
          const config = RESTRICTION_TYPES[type];
          const count = restrictions.filter(r => r.restriction_type === type).length;
          const isActive = activeTab === type;

          return (
            <button
              key={type}
              onClick={() => setActiveTab(type)}
              style={{
                padding: '10px 16px',
                background: isActive ? config.color : '#f3f4f6',
                color: isActive ? 'white' : '#374151',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 600,
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              {config.label}
              {count > 0 && (
                <span style={{
                  background: isActive ? 'rgba(255,255,255,0.3)' : config.color,
                  color: isActive ? 'white' : 'white',
                  padding: '2px 6px',
                  borderRadius: 10,
                  fontSize: 11,
                  fontWeight: 700
                }}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div style={{
        background: 'white',
        borderRadius: 16,
        padding: 20,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, color: tabConfig.color }}>
          {tabConfig.label}
        </h2>

        {/* Predefined Options */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
          {predefinedOptions.map(option => {
            const selected = isSelected(option.value);
            const restriction = getRestriction(option.value);
            const severityLevel = restriction ? SEVERITY_LEVELS.find(s => s.value === restriction.severity) : null;

            return (
              <div key={option.value} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <button
                  onClick={() => toggleRestriction(option.value)}
                  disabled={saving}
                  style={{
                    padding: '10px 16px',
                    background: selected ? tabConfig.color : '#f3f4f6',
                    color: selected ? 'white' : '#374151',
                    border: selected ? 'none' : '2px solid #e5e7eb',
                    borderRadius: 20,
                    cursor: saving ? 'not-allowed' : 'pointer',
                    fontSize: 14,
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    opacity: saving ? 0.7 : 1
                  }}
                >
                  {option.label}
                  {selected && (
                    <span style={{ fontSize: 12 }}>x</span>
                  )}
                </button>

                {/* Severity button for allergies - separate clickable button */}
                {selected && activeTab === 'allergy' && restriction && (
                  <button
                    onClick={() => openSeverityModal(restriction)}
                    disabled={saving}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 16,
                      border: 'none',
                      background: severityLevel?.color || '#fed7aa',
                      cursor: saving ? 'not-allowed' : 'pointer',
                      fontSize: 12,
                      fontWeight: 700,
                      color: '#92400e',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    {severityLevel?.label || 'Moderada'}
                    <span style={{ fontSize: 10 }}>▼</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Custom Restrictions */}
        {customRestrictions.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#6b7280', marginBottom: 8 }}>
              Personalizadas
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {customRestrictions.map(r => (
                <button
                  key={r.id}
                  onClick={() => handleRemoveRestriction(r.id)}
                  disabled={saving}
                  style={{
                    padding: '10px 16px',
                    background: tabConfig.color,
                    color: 'white',
                    border: 'none',
                    borderRadius: 20,
                    cursor: saving ? 'not-allowed' : 'pointer',
                    fontSize: 14,
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    textTransform: 'capitalize'
                  }}
                >
                  {r.restriction_value.replace(/_/g, ' ')}
                  <span style={{ fontSize: 12 }}>x</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Add Custom Button */}
        <button
          onClick={() => setShowCustomModal(true)}
          style={{
            width: '100%',
            padding: 14,
            background: '#f3f4f6',
            border: '2px dashed #d1d5db',
            borderRadius: 12,
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 600,
            color: '#6b7280'
          }}
        >
          + Adicionar {tabConfig.label.toLowerCase().slice(0, -1)} personalizada
        </button>
      </div>

      {/* Summary */}
      {restrictions.length > 0 && (
        <div style={{
          marginTop: 24,
          padding: 16,
          background: '#f0fdf4',
          borderRadius: 12
        }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#166534', marginBottom: 8 }}>
            Resumo das suas restricoes
          </h3>
          <div style={{ fontSize: 13, color: '#166534' }}>
            {Object.keys(RESTRICTION_TYPES).map(type => {
              const count = restrictions.filter(r => r.restriction_type === type).length;
              if (count === 0) return null;
              return (
                <div key={type} style={{ marginBottom: 4 }}>
                  <strong>{RESTRICTION_TYPES[type as TabType].label}:</strong> {count}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Custom Modal */}
      {showCustomModal && (
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
          padding: 24,
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: 16,
            padding: 24,
            width: '100%',
            maxWidth: 400
          }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>
              Adicionar {tabConfig.label.slice(0, -1)}
            </h2>
            <form onSubmit={handleAddCustom}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
                  Nome *
                </label>
                <input
                  type="text"
                  value={customValue}
                  onChange={e => setCustomValue(e.target.value)}
                  placeholder={`Ex: ${activeTab === 'allergy' ? 'Kiwi' : activeTab === 'diet' ? 'Flexitariano' : 'Outro'}`}
                  required
                  style={{
                    width: '100%',
                    padding: 12,
                    fontSize: 16,
                    border: '2px solid #e5e7eb',
                    borderRadius: 8,
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {activeTab === 'allergy' && (
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
                    Severidade
                  </label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {SEVERITY_LEVELS.map(level => (
                      <button
                        key={level.value}
                        type="button"
                        onClick={() => setCustomSeverity(level.value as Severity)}
                        style={{
                          flex: 1,
                          padding: 10,
                          background: customSeverity === level.value ? level.color : '#f3f4f6',
                          border: customSeverity === level.value ? `2px solid ${tabConfig.color}` : '2px solid transparent',
                          borderRadius: 8,
                          cursor: 'pointer',
                          fontSize: 14,
                          fontWeight: 600,
                          color: '#374151'
                        }}
                      >
                        {level.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  type="button"
                  onClick={() => { setShowCustomModal(false); setCustomValue(''); }}
                  style={{
                    flex: 1,
                    padding: 12,
                    background: '#f3f4f6',
                    border: 'none',
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontSize: 16,
                    fontWeight: 600
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    flex: 1,
                    padding: 12,
                    background: tabConfig.color,
                    color: 'white',
                    border: 'none',
                    borderRadius: 8,
                    cursor: saving ? 'not-allowed' : 'pointer',
                    fontSize: 16,
                    fontWeight: 600
                  }}
                >
                  Adicionar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Severity Modal */}
      {showSeverityModal && editingRestriction && (
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
          padding: 24,
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: 16,
            padding: 24,
            width: '100%',
            maxWidth: 400
          }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
              Severidade da Alergia
            </h2>
            <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 16 }}>
              {editingRestriction.restriction_value.charAt(0).toUpperCase() + editingRestriction.restriction_value.slice(1).replace(/_/g, ' ')}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
              {SEVERITY_LEVELS.map(level => (
                <button
                  key={level.value}
                  type="button"
                  onClick={() => setEditSeverity(level.value as Severity)}
                  style={{
                    padding: 14,
                    background: editSeverity === level.value ? level.color : '#f3f4f6',
                    border: editSeverity === level.value ? `2px solid ${tabConfig.color}` : '2px solid transparent',
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontSize: 14,
                    fontWeight: 600,
                    color: '#374151',
                    textAlign: 'left'
                  }}
                >
                  <strong>{level.label}</strong>
                  <span style={{ display: 'block', fontSize: 12, color: '#6b7280', marginTop: 4 }}>
                    {level.value === 'mild' && 'Desconforto leve, pode consumir em pequenas quantidades'}
                    {level.value === 'moderate' && 'Reacao moderada, evitar consumo'}
                    {level.value === 'severe' && 'Risco de anafilaxia, evitar completamente'}
                  </span>
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                type="button"
                onClick={() => { setShowSeverityModal(false); setEditingRestriction(null); }}
                style={{
                  flex: 1,
                  padding: 12,
                  background: '#f3f4f6',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontSize: 16,
                  fontWeight: 600
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleUpdateSeverity}
                disabled={saving}
                style={{
                  flex: 1,
                  padding: 12,
                  background: tabConfig.color,
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  cursor: saving ? 'not-allowed' : 'pointer',
                  fontSize: 16,
                  fontWeight: 600
                }}
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
