#!/usr/bin/env tsx
import { getPool } from '../lib/db';

async function verifyMeal() {
  const pool = getPool();
  const client = await pool.connect();

  try {
    const mealId = '37c8b7cf-d1a4-491c-add2-551ab0940874';

    console.log('🔍 Verificando refeição:', mealId, '\n');

    const meal = await client.query(`
      SELECT * FROM meals WHERE id = $1
    `, [mealId]);

    if (meal.rows.length === 0) {
      console.log('❌ Refeição não encontrada!');
      return;
    }

    console.log('✅ Refeição encontrada:');
    console.log(meal.rows[0]);

    const foods = await client.query(`
      SELECT fi.*, nd.*
      FROM food_items fi
      LEFT JOIN nutrition_data nd ON nd.food_item_id = fi.id
      WHERE fi.meal_id = $1
    `, [mealId]);

    console.log('\n🍽️  Alimentos (' + foods.rows.length + '):');
    console.table(foods.rows);

  } finally {
    client.release();
    await pool.end();
  }
}

verifyMeal();
