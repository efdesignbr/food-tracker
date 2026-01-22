import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

function sha256(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex');
}

export async function POST(req: Request) {
  const pool = getPool();
  const client = await pool.connect();
  try {
    const { token, newPassword } = await req.json();
    const rawToken = (token || '').toString();
    const password = (newPassword || '').toString();

    if (!rawToken || password.length < 8) {
      return NextResponse.json(
        { error: 'Token inválido ou senha fraca' },
        { status: 400 }
      );
    }

    const tokenHash = sha256(rawToken);

    await client.query('BEGIN');

    const { rows } = await client.query(
      `SELECT id, user_id, expires_at, used_at
         FROM password_reset_tokens
        WHERE token_hash = $1
        LIMIT 1`,
      [tokenHash]
    );

    const tokenRow = rows[0];
    const now = new Date();
    if (!tokenRow || tokenRow.used_at || new Date(tokenRow.expires_at) < now) {
      await client.query('ROLLBACK');
      return NextResponse.json(
        { error: 'Token inválido ou expirado' },
        { status: 400 }
      );
    }

    const hash = bcrypt.hashSync(password, 10);
    await client.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, tokenRow.user_id]);
    await client.query('UPDATE password_reset_tokens SET used_at = NOW() WHERE id = $1', [tokenRow.id]);

    await client.query('COMMIT');
    return NextResponse.json({ ok: true });
  } catch (e) {
    try { await client.query('ROLLBACK'); } catch {}
    return NextResponse.json(
      { error: 'Erro ao redefinir a senha' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

