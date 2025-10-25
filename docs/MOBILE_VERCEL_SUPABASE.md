# 📱 Mobile com Vercel + Supabase: Guia Completo

**Data:** 2025-10-25
**Stack:** Next.js + Vercel + Supabase (Postgres + Storage) + NextAuth
**Status:** EXCELENTE - Arquitetura ideal para mobile! ✅

---

## 🎯 Resumo Executivo

**BOA NOTÍCIA:** Sua stack atual é **PERFEITA** para mobile com Capacitor!

### Por quê?

| Componente | Status | Mobile-Ready? |
|------------|--------|---------------|
| **Vercel** | Deploy automático, edge functions | ✅ SIM - API já está online |
| **Supabase Storage** | Imagens hospedadas | ✅ SIM - CDN global rápido |
| **Supabase Postgres** | Banco de dados | ✅ SIM - acesso via Vercel API |
| **NextAuth** | Autenticação | ✅ SIM - session via cookies/JWT |
| **Next.js 14** | Framework | ✅ SIM - suporta SSG |

**Você NÃO precisa mudar NADA no backend!** 🎉

---

## 🏗️ Arquitetura Atual vs Mobile

### Arquitetura Atual (Web)

```
┌─────────────────────────────────────────────┐
│  Next.js App (Vercel)                       │
│  ┌───────────────────────────────────────┐  │
│  │ Frontend (React)                      │  │
│  │ - Pages renderizadas server-side     │  │
│  │ - Componentes                         │  │
│  └───────────────────────────────────────┘  │
│                ↓ (internal)                  │
│  ┌───────────────────────────────────────┐  │
│  │ API Routes (Backend)                  │  │
│  │ - /api/meals                          │  │
│  │ - /api/auth                           │  │
│  │ - /api/food-bank                      │  │
│  │ - NextAuth                            │  │
│  └───────────────────────────────────────┘  │
│         ↓                    ↓                │
└─────────────────────────────────────────────┘
         ↓                    ↓
    ┌─────────┐         ┌─────────────┐
    │Supabase │         │   Gemini    │
    │Postgres │         │     AI      │
    │Storage  │         │             │
    └─────────┘         └─────────────┘
```

### Arquitetura Mobile (Híbrida)

```
┌──────────────────────────────────────┐
│  Mobile App (Capacitor)              │
│  ┌────────────────────────────────┐  │
│  │ Frontend SSG (HTML/CSS/JS)     │  │
│  │ - Build estático do Next.js    │  │
│  │ - Roda localmente no device    │  │
│  │ - Plugins nativos (Camera)     │  │
│  └────────────────────────────────┘  │
└──────────────────────────────────────┘
            ↓ HTTPS
┌──────────────────────────────────────┐
│  Backend Vercel (MESMA API!)         │
│  ┌────────────────────────────────┐  │
│  │ API Routes (Backend)           │  │
│  │ - /api/meals                   │  │
│  │ - /api/auth                    │  │
│  │ - /api/food-bank               │  │
│  │ - NextAuth                     │  │
│  └────────────────────────────────┘  │
│         ↓                    ↓         │
└──────────────────────────────────────┘
         ↓                    ↓
    ┌─────────┐         ┌─────────────┐
    │Supabase │         │   Gemini    │
    │Postgres │         │     AI      │
    │Storage  │         │             │
    └─────────┘         └─────────────┘
```

**A ÚNICA diferença:**
- Web: Frontend e Backend no mesmo deploy (Vercel)
- Mobile: Frontend local (device) + Backend remoto (Vercel via HTTPS)

---

## ✅ Vantagens da Sua Stack para Mobile

### 1. Backend Já Está Pronto ✅

Você **NÃO precisa criar API do zero!**

Seus endpoints já funcionam:
- ✅ `/api/meals` → criar, listar, editar refeições
- ✅ `/api/auth` → login, signup (NextAuth)
- ✅ `/api/food-bank` → buscar alimentos
- ✅ `/api/restaurants` → gerenciar restaurantes
- ✅ Etc.

