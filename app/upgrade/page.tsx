'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUserPlan } from '@/hooks/useUserPlan';
import { PlanBadge } from '@/components/subscription';

interface PricingFeature {
  text: string;
  included: boolean;
  highlight?: boolean;
}

interface PricingPlan {
  name: string;
  price: string;
  period?: string;
  description: string;
  features: PricingFeature[];
  badge?: string;
  buttonText: string;
  buttonVariant: 'primary' | 'secondary';
}

const FAQ_ITEMS = [
  {
    question: 'Como funciona o período de teste?',
    answer: 'Atualmente não oferecemos período de teste, mas você pode começar gratuitamente com o plano FREE e fazer upgrade quando precisar dos recursos premium.'
  },
  {
    question: 'Posso cancelar a qualquer momento?',
    answer: 'Sim! Você pode cancelar sua assinatura a qualquer momento. Continuará tendo acesso aos recursos premium até o final do período pago.'
  },
  {
    question: 'O que acontece se eu atingir o limite mensal?',
    answer: 'Se você atingir o limite de 90 fotos ou 30 análises de tabelas, precisará aguardar até o próximo mês (dia 1º) para a renovação automática da quota.'
  },
  {
    question: 'Meus dados ficam salvos se eu cancelar?',
    answer: 'Sim! Seu histórico completo fica salvo. Se você voltar para o plano FREE, terá acesso aos últimos 30 dias. Ao reativar o PREMIUM, todo o histórico volta a ficar disponível.'
  },
  {
    question: 'Como funciona o pagamento?',
    answer: 'O pagamento é processado de forma segura via Stripe. Aceitamos cartões de crédito e débito. A cobrança é mensal e automática.'
  }
];

