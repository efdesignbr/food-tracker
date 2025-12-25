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

interface FoodSuggestion {
  food_name: string;
  consumption_count: number;
  days_consumed: number;
  avg_quantity: number;
  common_unit: string | null;
  last_consumed: string;
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

  // Suggestions states
  const [suggestions, setSuggestions] = useState<FoodSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // Duplicate modal
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateSourceList, setDuplicateSourceList] = useState<ShoppingList | null>(null);
  const [duplicateNewName, setDuplicateNewName] = useState('');

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

  async function fetchSuggestions() {
    try {
      setLoadingSuggestions(true);
      const res = await api.get('/api/shopping-lists/suggestions');
      const json = await res.json();
      if (res.ok) {
        setSuggestions(json.suggestions || []);
        setShowSuggestions(true);
      }
    } catch (e) {
      console.error('Erro ao buscar sugestões:', e);
    } finally {
      setLoadingSuggestions(false);
    }
  }

  async function handleAcceptSuggestion(suggestion: FoodSuggestion) {
    if (!selectedList) return;

    try {
      await api.post('/api/shopping-lists/items', {
        list_id: selectedList.id,
        name: suggestion.food_name.charAt(0).toUpperCase() + suggestion.food_name.slice(1),
        quantity: Math.round(suggestion.avg_quantity) || 1,
        unit: suggestion.common_unit || undefined
      });
      // Remove da lista de sugestões
      setSuggestions(prev => prev.filter(s => s.food_name !== suggestion.food_name));
      await fetchListDetails(selectedList.id);
    } catch (e) {
      console.error('Erro ao adicionar sugestão:', e);
    }
  }

  function handleRejectSuggestion(suggestion: FoodSuggestion) {
    setSuggestions(prev => prev.filter(s => s.food_name !== suggestion.food_name));
  }

  function openDuplicateModal(list: ShoppingList) {
    setDuplicateSourceList(list);
    setDuplicateNewName(`Cópia de ${list.name}`);
    setShowDuplicateModal(true);
  }

  async function handleDuplicateList(e: React.FormEvent) {
    e.preventDefault();
    if (!duplicateSourceList || !duplicateNewName.trim()) return;

    try {
      const res = await api.post('/api/shopping-lists/duplicate', {
        source_list_id: duplicateSourceList.id,
        name: duplicateNewName
      });
      const json = await res.json();

      if (res.ok) {
        setShowDuplicateModal(false);
        setDuplicateSourceList(null);
        setDuplicateNewName('');
        await fetchLists();
        // Abre a lista duplicada
        if (json.list) {
          fetchListDetails(json.list.id);
        }
      } else {
        setError(json.error || 'Erro ao duplicar lista');
      }
    } catch (e: any) {
      setError(e.message);
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
              padding: '8px 10px',
              background: '#fee2e2',
              border: '1px solid #fca5a5',
              borderRadius: 8,
              cursor: 'pointer',
              color: '#dc2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Excluir lista"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14M10 11v6M14 11v6"/>
            </svg>
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
          <button
            onClick={fetchSuggestions}
            disabled={loadingSuggestions}
            style={{
              padding: '12px 24px',
              background: '#f59e0b',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              cursor: loadingSuggestions ? 'not-allowed' : 'pointer',
              fontSize: 14,
              fontWeight: 600,
              opacity: loadingSuggestions ? 0.7 : 1
            }}
          >
            {loadingSuggestions ? 'Carregando...' : 'Sugestoes'}
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
                      padding: '6px 10px',
                      background: '#fee2e2',
                      border: '1px solid #fca5a5',
                      borderRadius: 6,
                      cursor: 'pointer',
                      color: '#dc2626',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="Remover item"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14M10 11v6M14 11v6"/>
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Suggestions */}
        {showSuggestions && suggestions.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h2 style={{ fontSize: 16, fontWeight: 600, color: '#f59e0b' }}>
                SUGESTOES ({suggestions.length})
              </h2>
              <button
                onClick={() => setShowSuggestions(false)}
                style={{
                  padding: '4px 8px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 12,
                  color: '#6b7280'
                }}
              >
                Fechar
              </button>
            </div>
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 12 }}>
              Baseado no seu consumo dos ultimos 30 dias
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {suggestions.map(suggestion => (
                <div
                  key={suggestion.food_name}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: 16,
                    background: '#fffbeb',
                    border: '2px solid #fcd34d',
                    borderRadius: 12
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, textTransform: 'capitalize' }}>{suggestion.food_name}</div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>
                      Consumido {suggestion.consumption_count}x em {suggestion.days_consumed} dias
                    </div>
                  </div>
                  <button
                    onClick={() => handleAcceptSuggestion(suggestion)}
                    style={{
                      padding: '8px 16px',
                      background: '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: 6,
                      cursor: 'pointer',
                      fontSize: 12,
                      fontWeight: 600
                    }}
                  >
                    Adicionar
                  </button>
                  <button
                    onClick={() => handleRejectSuggestion(suggestion)}
                    style={{
                      padding: '8px 12px',
                      background: '#f3f4f6',
                      border: '1px solid #d1d5db',
                      borderRadius: 6,
                      cursor: 'pointer',
                      fontSize: 14,
                      color: '#6b7280'
                    }}
                  >
                    X
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

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
                      borderRadius: 8,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
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
                        borderRadius: 8,
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
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
                        borderRadius: 8,
                        boxSizing: 'border-box'
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
            width: 44,
            height: 44,
            background: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            fontSize: 28,
            fontWeight: 400,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            lineHeight: 1
          }}
          title="Nova lista"
        >
          +
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
                    style={{
                      padding: 16,
                      background: 'white',
                      border: '2px solid #e5e7eb',
                      borderRadius: 12,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div
                      onClick={() => fetchListDetails(list.id)}
                      style={{ flex: 1, cursor: 'pointer' }}
                    >
                      <div style={{ fontWeight: 600, fontSize: 16 }}>{list.name}</div>
                      <div style={{ fontSize: 14, color: '#6b7280' }}>
                        Criada em {formatDate(list.created_at)}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); openDuplicateModal(list); }}
                        style={{
                          padding: '8px 12px',
                          background: '#f3f4f6',
                          border: '1px solid #d1d5db',
                          borderRadius: 8,
                          cursor: 'pointer',
                          fontSize: 14,
                          fontWeight: 500,
                          color: '#374151'
                        }}
                        title="Duplicar lista"
                      >
                        Duplicar
                      </button>
                      <div
                        onClick={() => fetchListDetails(list.id)}
                        style={{
                          padding: '8px 16px',
                          background: '#dbeafe',
                          color: '#1e40af',
                          borderRadius: 8,
                          fontSize: 14,
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        Abrir
                      </div>
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
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, color: '#166534' }}>{list.name}</div>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>
                        Finalizada em {formatDate(list.completed_at || list.updated_at)}
                      </div>
                    </div>
                    <button
                      onClick={() => openDuplicateModal(list)}
                      style={{
                        padding: '6px 12px',
                        background: '#dcfce7',
                        border: '1px solid #86efac',
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontSize: 13,
                        fontWeight: 500,
                        color: '#166534'
                      }}
                      title="Duplicar lista"
                    >
                      Duplicar
                    </button>
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

      {/* Duplicate List Modal */}
      {showDuplicateModal && duplicateSourceList && (
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
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Duplicar Lista</h2>
            <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 16 }}>
              Duplicando: <strong>{duplicateSourceList.name}</strong>
            </p>
            <form onSubmit={handleDuplicateList}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
                  Nome da nova lista *
                </label>
                <input
                  type="text"
                  value={duplicateNewName}
                  onChange={e => setDuplicateNewName(e.target.value)}
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
              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  type="button"
                  onClick={() => { setShowDuplicateModal(false); setDuplicateSourceList(null); }}
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
                  Duplicar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
