import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { requireTenant } from '@/lib/tenant';
import { getCurrentUser } from '@/lib/auth-helper';
import { init } from '@/lib/init';
import {
  getShoppingListById,
  updateShoppingList,
  createListFromUnpurchasedItems,
  getShoppingItemsByList
} from '@/lib/repos/shopping-list.repo';
import { z } from 'zod';

const completeSchema = z.object({
  list_id: z.string().uuid('ID da lista inválido'),
  store_id: z.string().uuid('ID da loja inválido').nullable().optional(),
  new_list_name: z.string().min(1, 'Nome da nova lista é obrigatório').optional()
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
    const validated = completeSchema.parse(body);

    // Verificar se a lista existe e pertence ao usuário
    const list = await getShoppingListById({
      tenantId: tenant.id,
      userId: session.userId,
      id: validated.list_id
    });

    if (!list) {
      return NextResponse.json({ error: 'Lista não encontrada' }, { status: 404 });
    }

    // Buscar itens da lista para verificar se há não comprados
    const items = await getShoppingItemsByList({
      tenantId: tenant.id,
      listId: validated.list_id
    });

    const unpurchasedItems = items.filter(item => !item.is_purchased);
    let newList = null;

    // Se há itens não comprados e foi fornecido nome para nova lista, criar nova lista
    if (unpurchasedItems.length > 0 && validated.new_list_name) {
      newList = await createListFromUnpurchasedItems({
        tenantId: tenant.id,
        userId: session.userId,
        sourceListId: validated.list_id,
        newName: validated.new_list_name
      });
    }

    // Finalizar a lista original
    await updateShoppingList({
      tenantId: tenant.id,
      userId: session.userId,
      id: validated.list_id,
      status: 'completed',
      storeId: validated.store_id || null
    });

    return NextResponse.json({
      ok: true,
      new_list: newList,
      transferred_items: unpurchasedItems.length
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Erro de validação',
        details: err.errors
      }, { status: 400 });
    }
    console.error('[complete POST] error:', err);
    if (err instanceof Response) return err;
    return NextResponse.json({ error: err.message || 'Erro ao finalizar lista' }, { status: 400 });
  }
}
