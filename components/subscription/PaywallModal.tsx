'use client';

import { useRouter } from 'next/navigation';
import type { Plan } from '@/lib/types/subscription';

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature: 'photo_analysis' | 'ocr_analysis' | 'coach_analysis';
  currentPlan: Plan;
}

const FEATURE_CONFIG = {
  photo_analysis: {
    title: 'Análise de Foto',
    icon: '📸',
    description: 'A análise de fotos de refeições é exclusiva para usuários PREMIUM',
    benefits: [
      '90 análises de foto por mês',
      'IA avançada para reconhecer alimentos',
      'Cálculo automático de macros',
      'Histórico ilimitado'
    ]
  },
  ocr_analysis: {
    title: 'Análise de Tabelas Nutricionais',
    icon: '📋',
    description: 'A leitura de tabelas nutricionais é exclusiva para usuários PREMIUM',
    benefits: [
      '30 análises de tabelas por mês',
      'OCR preciso de rótulos',
      'Importação rápida de alimentos',
      'Histórico ilimitado'
    ]
  },
  coach_analysis: {
    title: 'Coach IA',
    icon: '🤖',
    description: 'O Coach IA com insights personalizados é exclusivo para usuários PREMIUM',
    benefits: [
      'Análises ilimitadas do seu progresso',
      'Insights baseados em peso, medidas e alimentação',
      'Recomendações personalizadas',
      'Alertas importantes sobre sua saúde'
    ]
  }
} as const;

export default function PaywallModal({
  isOpen,
  onClose,
  feature,
  currentPlan
}: PaywallModalProps) {
  const router = useRouter();
  const config = FEATURE_CONFIG[feature];

  if (!isOpen) return null;

  const handleUpgrade = () => {
    router.push('/upgrade');
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      onClick={handleBackdropClick}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 16
      }}
    >
      <div
        style={{
          backgroundColor: '#fff',
          borderRadius: 16,
          padding: 32,
          maxWidth: 480,
          width: '100%',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          position: 'relative'
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            border: 'none',
            background: 'none',
            fontSize: 24,
            cursor: 'pointer',
            color: '#666',
            lineHeight: 1,
            padding: 4
          }}
          aria-label="Fechar"
        >
          ✕
        </button>

        {/* Icon */}
        <div
          style={{
            fontSize: 48,
            textAlign: 'center',
            marginBottom: 16
          }}
        >
          {config.icon}
        </div>

        {/* Title */}
        <h2
          style={{
            fontSize: 24,
            fontWeight: 700,
            textAlign: 'center',
            margin: '0 0 8px 0',
            color: '#1a1a1a'
          }}
        >
          Recurso Premium
        </h2>

        {/* Description */}
        <p
          style={{
            fontSize: 16,
            color: '#666',
            textAlign: 'center',
            margin: '0 0 24px 0',
            lineHeight: 1.5
          }}
        >
          {config.description}
        </p>

        {/* Divider */}
        <div
          style={{
            height: 1,
            backgroundColor: '#e5e7eb',
            margin: '24px 0'
          }}
        />

        {/* Benefits title */}
        <h3
          style={{
            fontSize: 18,
            fontWeight: 600,
            margin: '0 0 16px 0',
            color: '#1a1a1a'
          }}
        >
          Com PREMIUM você tem:
        </h3>

        {/* Benefits list */}
        <ul
          style={{
            listStyle: 'none',
            padding: 0,
            margin: '0 0 24px 0'
          }}
        >
          {config.benefits.map((benefit, index) => (
            <li
              key={index}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '8px 0',
                fontSize: 15,
                color: '#333'
              }}
            >
              <span style={{ color: '#10b981', fontSize: 20 }}>✓</span>
              {benefit}
            </li>
          ))}
        </ul>

        {/* Buttons */}
        <div
          style={{
            display: 'flex',
            gap: 12,
            marginTop: 24
          }}
        >
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '12px 24px',
              borderRadius: 8,
              border: '1px solid #e5e7eb',
              backgroundColor: '#fff',
              color: '#666',
              fontSize: 16,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f9fafb';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#fff';
            }}
          >
            Fechar
          </button>
          <button
            onClick={handleUpgrade}
            style={{
              flex: 1,
              padding: '12px 24px',
              borderRadius: 8,
              border: 'none',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: '#fff',
              fontSize: 16,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
            }}
          >
            Ver Planos
          </button>
        </div>
      </div>
    </div>
  );
}
