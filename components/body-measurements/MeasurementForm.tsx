'use client';

import { useState } from 'react';
import { getCurrentDateTimeBR } from '@/lib/datetime';
import { api } from '@/lib/api-client';

interface MeasurementFormProps {
  onSuccess: () => void;
}

export default function MeasurementForm({ onSuccess }: MeasurementFormProps) {
  const [formData, setFormData] = useState({
    waist: '',
    neck: '',
    chest: '',
    hips: '',
    left_thigh: '',
    right_thigh: '',
    left_bicep: '',
    right_bicep: '',
    left_calf: '',
    right_calf: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function handleChange(field: string, value: string) {
    setFormData(prev => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    try {
      const { date: measurementDate, time: measurementTime } = getCurrentDateTimeBR();

      // Converter valores para números, apenas os preenchidos
      const payload: any = {
        measurement_date: measurementDate,
        measurement_time: measurementTime
      };

      if (formData.waist && formData.waist.trim()) payload.waist = parseFloat(formData.waist);
      if (formData.neck && formData.neck.trim()) payload.neck = parseFloat(formData.neck);
      if (formData.chest && formData.chest.trim()) payload.chest = parseFloat(formData.chest);
      if (formData.hips && formData.hips.trim()) payload.hips = parseFloat(formData.hips);
      if (formData.left_thigh && formData.left_thigh.trim()) payload.left_thigh = parseFloat(formData.left_thigh);
      if (formData.right_thigh && formData.right_thigh.trim()) payload.right_thigh = parseFloat(formData.right_thigh);
      if (formData.left_bicep && formData.left_bicep.trim()) payload.left_bicep = parseFloat(formData.left_bicep);
      if (formData.right_bicep && formData.right_bicep.trim()) payload.right_bicep = parseFloat(formData.right_bicep);
      if (formData.left_calf && formData.left_calf.trim()) payload.left_calf = parseFloat(formData.left_calf);
      if (formData.right_calf && formData.right_calf.trim()) payload.right_calf = parseFloat(formData.right_calf);
      if (formData.notes && formData.notes.trim()) payload.notes = formData.notes;

      console.log(' Payload being sent:', payload);

      // Validar que pelo menos uma medida foi preenchida
      const hasAtLeastOne = Object.keys(payload).some(key =>
        key !== 'measurement_date' && key !== 'measurement_time' && key !== 'notes'
      );

      if (!hasAtLeastOne) {
        setError('Preencha pelo menos uma medida');
        return;
      }

      const res = await api.post('/api/body-measurements', payload);
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || 'Erro ao salvar medidas');
      }

      setSuccess(true);
      setFormData({
        waist: '',
        neck: '',
        chest: '',
        hips: '',
        left_thigh: '',
        right_thigh: '',
        left_bicep: '',
        right_bicep: '',
        left_calf: '',
        right_calf: '',
        notes: ''
      });
      onSuccess();

      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{
      background: 'white',
      border: '2px solid #e5e7eb',
      borderRadius: 16,
      padding: 24,
      marginBottom: 24
    }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}> Novo Registro de Medidas</h2>

      <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 20 }}>
        Preencha as medidas que desejar. Todas são opcionais, mas recomenda-se registrar pelo menos uma.
      </p>

      {/* Tronco */}
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: '#374151' }}>
          🫀 Tronco
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500 }}>
              Cintura (cm)
            </label>
            <input
              type="number"
              step="0.1"
              value={formData.waist}
              onChange={e => handleChange('waist', e.target.value)}
              placeholder="Ex: 85.5"
              style={{
                width: '100%',
                padding: 10,
                fontSize: 16,
                border: '2px solid #e5e7eb',
                borderRadius: 8
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500 }}>
              Pescoço (cm)
            </label>
            <input
              type="number"
              step="0.1"
              value={formData.neck}
              onChange={e => handleChange('neck', e.target.value)}
              placeholder="Ex: 38.0"
              style={{
                width: '100%',
                padding: 10,
                fontSize: 16,
                border: '2px solid #e5e7eb',
                borderRadius: 8
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500 }}>
              Peitoral (cm)
            </label>
            <input
              type="number"
              step="0.1"
              value={formData.chest}
              onChange={e => handleChange('chest', e.target.value)}
              placeholder="Ex: 95.0"
              style={{
                width: '100%',
                padding: 10,
                fontSize: 16,
                border: '2px solid #e5e7eb',
                borderRadius: 8
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500 }}>
              Quadril (cm)
            </label>
            <input
              type="number"
              step="0.1"
              value={formData.hips}
              onChange={e => handleChange('hips', e.target.value)}
              placeholder="Ex: 100.0"
              style={{
                width: '100%',
                padding: 10,
                fontSize: 16,
                border: '2px solid #e5e7eb',
                borderRadius: 8
              }}
            />
          </div>
        </div>
      </div>

      {/* Membros */}
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: '#374151' }}>
           Membros
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500 }}>
              Coxa E (cm)
            </label>
            <input
              type="number"
              step="0.1"
              value={formData.left_thigh}
              onChange={e => handleChange('left_thigh', e.target.value)}
              placeholder="Ex: 55.0"
              style={{
                width: '100%',
                padding: 10,
                fontSize: 16,
                border: '2px solid #e5e7eb',
                borderRadius: 8
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500 }}>
              Coxa D (cm)
            </label>
            <input
              type="number"
              step="0.1"
              value={formData.right_thigh}
              onChange={e => handleChange('right_thigh', e.target.value)}
              placeholder="Ex: 55.0"
              style={{
                width: '100%',
                padding: 10,
                fontSize: 16,
                border: '2px solid #e5e7eb',
                borderRadius: 8
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500 }}>
              Bíceps E (cm)
            </label>
            <input
              type="number"
              step="0.1"
              value={formData.left_bicep}
              onChange={e => handleChange('left_bicep', e.target.value)}
              placeholder="Ex: 35.0"
              style={{
                width: '100%',
                padding: 10,
                fontSize: 16,
                border: '2px solid #e5e7eb',
                borderRadius: 8
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500 }}>
              Bíceps D (cm)
            </label>
            <input
              type="number"
              step="0.1"
              value={formData.right_bicep}
              onChange={e => handleChange('right_bicep', e.target.value)}
              placeholder="Ex: 35.0"
              style={{
                width: '100%',
                padding: 10,
                fontSize: 16,
                border: '2px solid #e5e7eb',
                borderRadius: 8
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500 }}>
              Panturrilha E (cm)
            </label>
            <input
              type="number"
              step="0.1"
              value={formData.left_calf}
              onChange={e => handleChange('left_calf', e.target.value)}
              placeholder="Ex: 38.0"
              style={{
                width: '100%',
                padding: 10,
                fontSize: 16,
                border: '2px solid #e5e7eb',
                borderRadius: 8
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500 }}>
              Panturrilha D (cm)
            </label>
            <input
              type="number"
              step="0.1"
              value={formData.right_calf}
              onChange={e => handleChange('right_calf', e.target.value)}
              placeholder="Ex: 38.0"
              style={{
                width: '100%',
                padding: 10,
                fontSize: 16,
                border: '2px solid #e5e7eb',
                borderRadius: 8
              }}
            />
          </div>
        </div>
      </div>

      {/* Observações */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
           Observações (opcional)
        </label>
        <textarea
          value={formData.notes}
          onChange={e => handleChange('notes', e.target.value)}
          placeholder="Ex: Medido pela manhã em jejum..."
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
           {error}
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
           Medidas registradas com sucesso!
        </div>
      )}

      <button
        type="submit"
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
        {loading ? ' Salvando...' : ' Salvar Medidas'}
      </button>
    </form>
  );
}
