'use client';

import { useState, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Capacitor } from '@capacitor/core';
import { api } from '@/lib/api-client';

function LoginForm() {
  // Detecta mobile em runtime, não em build time
  const isMobile = typeof window !== 'undefined' && Capacitor.isNativePlatform();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  async function onSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setError(null);
    setLoading(true);
    try {
      console.log('Tentando login com:', { email, isMobile });

      if (isMobile) {
        // Fluxo Mobile: Token JWT
        const res = await api.post('/api/auth/mobile-login', { email, password });
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || 'Erro no login');
        } else {
          // Salva token e redireciona
          if (data.token) {
            localStorage.setItem('auth_token', data.token);
            console.log('Token salvo, redirecionando...');
            router.push('/');
            router.refresh();
          } else {
            setError('Erro: Token não recebido');
          }
        }
      } else {
        // Fluxo Web: Cookie NextAuth
        const res = await signIn('credentials', {
          email,
          password,
          redirect: false
        });

        if (res?.error) {
          console.error('Erro no login:', res.error);
          setError('Email ou senha incorretos');
        } else if (res?.ok) {
          console.log('Login bem-sucedido, redirecionando para:', callbackUrl);
          router.push(callbackUrl);
          router.refresh();
        } else {
          console.warn('Resposta inesperada:', res);
          setError('Erro inesperado ao fazer login');
        }
      }
    } catch (e: any) {
      console.error('Exceção ao fazer login:', e);
      setError('Erro ao fazer login: ' + e.message);
    } finally {
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
        Faça login para continuar
      </p>

      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 16 }}>
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
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
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
          {loading ? 'Entrando…' : 'Entrar'}
        </button>
      </form>

      <p style={{ textAlign: 'center', marginTop: 16, color: '#666', fontSize: 14 }}>
        Ainda nao tem conta?{' '}
        <Link
          href="/signup"
          style={{
            color: '#2196F3',
            fontWeight: 600,
            textDecoration: 'none'
          }}
        >
          Criar conta
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f5f5f5'
    }}>
      <Suspense fallback={<div>Carregando...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
