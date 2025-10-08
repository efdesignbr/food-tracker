import { useState } from 'react';
import { mealService } from '../services/meal.service';
import { InflammationReport } from '../types';

export default function Reports() {
  const [startDate, setStartDate] = useState<string>(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [report, setReport] = useState<InflammationReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleGenerate = async () => {
    setIsLoading(true);
    setError('');

    try {
      const data = await mealService.getInflammationReport(startDate, endDate);
      setReport(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao gerar relatório');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="px-4 py-8">
      <h2 className="text-3xl font-bold text-gray-900 mb-6">
        Relatório de Gatilhos Inflamatórios
      </h2>

      {/* Date Range */}
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
            onClick={handleGenerate}
            disabled={isLoading}
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-6 rounded-md disabled:opacity-50"
          >
            {isLoading ? 'Gerando...' : 'Gerar Relatório'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {report && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Resumo do Período</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-500">Total de Refeições</div>
                <div className="text-2xl font-bold">{report.total_meals}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Média de Refeições/Dia</div>
                <div className="text-2xl font-bold">
                  {report.patterns.average_meals_per_day}
                </div>
              </div>
            </div>
          </div>

          {/* Potential Triggers */}
          {report.potential_triggers.length > 0 && (
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">
                ⚠️ Possíveis Gatilhos Inflamatórios
              </h3>
              <div className="space-y-3">
                {report.potential_triggers.map((trigger, index) => (
                  <div
                    key={index}
                    className="border-l-4 border-red-400 bg-red-50 p-4"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-red-900 capitalize">
                        {trigger.food}
                      </h4>
                      <span className="bg-red-200 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded">
                        {trigger.occurrences}x detectado
                      </span>
                    </div>
                    <div className="text-sm text-red-700">
                      <span className="font-medium">Datas:</span>{' '}
                      {trigger.dates.join(', ')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {report.recommendations.length > 0 && (
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">💡 Recomendações</h3>
              <ul className="space-y-2">
                {report.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span className="text-gray-700">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Patterns */}
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
            <h4 className="font-semibold text-blue-900 mb-2">
              📊 Padrão Identificado
            </h4>
            <p className="text-blue-700">
              Tipo de refeição mais comum:{' '}
              <span className="font-medium">
                {report.patterns.most_common_meal_type === 'breakfast' &&
                  'Café da Manhã'}
                {report.patterns.most_common_meal_type === 'lunch' && 'Almoço'}
                {report.patterns.most_common_meal_type === 'dinner' && 'Jantar'}
                {report.patterns.most_common_meal_type === 'snack' && 'Lanche'}
              </span>
            </p>
          </div>
        </div>
      )}

      {!report && !isLoading && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500">
            Selecione um período e clique em "Gerar Relatório"
          </p>
        </div>
      )}
    </div>
  );
}
