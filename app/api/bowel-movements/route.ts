import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helper';
import { getPool } from '@/lib/db';

// GET: Buscar registros de evacuações por data
export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentUser() as any;
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date'); // YYYY-MM-DD format

    const pool = getPool();
    let query: string;
    let params: any[];

    if (date) {
      // Buscar registros de um dia específico
      query = `
        SELECT
          id,
          bristol_type,
          occurred_at,
          notes,
          created_at
        FROM bowel_movements
        WHERE user_id = $1
          AND DATE(occurred_at) = $2
        ORDER BY occurred_at DESC
      `;
      params = [session.userId, date];
    } else {
      // Buscar registros de hoje
      query = `
        SELECT
          id,
          bristol_type,
          occurred_at,
          notes,
          created_at
        FROM bowel_movements
        WHERE user_id = $1
          AND DATE(occurred_at) = CURRENT_DATE
        ORDER BY occurred_at DESC
      `;
      params = [session.userId];
    }

    const { rows } = await pool.query(query, params);

    // Calcular total do dia
    const count = rows.length;

    return NextResponse.json({
      success: true,
      records: rows,
      count
    });

  } catch (error: any) {
    console.error('Error fetching bowel movements:', error);
    if (error instanceof Response) return error;
    return NextResponse.json(
      { error: 'Erro ao buscar registros de evacuações', details: error.message },
      { status: 500 }
    );
  }
}

// POST: Adicionar novo registro de evacuação
export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUser() as any;
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await req.json();
    const { bristol_type, notes = null, occurred_at = new Date() } = body;

    // Validação
    if (!bristol_type || bristol_type < 1 || bristol_type > 7) {
      return NextResponse.json(
        { error: 'Tipo Bristol inválido (deve ser entre 1 e 7)' },
        { status: 400 }
      );
    }

    const pool = getPool();

    // Inserir registro
    const { rows } = await pool.query(
      `
      INSERT INTO bowel_movements (user_id, tenant_id, bristol_type, occurred_at, notes)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, bristol_type, occurred_at, notes, created_at
      `,
      [session.userId, session.tenantId, bristol_type, occurred_at, notes]
    );

    // Buscar total do dia após inserção
    const { rows: todayRows } = await pool.query(
      `
      SELECT COUNT(*) as count
      FROM bowel_movements
      WHERE user_id = $1
        AND DATE(occurred_at) = CURRENT_DATE
      `,
      [session.userId]
    );

    const countToday = parseInt(todayRows[0].count);

    return NextResponse.json({
      success: true,
      record: rows[0],
      count_today: countToday
    });

  } catch (error: any) {
    console.error('Error adding bowel movement:', error);
    if (error instanceof Response) return error;
    return NextResponse.json(
      { error: 'Erro ao adicionar registro de evacuação', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE: Remover registro de evacuação
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
      DELETE FROM bowel_movements
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
      SELECT COUNT(*) as count
      FROM bowel_movements
      WHERE user_id = $1
        AND DATE(occurred_at) = CURRENT_DATE
      `,
      [session.userId]
    );

    const countToday = parseInt(todayRows[0].count);

    return NextResponse.json({
      success: true,
      count_today: countToday
    });

  } catch (error: any) {
    console.error('Error deleting bowel movement:', error);
    if (error instanceof Response) return error;
    return NextResponse.json(
      { error: 'Erro ao deletar registro de evacuação', details: error.message },
      { status: 500 }
    );
  }
}
