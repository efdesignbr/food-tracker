/**
 * 💎 Sistema de Quotas de Assinatura
 *
 * Gerencia limites de uso de recursos premium por usuário.
 * Planos: FREE (sem acesso a IA visual) e PREMIUM (quotas mensais).
 *
 * Data: 2025-10-25
 */

import { getPool } from './db';
import { PLAN_LIMITS } from './constants';
import type { Plan, UsageQuota, QuotaCheck } from './types/subscription';

/**
 * Obtém o mês atual no formato YYYY-MM em America/Sao_Paulo
 */
function getCurrentMonth(): string {
  const now = new Date();
  const dateString = now.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
  const [year, month] = dateString.split('-');
  return `${year}-${month}`;
}

/**
 * Busca ou cria registro de quota para o mês atual
 *
 * @param userId - ID do usuário
 * @param tenantId - ID do tenant
 * @param month - Mês no formato YYYY-MM (opcional, padrão: mês atual)
 * @returns Registro de quota
 */
async function getOrCreateQuota(
  userId: string,
  tenantId: string,
  month: string = getCurrentMonth()
): Promise<UsageQuota> {
  const pool = getPool();

  // Tenta buscar registro existente
  const { rows } = await pool.query<UsageQuota>(
    `SELECT * FROM usage_quotas
     WHERE user_id = $1 AND month = $2
     LIMIT 1`,
    [userId, month]
  );

  if (rows.length > 0) {
    return rows[0];
  }

  // Cria novo registro se não existir
  const { rows: newRows } = await pool.query<UsageQuota>(
    `INSERT INTO usage_quotas (user_id, tenant_id, month, photo_analyses, ocr_analyses)
     VALUES ($1, $2, $3, 0, 0)
     RETURNING *`,
    [userId, tenantId, month]
  );

  return newRows[0];
}

/**
 * Verifica se o usuário pode usar um recurso premium
 *
 * @param userId - ID do usuário
 * @param tenantId - ID do tenant
 * @param plan - Plano do usuário ('free' | 'premium')
 * @param quotaType - Tipo de quota ('photo' | 'ocr')
 * @returns Objeto com informações de quota
 *
 * @example
 * ```typescript
 * const quota = await checkQuota(userId, tenantId, 'premium', 'photo');
 * if (!quota.allowed) {
 *   return Response.json({ error: 'quota_exceeded' }, { status: 429 });
 * }
 * ```
 */
export async function checkQuota(
  userId: string,
  tenantId: string,
  plan: Plan,
  quotaType: 'photo' | 'ocr' | 'text'
): Promise<QuotaCheck> {
  // UNLIMITED: sempre permite (admins/owners)
  if (plan === 'unlimited') {
    const quota = await getOrCreateQuota(userId, tenantId);
    const used =
      quotaType === 'photo' ? quota.photo_analyses :
      quotaType === 'ocr' ? quota.ocr_analyses :
      quota.text_analyses;

    return {
      allowed: true,
      used,
      limit: 999999,
      remaining: 999999,
    };
  }

  // FREE e PREMIUM: verifica quota baseado no plano
  const limits = PLAN_LIMITS[plan];
  const limit =
    quotaType === 'photo' ? limits.photo_analyses_per_month :
    quotaType === 'ocr' ? limits.ocr_analyses_per_month :
    limits.text_analyses_per_month;

  const quota = await getOrCreateQuota(userId, tenantId);
  const used =
    quotaType === 'photo' ? quota.photo_analyses :
    quotaType === 'ocr' ? quota.ocr_analyses :
    quota.text_analyses;

  return {
    allowed: used < limit,
    used,
    limit,
    remaining: Math.max(0, limit - used),
  };
}

/**
 * Incrementa o contador de uso de um recurso
 *
 * IMPORTANTE: Só chamar APÓS o recurso ter sido usado com sucesso!
 *
 * @param userId - ID do usuário
 * @param tenantId - ID do tenant
 * @param quotaType - Tipo de quota ('photo' | 'ocr')
 *
 * @example
 * ```typescript
 * // Após processar foto com IA
 * if (plan === 'premium' && imageUsed) {
 *   await incrementQuota(userId, tenantId, 'photo');
 * }
 * ```
 */
