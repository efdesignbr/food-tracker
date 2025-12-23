'use client';

import { BodyMeasurement } from '@/lib/repos/body-measurements.repo';
import { formatDateLongBR } from '@/lib/datetime';

interface MeasurementTimelineProps {
  measurements: BodyMeasurement[];
  onDelete: (id: string) => void;
}

export default function MeasurementTimeline({ measurements, onDelete }: MeasurementTimelineProps) {
  if (measurements.length === 0) {
    return (
      <div style={{
        padding: 32,
        textAlign: 'center',
        color: '#9ca3af',
        border: '2px dashed #d1d5db',
        borderRadius: 12
      }}>
        Nenhuma medida registrada ainda
      </div>
    );
  }

  function formatMeasurements(m: BodyMeasurement): string[] {
    const parts: string[] = [];
    if (m.waist) parts.push(`Cintura: ${m.waist}cm`);
    if (m.neck) parts.push(`Pescoço: ${m.neck}cm`);
    if (m.chest) parts.push(`Peitoral: ${m.chest}cm`);
    if (m.hips) parts.push(`Quadril: ${m.hips}cm`);

    // Bíceps - mostra ambos os lados separadamente
    if (m.left_bicep != null) {
      parts.push(`Bíceps E: ${m.left_bicep}cm`);
    }
    if (m.right_bicep != null) {
      parts.push(`Bíceps D: ${m.right_bicep}cm`);
    }

    // Coxa - mostra ambos os lados separadamente
    if (m.left_thigh != null) {
      parts.push(`Coxa E: ${m.left_thigh}cm`);
    }
    if (m.right_thigh != null) {
      parts.push(`Coxa D: ${m.right_thigh}cm`);
    }

    // Panturrilha - mostra ambos os lados separadamente
    if (m.left_calf != null) {
      parts.push(`Panturrilha E: ${m.left_calf}cm`);
    }
    if (m.right_calf != null) {
      parts.push(`Panturrilha D: ${m.right_calf}cm`);
    }

    return parts;
  }

  return (
    <div style={{
      background: 'white',
      border: '2px solid #e5e7eb',
      borderRadius: 16,
      padding: 24,
      marginBottom: 24
    }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}> Histórico de Medidas</h2>

      <div style={{ position: 'relative', paddingLeft: 40 }}>
        {/* Linha vertical da timeline */}
        <div style={{
          position: 'absolute',
          left: 16,
          top: 0,
          bottom: 0,
          width: 2,
          background: 'linear-gradient(to bottom, #10b981, #3b82f6)'
        }} />

        {measurements.map((measurement, index) => {
          const isFirst = index === 0;
          const parts = formatMeasurements(measurement);

          return (
            <div
              key={measurement.id}
              style={{
                position: 'relative',
                marginBottom: index === measurements.length - 1 ? 0 : 24,
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
                background: isFirst ? '#10b981' : '#6b7280',
                border: '3px solid white',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                zIndex: 1
              }} />

              {/* Conteúdo */}
              <div style={{
                background: isFirst ? '#f0fdf4' : 'white',
                border: `2px solid ${isFirst ? '#10b981' : '#e5e7eb'}`,
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
                    <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 4 }}>
                      {formatDateLongBR(measurement.measurement_date)} às {measurement.measurement_time}
                    </div>
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 8,
                      marginTop: 8
                    }}>
                      {parts.map((part, i) => (
                        <div
                          key={i}
                          style={{
                            padding: '6px 12px',
                            background: '#f3f4f6',
                            borderRadius: 8,
                            fontSize: 13,
                            fontWeight: 500,
                            color: '#374151'
                          }}
                        >
                          {part}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {isFirst && (
                      <div style={{
                        padding: '6px 12px',
                        background: '#d1fae5',
                        color: '#065f46',
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 600
                      }}>
                        Mais recente
                      </div>
                    )}
                    <button
                      onClick={() => onDelete(measurement.id)}
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
                      
                    </button>
                  </div>
                </div>

                {measurement.notes && (
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
                     {measurement.notes}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
