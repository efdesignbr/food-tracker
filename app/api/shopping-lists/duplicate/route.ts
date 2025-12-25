import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { requireTenant } from '@/lib/tenant';
import { getCurrentUser } from '@/lib/auth-helper';
import { init } from '@/lib/init';
import { duplicateShoppingList, getShoppingListById } from '@/lib/repos/shopping-list.repo';
import { z } from 'zod';

const duplicateSchema = z.object({
  source_list_id: z.string().uuid('ID da lista inválido'),
  name: z.string().min(1, 'Nome é obrigatório')
});

export async function POST(req: Request) {
  try {
    await init();
    const tenant = await requireTenant(req);
    const session = await getCurrentUser();

    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    if (session.tenantId !== tenant.id) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const body = await req.json();
    const validated = duplicateSchema.parse(body);

    // Verificar se a lista original existe e pertence ao usuário
    const sourceList = await getShoppingListById({
      tenantId: tenant.id,
      userId: session.userId,
      id: validated.source_list_id
    });

    if (!sourceList) {
      return NextResponse.json({ error: 'Lista não encontrada' }, { status: 404 });
    }

    const newList = await duplicateShoppingList({
      tenantId: tenant.id,
      userId: session.userId,
      sourceListId: validated.source_list_id,
      newName: validated.name
    });

    return NextResponse.json({ ok: true, list: newList });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Erro de validação',
        details: err.errors
      }, { status: 400 });
    }
    console.error('[duplicate POST] error:', err);
    return NextResponse.json({ error: err.message || 'Erro ao duplicar lista' }, { status: 400 });
  }
}
