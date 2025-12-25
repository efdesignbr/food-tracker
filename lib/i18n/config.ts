/**
 * Configuracao de internacionalizacao (i18n)
 *
 * Define os locales suportados e o locale padrao.
 */

export const locales = ['pt-BR', 'en', 'es'] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'pt-BR';

/**
 * Labels para exibicao no seletor de idioma
 */
export const localeLabels: Record<Locale, string> = {
  'pt-BR': 'Portugues',
  'en': 'English',
  'es': 'Espanol',
};
