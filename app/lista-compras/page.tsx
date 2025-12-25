'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';

interface ShoppingList {
  id: string;
  name: string;
  status: 'active' | 'completed' | 'archived';
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

interface ShoppingItem {
  id: string;
  list_id: string;
  name: string;
  quantity: number;
  unit: string | null;
  category: string | null;
  is_purchased: boolean;
  purchased_at: string | null;
  notes: string | null;
  created_at: string;
}

export default function ListaComprasPage() {
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [selectedList, setSelectedList] = useState<ShoppingList | null>(null);
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [showNewListModal, setShowNewListModal] = useState(false);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newItemName, setNewItemName] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('1');
  const [newItemUnit, setNewItemUnit] = useState('');

  useEffect(() => {
    fetchLists();
  }, []);

  async function fetchLists() {
    try {
      setLoading(true);
      const res = await api.get('/api/shopping-lists');
      const json = await res.json();
      if (res.ok) {
        setLists(json.lists || []);
      }
    } catch (e) {
      console.error('Erro ao buscar listas:', e);
    } finally {
      setLoading(false);
    }
  }

  async function fetchListDetails(listId: string) {
    try {
      const res = await api.get(`/api/shopping-lists/${listId}`);
      const json = await res.json();
      if (res.ok) {
        setSelectedList(json.list);
        setItems(json.items || []);
      }
    } catch (e) {
      console.error('Erro ao buscar detalhes:', e);
    }
  }

  async function handleCreateList(e: React.FormEvent) {
    e.preventDefault();
    if (!newListName.trim()) return;

    try {
      const res = await api.post('/api/shopping-lists', { name: newListName });
      const json = await res.json();

      if (res.ok) {
        setShowNewListModal(false);
        setNewListName('');
        await fetchLists();
        // Abre a lista recém-criada
        if (json.list) {
          fetchListDetails(json.list.id);
        }
      } else {
        setError(json.error || 'Erro ao criar lista');
      }
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function handleAddItem(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedList || !newItemName.trim()) return;

    try {
      const res = await api.post('/api/shopping-lists/items', {
        list_id: selectedList.id,
        name: newItemName,
        quantity: parseFloat(newItemQuantity) || 1,
        unit: newItemUnit || undefined
      });

      if (res.ok) {
        setShowAddItemModal(false);
        setNewItemName('');
        setNewItemQuantity('1');
        setNewItemUnit('');
        await fetchListDetails(selectedList.id);
      }
    } catch (e) {
      console.error('Erro ao adicionar item:', e);
    }
  }

  async function handleToggleItem(item: ShoppingItem) {
    try {
      await api.patch(`/api/shopping-lists/items?id=${item.id}`, {
        is_purchased: !item.is_purchased
      });
      if (selectedList) {
        await fetchListDetails(selectedList.id);
      }
    } catch (e) {
      console.error('Erro ao atualizar item:', e);
    }
  }

  async function handleDeleteItem(itemId: string) {
    if (!confirm('Remover este item?')) return;

    try {
      await api.delete(`/api/shopping-lists/items?id=${itemId}`);
      if (selectedList) {
        await fetchListDetails(selectedList.id);
      }
    } catch (e) {
      console.error('Erro ao remover item:', e);
    }
  }

  async function handleDeleteList(listId: string) {
    if (!confirm('Excluir esta lista?')) return;

    try {
      await api.delete(`/api/shopping-lists/${listId}`);
      setSelectedList(null);
      setItems([]);
      await fetchLists();
    } catch (e) {
      console.error('Erro ao excluir lista:', e);
    }
  }

  async function handleCompleteList() {
    if (!selectedList) return;
    if (!confirm('Finalizar esta lista?')) return;

    try {
      await api.patch(`/api/shopping-lists/${selectedList.id}`, {
        status: 'completed'
      });
      setSelectedList(null);
      setItems([]);
      await fetchLists();
    } catch (e) {
      console.error('Erro ao finalizar lista:', e);
    }
  }

  function formatDate(dateStr: string) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  }

  const activeLists = lists.filter(l => l.status === 'active');
  const completedLists = lists.filter(l => l.status === 'completed').slice(0, 5);
  const pendingItems = items.filter(i => !i.is_purchased);
  const purchasedItems = items.filter(i => i.is_purchased);

