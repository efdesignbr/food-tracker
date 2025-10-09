import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getPool } from '@/lib/db';
import bcrypt from 'bcryptjs';

/**
 * DELETE /api/account/delete
 *
 * Exclui a conta do usuário logado e TODOS os seus dados.
 *
 * ATENÇÃO: Esta operação é IRREVERSÍVEL!
 *
 * Segurança:
 * - Requer autenticação (sessão válida)
 * - Valida senha do usuário
 * - Requer confirmação explícita (texto "EXCLUIR")
 * - Deleta o tenant, que em cascata deleta:
 *   - users
 *   - meals
 *   - food_items
 *   - nutrition_data
 *   - water_intake
 */
export async function POST(req: NextRequest) {
  const pool = getPool();
  const client = await pool.connect();

  try {
    // 1. Verificar autenticação
    const session = await auth();
    if (!session?.userId || !session?.tenantId) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    // 2. Obter dados do corpo da requisição
    const body = await req.json();
    const { password, confirmText } = body;

    // 3. Validar campos obrigatórios
    if (!password || !confirmText) {
      return NextResponse.json(
        { error: 'Senha e confirmação são obrigatórios' },
        { status: 400 }
      );
    }

    // 4. Validar texto de confirmação (deve ser exatamente "EXCLUIR")
    if (confirmText !== 'EXCLUIR') {
      return NextResponse.json(
        { error: 'Texto de confirmação incorreto. Digite: EXCLUIR' },
        { status: 400 }
      );
    }

    // 5. Buscar usuário e validar senha
    const userResult = await client.query(
      'SELECT id, email, password_hash, tenant_id FROM users WHERE id = $1',
      [session.userId]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    const user = userResult.rows[0];

    // 6. Validar senha
    const passwordValid = await bcrypt.compare(password, user.password_hash);
    if (!passwordValid) {
      return NextResponse.json(
        { error: 'Senha incorreta' },
        { status: 401 }
      );
    }

    // 7. Verificar se tenant_id da sessão corresponde ao tenant_id do usuário
    if (user.tenant_id !== session.tenantId) {
      return NextResponse.json(
        { error: 'Erro de autorização' },
        { status: 403 }
      );
    }

    // 8. Log de auditoria ANTES de deletar (para registrar quem deletou)
    console.log('🗑️ EXCLUSÃO DE CONTA:', {
      userId: user.id,
      email: user.email,
      tenantId: user.tenant_id,
      timestamp: new Date().toISOString(),
    });

    // 9. Iniciar transação para deletar
    await client.query('BEGIN');

    // 10. Deletar o tenant (ON DELETE CASCADE vai deletar tudo relacionado)
    // ATENÇÃO: Esta linha deleta PERMANENTEMENTE todos os dados!
    const deleteResult = await client.query(
      'DELETE FROM tenants WHERE id = $1 RETURNING id',
      [user.tenant_id]
    );

    if (deleteResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json(
        { error: 'Erro ao excluir conta' },
        { status: 500 }
      );
    }

    // 11. Commit da transação
    await client.query('COMMIT');

    console.log('✅ Conta excluída com sucesso:', {
      tenantId: user.tenant_id,
      userId: user.id,
    });

    // 12. Retornar sucesso
    return NextResponse.json({
      success: true,
      message: 'Conta excluída com sucesso',
    });

  } catch (error: any) {
    // Rollback em caso de qualquer erro
    await client.query('ROLLBACK');

    console.error('❌ Erro ao excluir conta:', error);

    return NextResponse.json(
      { error: 'Erro ao excluir conta. Tente novamente.' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
