import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import bcrypt from 'bcryptjs';

/**
 * Gera slug único baseado no nome
 * Exemplo: "Minha Empresa" → "minha-empresa-a7f3x2"
 */
function generateSlug(name: string): string {
  // 1. Lowercase e remover acentos
  let slug = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  // 2. Substituir espaços e caracteres especiais por hífen
  slug = slug.replace(/[^a-z0-9]+/g, '-');

  // 3. Remover hífens no início/fim
  slug = slug.replace(/^-+|-+$/g, '');

  // 4. Adicionar sufixo aleatório para garantir unicidade
  const random = Math.random().toString(36).substring(2, 8);
  slug = `${slug}-${random}`;

  return slug;
}

/**
 * Valida formato de email
 */
function isValidEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * Verifica se email já está cadastrado em qualquer tenant
 */
async function isEmailUnique(email: string): Promise<boolean> {
  const pool = getPool();
  const { rows } = await pool.query(
    'SELECT id FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1',
    [email]
  );
  return rows.length === 0;
}

export async function POST(req: NextRequest) {
  const pool = getPool();
  const client = await pool.connect();

  try {
    const body = await req.json();
    const { name, email, password, companyName } = body;

    // Validações básicas
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Nome, email e senha são obrigatórios' },
        { status: 400 }
      );
    }

    // Validar email
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Email inválido' },
        { status: 400 }
      );
    }

    // Validar senha
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Senha deve ter no mínimo 8 caracteres' },
        { status: 400 }
      );
    }

    // Verificar se email já existe
    const emailUnique = await isEmailUnique(email);
    if (!emailUnique) {
      return NextResponse.json(
        { error: 'Email já cadastrado' },
        { status: 400 }
      );
    }

    // Usar nome da empresa ou nome do usuário para o tenant
    const tenantName = companyName?.trim() || name.trim();
    const tenantSlug = generateSlug(tenantName);

    // Hash da senha
    const passwordHash = bcrypt.hashSync(password, 10);

    // Iniciar transação
    await client.query('BEGIN');

    // Criar tenant
    const tenantResult = await client.query(
      'INSERT INTO tenants (slug, name) VALUES ($1, $2) RETURNING id',
      [tenantSlug, tenantName]
    );
    const tenantId = tenantResult.rows[0].id;

    // Criar usuário com goals padrão
    const userResult = await client.query(
      `INSERT INTO users (
        email,
        name,
        password_hash,
        tenant_id,
        role,
        goal_calories,
        goal_protein_g,
        goal_carbs_g,
        goal_fat_g,
        goal_water_ml
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
      [
        email.toLowerCase(),
        name,
        passwordHash,
        tenantId,
        'owner',
        2000,  // goal_calories
        150,   // goal_protein_g
        250,   // goal_carbs_g
        65,    // goal_fat_g
        2000   // goal_water_ml
      ]
    );
    const userId = userResult.rows[0].id;

    // Commit da transação
    await client.query('COMMIT');

    return NextResponse.json({
      ok: true,
      tenantId,
      userId,
      message: 'Conta criada com sucesso'
    });

  } catch (error: any) {
    // Rollback em caso de erro
    await client.query('ROLLBACK');

    console.error('Erro no signup:', error);

    return NextResponse.json(
      { error: 'Erro ao criar conta. Tente novamente.' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
