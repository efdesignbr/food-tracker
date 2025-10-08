# Setup Rápido - Food Tracker

## ✅ O que já está pronto

Toda a estrutura do projeto está criada! Agora falta apenas configurar as credenciais.

## 📝 Checklist de Setup

### 1. Supabase (Banco de Dados)

- [ ] Acessar https://supabase.com e fazer login
- [ ] Criar novo projeto
- [ ] Ir em `Project Settings > Database`
- [ ] Copiar **Connection String** (URI mode)
- [ ] Colar no `.env` do backend

### 2. Anthropic API Key

- [ ] Acessar https://console.anthropic.com
- [ ] Criar API Key
- [ ] Colar no `.env` do backend

### 3. Criar arquivos .env

**Backend** (`backend/.env`):
```bash
NODE_ENV=development
PORT=3000
DATABASE_URL=sua_connection_string_do_supabase_aqui
ANTHROPIC_API_KEY=sua_api_key_anthropic_aqui
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
ANTHROPIC_MAX_TOKENS=2048
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880
ALLOWED_MIME_TYPES=image/jpeg,image/png,image/webp
LOG_LEVEL=info
CORS_ORIGIN=http://localhost:5173
```

**Frontend** (`frontend/.env`):
```bash
VITE_API_BASE_URL=http://localhost:3000/api
VITE_API_TIMEOUT=30000
VITE_MAX_IMAGE_SIZE=5242880
```

### 4. Instalar dependências e rodar

```bash
# Terminal 1 - Backend
cd backend
npm install
npm run migrate  # Roda as migrations no Supabase
npm run dev      # Inicia servidor na porta 3000

# Terminal 2 - Frontend
cd frontend
npm install
npm run dev      # Inicia frontend na porta 5173
```

### 5. Testar

Acesse: http://localhost:5173

1. Vá em "Registrar Refeição"
2. Tire uma foto de um prato
3. Clique em "Analisar com IA"
4. Aprove e salve
5. Veja no histórico
6. Gere relatório de gatilhos!

## 🚨 Se algo der errado

### Erro de conexão DB
```bash
# Teste a connection string copiando ela e rodando:
psql "sua_connection_string_aqui"
```

### Backend não inicia
- Verifique se todas as variáveis do `.env` estão preenchidas
- Rode `npm run migrate` antes de iniciar

### Frontend não carrega
- Certifique-se que o backend está rodando (porta 3000)
- Verifique se `VITE_API_BASE_URL` está correto

## 📱 Próximo passo: Deploy

Quando quiser colocar online para usar do celular na rua:

1. **Backend**: Deploy no Railway (gratuito)
2. **Frontend**: Deploy no Vercel (gratuito)
3. Atualizar `VITE_API_BASE_URL` com a URL do Railway

## 💡 Dica

Use o modo desenvolvedor do navegador (F12) para ver os logs de requisições e identificar erros rapidamente.
