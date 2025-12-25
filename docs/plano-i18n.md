# Plano de Internacionalização (i18n) - Food Tracker

---

## Metodologia de Trabalho (OBRIGATÓRIA)

- **Commits pequenos e frequentes** - um commit por mudança funcional
- **NUNCA usar migrations** - alterações de banco direto no Supabase
- **NUNCA executar comando sed** - usar Edit tool ou edição manual
- **NUNCA inventar código** - sempre verificar padrões existentes antes
- **Testar compilação** com `npx tsc --noEmit` após cada mudança
- **Fazer push** após cada commit
- **Profissionalismo ao extremo** - código limpo, sem gambiarras
- **Fazer com calma e sem pressa** - qualidade > velocidade
- **Prioridade é iOS** (Capacitor), não PWA

---

## Objetivo

Preparar o app para suportar múltiplos idiomas, começando com:
- **pt-BR** (atual, idioma padrão)
- **en** (inglês)
- **es** (espanhol)

---

## Análise do Estado Atual

### O que já existe:
- Next.js 14 com App Router
- TypeScript strict mode
- date-fns instalado (suporta locales)
- Sistema multi-tenant funcional
- PWA configurado

### O que precisa ser feito:
- Nenhuma biblioteca de i18n instalada
- ~200 strings hardcoded em português
- URLs em português (/peso, /lista-compras, etc)
- Formatação de data hardcoded para pt-BR
- Formatação de moeda hardcoded para BRL

---

## Decisões Técnicas

### Biblioteca: next-intl
**Por que next-intl:**
- Feito especificamente para App Router
- Suporte a Server Components
- API simples e type-safe
- Boa documentação
- ~15KB gzipped

### Estratégia de Roteamento: Sub-path
```
/pt-BR/lista-compras  (português)
/en/shopping-list     (inglês)
/es/lista-compras     (espanhol)
```

**Por que sub-path:**
- Mais fácil de implementar
- SEO friendly
- Funciona bem com Capacitor/iOS
- Não precisa de múltiplos domínios

### URLs Localizadas
Manter URLs em português para pt-BR, traduzir para outros idiomas:

| pt-BR | en | es |
|-------|----|----|
| /lista-compras | /shopping-list | /lista-compras |
| /meus-alimentos | /my-foods | /mis-alimentos |
| /peso | /weight | /peso |
| /capture | /capture | /capturar |
| /history | /history | /historial |
| /coach | /coach | /coach |
| /reports | /reports | /reportes |
| /restaurants | /restaurants | /restaurantes |
| /account | /account | /cuenta |

---

## Estrutura de Arquivos

```
/messages
  /pt-BR.json       # Traduções português (base)
  /en.json          # Traduções inglês
  /es.json          # Traduções espanhol

/app
  /[locale]         # Segmento dinâmico de idioma
    /layout.tsx     # Layout com provider i18n
    /page.tsx       # Home
    /(routes)       # Grupo de rotas
      /lista-compras
      /meus-alimentos
      /...

/lib
  /i18n
    /config.ts      # Configuração de locales
    /request.ts     # getRequestConfig para next-intl
    /navigation.ts  # Links e redirect localizados

/middleware.ts      # Detecção de idioma e redirect
```

---

## Estrutura dos Arquivos de Tradução

