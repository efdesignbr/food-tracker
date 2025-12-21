import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

export type MealForExport = {
  meal_id: string;
  meal_type: string;
  consumed_at: Date;
  notes: string | null;
  location_type: string | null;
  restaurant_name: string | null;
  food_name: string;
  quantity: number;
  unit: string;
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  fiber_g: number | null;
  sodium_mg: number | null;
  sugar_g: number | null;
};

const TIMEZONE = 'America/Sao_Paulo';

/**
 * Converts meal data to CSV format
 * Each row represents one food item in a meal
 */
export function convertMealsToCSV(meals: MealForExport[]): string {
  const headers = [
    'Data',
    'Hora',
    'Tipo de Refeição',
    'Local',
    'Restaurante',
    'Alimento',
    'Quantidade',
    'Unidade',
    'Calorias',
    'Proteína (g)',
    'Carboidratos (g)',
    'Gordura (g)',
    'Fibra (g)',
    'Sódio (mg)',
    'Açúcar (g)',
  ];

  const rows = meals.map((meal) => {
    const zonedDate = toZonedTime(meal.consumed_at, TIMEZONE);
    const date = format(zonedDate, 'dd/MM/yyyy');
    const time = format(zonedDate, 'HH:mm');

    const mealTypeMap: Record<string, string> = {
      breakfast: 'Café da Manhã',
      lunch: 'Almoço',
      dinner: 'Jantar',
      snack: 'Lanche',
    };

    const locationMap: Record<string, string> = {
      home: 'Casa',
      out: 'Fora',
    };

    return [
      date,
      time,
      mealTypeMap[meal.meal_type] || meal.meal_type,
      meal.location_type ? locationMap[meal.location_type] || meal.location_type : '',
      meal.restaurant_name || '',
      escapeCSVField(meal.food_name),
      meal.quantity.toString(),
      meal.unit,
      meal.calories?.toString() || '',
      meal.protein_g?.toString() || '',
      meal.carbs_g?.toString() || '',
      meal.fat_g?.toString() || '',
      meal.fiber_g?.toString() || '',
      meal.sodium_mg?.toString() || '',
      meal.sugar_g?.toString() || '',
    ];
  });

  const csvLines = [
    headers.join(','),
    ...rows.map((row) => row.join(',')),
  ];

  return csvLines.join('\n');
}

/**
 * Escapes CSV field values that contain special characters
 */
function escapeCSVField(value: string): string {
  if (!value) return '';

  // If the field contains comma, newline, or double quote, wrap it in quotes
  if (value.includes(',') || value.includes('\n') || value.includes('"')) {
    // Escape existing double quotes by doubling them
    const escaped = value.replace(/"/g, '""');
    return `"${escaped}"`;
  }

  return value;
}

/**
 * Generates a CSV filename with the date range
 */
export function generateCSVFilename(startDate: Date, endDate: Date): string {
  const start = format(startDate, 'yyyy-MM-dd');
  const end = format(endDate, 'yyyy-MM-dd');
  return `historico-alimentacao_${start}_${end}.csv`;
}

/**
 * Triggers a browser download of the CSV file
 */
export function downloadCSV(csvContent: string, filename: string): void {
  // Add BOM for proper UTF-8 encoding in Excel
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up the object URL
  URL.revokeObjectURL(url);
}
