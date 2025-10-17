import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { auth } from '@/lib/auth';
import { getSessionData } from '@/lib/types/auth';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = getSessionData(await auth());
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const pool = getPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN');
      await client.query("SELECT set_config('app.tenant_id', $1, true)", [session.tenantId]);

      // Deleta nutrition_data primeiro (tem FK para food_items)
      await client.query(
        `DELETE FROM nutrition_data
         WHERE food_item_id IN (
           SELECT id FROM food_items WHERE meal_id = $1 AND tenant_id = $2
         ) AND tenant_id = $2`,
        [params.id, session.tenantId]
      );

      // Deleta food_items (tem FK para meals)
      await client.query(
        'DELETE FROM food_items WHERE meal_id = $1 AND tenant_id = $2',
        [params.id, session.tenantId]
      );

      // Deleta a meal
      const result = await client.query(
        'DELETE FROM meals WHERE id = $1 AND user_id = $2 AND tenant_id = $3 RETURNING id',
        [params.id, session.userId, session.tenantId]
      );

      if (result.rowCount === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: 'Refeição não encontrada' }, { status: 404 });
      }

      await client.query('COMMIT');
      return NextResponse.json({ success: true });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('Erro ao deletar refeição:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao deletar refeição' },
      { status: 500 }
    );
  }
}
