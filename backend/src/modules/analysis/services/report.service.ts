import { mealRepository } from '../../meals/repositories/meal.repository';
import { InflammationReport } from '../../../shared/types';
import { logger } from '../../../shared/utils/logger';

// Common inflammatory trigger foods for gut issues
const INFLAMMATORY_KEYWORDS = [
  'leite', 'queijo', 'iogurte', 'manteiga', 'lactose', 'nata', 'creme',
  'pão', 'massa', 'macarrão', 'bolo', 'biscoito', 'glúten', 'trigo',
  'fritura', 'frito', 'gorduroso', 'bacon', 'salsicha', 'embutido',
  'pimenta', 'picante', 'apimentado', 'molho picante',
  'refrigerante', 'café', 'álcool', 'cerveja', 'vinho',
  'processado', 'industrializado', 'fast food',
  'feijão', 'lentilha', 'grão de bico', 'brócolis', 'couve-flor', 'repolho',
];

class ReportService {
  async generateInflammationReport(
    startDate: Date,
    endDate: Date
  ): Promise<InflammationReport> {
    logger.info('Generating inflammation report', { startDate, endDate });

    const meals = await mealRepository.findByDateRange(startDate, endDate);

    // Extract all foods
    const allFoods: Array<{ name: string; date: string }> = [];
    meals.forEach((meal) => {
      meal.foods.forEach((food) => {
        allFoods.push({
          name: food.name.toLowerCase(),
          date: meal.consumed_at.toISOString().split('T')[0],
        });
      });
    });

    // Identify potential triggers
    const triggerMap = new Map<string, { occurrences: number; dates: string[] }>();

    allFoods.forEach(({ name, date }) => {
      const matchedTriggers = INFLAMMATORY_KEYWORDS.filter((keyword) =>
        name.includes(keyword)
      );

      matchedTriggers.forEach((trigger) => {
        if (!triggerMap.has(trigger)) {
          triggerMap.set(trigger, { occurrences: 0, dates: [] });
        }

        const data = triggerMap.get(trigger)!;
        data.occurrences++;
        if (!data.dates.includes(date)) {
          data.dates.push(date);
        }
      });
    });

    // Sort by occurrences
    const potentialTriggers = Array.from(triggerMap.entries())
      .map(([food, data]) => ({
        food,
        occurrences: data.occurrences,
        dates: data.dates.sort(),
      }))
      .sort((a, b) => b.occurrences - a.occurrences);

    // Calculate patterns
    const mealTypeCount = meals.reduce((acc, meal) => {
      acc[meal.meal_type] = (acc[meal.meal_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const mostCommonMealType = Object.entries(mealTypeCount).sort(
      ([, a], [, b]) => b - a
    )[0]?.[0] || 'N/A';

    const daysDiff = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const averageMealsPerDay = meals.length / (daysDiff || 1);

    // Generate recommendations
    const recommendations: string[] = [];

    if (potentialTriggers.length > 0) {
      recommendations.push(
        `Considere eliminar ${potentialTriggers[0].food} da dieta - foi detectado ${potentialTriggers[0].occurrences}x no período`
      );
    }

    if (averageMealsPerDay < 3) {
      recommendations.push(
        'Tente fazer refeições mais regulares (3-5 por dia) para melhor controle intestinal'
      );
    }

    if (triggerMap.has('café') || triggerMap.has('refrigerante')) {
      recommendations.push(
        'Reduza bebidas estimulantes (café, refrigerante) que podem irritar o intestino'
      );
    }

    if (recommendations.length === 0) {
      recommendations.push(
        'Continue monitorando sua alimentação para identificar possíveis gatilhos'
      );
    }

    const report: InflammationReport = {
      period_start: startDate.toISOString().split('T')[0],
      period_end: endDate.toISOString().split('T')[0],
      total_meals: meals.length,
      potential_triggers: potentialTriggers,
      patterns: {
        most_common_meal_type: mostCommonMealType,
        average_meals_per_day: parseFloat(averageMealsPerDay.toFixed(1)),
      },
      recommendations,
    };

    logger.info('Report generated', {
      triggersFound: potentialTriggers.length,
      totalMeals: meals.length,
    });

    return report;
  }
}

export const reportService = new ReportService();
