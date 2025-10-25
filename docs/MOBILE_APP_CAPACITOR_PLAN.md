# 📱 Plano de Mobilização: Food Tracker Mobile (Capacitor)

**Data:** 2025-10-25
**Status:** Planejamento
**Versão:** 1.0
**Plataformas-alvo:** iOS (App Store) + Android (Play Store)

---

## 📋 Índice

1. [Análise Atual](#análise-atual)
2. [Arquitetura Proposta](#arquitetura-proposta)
3. [Desafios e Soluções](#desafios-e-soluções)
4. [Roadmap de Implementação](#roadmap-de-implementação)
5. [Configuração do Capacitor](#configuração-do-capacitor)
6. [Plugins Nativos Necessários](#plugins-nativos-necessários)
7. [Ajustes no Next.js](#ajustes-no-nextjs)
8. [Build e Deploy](#build-e-deploy)
9. [Publicação nas Lojas](#publicação-nas-lojas)
10. [Custos e Requisitos](#custos-e-requisitos)

---

## 🎯 Análise Atual

### ✅ O Que JÁ ESTÁ PRONTO (80% do caminho!)

**Você está MUITO à frente!** O app já tem uma base sólida para mobile:

| Item | Status | Detalhes |
|------|--------|----------|
| **PWA Configurado** | ✅ COMPLETO | `next-pwa` instalado e configurado |
| **Service Worker** | ✅ COMPLETO | Cache strategies implementadas |
| **Manifest.json** | ✅ COMPLETO | Metadata, ícones, shortcuts |
| **Ícones** | ✅ COMPLETO | 192x192, 512x512, Apple Touch Icon |
| **Display Mode** | ✅ COMPLETO | `standalone` (sem barra do navegador) |
| **Orientação** | ✅ COMPLETO | `portrait` definido |
| **Shortcuts** | ✅ COMPLETO | Capturar refeição, Histórico |
| **Next.js Moderno** | ✅ COMPLETO | Next.js 14 (compatível) |
| **React 18** | ✅ COMPLETO | Versão estável |
| **TypeScript** | ✅ COMPLETO | Tipagem completa |
| **API Routes** | ✅ COMPLETO | Backend integrado |
| **Upload de Foto** | ✅ COMPLETO | `accept="image/*"` funcionando |
| **Responsividade** | ⚠️ PARCIAL | Precisa validar em mobile |

**PWA Configuration (next.config.mjs):**
```javascript
✅ Service Worker habilitado
✅ Cache de fontes Google
✅ Cache de imagens
✅ Cache de JS/CSS
✅ Network First para APIs
✅ Offline fallback
```

**Manifest.json Highlights:**
```json
✅ name: "Food Tracker"
✅ short_name: "FoodTracker"
✅ display: "standalone"
✅ theme_color: "#2196F3"
✅ icons: SVG + PNG (192, 512)
✅ shortcuts: Capturar, Histórico
✅ categories: health, lifestyle
```

### ❌ O Que FALTA (20% restante)

| Item | Status | Prioridade |
|------|--------|------------|
| Capacitor instalado | ❌ | 🔴 ALTA |
| Projetos Android/iOS | ❌ | 🔴 ALTA |
| Build estático (SSG) | ❌ | 🔴 ALTA |
| Plugins nativos | ❌ | 🟡 MÉDIA |
| Splash screens | ❌ | 🟡 MÉDIA |
| Ícones adaptados | ⚠️ | 🟡 MÉDIA |
| Deep links | ❌ | 🟢 BAIXA |
| Push notifications | ❌ | 🟢 BAIXA |

---

## 🏗️ Arquitetura Proposta

### Decisão Crítica: SSG vs SSR

**Problema:** Capacitor precisa de arquivos estáticos (HTML/CSS/JS), mas Next.js está configurado como SSR (Server-Side Rendering).

**Soluções Possíveis:**

#### **Opção A: Manter Backend Separado (RECOMENDADO ✅)**

```
┌─────────────────────────────────────┐
│  Mobile App (Capacitor)             │
│  ┌───────────────────────────────┐  │
│  │ Next.js SSG (Frontend Only)   │  │
│  │ Build: next build + export    │  │
│  │ Output: /out (HTML/CSS/JS)    │  │
│  └───────────────────────────────┘  │
│           ↓ HTTP Requests            │
└───────────────────────────────────────┘
            ↓
┌─────────────────────────────────────┐
│  Backend API (Servidor)             │
│  ┌───────────────────────────────┐  │
│  │ Next.js API Routes            │  │
│  │ OU Node.js/Express            │  │
│  │ Postgres, Auth, IA            │  │
│  └───────────────────────────────┘  │
│  URL: https://api.foodtracker.app   │
└─────────────────────────────────────┘
```

**Vantagens:**
- ✅ App mobile rápido (arquivos locais)
- ✅ Backend escalável independente
- ✅ Pode ter web e mobile usando mesma API
- ✅ Fácil de atualizar backend sem rebuild do app

**Desvantagens:**
- ❌ Precisa manter 2 projetos separados
- ❌ CORS precisa estar configurado
- ❌ Autenticação mais complexa

#### **Opção B: Monolito com Static Export (NÃO RECOMENDADO ❌)**

```
┌─────────────────────────────────────┐
│  Mobile App (Capacitor)             │
│  ┌───────────────────────────────┐  │
│  │ Next.js SSG (TUDO junto)      │  │
│  │ Problema: API Routes não      │  │
│  │ funcionam em build estático!  │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

**Por que NÃO funciona:**
- ❌ `next export` remove API Routes
- ❌ Não pode ter backend no app
- ❌ Precisaria reescrever tudo para usar API externa

### 🎯 Arquitetura Escolhida: Híbrida

**Solução Inteligente:**

```
Projeto Atual (food-tracker/)
├─ app/                    → Frontend (páginas React)
├─ components/             → Componentes
├─ lib/                    → Utilitários
├─ public/                 → Assets
├─ api/ (routes)           → Backend APIs
└─ ...

Novo Projeto (food-tracker-mobile/)
├─ next.config.js          → Config SSG (output: 'export')
├─ app/                    → CÓPIA do frontend (sem API routes)
├─ components/             → LINK SIMBÓLICO ou cópia
├─ lib/                    → Adaptado para chamar API externa
├─ android/                → Projeto Android (Capacitor)
├─ ios/                    → Projeto iOS (Capacitor)
└─ capacitor.config.ts     → Config do Capacitor

Backend Deploy Separado
└─ https://api.foodtracker.app  → API atual rodando em servidor
```

**Workflow:**
1. Desenvolve no projeto atual (SSR) normalmente
2. Quando estável, copia frontend para projeto mobile
3. Adapta chamadas de API para usar URL externa
4. Build SSG do mobile
5. Capacitor carrega HTML estático
6. App chama APIs remotas

---

## 🚧 Desafios e Soluções

### 1. API Routes Não Funcionam em SSG

**Problema:**
```typescript
// Isso NÃO funciona em build estático:
await fetch('/api/meals', { method: 'POST' });
```

**Solução:**
```typescript
// Usar variável de ambiente para URL base
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.foodtracker.app';

await fetch(`${API_URL}/api/meals`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
  },
  credentials: 'include', // Importante para cookies
});
```

### 2. Autenticação com NextAuth

**Problema:** NextAuth depende de API Routes do Next.js

**Solução A: Manter NextAuth no Backend**
```typescript
// Mobile chama API de login
const res = await fetch(`${API_URL}/api/auth/signin`, {
  method: 'POST',
  body: JSON.stringify({ email, password }),
});

const { token } = await res.json();

// Armazena token no Capacitor Preferences
import { Preferences } from '@capacitor/preferences';
await Preferences.set({ key: 'auth_token', value: token });
```

**Solução B: JWT Manual**
- Backend gera JWT
- Mobile armazena em `@capacitor/preferences`
- Envia em header de cada request

### 3. Upload de Imagens

**Problema:** Precisamos usar câmera nativa, não `<input type="file">`

**Solução: Capacitor Camera Plugin**
```typescript
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

async function tirarFoto() {
  const image = await Camera.getPhoto({
    quality: 80,
    allowEditing: true,
    resultType: CameraResultType.Base64,
    source: CameraSource.Camera, // ou Photos
  });

  const base64 = `data:image/jpeg;base64,${image.base64String}`;

  // Envia para API
  await fetch(`${API_URL}/api/meals/analyze-image`, {
    method: 'POST',
    body: JSON.stringify({ image: base64 }),
  });
}
```

### 4. Service Worker em Modo Standalone

**Problema:** Service Worker pode conflitar com Capacitor

**Solução:** Desabilitar PWA no build mobile
```javascript
// next.config.mjs (versão mobile)
const nextConfig = {
  output: 'export',
  // Desabilita PWA para evitar conflito
  // Capacitor já gerencia offline
};

export default nextConfig; // SEM withPWA()
```

### 5. Rotas Dinâmicas

**Problema:** SSG precisa gerar todas páginas em build time

**Solução:** Usar `fallback: 'blocking'` ou rotas client-side
```typescript
// app/history/page.tsx
'use client';

export default function HistoryPage() {
  const [meals, setMeals] = useState([]);

  useEffect(() => {
    // Carrega dados do lado do cliente
    fetch(`${API_URL}/api/meals`)
      .then(res => res.json())
      .then(setMeals);
  }, []);

  // Renderiza...
}
```

---

## 🗺️ Roadmap de Implementação

### Fase 0: Preparação (1 dia)

**Objetivo:** Separar frontend e backend, configurar ambiente

- [ ] **0.1** Criar conta Apple Developer ($99/ano)
- [ ] **0.2** Criar conta Google Play Developer ($25 taxa única)
- [ ] **0.3** Decidir URL da API (ex: `api.foodtracker.app`)
- [ ] **0.4** Fazer deploy do backend atual em servidor
  - Opções: Vercel, Railway, Render, AWS
  - Configurar variáveis de ambiente
  - Testar endpoints via Postman

- [ ] **0.5** Criar novo diretório `food-tracker-mobile/`
- [ ] **0.6** Copiar estrutura do frontend
- [ ] **0.7** Criar `lib/api-client.ts` com wrapper para fetch

**Critério de Sucesso:**
- ✅ Backend rodando em URL pública
- ✅ Projeto mobile criado
- ✅ Consegue chamar API de teste

---

### Fase 1: Configurar Capacitor (2-3 horas)

**Objetivo:** Instalar Capacitor e criar projetos nativos

#### 1.1 Instalar Dependências

```bash
cd food-tracker-mobile/

npm install @capacitor/core @capacitor/cli
npm install @capacitor/android @capacitor/ios

# Plugins essenciais
npm install @capacitor/camera
npm install @capacitor/preferences
npm install @capacitor/splash-screen
npm install @capacitor/status-bar
npm install @capacitor/app
npm install @capacitor/network
```

#### 1.2 Inicializar Capacitor

```bash
npx cap init

# Perguntas:
# App name: Food Tracker
# App package ID: com.foodtracker.app
# Web asset directory: out
```

#### 1.3 Criar Projetos Nativos

```bash
# Android
npx cap add android

# iOS (só funciona no macOS)
npx cap add ios
```

**Estrutura Resultante:**
```
food-tracker-mobile/
├─ android/              ← Projeto Android Studio
├─ ios/                  ← Projeto Xcode
├─ out/                  ← Build estático do Next.js
├─ capacitor.config.ts   ← Config do Capacitor
├─ next.config.js        ← Config SSG
└─ ...
```

#### 1.4 Configurar `capacitor.config.ts`

```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.foodtracker.app',
  appName: 'Food Tracker',
  webDir: 'out',
  server: {
    // IMPORTANTE: URL da API em produção
    // Ou usar androidScheme/iosScheme para servir localmente
    cleartext: true, // Apenas para desenvolvimento local
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#2196F3',
      showSpinner: false,
    },
    Camera: {
      permissions: {
        camera: 'Precisamos acessar a câmera para fotografar suas refeições',
        photos: 'Precisamos acessar suas fotos para adicionar imagens de refeições',
      },
    },
  },
  android: {
    allowMixedContent: true, // Apenas dev
  },
  ios: {
    contentInset: 'automatic',
  },
};

export default config;
```

**Critério de Sucesso:**
- ✅ Pastas `android/` e `ios/` criadas
- ✅ `capacitor.config.ts` configurado
- ✅ Consegue abrir Android Studio e Xcode

---

### Fase 2: Adaptar Next.js para SSG (4-6 horas)

**Objetivo:** Fazer build estático funcionar

#### 2.1 Criar `next.config.js` para Mobile

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // ← CRÍTICO: gera build estático
  reactStrictMode: true,
  images: {
    unoptimized: true, // Next.js Image não funciona em SSG
  },
  trailingSlash: true, // Melhora compatibilidade mobile
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

export default nextConfig;
```

#### 2.2 Criar `lib/api-client.ts`

```typescript
// lib/api-client.ts

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? 'http://localhost:3000'
    : 'https://api.foodtracker.app');

interface FetchOptions extends RequestInit {
  token?: string;
}

export async function apiClient(
  endpoint: string,
  options: FetchOptions = {}
): Promise<Response> {
  const { token, ...fetchOptions } = options;

  const headers: HeadersInit = {
    ...fetchOptions.headers,
  };

  // Adiciona token se existir
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Adiciona Content-Type se for JSON
  if (fetchOptions.body && typeof fetchOptions.body === 'string') {
    headers['Content-Type'] = 'application/json';
  }

  const url = `${API_URL}${endpoint}`;

  return fetch(url, {
    ...fetchOptions,
    headers,
    credentials: 'include',
  });
}

// Helpers
export const api = {
  get: (endpoint: string, token?: string) =>
    apiClient(endpoint, { method: 'GET', token }),

  post: (endpoint: string, body: any, token?: string) =>
    apiClient(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
      token,
    }),

  put: (endpoint: string, body: any, token?: string) =>
    apiClient(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
      token,
    }),

  delete: (endpoint: string, token?: string) =>
    apiClient(endpoint, { method: 'DELETE', token }),
};
```

#### 2.3 Substituir Chamadas de API

**ANTES (SSR):**
```typescript
const res = await fetch('/api/meals', {
  method: 'POST',
  body: JSON.stringify(payload),
});
```

**DEPOIS (SSG):**
```typescript
import { api } from '@/lib/api-client';

const res = await api.post('/api/meals', payload, token);
```

#### 2.4 Criar Script de Build

```json
// package.json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "build:mobile": "next build && npx cap sync",
    "open:android": "npx cap open android",
    "open:ios": "npx cap open ios"
  }
}
```

**Critério de Sucesso:**
- ✅ `npm run build` gera pasta `/out`
- ✅ Todos arquivos HTML/CSS/JS estáticos
- ✅ Sem erros de build
- ✅ `npx cap sync` copia arquivos para Android/iOS

---

### Fase 3: Integrar Plugins Nativos (3-4 horas)

**Objetivo:** Substituir recursos web por nativos

#### 3.1 Câmera Nativa

**ANTES (Web):**
```typescript
<input
  type="file"
  accept="image/*"
  onChange={handleFileChange}
/>
```

**DEPOIS (Native):**
```typescript
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

async function tirarFoto() {
  // Verifica se está rodando em mobile
  if (!Capacitor.isNativePlatform()) {
    // Fallback para web (input file)
    return usarInputFile();
  }

  try {
    const image = await Camera.getPhoto({
      quality: 80,
      allowEditing: true,
      resultType: CameraResultType.Base64,
      source: CameraSource.Prompt, // Câmera ou Galeria
      width: 1024,
      height: 1024,
    });

    const base64 = `data:image/jpeg;base64,${image.base64String}`;
    return base64;
  } catch (error) {
    console.error('Erro ao tirar foto:', error);
    return null;
  }
}
```

#### 3.2 Storage Nativo (Preferências)

```typescript
import { Preferences } from '@capacitor/preferences';

// Salvar token de autenticação
export async function saveAuthToken(token: string) {
  await Preferences.set({
    key: 'auth_token',
    value: token,
  });
}

// Recuperar token
export async function getAuthToken(): Promise<string | null> {
  const { value } = await Preferences.get({ key: 'auth_token' });
  return value;
}

// Remover token (logout)
export async function removeAuthToken() {
  await Preferences.remove({ key: 'auth_token' });
}
```

#### 3.3 Status Bar e Splash Screen

```typescript
// lib/capacitor-init.ts

import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';

export async function initializeCapacitor() {
  if (!Capacitor.isNativePlatform()) return;

  // Configura status bar
  await StatusBar.setStyle({ style: Style.Light });
  await StatusBar.setBackgroundColor({ color: '#2196F3' });

  // Esconde splash screen após carregar
  setTimeout(() => {
    SplashScreen.hide();
  }, 2000);
}

// Chamar no _app.tsx ou layout.tsx
useEffect(() => {
  initializeCapacitor();
}, []);
```

#### 3.4 Detecção de Conectividade

```typescript
import { Network } from '@capacitor/network';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Status inicial
    Network.getStatus().then((status) => {
      setIsOnline(status.connected);
    });

    // Listener de mudanças
    const listener = Network.addListener('networkStatusChange', (status) => {
      setIsOnline(status.connected);
    });

    return () => {
      listener.remove();
    };
  }, []);

  return isOnline;
}
```

**Critério de Sucesso:**
- ✅ Câmera nativa funciona
- ✅ Autenticação persiste com Preferences
- ✅ Status bar customizada
- ✅ Splash screen aparece

---

### Fase 4: Ícones e Splash Screens (2 horas)

**Objetivo:** Criar assets nativos

#### 4.1 Gerar Ícones

Você precisa de um ícone **1024×1024 PNG** sem transparência.

**Ferramentas:**
- [Icon Kitchen](https://icon.kitchen/) - Gera todos tamanhos
- [App Icon Generator](https://www.appicon.co/)
- Figma + export

**Tamanhos Necessários:**

**Android:**
```
mipmap-mdpi/ic_launcher.png       (48×48)
mipmap-hdpi/ic_launcher.png       (72×72)
mipmap-xhdpi/ic_launcher.png      (96×96)
mipmap-xxhdpi/ic_launcher.png     (144×144)
mipmap-xxxhdpi/ic_launcher.png    (192×192)
```

**iOS:**
```
AppIcon.appiconset/
  Icon-20.png, Icon-20@2x.png, Icon-20@3x.png
  Icon-29.png, Icon-29@2x.png, Icon-29@3x.png
  Icon-40.png, Icon-40@2x.png, Icon-40@3x.png
  Icon-60@2x.png, Icon-60@3x.png
  Icon-76.png, Icon-76@2x.png
  Icon-83.5@2x.png
  Icon-1024.png
```

**Comando automatizado:**
```bash
# Instalar ferramenta
npm install -g @capacitor/assets

# Gerar todos ícones e splashes
npx capacitor-assets generate \
  --iconBackgroundColor '#2196F3' \
  --iconBackgroundColorDark '#1976D2' \
  --splashBackgroundColor '#2196F3'
```

#### 4.2 Splash Screens

**Criar arquivo `resources/splash.png` (2732×2732)**

Conteúdo:
- Logo centralizado
- Background #2196F3
- Texto "Food Tracker" (opcional)

**Gerar automaticamente:**
```bash
npx capacitor-assets generate --splash resources/splash.png
```

**Critério de Sucesso:**
- ✅ Ícones aparecem no home screen
- ✅ Splash screen mostra ao abrir
- ✅ Cores consistentes com branding

---

### Fase 5: Build e Teste (2 horas)

**Objetivo:** Gerar APK/IPA e testar em dispositivos

#### 5.1 Build Android

```bash
# 1. Build do Next.js
npm run build

# 2. Sincronizar com Capacitor
npx cap sync android

# 3. Abrir Android Studio
npx cap open android

# 4. No Android Studio:
# - Build > Generate Signed Bundle / APK
# - Ou Run (para testar em emulador/dispositivo)
```

**Configurações Android:**

```xml
<!-- android/app/src/main/AndroidManifest.xml -->
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
  <!-- Permissões -->
  <uses-permission android:name="android.permission.INTERNET" />
  <uses-permission android:name="android.permission.CAMERA" />
  <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
  <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />

  <application
    android:label="Food Tracker"
    android:icon="@mipmap/ic_launcher"
    android:roundIcon="@mipmap/ic_launcher_round"
    android:usesCleartextTraffic="true">
    <!-- ... -->
  </application>
</manifest>
```

#### 5.2 Build iOS

```bash
# 1. Build do Next.js
npm run build

# 2. Sincronizar com Capacitor
npx cap sync ios

# 3. Abrir Xcode
npx cap open ios

# 4. No Xcode:
# - Selecionar Team (Apple Developer Account)
# - Selecionar dispositivo/simulador
# - Product > Run
```

**Configurações iOS:**

```xml
<!-- ios/App/App/Info.plist -->
<dict>
  <key>NSCameraUsageDescription</key>
  <string>Precisamos acessar a câmera para fotografar suas refeições</string>

  <key>NSPhotoLibraryUsageDescription</key>
  <string>Precisamos acessar suas fotos para adicionar imagens de refeições</string>

  <key>NSPhotoLibraryAddUsageDescription</key>
  <string>Precisamos salvar fotos das suas refeições</string>
</dict>
```

**Critério de Sucesso:**
- ✅ APK gerado sem erros
- ✅ App instala em dispositivo Android
- ✅ IPA gerado (apenas macOS)
- ✅ App roda em simulador iOS

---

### Fase 6: Testes em Dispositivos (1-2 dias)

**Checklist de Testes:**

#### Funcionalidades Core
- [ ] Login funciona
- [ ] Cadastro de usuário funciona
- [ ] Dashboard carrega dados
- [ ] Capturar refeição abre corretamente
- [ ] Tirar foto com câmera funciona
- [ ] Selecionar foto da galeria funciona
- [ ] Upload de foto funciona
- [ ] IA analisa foto
- [ ] Salvar refeição funciona
- [ ] Histórico mostra refeições
- [ ] Logout funciona

#### Recursos Nativos
- [ ] Câmera nativa abre
- [ ] Permissões de câmera solicitadas
- [ ] Status bar customizada aparece
- [ ] Splash screen aparece ao abrir
- [ ] App funciona offline (cache)
- [ ] App reconecta quando volta online

#### UX Mobile
- [ ] Telas responsivas em 5" e 6.5"
- [ ] Botões têm tamanho mínimo 44×44px
- [ ] Não tem scroll horizontal
- [ ] Inputs não causam zoom no iOS
- [ ] Teclado não sobrepõe campos
- [ ] Gestos nativos funcionam (swipe back)

#### Performance
- [ ] App abre em < 3 segundos
- [ ] Transições são fluidas (60fps)
- [ ] Imagens carregam rápido
- [ ] Não trava ao usar câmera

---

## 📦 Publicação nas Lojas

### App Store (iOS)

#### Requisitos
- [ ] Conta Apple Developer ($99/ano)
- [ ] macOS com Xcode
- [ ] Certificados e provisioning profiles
- [ ] Screenshots (6.5", 6.7", 12.9")
- [ ] Ícone 1024×1024
- [ ] Política de privacidade (URL)

#### Processo

1. **Criar App no App Store Connect**
   - https://appstoreconnect.apple.com
   - Criar novo app
   - Bundle ID: `com.foodtracker.app`
   - Nome: "Food Tracker"

2. **Configurar Metadata**
   - Descrição (4000 caracteres)
   - Keywords
   - Screenshots (obrigatório 3 tamanhos)
   - Preview video (opcional)
   - Categoria: Health & Fitness
   - Preço: Free com in-app purchases (PREMIUM)

3. **Upload do Build**
   ```bash
   # No Xcode:
   # Product > Archive
   # Window > Organizer
   # Distribute App > App Store Connect
   ```

4. **Revisão**
   - Preencher informações de revisão
   - Informações de contato
   - Notas para revisores
   - Submit for Review

**Tempo de Aprovação:** 1-3 dias (primeira vez pode demorar mais)

---

### Play Store (Android)

#### Requisitos
- [ ] Conta Google Play Developer ($25 taxa única)
- [ ] APK ou AAB assinado
- [ ] Screenshots (phone, tablet)
- [ ] Ícone 512×512
- [ ] Feature graphic 1024×500
- [ ] Política de privacidade (URL)

#### Processo

1. **Criar App no Google Play Console**
   - https://play.google.com/console
   - Criar aplicativo
   - Nome: "Food Tracker"
   - Idioma: Português (Brasil)

2. **Configurar Metadata**
   - Descrição curta (80 caracteres)
   - Descrição completa (4000 caracteres)
   - Screenshots (mínimo 2)
   - Feature graphic
   - Categoria: Saúde e fitness
   - Preço: Grátis com compras no app

3. **Upload do Build**
   ```bash
   # Gerar AAB assinado no Android Studio
   # Build > Generate Signed Bundle / APK
   # Escolher "Android App Bundle"
   # Upload no Play Console > Produção > Criar nova versão
   ```

4. **Classificação de Conteúdo**
   - Preencher questionário
   - Categoria: Health & Fitness
   - Sem violência, sexo, etc.

5. **Política de Privacidade**
   - URL obrigatória
   - Explicar coleta de dados (fotos, email, etc)

6. **Enviar para Revisão**

**Tempo de Aprovação:** Algumas horas a 1 dia

---

## 💰 Custos e Requisitos

### Contas de Desenvolvedor

| Plataforma | Custo | Recorrência | Observações |
|------------|-------|-------------|-------------|
| **Apple Developer** | $99 USD | Anual | Obrigatório para iOS |
| **Google Play** | $25 USD | Taxa única | Obrigatório para Android |
| **TOTAL** | ~$124 USD | Primeiro ano | ~R$ 620 |

### Equipamentos

| Item | Necessário Para | Alternativa |
|------|-----------------|-------------|
| **macOS** | Build iOS | Aluguel de Mac na nuvem (MacStadium, MacinCloud) |
| **Android Studio** | Build Android | Qualquer OS (Windows/Mac/Linux) |
| **iPhone** | Testes iOS | Simulador (limitado) |
| **Android Phone** | Testes Android | Emulador (bom o suficiente) |

### Serviços Externos

| Serviço | Finalidade | Custo Estimado |
|---------|------------|----------------|
| **Servidor API** | Backend | $5-20/mês (Vercel/Railway) |
| **Domínio** | api.foodtracker.app | $10-15/ano |
| **SSL** | HTTPS | Grátis (Let's Encrypt) |
| **CDN** | Assets estáticos | Grátis (Cloudflare) |

---

## 🎯 Timeline Estimado

### Cenário Otimista (Tem macOS, conhece mobile)
- **Fase 0-1:** 1 dia (preparação + Capacitor)
- **Fase 2-3:** 2 dias (adaptações + plugins)
- **Fase 4-5:** 1 dia (assets + build)
- **Fase 6:** 2 dias (testes)
- **Publicação:** 1-3 dias (aprovação lojas)
- **TOTAL:** 7-10 dias

### Cenário Realista (Primeira vez com mobile)
- **Fase 0-1:** 2 dias (aprendizado + setup)
- **Fase 2-3:** 3-4 dias (debugging)
- **Fase 4-5:** 2 dias (assets + builds)
- **Fase 6:** 3 dias (testes + correções)
- **Publicação:** 3-7 dias (possíveis rejeições)
- **TOTAL:** 13-18 dias

---

## 📝 Checklist Final

### Pré-Publicação
- [ ] App funciona 100% offline (cache)
- [ ] Todas features testadas em Android e iOS
- [ ] Performance aceitável (< 3s abertura)
- [ ] Sem crashes
- [ ] Permissões todas justificadas
- [ ] Política de privacidade publicada
- [ ] Termos de uso publicados
- [ ] Email de suporte configurado
- [ ] Certificados de assinatura criados
- [ ] Screenshots de boa qualidade (5 mínimo)
- [ ] Descrição otimizada (ASO - App Store Optimization)

### Pós-Publicação
- [ ] Configurar analytics (Firebase, Amplitude)
- [ ] Configurar crash reporting (Sentry, Crashlytics)
- [ ] Monitorar reviews
- [ ] Planejar updates regulares
- [ ] A/B testing de onboarding
- [ ] Push notifications (opcional)
- [ ] Deep links (opcional)

---

## 🚀 Próximos Passos IMEDIATOS

### Decisões Necessárias

1. **Quando quer lançar mobile?**
   - [ ] ASAP (próximas 2 semanas)
   - [ ] Médio prazo (1-2 meses)
   - [ ] Longo prazo (3+ meses)

2. **Tem acesso a macOS?**
   - [ ] SIM (próprio)
   - [ ] SIM (alugado na nuvem)
   - [ ] NÃO (só Android por enquanto)

3. **Backend já está deployado?**
   - [ ] SIM, em: _______________
   - [ ] NÃO, preciso fazer deploy

4. **Quer que eu comece a implementação?**
   - [ ] SIM, Fase 0 (preparação)
   - [ ] SIM, Fase 1 (Capacitor)
   - [ ] NÃO, quero planejar mais

### Recomendação

**Minha sugestão de ordem:**

1. ✅ **Terminar sistema de assinaturas PRIMEIRO**
   - Planos FREE/PREMIUM
   - Quotas e paywalls
   - Página de upgrade
   - **Motivo:** Apps mobile precisam ter monetização ANTES de lançar

2. ✅ **Deploy do backend**
   - Colocar API em produção
   - Testar estabilidade
   - **Motivo:** Mobile vai depender disso

3. ✅ **Capacitor e mobile**
   - Seguir fases 0-6 deste documento
   - Testar extensivamente
   - Publicar nas lojas

**Timeline Realista:**
- Assinaturas: 1 semana
- Backend deploy: 2 dias
- Mobile: 2-3 semanas
- **TOTAL: 4-5 semanas para ter app nas lojas**

---

## 📚 Recursos Úteis

### Documentação
- [Capacitor Docs](https://capacitorjs.com/docs)
- [Next.js Static Export](https://nextjs.org/docs/app/building-your-application/deploying/static-exports)
- [iOS Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Android Material Design](https://material.io/design)

### Ferramentas
- [Capacitor Assets Generator](https://github.com/ionic-team/capacitor-assets)
- [App Icon Generator](https://www.appicon.co/)
- [Screenshot Frames](https://www.screely.com/)

### Comunidade
- [Capacitor Discord](https://discord.gg/UPYYRhtyzp)
- [Stack Overflow - Capacitor](https://stackoverflow.com/questions/tagged/capacitor)

---

**Última atualização:** 2025-10-25
**Próxima revisão:** Após decisão sobre próximos passos
**Dúvidas?** Pergunte! Este é um processo complexo mas MUITO viável.
