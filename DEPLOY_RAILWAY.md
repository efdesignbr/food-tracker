# Deploy Econômico - Railway + Vercel

Esta configuração é **muito mais econômica** que usar Vercel para tudo.

## Por que Railway para o Backend?

- ✅ **Servidor sempre ligado** (não cobra por execução)
- ✅ **$5 de crédito grátis todo mês**
- ✅ **Melhor para APIs Node.js**
- ✅ **Mais barato que serverless para seu caso**

## Por que Vercel só para Frontend?

- ✅ **Totalmente grátis** para sites estáticos
- ✅ **CDN global rápido**
- ✅ **Ideal para React/Vite**

---

## 🚂 PASSO 1: Deploy do Backend no Railway

### 1.1 - Criar conta no Railway

1. Acesse: https://railway.app
2. Clique em **"Start a New Project"** ou **"Login with GitHub"**
3. Autorize o Railway a acessar seus repositórios

### 1.2 - Deploy do Backend

1. No Railway Dashboard, clique em **"New Project"**
2. Selecione **"Deploy from GitHub repo"**
3. Escolha o repositório: **`efdesignbr/food-tracker`**
4. Railway vai detectar que é um monorepo. Clique em **"Add variables"** antes de continuar

### 1.3 - Configurar Variables (IMPORTANTE!)

Adicione estas variáveis de ambiente:

```
NODE_ENV=production
PORT=3000
API_VERSION=v1
DATABASE_URL=sua_url_do_supabase
ANTHROPIC_API_KEY=sua_api_key_anthropic
ANTHROPIC_MODEL=claude-sonnet-4-20250514
ANTHROPIC_MAX_TOKENS=2048
UPLOAD_DIR=/app/uploads
MAX_FILE_SIZE=5242880
ALLOWED_MIME_TYPES=image/jpeg,image/png,image/webp
LOG_LEVEL=info
CORS_ORIGIN=*
```

**📝 Use as mesmas credenciais do arquivo `.env` local**

**Nota**: Vamos ajustar o CORS depois que o frontend estiver no ar.

### 1.4 - Configurar Build Settings

Na aba **"Settings"** do seu projeto Railway:

1. **Root Directory**: `backend`
2. **Build Command**: `npm install && npm run build`
3. **Start Command**: `node dist/server.js`
4. **Watch Paths**: `backend/**`

### 1.5 - Deploy!

1. Clique em **"Deploy"**
2. Aguarde o build terminar (1-2 minutos)
3. Railway vai gerar uma URL pública, algo como: `https://food-tracker-backend-production.up.railway.app`

### 1.6 - Copiar a URL do Backend

**⚠️ IMPORTANTE**: Copie essa URL! Você vai precisar dela no próximo passo.

Exemplo: `https://food-tracker-backend-production.up.railway.app`

---

## 🎨 PASSO 2: Deploy do Frontend no Vercel

### 2.1 - Criar projeto no Vercel

1. Acesse: https://vercel.com
2. Clique em **"Add New Project"**
3. Importe o repositório: **`efdesignbr/food-tracker`**

### 2.2 - Configurar o projeto

- **Framework Preset**: Vite
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### 2.3 - Adicionar Environment Variables

Adicione apenas esta variável (substitua pela URL real do Railway):

```
VITE_API_BASE_URL=https://food-tracker-backend-production.up.railway.app/api
VITE_API_TIMEOUT=30000
VITE_MAX_IMAGE_SIZE=5242880
```

**⚠️ IMPORTANTE**: Substitua `food-tracker-backend-production.up.railway.app` pela URL real que o Railway gerou!

### 2.4 - Deploy!

1. Clique em **"Deploy"**
2. Aguarde o build (1 minuto)
3. Vercel vai gerar uma URL, algo como: `https://food-tracker-tau.vercel.app`

---

## 🔒 PASSO 3: Atualizar CORS no Backend

Agora que você tem a URL do frontend, precisa atualizar o CORS no Railway:

1. Volte no **Railway Dashboard**
2. Abra o projeto do backend
3. Vá em **"Variables"**
4. Edite a variável `CORS_ORIGIN` e coloque a URL do Vercel:
   ```
   CORS_ORIGIN=https://food-tracker-tau.vercel.app
   ```
   (Substitua pela URL real do seu Vercel)

5. Clique em **"Redeploy"** (o Railway vai reiniciar automaticamente)

---

## ✅ PRONTO!

Seu app está no ar! Acesse a URL do Vercel no seu mobile e teste.

### 📊 Custos Mensais Estimados:

- **Railway**: $0 (até $5 de uso grátis/mês - suficiente para uso pessoal)
- **Vercel**: $0 (frontend é grátis)
- **Supabase**: $0 (plano free)
- **Anthropic**: ~$0.50-2.00/mês (depende de quantas fotos você analisa)

**Total: ~$0-2/mês** 💰

---

## 🔧 Troubleshooting

### Backend não inicia no Railway:
- Verifique os logs: Railway Dashboard → seu projeto → "Deployments" → clique no deployment → "View Logs"
- Certifique-se que todas as variáveis de ambiente estão corretas

### CORS Error:
- Certifique-se que o `CORS_ORIGIN` tem a URL correta do Vercel (sem barra no final)

### Frontend não conecta ao backend:
- Verifique se o `VITE_API_BASE_URL` termina com `/api`
- Teste a URL do backend direto no navegador: `https://sua-url.railway.app/api` (deve retornar algo)

---

## 🎯 Próximos Passos (Opcional)

Para economizar ainda mais na API da Anthropic:

1. **Reduzir qualidade de imagem** antes de enviar
2. **Usar Claude Haiku** (mais barato) em vez de Sonnet
3. **Adicionar cache** para não re-analisar a mesma foto
