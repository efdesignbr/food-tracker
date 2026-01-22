'use client';

import { useState, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api-client';

export default function ResetPasswordPage() {
  const search = useSearchParams();
  const router = useRouter();
  const token = useMemo(() => (search.get('token') || '').trim(), [search]);

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const canSubmit = token && password.length >= 8 && password === confirm;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);
    setLoading(true);
    try {
      const res = await api.post('/api/auth/reset-password', { token, newPassword: password });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Não foi possível redefinir a senha');
      } else {
        setSuccess(true);
      }
    } catch (err: any) {
      setError('Erro ao redefinir a senha. Tente novamente.');
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
        <h1 style={{ margin: 0, marginBottom: 8, fontSize: 24 }}>Definir nova senha</h1>
        {!token && (
          <div style={{ background: '#ffebee', color: '#c62828', padding: 12, borderRadius: 8, marginBottom: 12 }}>
            Token ausente. Solicite um novo link de redefinição.
          </div>
        )}

        {!success ? (
          <form onSubmit={onSubmit} style={{ display: 'grid', gap: 16 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 14 }}>Nova senha</label>
              <input
                type="password"
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Mínimo 8 caracteres"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: 14,
                  border: '1px solid #e0e0e0',
                  borderRadius: 8
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 14 }}>Confirmar nova senha</label>
              <input
                type="password"
                minLength={8}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
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
              disabled={loading || !canSubmit}
              style={{
                width: '100%',
                padding: '12px 16px',
                fontSize: 16,
                fontWeight: 600,
                color: 'white',
                background: loading || !canSubmit ? '#999' : '#2196F3',
                border: 'none',
                borderRadius: 8,
                cursor: loading || !canSubmit ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Salvando…' : 'Salvar nova senha'}
            </button>

            <div style={{ textAlign: 'center' }}>
              <Link href="/login" style={{ color: '#2196F3', textDecoration: 'none' }}>Voltar ao login</Link>
            </div>
          </form>
        ) : (
          <div>
            <div style={{ background: '#E3F2FD', color: '#0D47A1', padding: 12, borderRadius: 8 }}>
              Senha redefinida com sucesso! Você já pode fazer login.
            </div>
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <Link href="/login" style={{ color: '#2196F3', textDecoration: 'none' }}>Ir para login</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

