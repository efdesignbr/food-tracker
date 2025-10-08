'use client';

import Link from 'next/link';

export default function HomePage() {
  return (
    <main style={{ padding: 24, fontFamily: 'system-ui, -apple-system' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700 }}>Food Tracker</h1>
      <p style={{ marginTop: 8 }}>Bem-vindo! Escolha uma ação:</p>
      <ul style={{ marginTop: 16, display: 'grid', gap: 8 }}>
        <li><Link href="/login">Login</Link></li>
        <li><Link href="/capture">Capturar Refeição</Link></li>
        <li><Link href="/history">Histórico</Link></li>
        <li><Link href="/reports">Relatórios</Link></li>
      </ul>
    </main>
  );
}
