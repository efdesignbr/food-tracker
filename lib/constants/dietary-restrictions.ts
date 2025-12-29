export type RestrictionType = 'allergy' | 'intolerance' | 'diet' | 'religious' | 'medical' | 'preference';
export type Severity = 'mild' | 'moderate' | 'severe';

export interface DietaryRestriction {
  id: string;
  user_id: string;
  tenant_id: string;
  restriction_type: RestrictionType;
  restriction_value: string;
  severity: Severity;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

export const RESTRICTION_TYPES = {
  allergy: { label: 'Alergias', icon: 'alert-triangle', color: '#ef4444' },
  intolerance: { label: 'Intolerancias', icon: 'ban', color: '#f59e0b' },
  diet: { label: 'Dietas', icon: 'salad', color: '#10b981' },
  religious: { label: 'Religiosas', icon: 'heart', color: '#6366f1' },
  medical: { label: 'Medicas', icon: 'pill', color: '#ec4899' },
  preference: { label: 'Preferencias', icon: 'thumbs-up', color: '#8b5cf6' }
} as const;

export const PREDEFINED_RESTRICTIONS = {
  allergy: [
    { value: 'gluten', label: 'Gluten' },
    { value: 'lactose', label: 'Lactose' },
    { value: 'peanut', label: 'Amendoim' },
    { value: 'tree_nuts', label: 'Castanhas/Nozes' },
    { value: 'shellfish', label: 'Frutos do Mar' },
    { value: 'fish', label: 'Peixes' },
    { value: 'egg', label: 'Ovo' },
    { value: 'soy', label: 'Soja' },
    { value: 'wheat', label: 'Trigo' },
    { value: 'sesame', label: 'Gergelim' }
  ],
  intolerance: [
    { value: 'lactose', label: 'Lactose' },
    { value: 'fructose', label: 'Frutose' },
    { value: 'histamine', label: 'Histamina' },
    { value: 'fodmap', label: 'FODMAPs' }
  ],
  diet: [
    { value: 'vegetarian', label: 'Vegetariano' },
    { value: 'vegan', label: 'Vegano' },
    { value: 'pescatarian', label: 'Pescatariano' },
    { value: 'low_carb', label: 'Low Carb' },
    { value: 'keto', label: 'Cetogenica' },
    { value: 'paleo', label: 'Paleo' },
    { value: 'mediterranean', label: 'Mediterranea' }
  ],
  religious: [
    { value: 'halal', label: 'Halal' },
    { value: 'kosher', label: 'Kosher' },
    { value: 'no_pork', label: 'Sem Carne de Porco' },
    { value: 'no_beef', label: 'Sem Carne Bovina' }
  ],
  medical: [
    { value: 'diabetes', label: 'Diabetes' },
    { value: 'hypertension', label: 'Hipertensao' },
    { value: 'celiac', label: 'Doenca Celiaca' },
    { value: 'phenylketonuria', label: 'Fenilcetonuria' },
    { value: 'gout', label: 'Gota' },
    { value: 'kidney_disease', label: 'Doenca Renal' }
  ],
  preference: [
    { value: 'no_sugar', label: 'Sem Acucar Refinado' },
    { value: 'organic_only', label: 'Apenas Organicos' },
    { value: 'no_processed', label: 'Sem Ultraprocessados' }
  ]
} as const;

export const SEVERITY_LEVELS = [
  { value: 'mild', label: 'Leve', color: '#fef3c7' },
  { value: 'moderate', label: 'Moderada', color: '#fed7aa' },
  { value: 'severe', label: 'Grave', color: '#fecaca' }
] as const;

export function formatRestrictionName(value: string): string {
  // Busca o label em todas as categorias
  for (const category of Object.values(PREDEFINED_RESTRICTIONS)) {
    const found = category.find(r => r.value === value);
    if (found) return found.label;
  }
  // Se não encontrar, capitaliza o valor
  return value.charAt(0).toUpperCase() + value.slice(1).replace(/_/g, ' ');
}
