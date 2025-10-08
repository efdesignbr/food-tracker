import { api } from './api.service';
import { AIAnalysisResponse, HistoryResponse, InflammationReport, FoodItem } from '../types';

export const mealService = {
  async analyzeImage(imageFile: File): Promise<AIAnalysisResponse> {
    const formData = new FormData();
    formData.append('image', imageFile);

    const response = await api.post<AIAnalysisResponse>('/meals/analyze', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },

  async analyzeText(description: string, mealType: string): Promise<AIAnalysisResponse> {
    const response = await api.post<AIAnalysisResponse>('/meals/analyze-text', {
      description,
      meal_type: mealType,
    });

    return response.data;
  },

  async approveMeal(
    imageFile: File,
    foods: FoodItem[],
    mealType: string,
    consumedAt: string,
    notes?: string
  ): Promise<{ mealId: string; status: string }> {
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('foods', JSON.stringify(foods));
    formData.append('meal_type', mealType);
    formData.append('consumed_at', consumedAt);
    if (notes) {
      formData.append('notes', notes);
    }

    const response = await api.post('/meals/approve', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },

  async getHistory(startDate: string, endDate: string): Promise<HistoryResponse> {
    const response = await api.get<HistoryResponse>('/meals/history', {
      params: { start_date: startDate, end_date: endDate },
    });

    return response.data;
  },

  async deleteMeal(mealId: string): Promise<void> {
    await api.delete(`/meals/${mealId}`);
  },

  async getInflammationReport(startDate: string, endDate: string): Promise<InflammationReport> {
    const response = await api.get<InflammationReport>('/reports/inflammation', {
      params: { start_date: startDate, end_date: endDate },
    });

    return response.data;
  },
};
