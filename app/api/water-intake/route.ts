import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getPool } from '@/lib/db';
import { getSessionData } from '@/lib/types/auth';

// GET: Buscar registros de água por data ou histórico agregado
export async function GET(req: NextRequest) {
  try {
    const session = getSessionData(await auth());
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date'); // YYYY-MM-DD format
    const history = searchParams.get('history'); // 'true' para buscar histórico agregado

    const pool = getPool();

    if (history === 'true') {
      // Buscar histórico agregado por dia (últimos 90 dias)
      const query = `
        SELECT
          DATE(consumed_at) as date,
          SUM(amount_ml) as total_ml
        FROM water_intake
        WHERE user_id = $1
          AND consumed_at >= NOW() - INTERVAL '90 days'
        GROUP BY DATE(consumed_at)
        ORDER BY date DESC
      `;
      const { rows } = await pool.query(query, [session.userId]);

      return NextResponse.json({
        success: true,
        history: rows.map(row => ({
          date: row.date.toISOString().split('T')[0], // Format as YYYY-MM-DD
          total_ml: parseInt(row.total_ml)
        }))
      });
    }

    let query: string;
    let params: any[];

    if (date) {
      // Buscar registros de um dia específico
      query = `
        SELECT
          id,
          amount_ml,
          consumed_at,
          notes,
          created_at
        FROM water_intake
        WHERE user_id = $1
          AND DATE(consumed_at) = $2
        ORDER BY consumed_at DESC
      `;
      params = [session.userId, date];
    } else {
      // Buscar registros de hoje
      query = `
        SELECT
          id,
          amount_ml,
          consumed_at,
          notes,
          created_at
        FROM water_intake
        WHERE user_id = $1
          AND DATE(consumed_at) = CURRENT_DATE
        ORDER BY consumed_at DESC
      `;
      params = [session.userId];
    }

    const { rows } = await pool.query(query, params);

    // Calcular total do dia
    const total = rows.reduce((sum, row) => sum + row.amount_ml, 0);

    return NextResponse.json({
      success: true,
      records: rows,
      total_ml: total,
      glasses: Math.floor(total / 250) // 1 copo = 250ml
    });

  } catch (error: any) {
    console.error('Error fetching water intake:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar registros de água', details: error.message },
      { status: 500 }
    );
  }
}

// POST: Adicionar novo registro de água
export async function POST(req: NextRequest) {
  try {
    const session = getSessionData(await auth());
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await req.json();
    const { amount_ml = 250, notes = null } = body;

    // Validação
    if (amount_ml <= 0 || amount_ml > 5000) {
      return NextResponse.json(
        { error: 'Quantidade inválida (deve ser entre 1ml e 5000ml)' },
        { status: 400 }
      );
    }

    const pool = getPool();

    // Inserir registro
    const { rows } = await pool.query(
      `
      INSERT INTO water_intake (user_id, tenant_id, amount_ml, notes)
      VALUES ($1, $2, $3, $4)
      RETURNING id, amount_ml, consumed_at, notes, created_at
      `,
      [session.userId, session.tenantId, amount_ml, notes]
    );

    // Buscar total do dia após inserção
    const { rows: todayRows } = await pool.query(
      `
      SELECT COALESCE(SUM(amount_ml), 0) as total
      FROM water_intake
      WHERE user_id = $1
        AND DATE(consumed_at) = CURRENT_DATE
      `,
      [session.userId]
    );

    const totalToday = parseInt(todayRows[0].total);

    return NextResponse.json({
      success: true,
      record: rows[0],
      total_today_ml: totalToday,
      glasses: Math.floor(totalToday / 250)
    });

  } catch (error: any) {
    console.error('Error adding water intake:', error);
    return NextResponse.json(
      { error: 'Erro ao adicionar registro de água', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE: Remover registro de água
export async function DELETE(req: NextRequest) {
  try {
    const session = getSessionData(await auth());
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID não fornecido' }, { status: 400 });
    }

    const pool = getPool();

    // Deletar apenas se pertencer ao usuário
    const { rowCount } = await pool.query(
      `
      DELETE FROM water_intake
      WHERE id = $1 AND user_id = $2
      `,
      [id, session.userId]
    );

    if (rowCount === 0) {
      return NextResponse.json(
        { error: 'Registro não encontrado ou não pertence ao usuário' },
        { status: 404 }
      );
    }

    // Buscar total do dia após deleção
    const { rows: todayRows } = await pool.query(
      `
      SELECT COALESCE(SUM(amount_ml), 0) as total
      FROM water_intake
      WHERE user_id = $1
        AND DATE(consumed_at) = CURRENT_DATE
      `,
      [session.userId]
    );

    const totalToday = parseInt(todayRows[0].total);

    return NextResponse.json({
      success: true,
      total_today_ml: totalToday,
      glasses: Math.floor(totalToday / 250)
    });

  } catch (error: any) {
    console.error('Error deleting water intake:', error);
    return NextResponse.json(
      { error: 'Erro ao deletar registro de água', details: error.message },
      { status: 500 }
    );
  }
}
