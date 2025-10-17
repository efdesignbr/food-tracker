import { getPool } from '@/lib/db';
import type { PoolClient } from 'pg';

export type DbMeal = {
  id: string;
  user_id: string;
  tenant_id: string;
  image_url: string | null; // Nullable: images are not stored, only used for AI analysis
  meal_type: 'breakfast'|'lunch'|'dinner'|'snack';
  consumed_at: Date;
  status: 'pending'|'approved'|'rejected';
  notes: string | null;
  location_type?: 'home'|'out'|null;
  restaurant_id?: string | null;
  created_at: Date;
  updated_at: Date;
};

export type DbFoodItem = {
  id: string;
  meal_id: string;
  name: string;
  quantity: number;
  unit: string;
  confidence_score: number | null;
  created_at: Date;
};

export async function insertMealWithItems(args: {
  tenantId: string;
  userId: string;
  imageUrl: string | null;
  mealType: DbMeal['meal_type'];
  consumedAt: Date;
  notes?: string | null;
  locationType?: 'home'|'out'|null;
  restaurantId?: string | null;
  foods: Array<{
    name: string;
    quantity: number;
    unit: string;
    calories?: number;
    confidence?: number;
    protein_g?: number;
    carbs_g?: number;
    fat_g?: number;
    fiber_g?: number;
    sodium_mg?: number;
    sugar_g?: number;
  }>;
}) {
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // Use set_config which supports parameters (SET LOCAL doesn't accept $1)
    await client.query("SELECT set_config('app.tenant_id', $1, true)", [args.tenantId]);
    const mealRes = await client.query<DbMeal>(
      `INSERT INTO meals (user_id, tenant_id, image_url, meal_type, consumed_at, status, notes, location_type, restaurant_id)
       VALUES ($1,$2,$3,$4,$5,'approved',$6,$7,$8) RETURNING *`,
      [
        args.userId,
        args.tenantId,
        args.imageUrl,
        args.mealType,
        args.consumedAt,
        args.notes || null,
        args.locationType ?? null,
        args.restaurantId ?? null
      ]
    );
    const meal = mealRes.rows[0];

    for (const f of args.foods) {
      try {
        const fi = await client.query<DbFoodItem>(
          `INSERT INTO food_items (meal_id, tenant_id, name, quantity, unit, confidence_score)
           VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
          [meal.id, args.tenantId, f.name, f.quantity, f.unit, f.confidence ?? null]
        );
        const foodItem = fi.rows[0];
        // Upsert nutrition data if any present
        const hasAny = (
          typeof f.calories === 'number' ||
          typeof (f as any).protein_g === 'number' ||
          typeof (f as any).carbs_g === 'number' ||
          typeof (f as any).fat_g === 'number' ||
          typeof (f as any).fiber_g === 'number' ||
          typeof (f as any).sodium_mg === 'number' ||
          typeof (f as any).sugar_g === 'number'
        );
        if (hasAny) {
          await client.query(
            `INSERT INTO nutrition_data (food_item_id, tenant_id, calories, protein_g, carbs_g, fat_g, fiber_g, sodium_mg, sugar_g)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
             ON CONFLICT (food_item_id)
             DO UPDATE SET calories = COALESCE(EXCLUDED.calories, nutrition_data.calories),
                           protein_g = COALESCE(EXCLUDED.protein_g, nutrition_data.protein_g),
                           carbs_g = COALESCE(EXCLUDED.carbs_g, nutrition_data.carbs_g),
                           fat_g = COALESCE(EXCLUDED.fat_g, nutrition_data.fat_g),
                           fiber_g = COALESCE(EXCLUDED.fiber_g, nutrition_data.fiber_g),
                           sodium_mg = COALESCE(EXCLUDED.sodium_mg, nutrition_data.sodium_mg),
                           sugar_g = COALESCE(EXCLUDED.sugar_g, nutrition_data.sugar_g)`,
            [
              foodItem.id,
              args.tenantId,
              f.calories ?? 0,
              (f as any).protein_g ?? 0,
              (f as any).carbs_g ?? 0,
              (f as any).fat_g ?? 0,
              (f as any).fiber_g ?? 0,
              (f as any).sodium_mg ?? null,
              (f as any).sugar_g ?? null
            ]
          );
        }
      } catch (e: any) {
        // Attach context about which step failed
        (e as any)._context = { step: 'insert_food_or_nutrition', tenantId: args.tenantId };
        throw e;
      }
    }
    await client.query('COMMIT');
    return meal;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

export async function insertMealWithItemsTx(client: PoolClient, args: {
  tenantId: string;
  userId: string;
  imageUrl: string | null;
  mealType: DbMeal['meal_type'];
  consumedAt: Date;
  notes?: string | null;
  locationType?: 'home'|'out'|null;
  restaurantId?: string | null;
  foods: Array<{
    name: string;
    quantity: number;
    unit: string;
    calories?: number;
    confidence?: number;
    protein_g?: number;
    carbs_g?: number;
    fat_g?: number;
    fiber_g?: number;
    sodium_mg?: number;
    sugar_g?: number;
  }>;
}) {
  const mealRes = await client.query<DbMeal>(
    `INSERT INTO meals (user_id, tenant_id, image_url, meal_type, consumed_at, status, notes, location_type, restaurant_id)
     VALUES ($1,$2,$3,$4,$5,'approved',$6,$7,$8) RETURNING *`,
    [
      args.userId,
      args.tenantId,
      args.imageUrl,
      args.mealType,
      args.consumedAt,
      args.notes || null,
      args.locationType ?? null,
      args.restaurantId ?? null
    ]
  );
  const meal = mealRes.rows[0];
  for (const f of args.foods) {
    const fi = await client.query<DbFoodItem>(
      `INSERT INTO food_items (meal_id, tenant_id, name, quantity, unit, confidence_score)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [meal.id, args.tenantId, f.name, f.quantity, f.unit, f.confidence ?? null]
    );
    const foodItem = fi.rows[0];
    const hasAny = (
      typeof f.calories === 'number' ||
      typeof (f as any).protein_g === 'number' ||
      typeof (f as any).carbs_g === 'number' ||
      typeof (f as any).fat_g === 'number' ||
      typeof (f as any).fiber_g === 'number' ||
      typeof (f as any).sodium_mg === 'number' ||
      typeof (f as any).sugar_g === 'number'
    );
    if (hasAny) {
      await client.query(
        `INSERT INTO nutrition_data (food_item_id, tenant_id, calories, protein_g, carbs_g, fat_g, fiber_g, sodium_mg, sugar_g)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         ON CONFLICT (food_item_id)
         DO UPDATE SET calories = COALESCE(EXCLUDED.calories, nutrition_data.calories),
                       protein_g = COALESCE(EXCLUDED.protein_g, nutrition_data.protein_g),
                       carbs_g = COALESCE(EXCLUDED.carbs_g, nutrition_data.carbs_g),
                       fat_g = COALESCE(EXCLUDED.fat_g, nutrition_data.fat_g),
                       fiber_g = COALESCE(EXCLUDED.fiber_g, nutrition_data.fiber_g),
                       sodium_mg = COALESCE(EXCLUDED.sodium_mg, nutrition_data.sodium_mg),
                       sugar_g = COALESCE(EXCLUDED.sugar_g, nutrition_data.sugar_g)`,
        [
          foodItem.id,
          args.tenantId,
          f.calories ?? 0,
          (f as any).protein_g ?? 0,
          (f as any).carbs_g ?? 0,
          (f as any).fat_g ?? 0,
          (f as any).fiber_g ?? 0,
          (f as any).sodium_mg ?? null,
          (f as any).sugar_g ?? null
        ]
      );
    }
  }
  return meal;
}

export async function findMealsWithFoodsByDateRange(args: {
  tenantId: string;
  userId: string;
  start: Date;
  end: Date;
}) {
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // Use set_config which supports parameters (SET LOCAL doesn't accept $1)
    await client.query("SELECT set_config('app.tenant_id', $1, true)", [args.tenantId]);
    const { rows } = await client.query(
      `SELECT m.id as meal_id, m.image_url, m.meal_type, m.consumed_at, m.notes,
              m.location_type, m.restaurant_id, r.name as restaurant_name,
              fi.id as food_id, fi.name as food_name, fi.quantity, fi.unit,
              nd.calories, nd.protein_g, nd.carbs_g, nd.fat_g, nd.fiber_g, nd.sodium_mg, nd.sugar_g
       FROM meals m
       LEFT JOIN restaurants r ON r.id = m.restaurant_id AND r.tenant_id = m.tenant_id
       LEFT JOIN food_items fi ON fi.meal_id = m.id
       LEFT JOIN nutrition_data nd ON nd.food_item_id = fi.id
       WHERE m.tenant_id = $1 AND m.user_id = $2 AND m.consumed_at::date BETWEEN $3::date AND $4::date
       ORDER BY m.consumed_at DESC`,
      [args.tenantId, args.userId, args.start, args.end]
    );
    // group
    const map = new Map<string, any>();
    for (const r of rows as any[]) {
      let m = map.get(r.meal_id);
      if (!m) {
        m = {
          id: r.meal_id,
          image_url: r.image_url,
          meal_type: r.meal_type,
          consumed_at: r.consumed_at,
          notes: r.notes,
          location_type: r.location_type ?? null,
          restaurant_id: r.restaurant_id ?? null,
          restaurant_name: r.restaurant_name ?? null,
          foods: [] as any[]
        };
        map.set(r.meal_id, m);
      }
      if (r.food_id) {
        m.foods.push({
          id: r.food_id,
          name: r.food_name,
          quantity: Number(r.quantity),
          unit: r.unit,
          calories: r.calories != null ? Number(r.calories) : undefined,
          protein_g: r.protein_g != null ? Number(r.protein_g) : undefined,
          carbs_g: r.carbs_g != null ? Number(r.carbs_g) : undefined,
          fat_g: r.fat_g != null ? Number(r.fat_g) : undefined,
          fiber_g: r.fiber_g != null ? Number(r.fiber_g) : undefined,
          sodium_mg: r.sodium_mg != null ? Number(r.sodium_mg) : undefined,
          sugar_g: r.sugar_g != null ? Number(r.sugar_g) : undefined
        });
      }
    }
    await client.query('COMMIT');
    return Array.from(map.values());
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}
