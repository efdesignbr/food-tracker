# Deploy no Vercel

## 1. Backend

### No Vercel Dashboard:

1. Faça login no [Vercel](https://vercel.com)
2. Clique em "Add New Project"
3. Importe o repositório do GitHub
4. Configure o projeto:
   - **Framework Preset**: Other
   - **Root Directory**: `backend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

5. Adicione as **Environment Variables**:
   ```
   NODE_ENV=production
   PORT=3000
   API_VERSION=v1
   DATABASE_URL=sua_database_url_do_supabase
   ANTHROPIC_API_KEY=sua_api_key_da_anthropic
   ANTHROPIC_MODEL=claude-sonnet-4-20250514
   ANTHROPIC_MAX_TOKENS=2048
   UPLOAD_DIR=./uploads
   MAX_FILE_SIZE=5242880
   ALLOWED_MIME_TYPES=image/jpeg,image/png,image/webp
   LOG_LEVEL=info
   CORS_ORIGIN=https://SEU-FRONTEND.vercel.app
   ```

   **📝 Copie suas credenciais do arquivo `.env` local para preencher DATABASE_URL e ANTHROPIC_API_KEY**

6. Deploy!

7. **Após o deploy**, copie a URL do backend (ex: `https://seu-backend.vercel.app`)

---

## 2. Frontend

### No Vercel Dashboard:

1. Clique em "Add New Project" novamente
2. Importe o mesmo repositório do GitHub
3. Configure o projeto:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

4. Adicione as **Environment Variables**:
   ```
   VITE_API_BASE_URL=https://SEU-BACKEND.vercel.app/api
   VITE_API_TIMEOUT=30000
   VITE_MAX_IMAGE_SIZE=5242880
   ```

   **⚠️ IMPORTANTE**: Substitua `SEU-BACKEND` pela URL real do backend que você copiou no passo anterior!

5. Deploy!

---

## 3. Atualizar CORS no Backend

Depois que o frontend estiver no ar:

1. Volte no projeto do **backend** no Vercel
2. Vá em **Settings** → **Environment Variables**
3. Edite a variável `CORS_ORIGIN` e coloque a URL do frontend:
   ```
   CORS_ORIGIN=https://seu-frontend.vercel.app
   ```
4. Clique em **Redeploy** para aplicar as mudanças

---

## ✅ Pronto!

Seu app estará rodando em produção e acessível de qualquer lugar, inclusive mobile!

### URLs finais:
- Frontend: `https://seu-frontend.vercel.app`
- Backend: `https://seu-backend.vercel.app/api`

---

## 🔧 Troubleshooting

Se der erro no deploy:

1. **Backend não inicia**: Verifique os logs no Vercel Dashboard
2. **CORS error**: Certifique-se que o `CORS_ORIGIN` está correto
3. **Database error**: Verifique se o `DATABASE_URL` do Supabase está correto
4. **AI error**: Verifique se o `ANTHROPIC_API_KEY` está correto