**Mobile vai usar EXATAMENTE os mesmos endpoints!**

### 2. Vercel = Deploy Automático ✅

- Push no GitHub → Deploy automático
- URL estável (`https://seu-app.vercel.app`)
- HTTPS grátis (SSL)
- Edge functions globais (rápido no mundo todo)
- Rollback fácil

**Mobile sempre terá backend atualizado!**

### 3. Supabase Storage = CDN Global ✅

- Imagens já hospedadas
- URL pública estável
- CDN rápido
- Funciona perfeitamente em mobile

**Fotos carregam rápido no app!**

### 4. NextAuth = Autenticação Pronta ✅

- Sessions funcionam via cookies/JWT
- Login/signup já implementados
- Proteção de rotas já funciona

**Só precisa adaptar para JWT no mobile!**

---

## 🚀 Implementação: Passo a Passo

### Fase 1: Configurar Vercel para Mobile (30 min)

#### 1.1 Verificar URL de Produção

```bash
# Qual é a URL do seu app no Vercel?
# Exemplo: https://food-tracker-web.vercel.app
```

**Anote essa URL!** Vai ser o `NEXT_PUBLIC_API_URL`

#### 1.2 Configurar CORS no Backend

Vercel precisa aceitar requests do app mobile:

```typescript
// middleware.ts (criar na raiz do projeto atual)

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Permitir CORS de qualquer origem (capacitor://, ionic://)
  const origin = request.headers.get('origin');
  if (origin) {
    response.headers.set('Access-Control-Allow-Origin', origin);
  } else {
    response.headers.set('Access-Control-Allow-Origin', '*');
  }

  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, OPTIONS'
  );
  response.headers.set(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-Requested-With'
  );

  // Handle preflight
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, { status: 200, headers: response.headers });
  }

  return response;
}

export const config = {
  matcher: '/api/:path*', // Aplica só nas API routes
};
```

**Deploy isso no Vercel!**

#### 1.3 Testar Endpoints Remotamente

```bash
# Testar se API está acessível
curl https://SEU-APP.vercel.app/api/meals

# Deve retornar algo (mesmo que erro de auth)
# Se der timeout/404 → problema de deploy
```

---

### Fase 2: Criar Projeto Mobile (2 horas)

#### 2.1 Estrutura de Pastas

```bash
# Opção A: Duplicar projeto
cp -r food-tracker food-tracker-mobile
cd food-tracker-mobile

# Opção B: Criar do zero e linkar código
mkdir food-tracker-mobile
cd food-tracker-mobile
npm create next-app@latest . --typescript --tailwind --app
```

#### 2.2 Instalar Capacitor

```bash
npm install @capacitor/core @capacitor/cli
npm install @capacitor/android @capacitor/ios

# Plugins nativos
npm install @capacitor/camera
npm install @capacitor/preferences
npm install @capacitor/splash-screen
npm install @capacitor/status-bar
npm install @capacitor/app
```

#### 2.3 Configurar Next.js para SSG

```javascript
// next.config.mjs

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // ← CRÍTICO
  reactStrictMode: true,
  images: {
    unoptimized: true, // Next Image não funciona em SSG
  },
  trailingSlash: true,
  // REMOVER next-pwa (conflita com Capacitor)
};

export default nextConfig;
```

#### 2.4 Inicializar Capacitor

```bash
npx cap init

# Perguntas:
# App name: Food Tracker
# App ID: com.foodtracker.app
# Web directory: out

# Criar projetos nativos
npx cap add android
npx cap add ios # (só macOS)
```

---

### Fase 3: Adaptar Código para API Remota (4 horas)

#### 3.1 Criar Cliente de API

```typescript
// lib/api-client.ts

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'https://SEU-APP.vercel.app';

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

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (fetchOptions.body && typeof fetchOptions.body === 'string') {
    headers['Content-Type'] = 'application/json';
  }

  const url = `${API_URL}${endpoint}`;

  return fetch(url, {
    ...fetchOptions,
    headers,
    credentials: 'include', // Importante para cookies
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

  // Upload de arquivo (FormData)
  upload: (endpoint: string, formData: FormData, token?: string) =>
    apiClient(endpoint, {
      method: 'POST',
      body: formData,
      token,
      // NÃO adicionar Content-Type, deixa o browser adicionar com boundary
    }),
};
```

