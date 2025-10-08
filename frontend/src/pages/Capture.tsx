import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mealService } from '../services/meal.service';
import { AIAnalysisResponse, FoodItem } from '../types';

export default function Capture() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'photo' | 'manual'>('photo');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AIAnalysisResponse | null>(null);
  const [consumedAt, setConsumedAt] = useState<string>(
    new Date().toISOString().slice(0, 16)
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string>('');

  // Manual mode state
  const [manualMealType, setManualMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('lunch');
  const [manualDescription, setManualDescription] = useState<string>('');
  const [manualNotes, setManualNotes] = useState<string>('');

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setAnalysis(null);
    setError('');
  };

  const handleAnalyze = async () => {
    if (!imageFile) return;

    setIsAnalyzing(true);
    setError('');

    try {
      const result = await mealService.analyzeImage(imageFile);
      setAnalysis(result);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao analisar imagem');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleManualAnalyze = async () => {
    if (!manualDescription.trim()) {
      setError('Descreva o que você comeu');
      return;
    }

    setIsAnalyzing(true);
    setError('');

    try {
      const result = await mealService.analyzeText(manualDescription, manualMealType);
      setAnalysis(result);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao analisar descrição');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleManualSave = async () => {
    if (!analysis) return;

    setIsSaving(true);
    setError('');

    try {
      // Create a minimal 1x1 transparent PNG as placeholder image
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => resolve(b!), 'image/png');
      });
      const placeholderFile = new File([blob], 'manual.png', { type: 'image/png' });

      await mealService.approveMeal(
        placeholderFile,
        analysis.foods,
        analysis.meal_type,
        new Date(consumedAt).toISOString(),
        manualNotes || analysis.notes || 'Registro manual'
      );

      alert('Refeição salva com sucesso!');
      navigate('/history');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao salvar refeição');
    } finally {
      setIsSaving(false);
    }
  };

  const handleApprove = async () => {
    if (!imageFile || !analysis) return;

    setIsSaving(true);
    setError('');

    try {
      await mealService.approveMeal(
        imageFile,
        analysis.foods,
        analysis.meal_type,
        new Date(consumedAt).toISOString(),
        analysis.notes
      );

      alert('Refeição salva com sucesso!');
      navigate('/history');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao salvar refeição');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="px-4 py-8">
      <h2 className="text-3xl font-bold text-gray-900 mb-6">Registrar Refeição</h2>

      {/* Mode Selector */}
      <div className="mb-6 flex gap-4 max-w-2xl mx-auto">
        <button
          onClick={() => setMode('photo')}
          className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-colors ${
            mode === 'photo'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          📸 Com Foto
        </button>
        <button
          onClick={() => setMode('manual')}
          className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-colors ${
            mode === 'manual'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          ✍️ Manual
        </button>
      </div>

      {/* Photo Mode */}
      {mode === 'photo' && (
        <div className="bg-white shadow rounded-lg p-6 max-w-2xl mx-auto">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Foto da Refeição
            </label>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleImageSelect}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
            />
          </div>

          {imagePreview && (
            <div className="mb-6">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full max-h-96 object-contain rounded-lg"
              />
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data e Hora da Refeição
            </label>
            <input
              type="datetime-local"
              value={consumedAt}
              onChange={(e) => setConsumedAt(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          {imageFile && !analysis && (
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAnalyzing ? 'Analisando...' : 'Analisar com IA'}
            </button>
          )}

          {analysis && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-4">Análise da IA</h3>

              <div className="mb-4">
                <span className="inline-block bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                  {analysis.meal_type === 'breakfast' && 'Café da Manhã'}
                  {analysis.meal_type === 'lunch' && 'Almoço'}
                  {analysis.meal_type === 'dinner' && 'Jantar'}
                  {analysis.meal_type === 'snack' && 'Lanche'}
                </span>
              </div>

              {analysis.notes && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                  <p className="text-sm text-yellow-700">{analysis.notes}</p>
                </div>
              )}

              <div className="space-y-3">
                {analysis.foods.map((food, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold">{food.name}</h4>
                      <span className="text-sm text-gray-500">
                        Confiança: {(food.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {food.quantity} {food.unit}
                    </p>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <span className="text-gray-500">Calorias:</span>{' '}
                        <span className="font-medium">{food.nutrition.calories}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Proteína:</span>{' '}
                        <span className="font-medium">{food.nutrition.protein_g}g</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Fibras:</span>{' '}
                        <span className="font-medium">{food.nutrition.fiber_g}g</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex gap-4">
                <button
                  onClick={() => {
                    setAnalysis(null);
                    setImageFile(null);
                    setImagePreview('');
                  }}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-6 rounded-lg"
                >
                  Descartar
                </button>
                <button
                  onClick={handleApprove}
                  disabled={isSaving}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg disabled:opacity-50"
                >
                  {isSaving ? 'Salvando...' : 'Aprovar e Salvar'}
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 bg-red-50 border-l-4 border-red-400 p-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </div>
      )}

      {/* Manual Mode */}
      {mode === 'manual' && (
        <div className="bg-white shadow rounded-lg p-6 max-w-2xl mx-auto">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Refeição
            </label>
            <select
              value={manualMealType}
              onChange={(e) => setManualMealType(e.target.value as any)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="breakfast">☀️ Café da Manhã</option>
              <option value="lunch">🍽️ Almoço</option>
              <option value="dinner">🌙 Jantar</option>
              <option value="snack">🍪 Lanche</option>
            </select>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data e Hora da Refeição
            </label>
            <input
              type="datetime-local"
              value={consumedAt}
              onChange={(e) => setConsumedAt(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              O que você comeu? *
            </label>
            <textarea
              value={manualDescription}
              onChange={(e) => setManualDescription(e.target.value)}
              placeholder="Ex: Arroz, feijão, frango grelhado e salada"
              rows={3}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Descreva os alimentos separados por vírgula
            </p>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observações (opcional)
            </label>
            <textarea
              value={manualNotes}
              onChange={(e) => setManualNotes(e.target.value)}
              placeholder="Ex: Passei mal depois, senti azia, etc"
              rows={2}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          {!analysis && (
            <button
              onClick={handleManualAnalyze}
              disabled={isAnalyzing || !manualDescription.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAnalyzing ? 'Analisando...' : 'Analisar com IA'}
            </button>
          )}

          {analysis && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-4">Análise da IA</h3>

              {analysis.notes && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                  <p className="text-sm text-yellow-700">{analysis.notes}</p>
                </div>
              )}

              <div className="space-y-3 mb-6">
                {analysis.foods.map((food, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold">{food.name}</h4>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {food.quantity} {food.unit}
                    </p>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <span className="text-gray-500">Calorias:</span>{' '}
                        <span className="font-medium">{food.nutrition.calories}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Proteína:</span>{' '}
                        <span className="font-medium">{food.nutrition.protein_g}g</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Fibras:</span>{' '}
                        <span className="font-medium">{food.nutrition.fiber_g}g</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setAnalysis(null)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-6 rounded-lg"
                >
                  Refazer
                </button>
                <button
                  onClick={handleManualSave}
                  disabled={isSaving}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg disabled:opacity-50"
                >
                  {isSaving ? 'Salvando...' : 'Salvar Refeição'}
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 bg-red-50 border-l-4 border-red-400 p-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