export async function incrementQuota(
  userId: string,
  tenantId: string,
  quotaType: 'photo' | 'ocr' | 'text'
): Promise<void> {
  const pool = getPool();
  const month = getCurrentMonth();
  const field =
    quotaType === 'photo' ? 'photo_analyses' :
    quotaType === 'ocr' ? 'ocr_analyses' :
    'text_analyses';

  // Garante que o registro existe
  await getOrCreateQuota(userId, tenantId, month);

  // Incrementa contador
  await pool.query(
    `UPDATE usage_quotas
     SET ${field} = ${field} + 1,
         updated_at = NOW()
     WHERE user_id = $1 AND month = $2`,
    [userId, month]
  );
}

/**
 * Busca o uso atual do mês (simplificado para API)
 *
 * @param userId - ID do usuário
 * @param tenantId - ID do tenant
 * @returns Uso atual do mês
 */
export async function getCurrentMonthUsage(
  userId: string,
  tenantId: string
): Promise<{
  month: string;
  photo_analyses: number;
  ocr_analyses: number;
}> {
  const quota = await getOrCreateQuota(userId, tenantId);

  return {
    month: quota.month,
    photo_analyses: quota.photo_analyses,
    ocr_analyses: quota.ocr_analyses
  };
}

/**
 * Busca estatísticas de uso para exibir ao usuário
 *
 * @param userId - ID do usuário
 * @param tenantId - ID do tenant
 * @param plan - Plano do usuário
 * @returns Estatísticas de uso com percentuais e data de reset
 *
 * @example
 * ```typescript
 * const stats = await getUsageStats(userId, tenantId, 'premium');
 * console.log(`Fotos: ${stats.photoAnalyses.used}/${stats.photoAnalyses.limit}`);
 * console.log(`Reset em: ${stats.resetDate}`);
 * ```
 */
export async function getUsageStats(
  userId: string,
  tenantId: string,
  plan: Plan
): Promise<{
  photoAnalyses: { used: number; limit: number; percentage: number };
  ocrAnalyses: { used: number; limit: number; percentage: number };
  resetDate: Date;
}> {
  const quota = await getOrCreateQuota(userId, tenantId);
  const limits = PLAN_LIMITS[plan];

  const photoLimit = limits.photo_analyses_per_month;
  const ocrLimit = limits.ocr_analyses_per_month;

  // Calcula data do próximo reset (dia 1º do próximo mês às 00:00 America/Sao_Paulo)
  const now = new Date();
  const dateString = now.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
  const [year, month] = dateString.split('-');
  const nextMonthNum = parseInt(month) === 12 ? 1 : parseInt(month) + 1;
  const nextYear = parseInt(month) === 12 ? parseInt(year) + 1 : parseInt(year);
  const nextMonth = new Date(`${nextYear}-${String(nextMonthNum).padStart(2, '0')}-01T00:00:00-03:00`);

  return {
    photoAnalyses: {
      used: quota.photo_analyses,
      limit: photoLimit,
      percentage: photoLimit > 0 ? Math.round((quota.photo_analyses / photoLimit) * 100) : 0,
    },
    ocrAnalyses: {
      used: quota.ocr_analyses,
      limit: ocrLimit,
      percentage: ocrLimit > 0 ? Math.round((quota.ocr_analyses / ocrLimit) * 100) : 0,
    },
    resetDate: nextMonth,
  };
}

/**
 * Reseta quotas de todos os usuários (para cronjob mensal)
 *
 * USAR COM CUIDADO: Deve ser chamado apenas por cronjob no dia 1º do mês
 *
 * @returns Quantidade de registros criados
 */
export async function resetMonthlyQuotas(): Promise<number> {
  const pool = getPool();
  const month = getCurrentMonth();

  // Busca todos usuários PREMIUM
  const { rows: users } = await pool.query(
    `SELECT id, tenant_id FROM users WHERE plan = 'premium'`
  );

  let created = 0;

  // Para cada usuário, cria registro do mês se não existir
  for (const user of users) {
    const { rowCount } = await pool.query(
      `INSERT INTO usage_quotas (user_id, tenant_id, month, photo_analyses, ocr_analyses)
       VALUES ($1, $2, $3, 0, 0)
       ON CONFLICT (user_id, month) DO NOTHING`,
      [user.id, user.tenant_id, month]
    );

    if (rowCount && rowCount > 0) {
      created++;
    }
  }

  return created;
}