#### 3.2 Adaptar Chamadas de API

**ANTES (Web):**
```typescript
// app/capture/page.tsx

const res = await fetch('/api/meals/analyze-meal', {
  method: 'POST',
  body: formData,
});
```

**DEPOIS (Mobile):**
```typescript
// app/capture/page.tsx

import { api } from '@/lib/api-client';
import { getAuthToken } from '@/lib/auth-storage'; // vamos criar

const token = await getAuthToken();

const res = await api.upload('/api/meals/analyze-meal', formData, token);
```

#### 3.3 Gerenciar Autenticação com Capacitor

```typescript
// lib/auth-storage.ts

import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';

const AUTH_TOKEN_KEY = 'auth_token';
const USER_DATA_KEY = 'user_data';

// Salvar token após login
export async function saveAuthToken(token: string) {
  if (Capacitor.isNativePlatform()) {
    await Preferences.set({
      key: AUTH_TOKEN_KEY,
      value: token,
    });
  } else {
    // Fallback para web (localStorage)
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  }
}

// Recuperar token
export async function getAuthToken(): Promise<string | null> {
  if (Capacitor.isNativePlatform()) {
    const { value } = await Preferences.get({ key: AUTH_TOKEN_KEY });
    return value;
  } else {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  }
}

// Remover token (logout)
export async function removeAuthToken() {
  if (Capacitor.isNativePlatform()) {
    await Preferences.remove({ key: AUTH_TOKEN_KEY });
  } else {
    localStorage.removeItem(AUTH_TOKEN_KEY);
  }
}

// Salvar dados do usuário
export async function saveUserData(user: any) {
  const userData = JSON.stringify(user);
  if (Capacitor.isNativePlatform()) {
    await Preferences.set({
      key: USER_DATA_KEY,
      value: userData,
    });
  } else {
    localStorage.setItem(USER_DATA_KEY, userData);
  }
}

// Recuperar dados do usuário
export async function getUserData(): Promise<any | null> {
  let userData: string | null;

  if (Capacitor.isNativePlatform()) {
    const { value } = await Preferences.get({ key: USER_DATA_KEY });
    userData = value;
  } else {
    userData = localStorage.getItem(USER_DATA_KEY);
  }

  return userData ? JSON.parse(userData) : null;
}
```

#### 3.4 Adaptar Login/Signup

**Fluxo NextAuth no Mobile:**

NextAuth funciona com cookies, mas em mobile é melhor usar JWT:

**OPÇÃO A: Criar endpoint de JWT**

```typescript
// app/api/auth/mobile-login/route.ts (NOVO endpoint no backend)

import { NextRequest } from 'next/server';
import { getPool } from '@/lib/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.NEXTAUTH_SECRET!;

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  const pool = getPool();
  const { rows } = await pool.query(
    'SELECT * FROM users WHERE email = $1 LIMIT 1',
    [email]
  );

  if (rows.length === 0) {
    return Response.json({ error: 'invalid_credentials' }, { status: 401 });
  }

  const user = rows[0];

  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) {
    return Response.json({ error: 'invalid_credentials' }, { status: 401 });
  }

  // Gera JWT
  const token = jwt.sign(
    {
      userId: user.id,
      tenantId: user.tenant_id,
      email: user.email,
    },
    JWT_SECRET,
    { expiresIn: '30d' } // Token válido por 30 dias
  );

  return Response.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      tenantId: user.tenant_id,
    },
  });
}
```

**Mobile - Login:**
```typescript
// app/login/page.tsx (mobile)

import { api } from '@/lib/api-client';
import { saveAuthToken, saveUserData } from '@/lib/auth-storage';

async function handleLogin(email: string, password: string) {
  const res = await api.post('/api/auth/mobile-login', { email, password });

  if (!res.ok) {
    throw new Error('Login falhou');
  }

  const { token, user } = await res.json();

  // Salva token e dados do usuário
  await saveAuthToken(token);
  await saveUserData(user);

  // Redireciona para dashboard
  router.push('/dashboard');
}
```

