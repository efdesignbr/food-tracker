/**
 * 🕐 Data/Hora Utilities
 *
 * Utilitários para trabalhar com datas e horários no timezone America/Sao_Paulo
 * Evita problemas de conversão de timezone ao usar new Date() e toISOString()
 */

const TIMEZONE = 'America/Sao_Paulo';

/**
 * Retorna a data atual no formato YYYY-MM-DD em America/Sao_Paulo
 */
export function getCurrentDateBR(): string {
  const now = new Date();
  return now.toLocaleDateString('en-CA', { timeZone: TIMEZONE });
}

/**
 * Retorna o horário atual no formato HH:MM:SS em America/Sao_Paulo
 */
export function getCurrentTimeBR(): string {
  const now = new Date();
  return now.toLocaleTimeString('pt-BR', {
    timeZone: TIMEZONE,
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

/**
 * Retorna data e hora atuais em America/Sao_Paulo
 */
export function getCurrentDateTimeBR(): { date: string; time: string } {
  return {
    date: getCurrentDateBR(),
    time: getCurrentTimeBR()
  };
}

/**
 * Formata uma data ISO string para exibição em pt-BR
 */
export function formatDateBR(dateString: string): string {
  const date = new Date(dateString + 'T00:00:00');
  return date.toLocaleDateString('pt-BR', { timeZone: TIMEZONE });
}

/**
 * Formata uma data ISO string para exibição detalhada em pt-BR
 */
export function formatDateLongBR(dateString: string): string {
  const date = new Date(dateString + 'T00:00:00');
  return date.toLocaleDateString('pt-BR', {
    timeZone: TIMEZONE,
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
}

/**
 * Converte Date para o timezone de São Paulo e retorna no formato ISO date
 */
export function toDateBR(date: Date): string {
  return date.toLocaleDateString('en-CA', { timeZone: TIMEZONE });
}

/**
 * Converte Date para o timezone de São Paulo e retorna o horário
 */
export function toTimeBR(date: Date): string {
  return date.toLocaleTimeString('pt-BR', {
    timeZone: TIMEZONE,
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

/**
 * Função auxiliar para backend: retorna horário atual em America/Sao_Paulo
 * Pode ser usada tanto no frontend quanto no backend (Node.js)
 */
export function getDefaultTimeBR(): string {
  return getCurrentTimeBR();
}
