'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api, apiClient } from '@/lib/api-client';
import { useUserPlan } from '@/hooks/useUserPlan';

interface ShoppingList {
  id: string;
  name: string;
  status: 'active' | 'completed' | 'archived';
  store_id: string | null;
  store_name: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  total_price?: number;
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
  price: number | null;
  unit_price: number | null;
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

interface Store {
  id: string;
  name: string;
  address: string | null;
}

export default function ListaComprasPage() {
  const router = useRouter();
  const { plan } = useUserPlan();
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

  // Store states
  const [stores, setStores] = useState<Store[]>([]);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [selectedStoreId, setSelectedStoreId] = useState<string>('');
  const [showNewStoreInput, setShowNewStoreInput] = useState(false);
  const [newStoreName, setNewStoreName] = useState('');

  // View completed list states
  const [isViewingCompleted, setIsViewingCompleted] = useState(false);
  const [isEditingCompleted, setIsEditingCompleted] = useState(false);
  const [showAllCompleted, setShowAllCompleted] = useState(false);
  const [editStoreId, setEditStoreId] = useState<string>('');

  // Complete with transfer states
  const [completeStep, setCompleteStep] = useState<1 | 2>(1);
  const [newListNameForTransfer, setNewListNameForTransfer] = useState('');

  // Scan receipt states
  const [showScanModal, setShowScanModal] = useState(false);
  const [scanLoading, setScanLoading] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanListName, setScanListName] = useState('');
  const [scanStoreId, setScanStoreId] = useState<string>('');
  const [showScanNewStore, setShowScanNewStore] = useState(false);
  const [scanNewStoreName, setScanNewStoreName] = useState('');