**OPÇÃO B: Usar NextAuth session cookie**

Mais complexo, mas possível. NextAuth pode funcionar via cookies em mobile se configurar CORS correto.

---

### Fase 4: Câmera Nativa (2 horas)

```typescript
// components/CameraButton.tsx

'use client';

import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

export default function CameraButton({ onPhoto }: { onPhoto: (base64: string) => void }) {
  async function tirarFoto() {
    // Verifica se está em mobile nativo
    if (!Capacitor.isNativePlatform()) {
      // Fallback: usar input file na web
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = () => onPhoto(reader.result as string);
          reader.readAsDataURL(file);
        }
      };
      input.click();
      return;
    }

    // Mobile nativo: usar câmera nativa
    try {
      const image = await Camera.getPhoto({
        quality: 80,
        allowEditing: true,
        resultType: CameraResultType.Base64,
        source: CameraSource.Prompt, // Mostra escolha: Câmera ou Galeria
        width: 1024,
        height: 1024,
      });

      const base64 = `data:image/jpeg;base64,${image.base64String}`;
      onPhoto(base64);
    } catch (error) {
      console.error('Erro ao tirar foto:', error);
    }
  }

  return (
    <button onClick={tirarFoto} className="btn-primary">
      📸 Adicionar Foto
    </button>
  );
}
```

**Usar no capture/page.tsx:**
```typescript
import CameraButton from '@/components/CameraButton';

export default function CapturePage() {
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);

  return (
    <div>
      <CameraButton onPhoto={setPhotoBase64} />

      {photoBase64 && (
        <img src={photoBase64} alt="Preview" />
      )}
    </div>
  );
}
```

---

### Fase 5: Build e Deploy (1 hora)

#### 5.1 Configurar Variáveis de Ambiente

```bash
# .env.production (projeto mobile)

NEXT_PUBLIC_API_URL=https://SEU-APP.vercel.app
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key
```

#### 5.2 Build

```bash
# Build Next.js (SSG)
npm run build

# Sincronizar com Capacitor
npx cap sync

# Resultado: pasta /out com HTML/CSS/JS
# Copiado para android/app/src/main/assets/public
# Copiado para ios/App/App/public
```

#### 5.3 Abrir e Testar

```bash
# Android
npx cap open android
# No Android Studio: Run (Shift+F10)

# iOS (macOS only)
npx cap open ios
# No Xcode: Product > Run
```

---

## 🔐 Autenticação: Detalhes Importantes

### Como NextAuth Funciona com Mobile

**Web (atual):**
```
User → Login → NextAuth API → Session Cookie → Protected Routes
```

**Mobile (adaptado):**
```
User → Login → NextAuth API → JWT Token → Capacitor Preferences → Protected Routes
```

### Proteger Endpoints no Backend

```typescript
// lib/auth-jwt.ts (NOVO - adicionar no backend)

import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

const JWT_SECRET = process.env.NEXTAUTH_SECRET!;

export async function verifyJWT(req: NextRequest) {
  const authHeader = req.headers.get('authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    throw new Response(JSON.stringify({ error: 'unauthorized' }), {
      status: 401,
    });
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      tenantId: string;
      email: string;
    };

    return decoded;
  } catch (error) {
    throw new Response(JSON.stringify({ error: 'invalid_token' }), {
      status: 401,
    });
  }
}
```

**Usar em API Routes:**
```typescript
// app/api/meals/route.ts

import { verifyJWT } from '@/lib/auth-jwt';

export async function GET(req: NextRequest) {
  // Verifica JWT
  const { userId, tenantId } = await verifyJWT(req);

  // Continua normalmente...
  const pool = getPool();
  const { rows } = await pool.query(
    'SELECT * FROM meals WHERE user_id = $1',
    [userId]
  );

  return Response.json({ meals: rows });
}
```

---

## 📊 Comparação: Web vs Mobile

