'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api-client';

type Restaurant = {
  id: string;
  name: string;
  address?: string | null;
};

export default function RestaurantsPage() {
  const [items, setItems] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    try {
      setLoading(true);
      const res = await api.get('/api/restaurants');
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erro ao carregar');
      setItems(json.restaurants || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function createRestaurant(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      setSubmitting(true);
      const res = await api.post('/api/restaurants', { name: name.trim(), address: address.trim() || null });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erro ao cadastrar');
      setName('');
      setAddress('');
      setItems((prev) => [json.restaurant, ...prev]);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ padding: 16, maxWidth: 800, margin: '0 auto' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}> Restaurantes</h1>

      {/* Create */}
      <form onSubmit={createRestaurant} style={{
        background: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        border: '1px solid #e5e7eb'
      }}>
        <div style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr' }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Nome *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Restaurante da Praça"
              style={{ width: '100%', padding: 10, border: '1px solid #d1d5db', borderRadius: 8 }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Endereço (opcional)</label>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Rua Exemplo, 123"
              style={{ width: '100%', padding: 10, border: '1px solid #d1d5db', borderRadius: 8 }}
            />
          </div>
          <div>
            <button
              type="submit"
              disabled={submitting || !name.trim()}
              style={{
                width: '100%',
                padding: 12,
                background: submitting ? '#9ca3af' : '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                fontWeight: 700,
                cursor: submitting ? 'not-allowed' : 'pointer'
              }}
            >
              {submitting ? 'Cadastrando...' : 'Cadastrar Restaurante'}
            </button>
          </div>
        </div>
      </form>

      {/* List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 24 }}>Carregando...</div>
      ) : error ? (
        <div style={{
          padding: 16,
          background: '#fee2e2',
          border: '2px solid #ef4444',
          borderRadius: 12,
          marginBottom: 16,
          color: '#991b1b'
        }}>
          {error}
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 8 }}>
          {items.length === 0 && (
            <div style={{ textAlign: 'center', padding: 24, background: '#f9fafb', borderRadius: 12, border: '1px dashed #e5e7eb' }}>
              Nenhum restaurante cadastrado ainda.
            </div>
          )}
          {items.map(r => (
            <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', border: '1px solid #e5e7eb', borderRadius: 12, padding: 12 }}>
              <div>
                <div style={{ fontWeight: 700, color: '#374151' }}>{r.name}</div>
                {r.address && <div style={{ fontSize: 12, color: '#6b7280' }}>{r.address}</div>}
              </div>
              <div style={{ fontSize: 20 }}></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

