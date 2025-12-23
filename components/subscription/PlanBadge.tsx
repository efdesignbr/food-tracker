'use client';

import type { Plan } from '@/lib/types/subscription';

interface PlanBadgeProps {
  plan: Plan;
  size?: 'sm' | 'md' | 'lg';
}

const PLAN_CONFIG = {
  free: {
    label: 'FREE',
    emoji: '',
    bg: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
    text: '#6b7280',
    border: '#d1d5db'
  },
  premium: {
    label: 'PRO',
    emoji: '',
    bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    text: '#ffffff',
    border: '#667eea'
  },
  unlimited: {
    label: 'ADMIN',
    emoji: '⭐',
    bg: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    text: '#ffffff',
    border: '#f093fb'
  }
} as const;

const SIZE_CONFIG = {
  sm: {
    fontSize: 10,
    padding: '2px 6px',
    gap: 3
  },
  md: {
    fontSize: 12,
    padding: '4px 8px',
    gap: 4
  },
  lg: {
    fontSize: 14,
    padding: '6px 12px',
    gap: 6
  }
} as const;

export default function PlanBadge({ plan, size = 'md' }: PlanBadgeProps) {
  const config = PLAN_CONFIG[plan];
  const sizeConfig = SIZE_CONFIG[size];

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: sizeConfig.gap,
        padding: sizeConfig.padding,
        borderRadius: 6,
        background: config.bg,
        color: config.text,
        fontSize: sizeConfig.fontSize,
        fontWeight: 700,
        letterSpacing: '0.5px',
        border: `1px solid ${config.border}`,
        textTransform: 'uppercase',
        lineHeight: 1,
        whiteSpace: 'nowrap'
      }}
    >
      {config.emoji && <span>{config.emoji}</span>}
      {config.label}
    </span>
  );
}
