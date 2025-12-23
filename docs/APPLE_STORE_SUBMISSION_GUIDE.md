# Guia de Submissao - Apple App Store

**App:** Food Tracker
**Data:** 2025-12-23
**Versao:** 1.0.0

---

## Checklist de Submissao

### 1. Requisitos Tecnicos

| Item | Status | Notas |
|------|--------|-------|
| Icone 1024x1024 PNG | OK | `ios/App/App/Assets.xcassets/AppIcon.appiconset/` |
| Info.plist configurado | OK | Permissoes de camera e fotos adicionadas |
| NSCameraUsageDescription | OK | "Food Tracker precisa acessar a camera..." |
| NSPhotoLibraryUsageDescription | OK | "Food Tracker precisa acessar suas fotos..." |
| NSPhotoLibraryAddUsageDescription | OK | "Food Tracker pode salvar fotos..." |
| Bundle ID unico | VERIFICAR | Definir no Xcode: `com.seudominio.foodtracker` |
| Versao e Build Number | VERIFICAR | Definir no Xcode antes de cada submissao |
| Suporte a iPad (se universal) | OK | Orientacoes configuradas |
| Minimum iOS Version | VERIFICAR | Recomendado: iOS 14.0+ |

### 2. App Store Connect

| Item | Status | Notas |
|------|--------|-------|
| Conta de Desenvolvedor Apple | NECESSARIO | $99/ano |
| App criado no App Store Connect | PENDENTE | Criar antes de submeter |
| Categoria do app | PENDENTE | Sugestao: Health & Fitness |
| Classificacao etaria | PENDENTE | 4+ (sem conteudo sensivel) |
| Descricao do app | PENDENTE | Ver secao abaixo |
| Keywords | PENDENTE | Ver secao abaixo |
| URL de Suporte | PENDENTE | URL do site do app |
| URL de Politica de Privacidade | PENDENTE | Sera criado no site |
| Screenshots | PENDENTE | Ver secao abaixo |

### 3. Conta Demo para Review

| Item | Status | Notas |
|------|--------|-------|
| Script de criacao | OK | `scripts/create-demo-account.js` |
| Email demo | OK | `demo@foodtracker.app` |
| Senha demo | OK | `AppleReview2024!` |
| Conta com plano Premium | OK | Para testar todas funcoes |
| Dados de exemplo no banco | RECOMENDADO | Adicionar refeicoes de exemplo |

**Para criar a conta demo:**
```bash
export DATABASE_URL="sua_connection_string"
node scripts/create-demo-account.js
```

---

## Pontos Sensiveis - Atencao Especial

### A. Compras In-App (CRITICO)

**Status atual:** Nao implementado - App usa modelo freemium

**O que a Apple exige:**
- Se o app oferece compras digitais, DEVE usar In-App Purchase
- Nao pode direcionar para pagamento externo (site, Stripe direto)
- Excecao: apps de "reader" (Netflix, Spotify) podem nao oferecer compra no app

**Solucao atual:**
- Plano FREE funcional (analise de texto liberada)
- Features premium bloqueadas mostram tela de upgrade
- Pagina de upgrade preparada para futura integracao
- **NAO** ha cobranca no app ainda

**Recomendacao para aprovacao:**
1. Submeter como app FREE funcional
2. Botao "Fazer Upgrade" pode mostrar "Em breve" ou link para contato
3. Implementar RevenueCat/StoreKit apos aprovacao inicial

### B. Politica de Privacidade (OBRIGATORIO)

**Status:** Pendente - sera no site

**O que incluir:**
- Quais dados sao coletados (email, fotos de refeicoes, dados nutricionais)
- Como os dados sao usados (analise nutricional, historico pessoal)
- Se dados sao compartilhados com terceiros (Google Gemini para IA)
- Como o usuario pode deletar seus dados
- Contato para questoes de privacidade

**URL para App Store Connect:** `https://seusite.com/privacidade`

### C. Permissoes de Camera/Fotos (OBRIGATORIO)

**Status:** OK - Configurado no Info.plist

As mensagens de permissao DEVEM:
- Explicar claramente POR QUE o app precisa do acesso
- Ser em portugues (idioma do app)
- Ser especificas para o contexto do app

**Configurado:**
```xml
<key>NSCameraUsageDescription</key>
<string>Food Tracker precisa acessar a camera para fotografar suas refeicoes e analisar os alimentos.</string>

<key>NSPhotoLibraryUsageDescription</key>
<string>Food Tracker precisa acessar suas fotos para voce selecionar imagens de refeicoes.</string>
```

### D. Conteudo Gerado por IA (ATENCAO)

**Status:** OK - Implementado com restricoes

**O que a Apple observa:**
- IA nao pode gerar conteudo ofensivo, ilegal ou prejudicial
- Usuario deve saber quando esta interagindo com IA
- Conteudo de saude nao pode substituir orientacao medica

**Implementado no Food Tracker:**
- Coach IA tem disclaimer sobre nao substituir profissionais
- Analise nutricional e informativa, nao prescritiva
- Sem geracao de conteudo sensivel

### E. Dados de Saude (ATENCAO)

**Status:** OK - App nao usa HealthKit

**Se usar HealthKit no futuro:**
- Requer aprovacao adicional da Apple
- Deve explicar uso especifico dos dados
- Nao pode vender dados de saude

**Food Tracker atual:**
- Armazena dados nutricionais em banco proprio
- Nao integra com Apple Health (pode ser feature futura)
- Dados de peso sao auto-reportados

