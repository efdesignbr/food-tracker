import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { encode } from 'next-auth/jwt';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email e senha obrigatórios' }, { status: 400 });
    }

    const pool = getPool();
    const { rows } = await pool.query(
      `select u.id, u.email, u.name, u.password_hash, u.role, u.tenant_id, t.slug as tenant_slug
       from users u
       join tenants t on t.id = u.tenant_id
       where u.email = $1
       limit 1`,
      [email.toLowerCase()]
    );

    const user = rows[0];
    if (!user || !user.password_hash) {
      return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
    }

    // Gerar JWE compatível com NextAuth
    const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
    if (!secret) {
      console.error('AUTH_SECRET not set');
      return NextResponse.json({ error: 'Server config error' }, { status: 500 });
    }

    const token = await encode({
      token: {
        sub: user.id,
        userId: user.id,
        email: user.email,
        role: user.role,
        tenantId: user.tenant_id,
        tenantSlug: user.tenant_slug
      },
      secret,
      salt: '__Secure-next-auth.session-token', // Deve bater com auth.ts
    });

    return NextResponse.json({ token, user: { id: user.id, name: user.name, email: user.email } });

  } catch (error) {
    console.error('Mobile login error:', error);
    return NextResponse.json({ error: 'Erro interno ao realizar login' }, { status: 500 });
  }
}
