'use client';

import { useRouter } from 'next/navigation';
import type { Plan } from '@/lib/types/subscription';

interface UpgradeButtonProps {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  currentPlan: Plan;
}

const VARIANT_STYLES = {
  primary: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#ffffff',
    border: 'none',
    boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)'
  },
  secondary: {
    background: '#f3f4f6',
    color: '#667eea',
    border: '1px solid #e5e7eb',
    boxShadow: 'none'
  },
  outline: {
    background: 'transparent',
    color: '#667eea',
    border: '1px solid #667eea',
    boxShadow: 'none'
  }
} as const;

const SIZE_STYLES = {
  sm: {
    fontSize: 12,
    padding: '6px 12px',
    borderRadius: 6
  },
  md: {
    fontSize: 14,
    padding: '8px 16px',
    borderRadius: 8
  },
  lg: {
    fontSize: 16,
    padding: '12px 24px',
    borderRadius: 10
  }
} as const;

export default function UpgradeButton({
  variant = 'primary',
  size = 'md',
  currentPlan
}: UpgradeButtonProps) {
  const router = useRouter();

  // Não mostrar botão para UNLIMITED
  if (currentPlan === 'unlimited') {
    return null;
  }

  const variantStyle = VARIANT_STYLES[variant];
  const sizeStyle = SIZE_STYLES[size];

  const buttonText = currentPlan === 'free' ? 'Fazer Upgrade' : 'Gerenciar Assinatura';
  const destination = currentPlan === 'free' ? '/upgrade' : '/subscription';

  const handleClick = () => {
    router.push(destination);
  };

  return (
    <button
      onClick={handleClick}
      style={{
        ...variantStyle,
        ...sizeStyle,
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        whiteSpace: 'nowrap'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-1px)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = variantStyle.boxShadow;
      }}
    >
      {currentPlan === 'free' && '✨ '}
      {buttonText}
    </button>
  );
}