### F. Login e Autenticacao

**Status:** OK

**Requisitos da Apple:**
- Se oferece login social (Google, Facebook), DEVE oferecer Sign in with Apple
- Pode oferecer login por email/senha sem Apple Sign In

**Food Tracker atual:**
- Login por email/senha
- Nao tem login social
- Nao precisa de Sign in with Apple (por enquanto)

---

## Screenshots Necessarios

### Dispositivos obrigatorios:
1. **iPhone 6.7"** (iPhone 15 Pro Max, 14 Pro Max)
   - 1290 x 2796 pixels
2. **iPhone 6.5"** (iPhone 11 Pro Max, XS Max)
   - 1242 x 2688 pixels
3. **iPhone 5.5"** (iPhone 8 Plus, 7 Plus)
   - 1242 x 2208 pixels

### Se suportar iPad:
4. **iPad Pro 12.9"**
   - 2048 x 2732 pixels

### Screenshots sugeridos (ordem):
1. **Dashboard** - Visao geral do dia com calorias e macros
2. **Captura de Refeicao** - Tela de foto/analise
3. **Historico** - Lista de refeicoes
4. **Relatorios** - Graficos e estatisticas
5. **Coach IA** - Interacao com assistente (se premium)

### Dicas:
- Usar dados reais/realistas nas telas
- Evitar informacoes pessoais visiveis
- Mostrar o app em uso, nao telas vazias
- Considerar usar mockup de iPhone

---

## Descricao do App (Sugestao)

### Titulo:
`Food Tracker - Diario Alimentar`

### Subtitulo:
`Registre refeicoes e acompanhe nutricao`

### Descricao Curta (Promotional Text):
```
Acompanhe sua alimentacao de forma simples e inteligente.
```

### Descricao Completa:
```
Food Tracker e seu diario alimentar inteligente. Registre suas refeicoes,
acompanhe calorias e macronutrientes, e alcance seus objetivos de saude.

PRINCIPAIS RECURSOS:

- Registro rapido de refeicoes por foto ou texto
- Analise nutricional com inteligencia artificial
- Acompanhamento de calorias, proteinas, carboidratos e gorduras
- Historico completo de alimentacao
- Graficos e relatorios de progresso
- Registro de peso corporal
- Metas personalizaveis

SIMPLES E EFICIENTE:
Tire uma foto da sua refeicao ou descreva o que comeu. Nossa IA identifica
os alimentos e calcula os valores nutricionais automaticamente.

ACOMPANHE SEU PROGRESSO:
Visualize seu historico alimentar, identifique padroes e ajuste sua dieta
para atingir seus objetivos.

PRIVACIDADE:
Seus dados sao seus. Nao vendemos informacoes para terceiros.

---
Este app nao substitui orientacao de nutricionistas ou medicos.
Consulte um profissional de saude para orientacoes personalizadas.
```

### Keywords (100 caracteres max):
```
dieta,nutricao,calorias,alimentacao,refeicao,macros,proteina,emagrecer,saude,fitness
```

---

## Processo de Submissao

### Passo 1: Preparacao Local
```bash
# 1. Garantir que o build esta OK
npm run build

# 2. Sincronizar com Capacitor
npx cap sync ios

# 3. Criar conta demo no banco de producao
export DATABASE_URL="sua_string_de_conexao"
node scripts/create-demo-account.js
```

### Passo 2: Xcode
1. Abrir `ios/App/App.xcworkspace` no Xcode
2. Selecionar Team (sua conta de desenvolvedor)
3. Verificar Bundle ID
4. Definir Version (1.0.0) e Build (1)
5. Selecionar "Any iOS Device" como destino
6. Product > Archive
7. Distribute App > App Store Connect

### Passo 3: App Store Connect
1. Acessar appstoreconnect.apple.com
2. Criar novo app (se ainda nao existe)
3. Preencher todas as informacoes
4. Adicionar screenshots
5. Configurar preco (Gratis)
6. Adicionar conta demo em "App Review Information"
7. Submeter para revisao

### Passo 4: Aguardar Revisao
- Tempo medio: 24-48 horas
- Pode demorar mais na primeira submissao
- Responder rapidamente se houver rejeicao

---

## Motivos Comuns de Rejeicao

| Motivo | Prevencao no Food Tracker |
|--------|---------------------------|
| Crashes/bugs | Testar exaustivamente antes |
| Metadados incompletos | Preencher todos os campos |
| Screenshots inadequados | Usar screenshots reais do app |
| Sem conta demo | Conta demo criada |
| Links quebrados | Verificar URL de privacidade |
| Compra fora do app | Nao ha cobranca ainda |
| Permissoes sem justificativa | Textos claros no Info.plist |
| Conteudo placeholder | Remover "Lorem ipsum" etc |
| App incompleto | Todas features funcionais |

---

## Contatos e Links Uteis

- **App Store Connect:** https://appstoreconnect.apple.com
- **Developer Portal:** https://developer.apple.com
- **App Review Guidelines:** https://developer.apple.com/app-store/review/guidelines/
- **Human Interface Guidelines:** https://developer.apple.com/design/human-interface-guidelines/

---

## Historico de Submissoes

| Data | Versao | Build | Status | Notas |
|------|--------|-------|--------|-------|
| - | 1.0.0 | 1 | Pendente | Primeira submissao |

---

*Ultima atualizacao: 2025-12-23*