| Aspecto | Web (Atual) | Mobile (Capacitor) |
|---------|-------------|---------------------|
| **Deploy** | Vercel (SSR) | Device local (SSG) |
| **Backend** | Vercel API Routes | Vercel API Routes (HTTP) |
| **Auth** | NextAuth (cookies) | NextAuth (JWT) |
| **Storage** | Supabase | Supabase (mesma URL) |
| **Database** | Postgres (Vercel) | Postgres (via API) |
| **Fotos** | Input file | Câmera nativa |
| **Offline** | Service Worker | Capacitor cache |
| **Atualização** | Deploy automático | Rebuild + resubmit |

---

## ✅ Checklist Final

### Backend (Vercel - Atual)

- [ ] CORS configurado (middleware.ts)
- [ ] Endpoint `/api/auth/mobile-login` criado
- [ ] JWT validation em routes protegidas
- [ ] Testado via Postman/curl
- [ ] Deploy feito e funcionando

### Mobile (Capacitor - Novo)

- [ ] Projeto criado
- [ ] Capacitor instalado
- [ ] `next.config.js` configurado para SSG
- [ ] `lib/api-client.ts` criado
- [ ] `lib/auth-storage.ts` criado
- [ ] Todas chamadas de API adaptadas
- [ ] Câmera nativa implementada
- [ ] Login/logout funcionando
- [ ] Build roda sem erros
- [ ] Testado em Android/iOS

---

## 🎯 Ordem de Implementação Recomendada

### Semana 1: Backend (Vercel)
- [ ] Dia 1: Adicionar middleware CORS
- [ ] Dia 2: Criar endpoint mobile-login
- [ ] Dia 3: Adicionar JWT validation
- [ ] Dia 4: Testar todos endpoints remotamente
- [ ] Dia 5: Deploy e validação

### Semana 2: Mobile Setup
- [ ] Dia 1: Criar projeto mobile
- [ ] Dia 2: Instalar Capacitor
- [ ] Dia 3: Configurar Next.js SSG
- [ ] Dia 4-5: Adaptar API client

### Semana 3: Features Nativas
- [ ] Dia 1-2: Implementar câmera
- [ ] Dia 3: Implementar auth storage
- [ ] Dia 4: Adaptar login/logout
- [ ] Dia 5: Testar tudo

### Semana 4: Build e Testes
- [ ] Dia 1: Build Android
- [ ] Dia 2: Build iOS
- [ ] Dia 3-5: Testes em dispositivos

---

## 💡 Dicas Importantes

### 1. Supabase Storage URLs

As URLs de imagens continuam funcionando:
```typescript
// Backend gera URL pública
const { publicUrl } = supabase.storage.from('images').getPublicUrl(path);

// Mobile carrega normalmente
<img src={publicUrl} />
```

### 2. Debugging

```typescript
// Saber se está rodando em mobile ou web
import { Capacitor } from '@capacitor/core';

if (Capacitor.isNativePlatform()) {
  console.log('Rodando em mobile nativo');
} else {
  console.log('Rodando na web');
}
```

### 3. Desenvolvimento Local

Durante desenvolvimento, você pode:
```bash
# Terminal 1: Backend (projeto original)
cd food-tracker
npm run dev
# http://localhost:3000

# Terminal 2: Mobile (projeto novo)
cd food-tracker-mobile
NEXT_PUBLIC_API_URL=http://localhost:3000 npm run build && npx cap sync
npx cap run android
```

---

## 🚀 Resumo Final

**Sua stack é PERFEITA para mobile!**

✅ Backend já pronto (Vercel)
✅ Banco já configurado (Supabase Postgres)
✅ Storage já funcionando (Supabase Storage)
✅ Auth já implementada (NextAuth)

**Só falta:**
- Adicionar CORS
- Criar projeto mobile
- Adaptar chamadas de API
- Build e publicar

**Tempo estimado:** 3-4 semanas até estar nas lojas! 🎉

---

**Próximos passos:** Quer que eu comece implementando o CORS e o endpoint de mobile-login?
