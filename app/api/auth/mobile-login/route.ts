import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email e senha obrigatórios' }, { status: 400 });
    }

    const pool = getPool();
    const { rows } = await pool.query(
      `select u.id,
              u.email,
              u.name,
              u.password_hash,
              u.role,
              u.tenant_id,
              u.plan,
              t.slug as tenant_slug
       from users u
       left join tenants t on t.id = u.tenant_id
       where lower(u.email) = lower($1)
       limit 1`,
      [email]
    );

    const user = rows[0];
    if (!user) {
      return NextResponse.json({ error: 'Email ou senha incorretos' }, { status: 401 });
    }

    // Tenant deletado ou inconsistente
    if (!user.tenant_id || !user.tenant_slug) {
      return NextResponse.json({ error: 'tenant_not_found' }, { status: 404 });
    }

    if (!user.password_hash) {
      return NextResponse.json({ error: 'Email ou senha incorretos' }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return NextResponse.json({ error: 'Email ou senha incorretos' }, { status: 401 });
    }

    // Gerar JWT Padrão (JWS)
    const secretStr = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || 'fallback-secret-dev';
    const secret = new TextEncoder().encode(secretStr);
    
    const token = await new SignJWT({
        sub: user.id,
        userId: user.id,
        email: user.email,
        role: user.role,
        tenantId: user.tenant_id,
        tenantSlug: user.tenant_slug,
        plan: user.plan || 'free'
      })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('30d')
      .sign(secret);

    return NextResponse.json({ token, user: { id: user.id, name: user.name, email: user.email } });

  } catch (error) {
    console.error('Mobile login error:', error);
    return NextResponse.json({ error: 'Erro interno ao realizar login' }, { status: 500 });
  }
}
