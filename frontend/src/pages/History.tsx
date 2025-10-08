import { useState, useEffect } from 'react';
import { mealService } from '../services/meal.service';
import { HistoryResponse } from '../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function History() {
  const [startDate, setStartDate] = useState<string>(
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [history, setHistory] = useState<HistoryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const loadHistory = async () => {
    setIsLoading(true);
    setError('');

    try {
      console.log('[History] Loading history from', startDate, 'to', endDate);
      const data = await mealService.getHistory(startDate, endDate);
      console.log('[History] Received data:', data);
      setHistory(data);
    } catch (err: any) {
      console.error('[History] Error loading history:', err);
      setError(err.response?.data?.message || 'Erro ao carregar histórico');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleDelete = async (mealId: string) => {
    if (!confirm('Deseja realmente excluir esta refeição?')) return;

    try {
      await mealService.deleteMeal(mealId);
      loadHistory();
    } catch (err: any) {
      alert('Erro ao excluir refeição');
    }
  };

  return (
    <div className="px-4 py-8">
      <h2 className="text-3xl font-bold text-gray-900 mb-6">Histórico</h2>

      {/* Date Range Filter */}
      <div className="bg-white shadow rounded-lg p-4 mb-6">
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data Início
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data Fim
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={loadHistory}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-md disabled:opacity-50"
          >
            {isLoading ? 'Carregando...' : 'Buscar'}
          </button>
        </div>
      </div>

      {/* Totals */}
      {history && history.totals && history.totals.calories > 0 && (
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Totais do Período (apenas refeições analisadas)</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <div className="text-sm text-gray-500">Calorias</div>
              <div className="text-2xl font-bold">{history.totals.calories.toFixed(0)}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Proteína</div>
              <div className="text-2xl font-bold">{history.totals.protein_g.toFixed(1)}g</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Carboidratos</div>
              <div className="text-2xl font-bold">{history.totals.carbs_g.toFixed(1)}g</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Gorduras</div>
              <div className="text-2xl font-bold">{history.totals.fat_g.toFixed(1)}g</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Fibras</div>
              <div className="text-2xl font-bold">{history.totals.fiber_g.toFixed(1)}g</div>
            </div>
          </div>
        </div>
      )}

      {/* Meals List */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {history && history.meals.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500">Nenhuma refeição encontrada neste período</p>
        </div>
      )}

      <div className="space-y-4">
        {history?.meals.map((meal) => (
          <div key={meal.id} className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold">
                  {meal.meal_type === 'breakfast' && '☀️ Café da Manhã'}
                  {meal.meal_type === 'lunch' && '🍽️ Almoço'}
                  {meal.meal_type === 'dinner' && '🌙 Jantar'}
                  {meal.meal_type === 'snack' && '🍪 Lanche'}
                </h3>
                <p className="text-sm text-gray-500">
                  {format(new Date(meal.consumed_at), "dd/MM/yyyy 'às' HH:mm", {
                    locale: ptBR,
                  })}
                </p>
              </div>
              <button
                onClick={() => handleDelete(meal.id)}
                className="text-red-600 hover:text-red-800 text-sm"
              >
                Excluir
              </button>
            </div>

            {meal.notes && (
              <div className="mb-4 text-sm text-gray-600 italic">{meal.notes}</div>
            )}

            <div className="space-y-2">
              {meal.foods.map((food) => (
                <div key={food.id} className="flex justify-between items-center text-sm">
                  <span>
                    {food.name} ({food.quantity} {food.unit})
                  </span>
                  <span className="text-gray-500">
                    {food.nutrition.calories > 0 ? `${food.nutrition.calories} kcal` : 'Registro manual'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