  // Edit item modal states
  const [showEditItemModal, setShowEditItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ShoppingItem | null>(null);
  const [editItemName, setEditItemName] = useState('');
  const [editItemQuantity, setEditItemQuantity] = useState('');
  const [editItemUnit, setEditItemUnit] = useState('');
  const [editItemUnitPrice, setEditItemUnitPrice] = useState('');
  const [editItemPrice, setEditItemPrice] = useState('');

  useEffect(() => {
    fetchLists();
    fetchStores();
  }, []);

  async function fetchStores() {
    try {
      const res = await api.get('/api/stores');
      const json = await res.json();
      if (res.ok) {
        setStores(json.stores || []);
      }
    } catch (e) {
      console.error('Erro ao buscar lojas:', e);
    }
  }

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
      const newIsPurchased = !item.is_purchased;
      const updates: any = { is_purchased: newIsPurchased };

      // Se desmarcar o item, reseta os valores de preço
      if (!newIsPurchased) {
        updates.price = null;
        updates.unitPrice = null; // Backend espera unitPrice
      }

      await api.patch(`/api/shopping-lists/items?id=${item.id}`, updates);
      if (selectedList) {
        await fetchListDetails(selectedList.id);
      }
    } catch (e) {
      console.error('Erro ao atualizar item:', e);
    }
  }

  async function handleUpdatePrice(itemId: string, price: number | null) {
    try {
      await api.patch(`/api/shopping-lists/items?id=${itemId}`, { price });
      if (selectedList) {
        await fetchListDetails(selectedList.id);
      }
    } catch (e) {
      console.error('Erro ao atualizar preço:', e);
    }
  }

  async function handleUpdateItemDetails(itemId: string, updates: { quantity?: number; unit?: string; price?: number | null; unitPrice?: number | null }) {
    try {
      await api.patch(`/api/shopping-lists/items?id=${itemId}`, updates);
      if (selectedList) {
        await fetchListDetails(selectedList.id);
      }
    } catch (e) {
      console.error('Erro ao atualizar item:', e);
    }
  }

  // Converte quantidade para unidade de referência do preço (ex: 500g -> 0.5kg)
  function convertQuantityForPrice(quantity: number, unit: string | null): number {
    const u = (unit || 'un').toLowerCase();
    // Se a unidade é gramas, assume preço por kg
    if (u === 'g') return quantity / 1000;
    // Se a unidade é ml, assume preço por litro
    if (u === 'ml') return quantity / 1000;
    // Outras unidades: quantidade direta
    return quantity;
  }

  // Converte de volta para a unidade original (ex: 0.5kg -> 500g)
  function convertQuantityFromPrice(quantity: number, unit: string | null): number {
    const u = (unit || 'un').toLowerCase();
    if (u === 'g') return quantity * 1000;
    if (u === 'ml') return quantity * 1000;
    return quantity;
  }

  async function handleSmartPriceUpdate(
    item: ShoppingItem,
    field: 'quantity' | 'unit_price' | 'price',
    value: number
  ) {
    let updates: { quantity?: number; unit_price?: number; price?: number } = {};

    // Quantidade convertida para unidade de referência (ex: 500g -> 0.5kg)
    const getConvertedQty = (qty: number) => convertQuantityForPrice(qty, item.unit);

    // Lógica da Calculadora Inteligente
    if (field === 'quantity') {
      updates.quantity = value;
      const convertedQty = getConvertedQty(value);
      // Se mudar quantidade e tiver preço unitário, recalcula total
      if (item.unit_price) {
        updates.price = Number((convertedQty * item.unit_price).toFixed(2));
      }
      // Se tiver total mas não unitário, recalcula unitário (caso de pesáveis)
      else if (item.price && convertedQty > 0) {
        updates.unit_price = Number((item.price / convertedQty).toFixed(2));
      }
    } else if (field === 'unit_price') {
      updates.unit_price = value;
      const convertedQty = getConvertedQty(item.quantity);
      // Se mudar unitário, recalcula total baseado na quantidade convertida
      if (convertedQty > 0) {
        updates.price = Number((convertedQty * value).toFixed(2));
      }
    } else if (field === 'price') {
      updates.price = value;
      const convertedQty = getConvertedQty(item.quantity);
      // Se mudar total, recalcula unitário baseado na quantidade convertida
      if (convertedQty > 0) {
        updates.unit_price = Number((value / convertedQty).toFixed(2));
      }
    }

    // Atualização Otimista da UI
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, ...updates } : i));

    // Persistência
    try {
      // Mapear unit_price para unitPrice para a API
      const apiUpdates: any = { ...updates };
      if (updates.unit_price !== undefined) {
        apiUpdates.unitPrice = updates.unit_price;
        delete apiUpdates.unit_price;
      }

      await api.patch(`/api/shopping-lists/items?id=${item.id}`, apiUpdates);
      // Não recarrega tudo para não perder foco, pois já atualizamos localmente
    } catch (e) {
      console.error('Erro ao atualizar item:', e);
      // Reverter em caso de erro (opcional, mas recomendado)
      await fetchListDetails(selectedList!.id);
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

  function openEditItemModal(item: ShoppingItem) {
    setEditingItem(item);
    setEditItemName(item.name);
    setEditItemQuantity(String(item.quantity));
    setEditItemUnit(item.unit || '');
    setEditItemUnitPrice(item.unit_price ? String(item.unit_price) : '');
    setEditItemPrice(item.price ? String(item.price) : '');
    setShowEditItemModal(true);
  }

  async function handleSaveEditItem() {
    if (!editingItem || !editItemName.trim()) return;

    try {
      const updates: any = {
        name: editItemName.trim(),
        quantity: parseFloat(editItemQuantity) || 1,
        unit: editItemUnit || null,
      };

      // Só inclui preços se tiver valores
      if (editItemUnitPrice) {
        updates.unitPrice = parseFloat(editItemUnitPrice);
      }
      if (editItemPrice) {
        updates.price = parseFloat(editItemPrice);
      }

      await api.patch(`/api/shopping-lists/items?id=${editingItem.id}`, updates);

      setShowEditItemModal(false);
      setEditingItem(null);

      if (selectedList) {
        await fetchListDetails(selectedList.id);
      }
    } catch (e) {
      console.error('Erro ao salvar item:', e);
    }
  }

  async function handleDeleteList(listId: string) {
    if (!confirm('Excluir esta lista?')) return;

    try {
      await api.delete(`/api/shopping-lists/${listId}`);
      setSelectedList(null);
      setItems([]);
      setIsViewingCompleted(false);
      setIsEditingCompleted(false);
      await fetchLists();
    } catch (e) {
      console.error('Erro ao excluir lista:', e);
    }
  }

  function openCompleteModal() {
    setSelectedStoreId('');
    setShowNewStoreInput(false);
    setNewStoreName('');
    setCompleteStep(1);
    setNewListNameForTransfer('');
    setShowCompleteModal(true);
  }

  async function handleCompleteList() {
    if (!selectedList) return;

    const hasPendingItems = pendingItems.length > 0;

    // Se está no passo 1 e há itens pendentes, vai para passo 2
    if (completeStep === 1 && hasPendingItems) {
      // Sugestão de nome para nova lista
      const today = new Date();
      const dateStr = today.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      setNewListNameForTransfer(`Pendentes ${selectedList.name} - ${dateStr}`);
      setCompleteStep(2);
      return;
    }

    try {
      let storeId = selectedStoreId || null;

      // Se está criando nova loja
      if (showNewStoreInput && newStoreName.trim()) {
        const res = await api.post('/api/stores', { name: newStoreName.trim() });
        const json = await res.json();
        if (res.ok && json.store) {
          storeId = json.store.id;
          await fetchStores();
        }
      }

      // Usar o novo endpoint de complete
      const res = await api.post('/api/shopping-lists/complete', {
        list_id: selectedList.id,
        store_id: storeId,
        new_list_name: hasPendingItems ? newListNameForTransfer : undefined
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Erro ao finalizar lista');
      }

      setShowCompleteModal(false);
      setSelectedList(null);
      setItems([]);
      await fetchLists();

      // Se criou nova lista, mostrar mensagem ou abrir
      if (json.new_list) {
        fetchListDetails(json.new_list.id);
      }
    } catch (e) {
      console.error('Erro ao finalizar lista:', e);
    }
  }

  function openCompletedList(list: ShoppingList) {
    setIsViewingCompleted(true);
    setIsEditingCompleted(false);
    setEditStoreId(list.store_id || '');
    fetchListDetails(list.id);
  }

  function startEditingCompleted() {
    setIsEditingCompleted(true);
  }

  async function saveCompletedEdits() {
    if (!selectedList) return;

    try {
      await api.patch(`/api/shopping-lists/${selectedList.id}`, {
        store_id: editStoreId || null
      });

      setIsEditingCompleted(false);
      await fetchLists();
      await fetchListDetails(selectedList.id);
    } catch (e) {
      console.error('Erro ao salvar edicoes:', e);
    }
  }

  function closeCompletedView() {
    setSelectedList(null);
    setItems([]);
    setIsViewingCompleted(false);
    setIsEditingCompleted(false);
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

  function openScanModal() {
    const today = new Date();
    const dateStr = today.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    setScanListName(`Compras ${dateStr}`);
    setScanStoreId('');
    setShowScanNewStore(false);
    setScanNewStoreName('');
    setScanError(null);
    setShowScanModal(true);
  }

  async function handleScanReceipt(e: React.FormEvent) {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const fileInput = form.querySelector('input[type="file"]') as HTMLInputElement;
    const file = fileInput?.files?.[0];

    if (!file) {
      setScanError('Selecione uma imagem da nota fiscal');
      return;
    }

    setScanLoading(true);
    setScanError(null);

    try {
      let storeId = scanStoreId || null;

      if (showScanNewStore && scanNewStoreName.trim()) {
        const storeRes = await api.post('/api/stores', { name: scanNewStoreName.trim() });
        const storeJson = await storeRes.json();
        if (storeRes.ok && storeJson.store) {
          storeId = storeJson.store.id;
          await fetchStores();
        }
      }

      const formData = new FormData();
      formData.append('image', file);
      formData.append('name', scanListName || `Compras ${new Date().toLocaleDateString('pt-BR')}`);
      if (storeId) {
        formData.append('store_id', storeId);
      }

      const res = await apiClient('/api/shopping-lists/scan-receipt', {
        method: 'POST',
        body: formData,
        timeoutMs: 90000
      });

      const json = await res.json();

      if (!res.ok) {
        if (res.status === 403 && json?.error === 'watch_ad_required') {
          const { showRewardedAd } = await import('@/lib/ads/admob');
          const ok = await showRewardedAd('scan_receipt');
          if (!ok) throw new Error('Anúncio indisponível. Tente novamente.');
          // Repetir com header de bypass
          const retry = await apiClient('/api/shopping-lists/scan-receipt', {
            method: 'POST',
            body: formData,
            headers: { 'x-ad-completed': '1' },
            timeoutMs: 90000
          });
          const retryJson = await retry.json();
          if (!retry.ok) throw new Error(retryJson.error || 'Erro ao analisar nota');
          setShowScanModal(false);
          await fetchLists();
          if (retryJson.list?.id) {
            openCompletedList({ id: retryJson.list.id, name: retryJson.list.name } as ShoppingList);
          }
          return;
        }
        throw new Error(json.error || 'Erro ao analisar nota');
      }

      setShowScanModal(false);
      await fetchLists();

      if (json.list?.id) {
        openCompletedList({ id: json.list.id, name: json.list.name } as ShoppingList);
      }
    } catch (err: any) {
      setScanError(err.message || 'Erro ao processar nota fiscal');
    } finally {
      setScanLoading(false);
    }
  }

  const activeLists = lists.filter(l => l.status === 'active');
  const allCompletedLists = lists.filter(l => l.status === 'completed');
  const completedLists = showAllCompleted ? allCompletedLists : allCompletedLists.slice(0, 5);
  const pendingItems = items.filter(i => !i.is_purchased);
  const purchasedItems = items.filter(i => i.is_purchased);
  const totalPrice = purchasedItems.reduce((sum, item) => sum + (Number(item.price) || 0), 0);

  function formatPrice(value: number) {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  // Visualização de lista concluída
  if (selectedList && isViewingCompleted) {
    return (
      <div style={{ maxWidth: 800, margin: '0 auto', padding: 24 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <button
            onClick={closeCompletedView}
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

        {/* Info da lista */}
        <div style={{
          padding: 16,
          background: '#f0fdf4',
          // border: '2px solid #bbf7d0', // Borda removida
          borderRadius: 12,
          marginBottom: 24
        }}>
          <div style={{ fontSize: 14, color: '#166534', marginBottom: 8 }}>
            Finalizada em {formatDate(selectedList.completed_at || selectedList.updated_at)}
          </div>

          {isEditingCompleted ? (
            <div style={{ marginTop: 12 }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                Loja
              </label>
              <select
                value={editStoreId}
                onChange={e => setEditStoreId(e.target.value)}
                style={{
                  width: '100%',
                  padding: 10,
                  fontSize: 14,
                  border: '2px solid #e5e7eb',
                  borderRadius: 8,
                  background: 'white',
                  boxSizing: 'border-box'
                }}
              >
                <option value="">Sem loja</option>
                {stores.map(store => (
                  <option key={store.id} value={store.id}>{store.name}</option>
                ))}
              </select>
            </div>
          ) : (
            selectedList.store_name && (
              <div style={{ fontSize: 14, color: '#166534' }}>
                Loja: <strong>{selectedList.store_name}</strong>
              </div>
            )
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          {isEditingCompleted ? (
            <>
              <button
                onClick={saveCompletedEdits}
                style={{
                  padding: '12px 24px',
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 600
                }}
              >
                Salvar
              </button>
              <button
                onClick={() => setIsEditingCompleted(false)}
                style={{
                  padding: '12px 24px',
                  background: '#f3f4f6',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 600
                }}
              >
                Cancelar
              </button>
            </>
          ) : (
            <>
              <button
                onClick={startEditingCompleted}
                style={{
                  padding: '12px 24px',
                  background: '#f59e0b',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 600
                }}
              >
                Editar
              </button>
              <button
                onClick={() => openDuplicateModal(selectedList)}
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
                Duplicar
              </button>
            </>
          )}
        </div>

        {/* Items */}
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: '#6b7280', marginBottom: 12 }}>
            ITENS ({items.length})
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {items.map(item => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: 12,
                  background: '#f0fdf4',
                  borderRadius: 12
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 15, color: '#374151' }}>{item.name}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginTop: 6 }}>
                    {/* Quantidade */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <label style={{ fontSize: 10, color: '#9ca3af' }}>Qtd</label>
                      <div style={{
                        width: 60,
                        padding: '6px',
                        fontSize: 13,
                        background: 'white',
                        border: '1px solid #d1d5db',
                        borderRadius: 6,
                        textAlign: 'center'
                      }}>
                        {item.quantity}
                      </div>
                    </div>

                    {/* Unidade */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <label style={{ fontSize: 10, color: '#9ca3af' }}>Unid</label>
                      <div style={{
                        width: 50,
                        padding: '6px',
                        fontSize: 13,
                        background: 'white',
                        border: '1px solid #d1d5db',
                        borderRadius: 6,
                        textAlign: 'center'
                      }}>
                        {item.unit || 'un'}
                      </div>
                    </div>

                    {/* Preço Unitário */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <label style={{ fontSize: 10, color: '#9ca3af' }}>R$ Unit.</label>
                      {isEditingCompleted ? (
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0,00"
                          defaultValue={item.unit_price ? Number(item.unit_price).toFixed(2) : ''}
                          onBlur={(e) => {
                            const value = e.target.value ? parseFloat(e.target.value) : null;
                            handleUpdateItemDetails(item.id, { unitPrice: value });
                          }}
                          style={{
                            width: 70,
                            padding: '6px',
                            fontSize: 13,
                            border: '1px solid #d1d5db',
                            borderRadius: 6,
                            textAlign: 'right'
                          }}
                        />
                      ) : (
                        <div style={{
                          width: 70,
                          padding: '6px',
                          fontSize: 13,
                          background: 'white',
                          border: '1px solid #d1d5db',
                          borderRadius: 6,
                          textAlign: 'right'
                        }}>
                          {item.unit_price ? Number(item.unit_price).toFixed(2) : '-'}
                        </div>
                      )}
                    </div>

                    {/* Preço Total */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <label style={{ fontSize: 10, color: '#166534', fontWeight: 600 }}>R$ Total</label>
                      {isEditingCompleted ? (
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0,00"
                          defaultValue={item.price ? Number(item.price).toFixed(2) : ''}
                          onBlur={(e) => {
                            const value = e.target.value ? parseFloat(e.target.value) : null;
                            if (value !== item.price) {
                              handleUpdatePrice(item.id, value);
                            }
                          }}
                          style={{
                            width: 80,
                            padding: '6px',
                            fontSize: 13,
                            border: '1px solid #10b981',
                            borderRadius: 6,
                            textAlign: 'right',
                            fontWeight: 600,
                            color: '#166534'
                          }}
                        />
                      ) : (
                        <div style={{
                          width: 80,
                          padding: '6px',
                          fontSize: 13,
                          background: 'white',
                          border: '1px solid #10b981',
                          borderRadius: 6,
                          textAlign: 'right',
                          fontWeight: 600,
                          color: '#166534'
                        }}>
                          {item.price ? Number(item.price).toFixed(2) : '-'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => openEditItemModal(item)}
                  style={{
                    padding: '6px 10px',
                    background: '#dbeafe',
                    border: '1px solid #93c5fd',
                    borderRadius: 6,
                    cursor: 'pointer',
                    color: '#1e40af',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                  title="Editar item"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Total */}
        {totalPrice > 0 && (
          <div style={{
            padding: 16,
            background: '#dcfce7',
            borderRadius: 12,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ fontWeight: 600, color: '#166534', fontSize: 18 }}>Total</span>
            <span style={{ fontWeight: 700, fontSize: 24, color: '#166534' }}>
              {formatPrice(totalPrice)}
            </span>
          </div>
        )}

        {/* Duplicate Modal */}
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

        {/* Edit Item Modal (lista concluída) */}
        {showEditItemModal && editingItem && (
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
              <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Editar Item</h2>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
                  Nome do item *
                </label>
                <input
                  type="text"
                  value={editItemName}
                  onChange={e => setEditItemName(e.target.value)}
                  placeholder="Ex: Arroz integral"
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
                    step="0.001"
                    value={editItemQuantity}
                    onChange={e => setEditItemQuantity(e.target.value)}
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
                    value={editItemUnit}
                    onChange={e => setEditItemUnit(e.target.value)}
                    placeholder="kg, g, un, L..."
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
              <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
                    R$ Unitário
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editItemUnitPrice}
                    onChange={e => setEditItemUnitPrice(e.target.value)}
                    placeholder="0,00"
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
                    R$ Total
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editItemPrice}
                    onChange={e => setEditItemPrice(e.target.value)}
                    placeholder="0,00"
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
                  onClick={() => { setShowEditItemModal(false); setEditingItem(null); }}
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
                  type="button"
                  onClick={handleSaveEditItem}
                  style={{
                    flex: 1,
                    padding: 12,
                    background: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontSize: 16,
                    fontWeight: 600
                  }}
                >
                  Salvar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

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
                    // border: '2px solid #e5e7eb', // Borda removida
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
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
                    onClick={() => openEditItemModal(item)}
                    style={{
                      padding: '6px 10px',
                      background: '#dbeafe',
                      border: '1px solid #93c5fd',
                      borderRadius: 6,
                      cursor: 'pointer',
                      color: '#1e40af',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="Editar item"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>
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
                    padding: 12,
                    background: '#f0fdf4',
                    // border: '2px solid #bbf7d0', // Borda removida
                    borderRadius: 12
                  }}
                >
                  <input
                    type="checkbox"
                    checked={true}
                    onChange={() => handleToggleItem(item)}
                    style={{ width: 22, height: 22, cursor: 'pointer', flexShrink: 0 }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 15, textDecoration: 'line-through', color: '#6b7280' }}>{item.name}</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginTop: 6 }}>
                      {/* Quantidade */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <label style={{ fontSize: 10, color: '#9ca3af' }}>Qtd</label>
                        <input
                          type="number"
                          step="0.001"
                          min="0.001"
                          className="no-spinner"
                          defaultValue={item.quantity}
                          onFocus={(e) => e.target.select()}
                          onBlur={(e) => {
                            const value = parseFloat(e.target.value);
                            if (value && value !== Number(item.quantity)) {
                              handleSmartPriceUpdate(item, 'quantity', value);
                            }
                          }}
                          style={{
                            width: 60,
                            padding: '6px',
                            fontSize: 13,
                            border: '1px solid #d1d5db',
                            borderRadius: 6,
                            textAlign: 'center'
                          }}
                        />
                      </div>

                      {/* Unidade */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <label style={{ fontSize: 10, color: '#9ca3af' }}>Unid</label>
                        <input
                          type="text"
                          defaultValue={item.unit || 'un'}
                          onBlur={(e) => {
                            const value = e.target.value.trim();
                            if (value && value !== item.unit) {
                              handleUpdateItemDetails(item.id, { unit: value });
                            }
                          }}
                          style={{
                            width: 50,
                            padding: '6px',
                            fontSize: 13,
                            border: '1px solid #d1d5db',
                            borderRadius: 6,
                            textAlign: 'center'
                          }}
                        />
                      </div>

                      {/* Preço Unitário */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <label style={{ fontSize: 10, color: '#9ca3af' }}>R$ Unit.</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0,00"
                          className="no-spinner"
                          key={`unit-${item.id}-${item.unit_price}`} // Força re-render ao mudar externamente
                          defaultValue={item.unit_price ? Number(item.unit_price).toFixed(2) : ''}
                          onFocus={(e) => e.target.select()}
                          onBlur={(e) => {
                            const value = e.target.value ? parseFloat(e.target.value) : 0;
                            if (value !== Number(item.unit_price)) {
                              handleSmartPriceUpdate(item, 'unit_price', value);
                            }
                          }}
                          style={{
                            width: 70,
                            padding: '6px',
                            fontSize: 13,
                            border: '1px solid #d1d5db',
                            borderRadius: 6,
                            textAlign: 'right',
                            background: '#f9fafb'
                          }}
                        />
                      </div>

                      {/* Preço Total */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <label style={{ fontSize: 10, color: '#166534', fontWeight: 600 }}>R$ Total</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0,00"
                          className="no-spinner"
                          key={`total-${item.id}-${item.price}`} // Força re-render ao mudar externamente
                          defaultValue={item.price ? Number(item.price).toFixed(2) : ''}
                          onFocus={(e) => e.target.select()}
                          onBlur={(e) => {
                            const value = e.target.value ? parseFloat(e.target.value) : 0;
                            if (value !== Number(item.price)) {
                              handleSmartPriceUpdate(item, 'price', value);
                            }
                          }}
                          style={{
                            width: 80,
                            padding: '6px',
                            fontSize: 13,
                            border: '1px solid #10b981',
                            borderRadius: 6,
                            textAlign: 'right',
                            fontWeight: 600,
                            color: '#166534'
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'none' }}>
                    {/* Placeholder para manter layout flex antigo se necessário, mas agora tudo está no bloco principal */}
                  </div>
                </div>
              ))}
            </div>
            {/* Total */}
            {totalPrice > 0 && (
              <div style={{
                marginTop: 12,
                padding: 12,
                background: '#dcfce7',
                borderRadius: 8,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ fontWeight: 600, color: '#166534' }}>Total</span>
                <span style={{ fontWeight: 700, fontSize: 18, color: '#166534' }}>
                  {formatPrice(totalPrice)}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Complete List Button */}
        {purchasedItems.length > 0 && (
          <button
            onClick={openCompleteModal}
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
            {pendingItems.length > 0 && (
              <span style={{ fontSize: 13, fontWeight: 400, marginLeft: 8 }}>
                ({pendingItems.length} pendente{pendingItems.length > 1 ? 's' : ''})
              </span>
            )}
          </button>
        )}

        {/* Complete List Modal */}
        {showCompleteModal && (
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
              {completeStep === 1 ? (
                <>
                  <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Finalizar Lista</h2>

                  {pendingItems.length > 0 && (
                    <div style={{
                      padding: 12,
                      background: '#fef3c7',
                      borderRadius: 8,
                      marginBottom: 16,
                      fontSize: 14,
                      color: '#92400e'
                    }}>
                      {pendingItems.length} item(ns) ainda nao comprado(s). Serao transferidos para uma nova lista.
                    </div>
                  )}

                  <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 16 }}>
                    Onde voce fez as compras?
                  </p>

                  {!showNewStoreInput ? (
                    <>
                      <select
                        value={selectedStoreId}
                        onChange={e => setSelectedStoreId(e.target.value)}
                        style={{
                          width: '100%',
                          padding: 12,
                          fontSize: 16,
                          border: '2px solid #e5e7eb',
                          borderRadius: 8,
                          marginBottom: 12,
                          boxSizing: 'border-box',
                          background: 'white'
                        }}
                      >
                        <option value="">Selecione uma loja (opcional)</option>
                        {stores.map(store => (
                          <option key={store.id} value={store.id}>{store.name}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => setShowNewStoreInput(true)}
                        style={{
                          width: '100%',
                          padding: 10,
                          background: '#f3f4f6',
                          border: '1px dashed #d1d5db',
                          borderRadius: 8,
                          cursor: 'pointer',
                          fontSize: 14,
                          color: '#6b7280',
                          marginBottom: 16
                        }}
                      >
                        + Adicionar nova loja
                      </button>
                    </>
                  ) : (
                    <>
                      <input
                        type="text"
                        value={newStoreName}
                        onChange={e => setNewStoreName(e.target.value)}
                        placeholder="Nome da loja (ex: Carrefour Centro)"
                        style={{
                          width: '100%',
                          padding: 12,
                          fontSize: 16,
                          border: '2px solid #e5e7eb',
                          borderRadius: 8,
                          marginBottom: 12,
                          boxSizing: 'border-box'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => { setShowNewStoreInput(false); setNewStoreName(''); }}
                        style={{
                          width: '100%',
                          padding: 10,
                          background: '#f3f4f6',
                          border: 'none',
                          borderRadius: 8,
                          cursor: 'pointer',
                          fontSize: 14,
                          color: '#6b7280',
                          marginBottom: 16
                        }}
                      >
                        Voltar para lista de lojas
                      </button>
                    </>
                  )}

                  <div style={{ display: 'flex', gap: 12 }}>
                    <button
                      type="button"
                      onClick={() => setShowCompleteModal(false)}
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
                      type="button"
                      onClick={handleCompleteList}
                      style={{
                        flex: 1,
                        padding: 12,
                        background: '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: 8,
                        cursor: 'pointer',
                        fontSize: 16,
                        fontWeight: 600
                      }}
                    >
                      {pendingItems.length > 0 ? 'Proximo' : 'Finalizar'}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Itens Pendentes</h2>

                  <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 8 }}>
                    Os seguintes itens nao foram comprados:
                  </p>

                  <div style={{
                    maxHeight: 150,
                    overflowY: 'auto',
                    padding: 12,
                    background: '#f9fafb',
                    borderRadius: 8,
                    marginBottom: 16
                  }}>
                    {pendingItems.map(item => (
                      <div key={item.id} style={{ fontSize: 14, color: '#374151', marginBottom: 4 }}>
                        • {item.name} ({item.quantity} {item.unit || 'un'})
                      </div>
                    ))}
                  </div>

                  <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 8 }}>
                    Qual nome dar para a nova lista com esses itens?
                  </p>

                  <input
                    type="text"
                    value={newListNameForTransfer}
                    onChange={e => setNewListNameForTransfer(e.target.value)}
                    placeholder="Nome da nova lista"
                    style={{
                      width: '100%',
                      padding: 12,
                      fontSize: 16,
                      border: '2px solid #e5e7eb',
                      borderRadius: 8,
                      marginBottom: 16,
                      boxSizing: 'border-box'
                    }}
                  />

                  <div style={{ display: 'flex', gap: 12 }}>
                    <button
                      type="button"
                      onClick={() => setCompleteStep(1)}
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
                      Voltar
                    </button>
                    <button
                      type="button"
                      onClick={handleCompleteList}
                      disabled={!newListNameForTransfer.trim()}
                      style={{
                        flex: 1,
                        padding: 12,
                        background: newListNameForTransfer.trim() ? '#10b981' : '#9ca3af',
                        color: 'white',
                        border: 'none',
                        borderRadius: 8,
                        cursor: newListNameForTransfer.trim() ? 'pointer' : 'not-allowed',
                        fontSize: 16,
                        fontWeight: 600
                      }}
                    >
                      Finalizar
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
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

        {/* Edit Item Modal */}
        {showEditItemModal && editingItem && (
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
              <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Editar Item</h2>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
                  Nome do item *
                </label>
                <input
                  type="text"
                  value={editItemName}
                  onChange={e => setEditItemName(e.target.value)}
                  placeholder="Ex: Arroz integral"
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
                    step="0.001"
                    value={editItemQuantity}
                    onChange={e => setEditItemQuantity(e.target.value)}
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
                    value={editItemUnit}
                    onChange={e => setEditItemUnit(e.target.value)}
                    placeholder="kg, g, un, L..."
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
              {editingItem.is_purchased && (
                <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
                      R$ Unitário
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={editItemUnitPrice}
                      onChange={e => setEditItemUnitPrice(e.target.value)}
                      placeholder="0,00"
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
                      R$ Total
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={editItemPrice}
                      onChange={e => setEditItemPrice(e.target.value)}
                      placeholder="0,00"
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
              )}
              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  type="button"
                  onClick={() => { setShowEditItemModal(false); setEditingItem(null); }}
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
                  type="button"
                  onClick={handleSaveEditItem}
                  style={{
                    flex: 1,
                    padding: 12,
                    background: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontSize: 16,
                    fontWeight: 600
                  }}
                >
                  Salvar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Lista principal
  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>Lista de Compras</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={async () => {
              try {
                if (plan === 'free') {
                  const { showRewardedAd } = await import('@/lib/ads/admob');
                  await showRewardedAd('shopping_dashboard');
                }
              } catch {}
              router.push('/lista-compras/dashboard');
            }}
            style={{
              flex: 1,
              height: 44,
              background: 'white',
              color: '#374151',
              border: '2px solid #e5e7eb',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 20V10M12 20V4M6 20v-6" />
            </svg>
            Painel
          </button>
          <button
            onClick={openScanModal}
            style={{
              flex: 1,
              height: 44,
              background: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="16" rx="2" />
              <line x1="7" y1="8" x2="17" y2="8" />
              <line x1="7" y1="12" x2="13" y2="12" />
              <line x1="7" y1="16" x2="10" y2="16" />
            </svg>
            Nota
          </button>
          <button
            onClick={() => setShowNewListModal(true)}
            style={{
              flex: 1,
              height: 44,
              background: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Nova
          </button>
        </div>
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
                      // border: '2px solid #e5e7eb', // Borda removida
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)', // Adicionando sombra leve para manter separação visual
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
          {allCompletedLists.length > 0 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h2 style={{ fontSize: 16, fontWeight: 600, color: '#6b7280' }}>
                  LISTAS CONCLUIDAS {!showAllCompleted && allCompletedLists.length > 5 && `(ultimas 5 de ${allCompletedLists.length})`}
                </h2>
                {allCompletedLists.length > 5 && (
                  <button
                    onClick={() => setShowAllCompleted(!showAllCompleted)}
                    style={{
                      padding: '6px 12px',
                      background: '#f3f4f6',
                      border: 'none',
                      borderRadius: 6,
                      cursor: 'pointer',
                      fontSize: 13,
                      fontWeight: 500,
                      color: '#6b7280'
                    }}
                  >
                    {showAllCompleted ? 'Mostrar menos' : 'Ver todas'}
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {completedLists.map(list => (
                  <div
                    key={list.id}
                    style={{
                      padding: 12,
                      background: '#f0fdf4',
                      // border: '2px solid #bbf7d0', // Borda removida
                      borderRadius: 12,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div
                      onClick={() => openCompletedList(list)}
                      style={{ flex: 1, cursor: 'pointer' }}
                    >
                      <div style={{ fontWeight: 600, color: '#166534', fontSize: 15, marginBottom: 2 }}>
                        {list.name}
                        <span style={{ fontWeight: 400, color: '#6b7280', fontSize: 13 }}>
                          {' - '}{formatDate(list.completed_at || list.updated_at)}
                          {list.store_name && ` - ${list.store_name}`}
                        </span>
                      </div>
                      {list.total_price && Number(list.total_price) > 0 && (
                        <div style={{ fontSize: 15, fontWeight: 700, color: '#166534' }}>
                          {formatPrice(Number(list.total_price))}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => openCompletedList(list)}
                        style={{
                          padding: '6px 12px',
                          background: '#dbeafe',
                          border: '1px solid #93c5fd',
                          borderRadius: 6,
                          cursor: 'pointer',
                          fontSize: 13,
                          fontWeight: 500,
                          color: '#1e40af'
                        }}
                      >
                        Ver
                      </button>
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
                      >
                        Duplicar
                      </button>
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

      {/* Modal Scan Nota Fiscal */}
      {showScanModal && (
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
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Escanear Nota Fiscal</h2>
            <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 16 }}>
              Tire uma foto da nota para importar os itens automaticamente.
            </p>

            <form onSubmit={handleScanReceipt}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
                  Nome da lista
                </label>
                <input
                  type="text"
                  value={scanListName}
                  onChange={e => setScanListName(e.target.value)}
                  placeholder="Ex: Compras 29/12"
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

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
                  Loja (opcional)
                </label>
                {!showScanNewStore ? (
                  <>
                    <select
                      value={scanStoreId}
                      onChange={e => setScanStoreId(e.target.value)}
                      style={{
                        width: '100%',
                        padding: 12,
                        fontSize: 16,
                        border: '2px solid #e5e7eb',
                        borderRadius: 8,
                        marginBottom: 8,
                        boxSizing: 'border-box',
                        background: 'white'
                      }}
                    >
                      <option value="">Selecione uma loja</option>
                      {stores.map(store => (
                        <option key={store.id} value={store.id}>{store.name}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setShowScanNewStore(true)}
                      style={{
                        width: '100%',
                        padding: 10,
                        background: '#f3f4f6',
                        border: '1px dashed #d1d5db',
                        borderRadius: 8,
                        cursor: 'pointer',
                        fontSize: 14,
                        color: '#6b7280'
                      }}
                    >
                      + Nova loja
                    </button>
                  </>
                ) : (
                  <>
                    <input
                      type="text"
                      value={scanNewStoreName}
                      onChange={e => setScanNewStoreName(e.target.value)}
                      placeholder="Nome da loja"
                      style={{
                        width: '100%',
                        padding: 12,
                        fontSize: 16,
                        border: '2px solid #e5e7eb',
                        borderRadius: 8,
                        marginBottom: 8,
                        boxSizing: 'border-box'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => { setShowScanNewStore(false); setScanNewStoreName(''); }}
                      style={{
                        width: '100%',
                        padding: 10,
                        background: '#f3f4f6',
                        border: 'none',
                        borderRadius: 8,
                        cursor: 'pointer',
                        fontSize: 14,
                        color: '#6b7280'
                      }}
                    >
                      Voltar para lista
                    </button>
                  </>
                )}
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
                  Foto da nota *
                </label>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  required
                  style={{
                    width: '100%',
                    padding: 12,
                    fontSize: 14,
                    border: '2px solid #e5e7eb',
                    borderRadius: 8,
                    boxSizing: 'border-box',
                    background: '#f9fafb'
                  }}
                />
                <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>
                  Tire uma foto clara da nota fiscal completa
                </p>
              </div>

              {scanError && (
                <div style={{
                  padding: 12,
                  background: '#fee2e2',
                  border: '2px solid #ef4444',
                  borderRadius: 8,
                  color: '#991b1b',
                  marginBottom: 16,
                  fontSize: 14
                }}>
                  {scanError}
                </div>
              )}

              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  type="button"
                  onClick={() => setShowScanModal(false)}
                  disabled={scanLoading}
                  style={{
                    flex: 1,
                    padding: 12,
                    background: '#f3f4f6',
                    border: 'none',
                    borderRadius: 8,
                    cursor: scanLoading ? 'not-allowed' : 'pointer',
                    fontSize: 16,
                    fontWeight: 600,
                    opacity: scanLoading ? 0.7 : 1
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={scanLoading}
                  style={{
                    flex: 1,
                    padding: 12,
                    background: scanLoading ? '#9ca3af' : '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: 8,
                    cursor: scanLoading ? 'not-allowed' : 'pointer',
                    fontSize: 16,
                    fontWeight: 600
                  }}
                >
                  {scanLoading ? 'Analisando...' : 'Escanear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