```json
// messages/pt-BR.json
{
  "common": {
    "save": "Salvar",
    "cancel": "Cancelar",
    "delete": "Excluir",
    "edit": "Editar",
    "back": "Voltar",
    "loading": "Carregando...",
    "error": "Erro",
    "success": "Sucesso"
  },
  "nav": {
    "home": "Início",
    "capture": "Capturar",
    "history": "Histórico",
    "weight": "Peso",
    "shoppingList": "Lista de Compras",
    "coach": "Coach IA",
    "reports": "Relatórios",
    "restaurants": "Restaurantes",
    "myFoods": "Meus Alimentos",
    "account": "Minha Conta",
    "logout": "Sair"
  },
  "shoppingList": {
    "title": "Lista de Compras",
    "newList": "Nova Lista",
    "activeLists": "Listas Ativas",
    "completedLists": "Listas Concluídas",
    "pending": "Pendentes",
    "purchased": "Comprados",
    "suggestions": "Sugestões",
    "addItem": "Adicionar Item",
    "finishList": "Finalizar Lista",
    "duplicate": "Duplicar",
    "open": "Abrir",
    "noActiveList": "Nenhuma lista ativa",
    "noPendingItems": "Nenhum item pendente",
    "createdAt": "Criada em {date}",
    "finishedAt": "Finalizada em {date}",
    "total": "Total",
    "confirmDelete": "Excluir esta lista?",
    "confirmFinish": "Finalizar esta lista?"
  },
  "myFoods": {
    "title": "Meus Alimentos",
    "registerManual": "Cadastrar Manualmente",
    "analyzeWithAI": "Analisar com IA",
    "manualRegistration": "Cadastro Manual",
    "foodName": "Nome do Alimento",
    "brand": "Marca",
    "serving": "Porção",
    "macros": "Macronutrientes",
    "nutritionalDetails": "Detalhes Nutricionais",
    "classification": "Classificação",
    "category": "Categoria",
    "purchasable": "Pode ser comprado no mercado",
    "registeredFoods": "Alimentos Cadastrados",
    "searchFood": "Buscar alimento...",
    "noFoodsYet": "Nenhum alimento cadastrado ainda",
    "noFoodsFound": "Nenhum alimento encontrado para \"{query}\"",
    "usedTimes": "Usado {count}x",
    "successCreate": "Alimento cadastrado com sucesso!",
    "successUpdate": "Alimento atualizado com sucesso!",
    "successDelete": "Alimento excluído com sucesso!",
    "confirmDelete": "Tem certeza que deseja excluir \"{name}\"?"
  },
  "meals": {
    "breakfast": "Café da Manhã",
    "lunch": "Almoço",
    "dinner": "Jantar",
    "snack": "Lanche"
  },
  "nutrients": {
    "calories": "Calorias",
    "protein": "Proteína",
    "carbs": "Carboidratos",
    "fat": "Gorduras",
    "fiber": "Fibras",
    "sodium": "Sódio",
    "sugar": "Açúcares",
    "saturatedFat": "Gordura Saturada"
  },
  "categories": {
    "preparedDishes": "Pratos prontos",
    "beverages": "Bebidas",
    "meats": "Carnes e derivados",
    "cereals": "Cereais e derivados",
    "fruits": "Frutas e derivados",
    "fatsOils": "Gorduras e óleos",
    "processed": "Industrializados",
    "legumes": "Leguminosas e derivados",
    "dairy": "Leite e derivados",
    "misc": "Miscelâneas",
    "nutsSeeds": "Nozes e sementes",
    "eggs": "Ovos e derivados",
    "seafood": "Pescados e frutos do mar",
    "sweets": "Produtos açucarados",
    "vegetables": "Verduras, hortaliças e derivados"
  },
  "subscription": {
    "premium": "Premium",
    "free": "Gratuito",
    "unlimited": "Ilimitado",
    "viewPlans": "Ver Planos",
    "premiumFeature": "Recurso Premium",
    "quotaReached": "Limite atingido",
    "quotaWarning": "Você está quase no limite!",
    "renewsAt": "Renova em: {date}"
  }
}
```

---

## Fases de Implementação

### Fase 1: Setup Inicial
**Arquivos a modificar:**
- `package.json` - adicionar next-intl
- `next.config.mjs` - configurar plugin
- `middleware.ts` - adicionar detecção de locale

**Arquivos a criar:**
- `/messages/pt-BR.json`
- `/messages/en.json`
- `/messages/es.json`
- `/lib/i18n/config.ts`
- `/lib/i18n/request.ts`

**Comandos:**
```bash
npm install next-intl
```

