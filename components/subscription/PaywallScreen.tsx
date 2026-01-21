'use client';

import { useEffect } from 'react';
import { usePurchase } from '@/hooks/usePurchase';

interface PaywallScreenProps {
  onPurchaseComplete?: () => void;
  onClose?: () => void;
}

export function PaywallScreen({ onPurchaseComplete, onClose }: PaywallScreenProps) {
  const {
    isLoading,
    error,
    packages,
    isMobile,
    loadOfferings,
    purchase,
    restorePurchases,
  } = usePurchase();

  useEffect(() => {
    console.log('[PaywallScreen] Component mounted, calling loadOfferings...');
    loadOfferings();
  }, [loadOfferings]);

  const handlePurchase = async (pkg: any) => {
    const success = await purchase(pkg);
    if (success) {
      onPurchaseComplete?.();
    }
  };

  const handleRestore = async () => {
    const success = await restorePurchases();
    if (success) {
      onPurchaseComplete?.();
    }
  };

  if (!isMobile) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <p style={{ color: '#666' }}>
          Assinaturas disponíveis apenas no aplicativo.
        </p>
      </div>
    );
  }

  if (isLoading && packages.length === 0) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <div style={{
          width: 32,
          height: 32,
          border: '3px solid #e5e7eb',
          borderTopColor: '#667eea',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 16px',
        }} />
        <p style={{ color: '#666' }}>Carregando planos...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <p style={{ color: '#dc2626', marginBottom: 16 }}>{error}</p>
        <button
          onClick={loadOfferings}
          style={{
            padding: '10px 20px',
            background: '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
          }}
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: 16 }}>
      {/* Packages */}
      <div style={{ display: 'grid', gap: 16 }}>
        {packages.map((pkg: any) => {
          const product = pkg.product;
          const isAnnual = pkg.packageType === 'ANNUAL';

          return (
            <div
              key={pkg.identifier}
              style={{
                border: isAnnual ? '2px solid #667eea' : '2px solid #e5e7eb',
                borderRadius: 16,
                padding: 20,
                position: 'relative',
                background: isAnnual ? 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)' : 'white',
              }}
            >
              {isAnnual && (
                <div style={{
                  position: 'absolute',
                  top: -12,
                  right: 16,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  padding: '4px 12px',
                  borderRadius: 12,
                  fontSize: 12,
                  fontWeight: 700,
                }}>
                  MELHOR OFERTA
                </div>
              )}

              <h3 style={{
                fontSize: 18,
                fontWeight: 700,
                margin: '0 0 8px 0',
                color: '#1a1a1a',
              }}>
                {isAnnual ? 'Plano Anual' : 'Plano Mensal'}
              </h3>

              <div style={{ marginBottom: 12 }}>
                <span style={{
                  fontSize: 28,
                  fontWeight: 800,
                  color: '#667eea',
                }}>
                  {product.priceString}
                </span>
                <span style={{ color: '#666', fontSize: 14 }}>
                  {isAnnual ? '/ano' : '/mês'}
                </span>
              </div>

              {isAnnual && (
                <p style={{ fontSize: 13, color: '#059669', marginBottom: 12 }}>
                  Economia de 66% comparado ao mensal
                </p>
              )}

              <button
                onClick={() => handlePurchase(pkg)}
                disabled={isLoading}
                style={{
                  width: '100%',
                  padding: 14,
                  borderRadius: 12,
                  border: 'none',
                  background: isLoading
                    ? '#e5e7eb'
                    : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: isLoading ? '#9ca3af' : 'white',
                  fontSize: 16,
                  fontWeight: 700,
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                }}
              >
                {isLoading ? 'Processando...' : 'Assinar'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Restore */}
      <div style={{ marginTop: 24, textAlign: 'center' }}>
        <button
          onClick={handleRestore}
          disabled={isLoading}
          style={{
            background: 'none',
            border: 'none',
            color: '#667eea',
            fontSize: 14,
            cursor: 'pointer',
            textDecoration: 'underline',
          }}
        >
          Restaurar compra anterior
        </button>
      </div>

      {/* Subscription Terms - Required by Apple */}
      <div style={{
        marginTop: 24,
        padding: '16px 0',
        borderTop: '1px solid #e5e7eb',
        textAlign: 'center'
      }}>
        <p style={{
          fontSize: 11,
          color: '#9ca3af',
          lineHeight: 1.6,
          margin: '0 0 12px 0'
        }}>
          A assinatura sera renovada automaticamente ao final de cada periodo.
          O pagamento sera cobrado na sua conta da App Store.
          Voce pode cancelar a qualquer momento nas configuracoes da sua conta.
        </p>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 16,
          flexWrap: 'wrap'
        }}>
          <a
            href="/privacidade"
            style={{
              fontSize: 12,
              color: '#667eea',
              textDecoration: 'underline'
            }}
          >
            Politica de Privacidade
          </a>
          <a
            href="/termos"
            style={{
              fontSize: 12,
              color: '#667eea',
              textDecoration: 'underline'
            }}
          >
            Termos de Uso
          </a>
        </div>
      </div>

      {/* Close */}
      {onClose && (
        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#666',
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            Fechar
          </button>
        </div>
      )}
    </div>
  );
}
