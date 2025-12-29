import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { requireTenant } from '@/lib/tenant';
import { getCurrentUser } from '@/lib/auth-helper';
import { getPool } from '@/lib/db';
import { convertMealsToCSV, type MealForExport } from '@/lib/utils/csv-export';
import { init } from '@/lib/init';

export async function GET(req: Request) {
  try {
    await init();
    const tenant = await requireTenant(req);
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    if (session.tenantId !== tenant.id) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

    const url = new URL(req.url);
    const startDateStr = url.searchParams.get('start_date');
    const endDateStr = url.searchParams.get('end_date');

    if (!startDateStr || !endDateStr) {
      return NextResponse.json({ error: 'start_date and end_date are required' }, { status: 400 });
    }

    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
    }

    if (startDate > endDate) {
      return NextResponse.json({ error: 'start_date must be before end_date' }, { status: 400 });
    }

    const pool = getPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN');
      await client.query("SELECT set_config('app.tenant_id', $1, true)", [tenant.id]);

      const { rows } = await client.query(
        `SELECT
          m.id as meal_id,
          m.meal_type,
          m.consumed_at,
          m.notes,
          m.location_type,
          r.name as restaurant_name,
          fi.name as food_name,
          fi.quantity,
          fi.unit,
          nd.calories,
          nd.protein_g,
          nd.carbs_g,
          nd.fat_g,
          nd.fiber_g,
          nd.sodium_mg,
          nd.sugar_g
        FROM meals m
        LEFT JOIN restaurants r ON r.id = m.restaurant_id AND r.tenant_id = m.tenant_id
        LEFT JOIN food_items fi ON fi.meal_id = m.id
        LEFT JOIN nutrition_data nd ON nd.food_item_id = fi.id
        WHERE m.tenant_id = $1
          AND m.user_id = $2
          AND m.consumed_at::date BETWEEN $3::date AND $4::date
          AND m.status = 'approved'
        ORDER BY m.consumed_at ASC, m.id, fi.id`,
        [tenant.id, session.userId, startDate, endDate]
      );

      await client.query('COMMIT');

      if (rows.length === 0) {
        return NextResponse.json({ error: 'No meals found for the specified date range' }, { status: 404 });
      }

      const mealsForExport: MealForExport[] = rows.map((row: any) => ({
        meal_id: row.meal_id,
        meal_type: row.meal_type,
        consumed_at: new Date(row.consumed_at),
        notes: row.notes,
        location_type: row.location_type,
        restaurant_name: row.restaurant_name,
        food_name: row.food_name,
        quantity: parseFloat(row.quantity),
        unit: row.unit,
        calories: row.calories != null ? parseFloat(row.calories) : null,
        protein_g: row.protein_g != null ? parseFloat(row.protein_g) : null,
        carbs_g: row.carbs_g != null ? parseFloat(row.carbs_g) : null,
        fat_g: row.fat_g != null ? parseFloat(row.fat_g) : null,
        fiber_g: row.fiber_g != null ? parseFloat(row.fiber_g) : null,
        sodium_mg: row.sodium_mg != null ? parseFloat(row.sodium_mg) : null,
        sugar_g: row.sugar_g != null ? parseFloat(row.sugar_g) : null,
      }));

      const csvContent = convertMealsToCSV(mealsForExport);

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="historico-alimentacao_${startDateStr}_${endDateStr}.csv"`,
        },
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (err: any) {
    const status = err instanceof Response ? err.status : 400;
    const payload = err instanceof Response ? await err.text() : JSON.stringify({ error: err.message });
    return new NextResponse(payload, { status, headers: { 'Content-Type': 'application/json' } });
  }
}