---

### Fase 2: Reestruturar App Router
**Mudanças:**
```
/app
  /[locale]           # NOVO: segmento dinâmico
    /layout.tsx       # Mover de /app/layout.tsx
    /page.tsx         # Mover de /app/page.tsx
    /lista-compras    # Mover rotas
    /meus-alimentos
    /...
```

**Arquivos críticos:**
- `/app/[locale]/layout.tsx` - wrapper com NextIntlClientProvider
- `/middleware.ts` - redirecionar / para /pt-BR

---

### Fase 3: Extrair Strings - Componentes Core
**Ordem de prioridade:**
1. `components/AppLayout.tsx` - navegação (10 labels)
2. `components/subscription/*.tsx` - paywall, quota (20+ strings)

---

### Fase 4: Extrair Strings - Páginas Principais
**Ordem de prioridade:**
1. `/app/[locale]/lista-compras/page.tsx` (~40 strings)
2. `/app/[locale]/meus-alimentos/page.tsx` (~50 strings)
3. `/app/[locale]/page.tsx` - home (~20 strings)
4. `/app/[locale]/peso/page.tsx`
5. Demais páginas

---

### Fase 5: Formatação de Data e Moeda
**Arquivos a modificar:**
- Substituir `toLocaleDateString('pt-BR')` por `format()` do next-intl
- Substituir formatação de moeda hardcoded

**Locais identificados:**
- `lista-compras/page.tsx` - datas e R$
- `coach/page.tsx` - datas
- `account/page.tsx` - datas
- `reports/page.tsx` - datas
- `meus-alimentos/page.tsx` - datas

---

### Fase 6: Traduções en/es
**Tarefas:**
1. Traduzir `messages/en.json`
2. Traduzir `messages/es.json`
3. Revisar contexto das traduções

---

### Fase 7: Seletor de Idioma
**Implementar:**
- Componente `LanguageSwitcher` no AppLayout
- Persistir preferência no localStorage
- Opcional: salvar preferência no perfil do usuário

---

### Fase 8: Testes e Ajustes
- Testar fluxo completo em cada idioma
- Verificar quebras de layout (textos maiores em outros idiomas)
- Testar no iOS via Capacitor
- Verificar PWA manifest

---

## Arquivos Críticos a Modificar

| Arquivo | Mudança |
|---------|---------|
| `next.config.mjs` | Plugin next-intl |
| `middleware.ts` | Detecção de locale |
| `app/layout.tsx` | Mover para [locale] |
| `components/AppLayout.tsx` | useTranslations |
| `app/lista-compras/page.tsx` | useTranslations |
| `app/meus-alimentos/page.tsx` | useTranslations |
| `components/subscription/PaywallModal.tsx` | useTranslations |
| `components/subscription/QuotaCard.tsx` | useTranslations |

---

## Estimativa de Esforço

| Fase | Complexidade |
|------|--------------|
| 1. Setup | Baixa |
| 2. Reestruturar Router | Média |
| 3. Componentes Core | Baixa |
| 4. Páginas | Alta |
| 5. Formatação | Média |
| 6. Traduções | Média |
| 7. Seletor | Baixa |
| 8. Testes | Média |

---

## Considerações Especiais

### Capacitor/iOS
- Sub-path routing funciona normalmente
- Testar deep links com locale
- PWA manifest precisa de nome localizado (opcional)

### SEO
- Cada locale terá URLs próprias
- Considerar hreflang tags no futuro

### API
- Mensagens de erro da API permanecem em inglês (padrão)
- Frontend traduz mensagens conhecidas
- Ou: adicionar header Accept-Language na API

### Fallback
- Se tradução não existir, usar pt-BR como fallback
- Logar traduções faltantes em desenvolvimento

---

## Próximos Passos

1. Aprovar este plano
2. Iniciar Fase 1 (setup)
3. Commit após cada fase funcional
4. Testar no iOS após Fase 2
