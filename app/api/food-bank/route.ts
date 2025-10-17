import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { requireTenant } from '@/lib/tenant';
import { auth } from '@/lib/auth';
import { init } from '@/lib/init';
import { getSessionData } from '@/lib/types/auth';
import {
  createFoodBankItem,
  listFoodBankItems,
  searchFoodBankItems,
  getFoodBankItemById,
  updateFoodBankItem,
  deleteFoodBankItem
} from '@/lib/repos/food-bank.repo';
import { z } from 'zod';

const createSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  brand: z.string().optional(),
  serving_size: z.string().optional(),
  photo_url: z.string().optional(),

  // Informações nutricionais
  calories: z.number().optional(),
  protein: z.number().optional(),
  carbs: z.number().optional(),
  fat: z.number().optional(),
  fiber: z.number().optional(),
  sodium: z.number().optional(),
  sugar: z.number().optional(),
  saturated_fat: z.number().optional(),

  source: z.enum(['manual', 'ai_analyzed']).optional()
});

const updateSchema = z.object({
  id: z.string().uuid('ID inválido'),
  name: z.string().min(1).optional(),
  brand: z.string().optional(),
  serving_size: z.string().optional(),
  photo_url: z.string().optional(),

  // Informações nutricionais
  calories: z.number().optional(),
  protein: z.number().optional(),
  carbs: z.number().optional(),
  fat: z.number().optional(),
  fiber: z.number().optional(),
  sodium: z.number().optional(),
  sugar: z.number().optional(),
  saturated_fat: z.number().optional()
});

export async function POST(req: Request) {
  try {
    await init();
    const tenant = await requireTenant(req);
    const session = getSessionData(await auth());

    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    if (session.tenantId !== tenant.id) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const body = await req.json();
    const validated = createSchema.parse(body);

    const foodItem = await createFoodBankItem({
      tenantId: tenant.id,
      userId: session.userId,
      name: validated.name,
      brand: validated.brand,
      servingSize: validated.serving_size,
      photoUrl: validated.photo_url,
      calories: validated.calories,
      protein: validated.protein,
      carbs: validated.carbs,
      fat: validated.fat,
      fiber: validated.fiber,
      sodium: validated.sodium,
      sugar: validated.sugar,
      saturatedFat: validated.saturated_fat,
      source: validated.source
    });

    return NextResponse.json({ ok: true, foodItem });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Erro de validação',
        details: err.errors
      }, { status: 400 });
    }
    console.error('Error creating food bank item:', err);
    return NextResponse.json({
      error: err.message || 'Erro ao criar alimento'
    }, { status: 400 });
  }
}

export async function GET(req: Request) {
  try {
    await init();
    const tenant = await requireTenant(req);
    const session = getSessionData(await auth());

    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    if (session.tenantId !== tenant.id) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const url = new URL(req.url);
    const searchQuery = url.searchParams.get('q');
    const orderBy = url.searchParams.get('order_by') as 'name' | 'usage_count' | 'created_at' | null;
    const limit = url.searchParams.get('limit');
    const itemId = url.searchParams.get('id');

    // Se pedir um item específico
    if (itemId) {
      const item = await getFoodBankItemById({
        tenantId: tenant.id,
        userId: session.userId,
        id: itemId
      });

      if (!item) {
        return NextResponse.json({ error: 'Alimento não encontrado' }, { status: 404 });
      }

      return NextResponse.json({ ok: true, item });
    }

    // Se for busca
    if (searchQuery) {
      const items = await searchFoodBankItems({
        tenantId: tenant.id,
        userId: session.userId,
        query: searchQuery,
        limit: limit ? parseInt(limit) : undefined
      });

      return NextResponse.json({ ok: true, items });
    }

    // Listagem geral
    const items = await listFoodBankItems({
      tenantId: tenant.id,
      userId: session.userId,
      orderBy: orderBy || 'name',
      limit: limit ? parseInt(limit) : undefined
    });

    return NextResponse.json({ ok: true, items });
  } catch (err: any) {
    console.error('Error fetching food bank items:', err);
    return NextResponse.json({
      error: err.message || 'Erro ao buscar alimentos'
    }, { status: 400 });
  }
}

export async function PATCH(req: Request) {
  try {
    await init();
    const tenant = await requireTenant(req);
    const session = getSessionData(await auth());

    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    if (session.tenantId !== tenant.id) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const body = await req.json();
    const validated = updateSchema.parse(body);

    const foodItem = await updateFoodBankItem({
      tenantId: tenant.id,
      userId: session.userId,
      id: validated.id,
      name: validated.name,
      brand: validated.brand,
      servingSize: validated.serving_size,
      photoUrl: validated.photo_url,
      calories: validated.calories,
      protein: validated.protein,
      carbs: validated.carbs,
      fat: validated.fat,
      fiber: validated.fiber,
      sodium: validated.sodium,
      sugar: validated.sugar,
      saturatedFat: validated.saturated_fat
    });

    return NextResponse.json({ ok: true, foodItem });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Erro de validação',
        details: err.errors
      }, { status: 400 });
    }
    console.error('Error updating food bank item:', err);
    return NextResponse.json({
      error: err.message || 'Erro ao atualizar alimento'
    }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  try {
    await init();
    const tenant = await requireTenant(req);
    const session = getSessionData(await auth());

    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    if (session.tenantId !== tenant.id) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const url = new URL(req.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID não fornecido' }, { status: 400 });
    }

    await deleteFoodBankItem({
      tenantId: tenant.id,
      userId: session.userId,
      id
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('Error deleting food bank item:', err);
    return NextResponse.json({
      error: err.message || 'Erro ao excluir alimento'
    }, { status: 400 });
  }
}