export default function UpgradePage() {
  const { plan, isLoading } = useUserPlan();
  const router = useRouter();
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const plans: PricingPlan[] = [
    {
      name: 'FREE',
      price: 'Grátis',
      description: 'Perfeito para começar',
      features: [
        { text: 'Registro manual ilimitado de refeições', included: true },
        { text: 'Análise de fotos com IA', included: false },
        { text: 'Análise de tabelas nutricionais (OCR)', included: false },
        { text: 'Histórico de 30 dias', included: true },
        { text: 'Coach IA personalizado', included: false },
        { text: 'Relatórios avançados', included: false }
      ],
      buttonText: plan === 'free' ? 'Plano Atual' : 'Voltar para FREE',
      buttonVariant: 'secondary'
    },
    {
      name: 'PREMIUM',
      price: 'R$ 14,90',
      period: '/mês',
      description: 'Recursos completos para resultados reais',
      badge: 'Mais Popular',
      features: [
        { text: 'Tudo do FREE, mais:', included: true, highlight: true },
        { text: '90 análises de foto por mês', included: true, highlight: true },
        { text: '30 análises de tabelas por mês', included: true, highlight: true },
        { text: 'Histórico ilimitado', included: true },
        { text: 'Coach IA personalizado', included: true },
        { text: 'Relatórios avançados', included: true }
      ],
      buttonText: plan === 'premium' ? 'Plano Atual' : 'Assinar PREMIUM',
      buttonVariant: 'primary'
    }
  ];

  const handleSubscribe = (planName: string) => {
    if (plan === 'unlimited') {
      alert('Você já tem acesso ILIMITADO a todos os recursos! 🎉');
      return;
    }

    if (planName === 'FREE') {
      if (plan === 'free') return;
      alert('Para voltar ao plano FREE, cancele sua assinatura nas configurações da conta.');
      return;
    }

    if (planName === 'PREMIUM') {
      if (plan === 'premium') {
        router.push('/account');
        return;
      }

      // Mock: futuramente será redirect para Stripe Checkout
      alert('🚧 Checkout em desenvolvimento!\n\nEm breve você poderá assinar o PREMIUM diretamente por aqui. Por enquanto, entre em contato com o suporte.');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      {/* Hero Section */}
      <div style={{ padding: '60px 24px 40px', textAlign: 'center', color: 'white' }}>
        <h1 style={{
          fontSize: 42,
          fontWeight: 800,
          margin: '0 0 16px 0',
          lineHeight: 1.2
        }}>
          Escolha o Plano Ideal para Você
        </h1>
        <p style={{
          fontSize: 18,
          margin: 0,
          opacity: 0.95,
          maxWidth: 600,
          marginLeft: 'auto',
          marginRight: 'auto'
        }}>
          Desbloqueie todo o poder da IA para transformar sua alimentação
        </p>

        {/* Current plan badge */}
        {!isLoading && plan !== 'free' && (
          <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 14, opacity: 0.9 }}>Seu plano atual:</span>
            <PlanBadge plan={plan} size="md" />
          </div>
        )}
      </div>

      {/* Pricing Cards */}
      <div style={{
        maxWidth: 1000,
        margin: '0 auto',
        padding: '0 24px 60px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 24
      }}>
        {plans.map((planData) => {
          const isCurrentPlan = planData.name.toLowerCase() === plan;

          return (
            <div
              key={planData.name}
              style={{
                background: 'white',
                borderRadius: 20,
                padding: 32,
                boxShadow: planData.badge ? '0 20px 60px rgba(0,0,0,0.3)' : '0 10px 30px rgba(0,0,0,0.2)',
                transform: planData.badge ? 'scale(1.05)' : 'scale(1)',
                position: 'relative',
                border: isCurrentPlan ? '3px solid #10b981' : 'none'
              }}
            >
              {/* Badge */}
              {planData.badge && (
                <div style={{
                  position: 'absolute',
                  top: -12,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                  color: 'white',
                  padding: '6px 20px',
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: '0.5px'
                }}>
                  {planData.badge}
                </div>
              )}

              {/* Current plan indicator */}
              {isCurrentPlan && (
                <div style={{
                  position: 'absolute',
                  top: 16,
                  right: 16,
                  background: '#10b981',
                  color: 'white',
                  padding: '4px 12px',
                  borderRadius: 12,
                  fontSize: 11,
                  fontWeight: 700
                }}>
                  ✓ ATUAL
                </div>
              )}

              {/* Plan name */}
              <h3 style={{
                fontSize: 24,
                fontWeight: 700,
                margin: '0 0 8px 0',
                color: '#1a1a1a'
              }}>
                {planData.name === 'PREMIUM' && '💎 '}
                {planData.name}
              </h3>

              {/* Price */}
              <div style={{ marginBottom: 12 }}>
                <span style={{
                  fontSize: 36,
                  fontWeight: 800,
                  color: '#667eea'
                }}>
                  {planData.price}
                </span>
                {planData.period && (
                  <span style={{
                    fontSize: 16,
                    color: '#666',
                    marginLeft: 4
                  }}>
                    {planData.period}
                  </span>
                )}
              </div>

              {/* Description */}
              <p style={{
                fontSize: 14,
                color: '#666',
                marginBottom: 24
              }}>
                {planData.description}
              </p>

              {/* Features */}
              <ul style={{
                listStyle: 'none',
                padding: 0,
                margin: '0 0 24px 0'
              }}>
                {planData.features.map((feature, index) => (
                  <li
                    key={index}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 10,
                      padding: '8px 0',
                      fontSize: 14,
                      color: feature.highlight ? '#667eea' : '#333',
                      fontWeight: feature.highlight ? 600 : 400
                    }}
                  >
                    <span style={{
                      fontSize: 18,
                      color: feature.included ? '#10b981' : '#dc2626',
                      lineHeight: 1
                    }}>
                      {feature.included ? '✓' : '✕'}
                    </span>
                    <span>{feature.text}</span>
                  </li>
                ))}
              </ul>

              {/* Button */}
              <button
                onClick={() => handleSubscribe(planData.name)}
                disabled={isCurrentPlan}
                style={{
                  width: '100%',
                  padding: 14,
                  borderRadius: 12,
                  border: 'none',
                  background: isCurrentPlan
                    ? '#e5e7eb'
                    : planData.buttonVariant === 'primary'
                      ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                      : '#f3f4f6',
                  color: isCurrentPlan
                    ? '#9ca3af'
                    : planData.buttonVariant === 'primary'
                      ? 'white'
                      : '#667eea',
                  fontSize: 16,
                  fontWeight: 700,
                  cursor: isCurrentPlan ? 'not-allowed' : 'pointer',
                  boxShadow: planData.buttonVariant === 'primary' && !isCurrentPlan
                    ? '0 4px 12px rgba(102, 126, 234, 0.4)'
                    : 'none',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (!isCurrentPlan) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    if (planData.buttonVariant === 'primary') {
                      e.currentTarget.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.5)';
                    }
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  if (planData.buttonVariant === 'primary') {
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
                  }
                }}
              >
                {planData.buttonText}
              </button>
            </div>
          );
        })}
      </div>

      {/* FAQ Section */}
      <div style={{
        maxWidth: 800,
        margin: '0 auto',
        padding: '60px 24px',
        background: 'white',
        borderRadius: '40px 40px 0 0'
      }}>
        <h2 style={{
          fontSize: 32,
          fontWeight: 700,
          textAlign: 'center',
          marginBottom: 40,
          color: '#1a1a1a'
        }}>
          ❓ Perguntas Frequentes
        </h2>

        <div style={{ display: 'grid', gap: 16 }}>
          {FAQ_ITEMS.map((item, index) => {
            const isExpanded = expandedFaq === index;

            return (
              <div
                key={index}
                style={{
                  border: '2px solid #e5e7eb',
                  borderRadius: 12,
                  overflow: 'hidden',
                  transition: 'all 0.2s ease'
                }}
              >
                <button
                  onClick={() => setExpandedFaq(isExpanded ? null : index)}
                  style={{
                    width: '100%',
                    padding: 20,
                    background: isExpanded ? '#f9fafb' : 'white',
                    border: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: 16,
                    fontWeight: 600,
                    color: '#1a1a1a'
                  }}
                >
                  <span>{item.question}</span>
                  <span style={{
                    fontSize: 20,
                    transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease'
                  }}>
                    ▼
                  </span>
                </button>

                {isExpanded && (
                  <div style={{
                    padding: '0 20px 20px',
                    fontSize: 14,
                    color: '#666',
                    lineHeight: 1.6,
                    background: '#f9fafb'
                  }}>
                    {item.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Final CTA */}
        <div style={{
          marginTop: 60,
          padding: 40,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: 20,
          textAlign: 'center',
          color: 'white'
        }}>
          <h3 style={{
            fontSize: 28,
            fontWeight: 700,
            margin: '0 0 16px 0'
          }}>
            Pronto para começar?
          </h3>
          <p style={{
            fontSize: 16,
            margin: '0 0 24px 0',
            opacity: 0.95
          }}>
            Desbloqueie análise de fotos com IA e transforme sua alimentação hoje mesmo
          </p>
          <button
            onClick={() => handleSubscribe('PREMIUM')}
            style={{
              padding: '14px 32px',
              background: 'white',
              color: '#667eea',
              border: 'none',
              borderRadius: 12,
              fontSize: 16,
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
            }}
          >
            Começar Agora
          </button>
        </div>
      </div>
    </div>
  );
}
