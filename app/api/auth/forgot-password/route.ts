import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import crypto from 'crypto';

function sha256(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex');
}

function getBaseUrl(): string {
  return (
    process.env.APP_BASE_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'https://app.foodtracker.com.br'
  );
}

async function ensureTokenTable() {
  const pool = getPool();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id UUID PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      used_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  await pool.query(
    `CREATE UNIQUE INDEX IF NOT EXISTS ux_password_reset_token_hash ON password_reset_tokens(token_hash)`
  );
  await pool.query(
    `CREATE INDEX IF NOT EXISTS ix_password_reset_user ON password_reset_tokens(user_id)`
  );
}

export async function POST(req: Request) {
  const pool = getPool();

  try {
    const { email } = await req.json();
    const safeEmail = (email || '').toString().trim();

    // Sempre responde 200 para evitar enumeração de e-mails
    const genericResponse = NextResponse.json({ ok: true });

    if (!safeEmail) return genericResponse;

    // Busca usuário (case-insensitive)
    const { rows } = await pool.query(
      'SELECT id, email, name FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1',
      [safeEmail]
    );
    const user = rows[0];
    if (!user) return genericResponse;

    // Garante a tabela
    await ensureTokenTable();

    // Cria token
    const tokenRaw = crypto.randomBytes(32).toString('hex');
    const tokenHash = sha256(tokenRaw);
    const id = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutos

    await pool.query(
      `INSERT INTO password_reset_tokens (id, user_id, token_hash, expires_at)
       VALUES ($1, $2, $3, $4)`,
      [id, user.id, tokenHash, expiresAt]
    );

    // Envia email via Resend
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    const RESEND_FROM = process.env.RESEND_FROM || 'Food Tracker <no-reply@foodtracker.com.br>';
    if (RESEND_API_KEY) {
      const resetUrl = `${getBaseUrl()}/reset-password?token=${tokenRaw}`;
      const subject = 'Redefinição de senha - Food Tracker';
      const text = `Olá,

Recebemos uma solicitação para redefinir sua senha do Food Tracker.
Se você fez essa solicitação, acesse o link abaixo:

${resetUrl}

Este link é válido por 30 minutos. Se você não fez essa solicitação, ignore este e-mail.

Obrigado,
Equipe Food Tracker`;
      const html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111">
          <h2>Redefinição de senha</h2>
          <p>Recebemos uma solicitação para redefinir sua senha do <strong>Food Tracker</strong>.</p>
          <p>Se você fez essa solicitação, clique no botão abaixo:</p>
          <p>
            <a href="${resetUrl}" style="background:#2196F3;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;display:inline-block">Redefinir senha</a>
          </p>
          <p>Ou copie e cole este link no seu navegador:</p>
          <p><a href="${resetUrl}">${resetUrl}</a></p>
          <p style="color:#555;font-size:12px">Este link é válido por 30 minutos. Se você não fez essa solicitação, ignore este e-mail.</p>
          <p style="color:#555;font-size:12px">Equipe Food Tracker</p>
        </div>`;

      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: RESEND_FROM,
            to: [user.email],
            subject,
            text,
            html,
          })
        });
      } catch (e) {
        // Não propaga erro para evitar revelar existência do e-mail
      }
    }

    return genericResponse;
  } catch (e) {
    // Nunca revela existência
    return NextResponse.json({ ok: true });
  }
}

