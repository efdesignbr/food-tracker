import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helper';
import { getPool } from '@/lib/db';
import { getUserPlanById } from '@/lib/quota';
import { PLAN_LIMITS } from '@/lib/constants';
import { getCurrentDateBR, getCurrentTimeBR } from '@/lib/datetime';

// GET: Buscar registros de água por data ou histórico agregado
export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentUser() as any;
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date'); // YYYY-MM-DD format
    const history = searchParams.get('history'); // 'true' para buscar histórico agregado

    const pool = getPool();

    if (history === 'true') {
      // Busca o plano do usuário para determinar limite de histórico
      const userPlan = await getUserPlanById(session.userId);
      const historyDays = PLAN_LIMITS[userPlan]?.history_days;

      // Se historyDays é null (premium/unlimited), usa 5 anos
      // Caso contrário usa o limite do plano (free = 30 dias)
      const intervalDays = historyDays === null ? 5 * 365 : historyDays;

      // Buscar histórico agregado por dia (usando data de São Paulo)
      const query = `
        SELECT
          consumed_date as date,
          SUM(amount_ml) as total_ml
        FROM water_intake
        WHERE user_id = $1
          AND consumed_date >= $2::date - INTERVAL '${intervalDays} days'
        GROUP BY consumed_date
        ORDER BY consumed_date DESC
      `;
      const { rows } = await pool.query(query, [session.userId, getCurrentDateBR()]);

      return NextResponse.json({
        success: true,
        history: rows.map((row: any) => {
          const d = row.date;
          const dateStr = typeof d === 'string'
            ? d
            : (d instanceof Date ? d.toISOString().slice(0, 10) : String(d));
          return { date: dateStr, total_ml: parseInt(row.total_ml) };
        })
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
          consumed_date,
          consumed_time,
          notes,
          created_at
        FROM water_intake
        WHERE user_id = $1
          AND consumed_date = $2
        ORDER BY consumed_date DESC, consumed_time DESC
      `;
      params = [session.userId, date];
    } else {
      // Buscar registros de hoje (data de São Paulo, não UTC)
      query = `
        SELECT
          id,
          amount_ml,
          consumed_date,
          consumed_time,
          notes,
          created_at
        FROM water_intake
        WHERE user_id = $1
          AND consumed_date = $2
        ORDER BY consumed_date DESC, consumed_time DESC
      `;
      params = [session.userId, getCurrentDateBR()];
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
    if (error instanceof Response) return error;
    return NextResponse.json(
      { error: 'Erro ao buscar registros de água', details: error.message },
      { status: 500 }
    );
  }
}

// POST: Adicionar novo registro de água
export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUser() as any;
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

    // Inserir registro com data e hora BR separados
    const { rows } = await pool.query(
      `
      INSERT INTO water_intake (user_id, tenant_id, amount_ml, consumed_date, consumed_time, notes)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, amount_ml, consumed_date, consumed_time, notes, created_at
      `,
      [session.userId, session.tenantId, amount_ml, getCurrentDateBR(), getCurrentTimeBR(), notes]
    );

    // Buscar total do dia após inserção (data de São Paulo, não UTC)
    const { rows: todayRows } = await pool.query(
      `
      SELECT COALESCE(SUM(amount_ml), 0) as total
      FROM water_intake
      WHERE user_id = $1
        AND consumed_date = $2
      `,
      [session.userId, getCurrentDateBR()]
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
    if (error instanceof Response) return error;
    return NextResponse.json(
      { error: 'Erro ao adicionar registro de água', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE: Remover registro de água
export async function DELETE(req: NextRequest) {
  try {
    const session = await getCurrentUser() as any;
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

    // Buscar total do dia após deleção (data de São Paulo, não UTC)
    const { rows: todayRows } = await pool.query(
      `
      SELECT COALESCE(SUM(amount_ml), 0) as total
      FROM water_intake
      WHERE user_id = $1
        AND consumed_date = $2
      `,
      [session.userId, getCurrentDateBR()]
    );

    const totalToday = parseInt(todayRows[0].total);

    return NextResponse.json({
      success: true,
      total_today_ml: totalToday,
      glasses: Math.floor(totalToday / 250)
    });

  } catch (error: any) {
    console.error('Error deleting water intake:', error);
    if (error instanceof Response) return error;
    return NextResponse.json(
      { error: 'Erro ao deletar registro de água', details: error.message },
      { status: 500 }
    );
  }
}
