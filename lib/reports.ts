import { toDateBR } from './datetime';

const INFLAMMATORY_KEYWORDS = [
  'leite', 'queijo', 'iogurte', 'manteiga', 'lactose', 'nata', 'creme',
  'pão', 'massa', 'macarrão', 'bolo', 'biscoito', 'glúten', 'trigo',
  'fritura', 'frito', 'gorduroso', 'bacon', 'salsicha', 'embutido',
  'pimenta', 'picante', 'apimentado', 'molho picante',
  'refrigerante', 'café', 'álcool', 'cerveja', 'vinho',
  'processado', 'industrializado', 'fast food',
  'feijão', 'lentilha', 'grão de bico', 'brócolis', 'couve-flor', 'repolho',
];

export function buildInflammationReport(meals: Array<{ consumed_at: string | Date; meal_type: string; foods: Array<{ name: string }> }>) {
  const allFoods: Array<{ name: string; date: string }> = [];
  for (const m of meals) {
    for (const f of m.foods) {
      const consumedDate = m.consumed_at instanceof Date ? m.consumed_at : new Date(m.consumed_at);
      allFoods.push({ name: f.name.toLowerCase(), date: toDateBR(consumedDate) });
    }
  }
  const triggerMap = new Map<string, { occurrences: number; dates: string[] }>();
  for (const { name, date } of allFoods) {
    const matched = INFLAMMATORY_KEYWORDS.filter(k => name.includes(k));
    for (const t of matched) {
      if (!triggerMap.has(t)) triggerMap.set(t, { occurrences: 0, dates: [] });
      const data = triggerMap.get(t)!;
      data.occurrences++;
      if (!data.dates.includes(date)) data.dates.push(date);
    }
  }
  const potential_triggers = Array.from(triggerMap.entries())
    .map(([food, d]) => ({ food, occurrences: d.occurrences, dates: d.dates.sort() }))
    .sort((a, b) => b.occurrences - a.occurrences);

  const mealTypeCount: Record<string, number> = {};
  for (const m of meals) mealTypeCount[m.meal_type] = (mealTypeCount[m.meal_type] || 0) + 1;
  const most_common_meal_type = Object.entries(mealTypeCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

  return { potential_triggers, patterns: { most_common_meal_type } };
}

