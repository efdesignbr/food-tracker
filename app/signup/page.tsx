'use client';

import { useState, useEffect, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api-client';

function SignupForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDeletedMessage, setShowDeletedMessage] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get('deleted') === 'true') {
      setShowDeletedMessage(true);
      setTimeout(() => setShowDeletedMessage(false), 8000);
    }
  }, [searchParams]);

  async function onSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Criar conta
      const res = await api.post('/api/auth/signup', { name, email, password, companyName });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Erro ao criar conta');
        setLoading(false);
        return;
      }

      // Auto-login após cadastro
      const signInRes = await signIn('credentials', {
        email,
        password,
        redirect: false
      });

      if (signInRes?.error) {
        setError('Conta criada, mas erro ao fazer login. Tente fazer login manualmente.');
        setLoading(false);
      } else if (signInRes?.ok) {
        router.push('/onboarding');
        router.refresh();
      }
    } catch (e: any) {
      setError('Erro ao criar conta. Tente novamente.');
      setLoading(false);
    }
  }

  return (
    <div style={{
      width: '100%',
      maxWidth: 400,
      padding: 32,
      backgroundColor: '#fff',
      borderRadius: 12,
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
    }}>
      <h1 style={{
        fontSize: 28,
        fontWeight: 700,
        marginBottom: 8,
        textAlign: 'center'
      }}>
        Food Tracker
      </h1>
      <p style={{
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 32
      }}>
        Crie sua conta grátis
      </p>

      {showDeletedMessage && (
        <div style={{
          padding: 16,
          backgroundColor: '#d1fae5',
          border: '2px solid #10b981',
          borderRadius: 12,
          marginBottom: 16,
          color: '#065f46',
          fontWeight: 600,
          textAlign: 'center'
        }}>
           Conta excluída com sucesso. Você pode criar uma nova conta quando quiser.
        </div>
      )}

      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 16 }}>
        <div>
          <label style={{
            display: 'block',
            fontSize: 14,
            fontWeight: 500,
            marginBottom: 8
          }}>
            Nome completo
          </label>
          <input
            type="text"
            placeholder="Seu nome"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '12px 16px',
              fontSize: 14,
              border: '1px solid #e0e0e0',
              borderRadius: 8,
              outline: 'none',
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = '#2196F3'}
            onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
          />
        </div>

        <div>
          <label style={{
            display: 'block',
            fontSize: 14,
            fontWeight: 500,
            marginBottom: 8
          }}>
            Email
          </label>
          <input
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '12px 16px',
              fontSize: 14,
              border: '1px solid #e0e0e0',
              borderRadius: 8,
              outline: 'none',
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = '#2196F3'}
            onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
          />
        </div>

        <div>
          <label style={{
            display: 'block',
            fontSize: 14,
            fontWeight: 500,
            marginBottom: 8
          }}>
            Senha
          </label>
          <input
            type="password"
            placeholder="Mínimo 8 caracteres"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={8}
            style={{
              width: '100%',
              padding: '12px 16px',
              fontSize: 14,
              border: '1px solid #e0e0e0',
              borderRadius: 8,
              outline: 'none',
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = '#2196F3'}
            onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
          />
        </div>

        <div>
          <label style={{
            display: 'block',
            fontSize: 14,
            fontWeight: 500,
            marginBottom: 8
          }}>
            Nome da empresa (opcional)
          </label>
          <input
            type="text"
            placeholder="Deixe em branco para usar seu nome"
            value={companyName}
            onChange={e => setCompanyName(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              fontSize: 14,
              border: '1px solid #e0e0e0',
              borderRadius: 8,
              outline: 'none',
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = '#2196F3'}
            onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
          />
        </div>

        {error && (
          <div style={{
            padding: 12,
            backgroundColor: '#ffebee',
            color: '#c62828',
            borderRadius: 8,
            fontSize: 14
          }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px 24px',
            fontSize: 16,
            fontWeight: 600,
            color: '#fff',
            backgroundColor: loading ? '#999' : '#2196F3',
            border: 'none',
            borderRadius: 8,
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => {
            if (!loading) e.currentTarget.style.backgroundColor = '#1976D2';
          }}
          onMouseLeave={(e) => {
            if (!loading) e.currentTarget.style.backgroundColor = '#2196F3';
          }}
        >
          {loading ? 'Criando conta...' : 'Criar conta grátis'}
        </button>
      </form>

      <p style={{ textAlign: 'center', marginTop: 16, color: '#666', fontSize: 14 }}>
        Já tem uma conta?{' '}
        <Link
          href="/login"
          style={{
            color: '#2196F3',
            fontWeight: 600,
            textDecoration: 'none'
          }}
        >
          Fazer login
        </Link>
      </p>
    </div>
  );
}

export default function SignupPage() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f5f5f5'
    }}>
      <Suspense fallback={<div>Carregando...</div>}>
        <SignupForm />
      </Suspense>
    </div>
  );
}
