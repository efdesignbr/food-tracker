'use client';

interface QuotaCardProps {
  quotaType: 'photo' | 'ocr' | 'text';
  used: number;
  limit: number;
  percentage: number;
  remaining: number;
  resetDate: Date;
}

const QUOTA_CONFIG = {
  photo: {
    title: 'Análise de Fotos',
    icon: '',
    unit: 'análises'
  },
  ocr: {
    title: 'Análise de Tabelas',
    icon: '',
    unit: 'análises'
  },
  text: {
    title: 'Análise de Texto',
    icon: '',
    unit: 'análises'
  }
} as const;

function getQuotaColor(percentage: number): string {
  if (percentage <= 50) return '#10b981'; // Verde
  if (percentage <= 80) return '#f59e0b'; // Amarelo
  return '#ef4444'; // Vermelho
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date);
}

export default function QuotaCard({
  quotaType,
  used,
  limit,
  percentage,
  remaining,
  resetDate
}: QuotaCardProps) {
  const config = QUOTA_CONFIG[quotaType];
  const color = getQuotaColor(percentage);

  return (
    <div
      style={{
        background: 'white',
        border: '2px solid #e5e7eb',
        borderRadius: 12,
        padding: 20,
        marginBottom: 16
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 12
        }}
      >
        <span style={{ fontSize: 24 }}>{config.icon}</span>
        <h3
          style={{
            fontSize: 16,
            fontWeight: 700,
            margin: 0,
            color: '#1a1a1a'
          }}
        >
          {config.title}
        </h3>
      </div>

      {/* Usage text */}
      <div
        style={{
          fontSize: 14,
          color: '#666',
          marginBottom: 8
        }}
      >
        <span style={{ fontWeight: 600, color }}>
          {used}/{limit}
        </span>{' '}
        usadas ({percentage}%)
      </div>

      {/* Progress bar */}
      <div
        style={{
          width: '100%',
          height: 8,
          backgroundColor: '#f3f4f6',
          borderRadius: 4,
          overflow: 'hidden',
          marginBottom: 12
        }}
      >
        <div
          style={{
            width: `${Math.min(percentage, 100)}%`,
            height: '100%',
            backgroundColor: color,
            transition: 'width 0.3s ease, background-color 0.3s ease'
          }}
        />
      </div>

      {/* Details */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 13,
          color: '#6b7280'
        }}
      >
        <div>
          <strong style={{ color: remaining > 0 ? color : '#dc2626' }}>
            {remaining > 0 ? `Restam: ${remaining}` : 'Limite atingido'}
          </strong>
        </div>
        <div>
          Renova em: <strong>{formatDate(resetDate)}</strong>
        </div>
      </div>

      {/* Warning if near limit */}
      {percentage >= 80 && remaining > 0 && (
        <div
          style={{
            marginTop: 12,
            padding: 8,
            background: percentage >= 90 ? '#fee2e2' : '#fef3c7',
            border: `1px solid ${percentage >= 90 ? '#fca5a5' : '#fcd34d'}`,
            borderRadius: 6,
            fontSize: 12,
            color: percentage >= 90 ? '#991b1b' : '#92400e'
          }}
        >
          {percentage >= 90
            ? ` Você está quase no limite! Restam apenas ${remaining} ${config.unit}.`
            : ` Atenção: você já usou ${percentage}% da sua quota este mês.`}
        </div>
      )}

      {/* Limit reached message */}
      {remaining === 0 && (
        <div
          style={{
            marginTop: 12,
            padding: 10,
            background: '#fee2e2',
            border: '2px solid #ef4444',
            borderRadius: 6,
            fontSize: 13,
            color: '#991b1b',
            fontWeight: 600
          }}
        >
           Limite mensal atingido. Sua quota será renovada em {formatDate(resetDate)}.
        </div>
      )}
    </div>
  );
}