  // Detalhes da lista selecionada
  if (selectedList) {
    return (
      <div style={{ maxWidth: 800, margin: '0 auto', padding: 24 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <button
            onClick={() => { setSelectedList(null); setItems([]); }}
            style={{
              padding: '8px 16px',
              background: '#f3f4f6',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 600
            }}
          >
            Voltar
          </button>
          <h1 style={{ fontSize: 24, fontWeight: 700, flex: 1 }}>{selectedList.name}</h1>
          <button
            onClick={() => handleDeleteList(selectedList.id)}
            style={{
              padding: '8px 12px',
              background: '#fee2e2',
              color: '#dc2626',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 14
            }}
          >
            Excluir
          </button>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          <button
            onClick={() => setShowAddItemModal(true)}
            style={{
              padding: '12px 24px',
              background: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 600
            }}
          >
            + Adicionar Item
          </button>
        </div>

        {/* Pending Items */}
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: '#6b7280', marginBottom: 12 }}>
            PENDENTES ({pendingItems.length})
          </h2>
          {pendingItems.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: '#9ca3af', border: '2px dashed #e5e7eb', borderRadius: 12 }}>
              Nenhum item pendente
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {pendingItems.map(item => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: 16,
                    background: 'white',
                    border: '2px solid #e5e7eb',
                    borderRadius: 12
                  }}
                >
                  <input
                    type="checkbox"
                    checked={false}
                    onChange={() => handleToggleItem(item)}
                    style={{ width: 24, height: 24, cursor: 'pointer' }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>{item.name}</div>
                    <div style={{ fontSize: 14, color: '#6b7280' }}>
                      {item.quantity} {item.unit || 'un'}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    style={{
                      padding: '8px 12px',
                      background: '#fee2e2',
                      color: '#dc2626',
                      border: 'none',
                      borderRadius: 8,
                      cursor: 'pointer',
                      fontSize: 12
                    }}
                  >
                    Remover
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Purchased Items */}
        {purchasedItems.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: '#6b7280', marginBottom: 12 }}>
              COMPRADOS ({purchasedItems.length})
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {purchasedItems.map(item => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: 16,
                    background: '#f0fdf4',
                    border: '2px solid #bbf7d0',
                    borderRadius: 12,
                    opacity: 0.8
                  }}
                >
                  <input
                    type="checkbox"
                    checked={true}
                    onChange={() => handleToggleItem(item)}
                    style={{ width: 24, height: 24, cursor: 'pointer' }}
                  />
                  <div style={{ flex: 1, textDecoration: 'line-through', color: '#6b7280' }}>
                    <div style={{ fontWeight: 600 }}>{item.name}</div>
                    <div style={{ fontSize: 14 }}>
                      {item.quantity} {item.unit || 'un'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Complete List Button */}
        {pendingItems.length === 0 && items.length > 0 && (
          <button
            onClick={handleCompleteList}
            style={{
              width: '100%',
              padding: 16,
              background: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: 12,
              fontSize: 16,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Finalizar Lista
          </button>
        )}

        {/* Add Item Modal */}
        {showAddItemModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            zIndex: 1000
          }}>
            <div style={{
              background: 'white',
              borderRadius: 16,
              padding: 24,
              width: '100%',
              maxWidth: 400
            }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Adicionar Item</h2>
              <form onSubmit={handleAddItem}>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
                    Nome do item *
                  </label>
                  <input
                    type="text"
                    value={newItemName}
                    onChange={e => setNewItemName(e.target.value)}
                    placeholder="Ex: Arroz integral"
                    required
                    style={{
                      width: '100%',
                      padding: 12,
                      fontSize: 16,
                      border: '2px solid #e5e7eb',
                      borderRadius: 8
                    }}
                  />
                </div>
                <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
                      Quantidade
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={newItemQuantity}
                      onChange={e => setNewItemQuantity(e.target.value)}
                      style={{
                        width: '100%',
                        padding: 12,
                        fontSize: 16,
                        border: '2px solid #e5e7eb',
                        borderRadius: 8
                      }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
                      Unidade
                    </label>
                    <input
                      type="text"
                      value={newItemUnit}
                      onChange={e => setNewItemUnit(e.target.value)}
                      placeholder="kg, un, L..."
                      style={{
                        width: '100%',
                        padding: 12,
                        fontSize: 16,
                        border: '2px solid #e5e7eb',
                        borderRadius: 8
                      }}
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button
                    type="button"
                    onClick={() => setShowAddItemModal(false)}
                    style={{
                      flex: 1,
                      padding: 12,
                      background: '#f3f4f6',
                      border: 'none',
                      borderRadius: 8,
                      cursor: 'pointer',
                      fontSize: 16,
                      fontWeight: 600
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    style={{
                      flex: 1,
                      padding: 12,
                      background: '#2196F3',
                      color: 'white',
                      border: 'none',
                      borderRadius: 8,
                      cursor: 'pointer',
                      fontSize: 16,
                      fontWeight: 600
                    }}
                  >
                    Adicionar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Lista principal
  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700 }}>Lista de Compras</h1>
        <button
          onClick={() => setShowNewListModal(true)}
          style={{
            padding: '12px 24px',
            background: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 600
          }}
        >
          + Nova
        </button>
      </div>

      {loading ? (
        <div style={{ padding: 32, textAlign: 'center', color: '#9ca3af' }}>
          Carregando...
        </div>
      ) : (
        <>
          {/* Active Lists */}
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: '#6b7280', marginBottom: 12 }}>
              LISTAS ATIVAS
            </h2>
            {activeLists.length === 0 ? (
              <div style={{
                padding: 32,
                textAlign: 'center',
                color: '#9ca3af',
                border: '2px dashed #e5e7eb',
                borderRadius: 12
              }}>
                Nenhuma lista ativa
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {activeLists.map(list => (
                  <div
                    key={list.id}
                    onClick={() => fetchListDetails(list.id)}
                    style={{
                      padding: 16,
                      background: 'white',
                      border: '2px solid #e5e7eb',
                      borderRadius: 12,
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 16 }}>{list.name}</div>
                      <div style={{ fontSize: 14, color: '#6b7280' }}>
                        Criada em {formatDate(list.created_at)}
                      </div>
                    </div>
                    <div style={{
                      padding: '8px 16px',
                      background: '#dbeafe',
                      color: '#1e40af',
                      borderRadius: 8,
                      fontSize: 14,
                      fontWeight: 600
                    }}>
                      Abrir
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Completed Lists */}
          {completedLists.length > 0 && (
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 600, color: '#6b7280', marginBottom: 12 }}>
                LISTAS CONCLUIDAS (ultimas 5)
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {completedLists.map(list => (
                  <div
                    key={list.id}
                    style={{
                      padding: 12,
                      background: '#f0fdf4',
                      border: '2px solid #bbf7d0',
                      borderRadius: 12,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      opacity: 0.8
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, color: '#166534' }}>{list.name}</div>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>
                        Finalizada em {formatDate(list.completed_at || list.updated_at)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* New List Modal */}
      {showNewListModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: 16,
            padding: 24,
            width: '100%',
            maxWidth: 400
          }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Nova Lista de Compras</h2>
            <form onSubmit={handleCreateList}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
                  Nome da lista *
                </label>
                <input
                  type="text"
                  value={newListName}
                  onChange={e => setNewListName(e.target.value)}
                  placeholder="Ex: Compras da semana"
                  required
                  style={{
                    width: '100%',
                    padding: 12,
                    fontSize: 16,
                    border: '2px solid #e5e7eb',
                    borderRadius: 8,
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              {error && (
                <div style={{
                  padding: 12,
                  background: '#fee2e2',
                  border: '2px solid #ef4444',
                  borderRadius: 8,
                  color: '#991b1b',
                  marginBottom: 16
                }}>
                  {error}
                </div>
              )}
              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  type="button"
                  onClick={() => { setShowNewListModal(false); setError(null); }}
                  style={{
                    flex: 1,
                    padding: 12,
                    background: '#f3f4f6',
                    border: 'none',
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontSize: 16,
                    fontWeight: 600
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: 12,
                    background: '#2196F3',
                    color: 'white',
                    border: 'none',
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontSize: 16,
                    fontWeight: 600
                  }}
                >
                  Criar Lista
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
