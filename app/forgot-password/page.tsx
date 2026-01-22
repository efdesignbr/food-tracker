'use client';

import { useState } from 'react';
import { api } from '@/lib/api-client';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.post('/api/auth/forgot-password', { email });
      setSubmitted(true);
    } catch (err: any) {
      setError('Não foi possível enviar o e-mail. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f5f5f5'
    }}>
      <div style={{
        width: '100%',
        maxWidth: 420,
        padding: 24,
        backgroundColor: '#fff',
        borderRadius: 12,
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ margin: 0, marginBottom: 8, fontSize: 24 }}>Redefinir senha</h1>
        <p style={{ marginTop: 0, color: '#666' }}>Informe seu e-mail para enviar o link de redefinição.</p>

        {!submitted ? (
          <form onSubmit={onSubmit} style={{ display: 'grid', gap: 16 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 14 }}>E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: 14,
                  border: '1px solid #e0e0e0',
                  borderRadius: 8
                }}
              />
            </div>

            {error && (
              <div style={{ background: '#ffebee', color: '#c62828', padding: 12, borderRadius: 8 }}>{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px 16px',
                fontSize: 16,
                fontWeight: 600,
                color: 'white',
                background: loading ? '#999' : '#2196F3',
                border: 'none',
                borderRadius: 8,
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Enviando…' : 'Enviar link'}
            </button>

            <div style={{ textAlign: 'center' }}>
              <Link href="/login" style={{ color: '#2196F3', textDecoration: 'none' }}>Voltar ao login</Link>
            </div>
          </form>
        ) : (
          <div>
            <div style={{ background: '#E3F2FD', color: '#0D47A1', padding: 12, borderRadius: 8 }}>
              Se o e-mail existir, enviaremos o link de redefinição.
            </div>
            <p style={{ marginTop: 16, color: '#666' }}>
              Verifique sua caixa de entrada (e também a pasta de spam). O link expira em 30 minutos.
            </p>
            <div style={{ textAlign: 'center' }}>
              <Link href="/login" style={{ color: '#2196F3', textDecoration: 'none' }}>Voltar ao login</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

