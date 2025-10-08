# Food Tracker MVP

Sistema de rastreamento alimentar com análise de IA para identificação de gatilhos inflamatórios intestinais.

## 🎯 Funcionalidades

- 📸 **Captura de refeições** via foto ou upload
- 🤖 **Análise automática com IA** (Claude) identificando alimentos e nutrientes
- 📅 **Registro temporal** com data/hora da refeição
- 📊 **Histórico detalhado** com filtros por período
- ⚠️ **Relatórios de gatilhos** identificando alimentos potencialmente inflamatórios
- 💡 **Recomendações personalizadas** baseadas nos padrões alimentares

## 🏗️ Stack Tecnológica

### Backend
- Node.js 20+ com TypeScript
- Express.js
- PostgreSQL (Supabase)
- Anthropic Claude API
- Multer + Sharp (processamento de imagens)
- Zod (validação)

### Frontend
- React 18 + TypeScript
- Vite
- Tailwind CSS
- React Router
- Axios
- date-fns

## 📋 Pré-requisitos

1. **Node.js 20+** instalado
2. **Conta Supabase** (PostgreSQL gratuito)
3. **API Key da Anthropic** (Claude)

## 🚀 Setup Local

### 1. Clone e instale dependências

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Configure o Supabase

1. Acesse https://supabase.com e crie um projeto
2. Vá em `Project Settings > Database`
3. Copie a **Connection String** (URI format)

### 3. Configure variáveis de ambiente

**Backend** - Crie `backend/.env`:

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxx
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
ANTHROPIC_MAX_TOKENS=2048
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880
ALLOWED_MIME_TYPES=image/jpeg,image/png,image/webp
LOG_LEVEL=info
CORS_ORIGIN=http://localhost:5173
```

**Frontend** - Crie `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_API_TIMEOUT=30000
VITE_MAX_IMAGE_SIZE=5242880
```

### 4. Execute as migrations

```bash
cd backend
npm run migrate
```

### 5. Inicie os servidores

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

Acesse: http://localhost:5173

## 📱 Como Usar

### 1. Registrar Refeição

1. Clique em "Registrar Refeição"
2. Tire uma foto ou faça upload
3. Ajuste data/hora se necessário
4. Clique em "Analisar com IA"
5. Revise os alimentos detectados
6. Clique em "Aprovar e Salvar"

### 2. Ver Histórico

1. Clique em "Histórico"
2. Selecione o período desejado
3. Veja suas refeições e totais nutricionais

### 3. Gerar Relatório de Gatilhos

1. Clique em "Relatórios"
2. Selecione o período (ex: últimos 30 dias)
3. Clique em "Gerar Relatório"
4. Veja alimentos potencialmente inflamatórios detectados
5. Leia as recomendações personalizadas

## 🔍 Alimentos Monitorados

O sistema identifica automaticamente alimentos conhecidos por causar inflamação intestinal:

- **Laticínios**: leite, queijo, iogurte, manteiga
- **Glúten**: pão, massa, bolo, biscoito
- **Gorduras**: frituras, embutidos, bacon
- **Picantes**: pimenta, molhos picantes
- **Estimulantes**: café, refrigerante, álcool
- **Processados**: fast food, industrializados
- **Fibras insolúveis em excesso**: feijão, brócolis, couve-flor

## 🚢 Deploy (Produção)

### Backend (Railway/Render)

1. Conecte seu repositório
2. Configure as variáveis de ambiente
3. Deploy automático

### Frontend (Vercel)

1. Conecte seu repositório
2. Configure `VITE_API_BASE_URL` com a URL do backend
3. Deploy automático

## 📁 Estrutura do Projeto

```
food-tracker/
├── backend/
│   ├── src/
│   │   ├── config/           # Configurações (DB, env)
│   │   ├── modules/
│   │   │   ├── meals/        # CRUD de refeições
│   │   │   ├── analysis/     # Relatórios
│   │   ├── shared/           # Utilitários, tipos
│   │   └── server.ts
│   ├── migrations/           # SQL migrations
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/       # Componentes React
│   │   ├── pages/            # Páginas (routes)
│   │   ├── services/         # API calls
│   │   └── types/            # TypeScript types
│   └── package.json
└── docs/                     # Documentação técnica
```

## 🔧 Scripts Disponíveis

### Backend
```bash
npm run dev      # Desenvolvimento (hot reload)
npm run build    # Build para produção
npm start        # Produção
npm run migrate  # Executar migrations
```

### Frontend
```bash
npm run dev      # Desenvolvimento
npm run build    # Build para produção
npm run preview  # Preview do build
```

## 🐛 Troubleshooting

### Erro de conexão com banco
- Verifique se a `DATABASE_URL` está correta
- Teste a conexão no Supabase Dashboard

### Erro na análise IA
- Verifique se `ANTHROPIC_API_KEY` é válida
- Confira se tem créditos na conta Anthropic

### Erro ao fazer upload
- Verifique permissões da pasta `uploads/`
- Confira limite de tamanho (`MAX_FILE_SIZE`)

### Frontend não conecta ao backend
- Verifique se backend está rodando na porta 3000
- Confira `VITE_API_BASE_URL` no `.env` do frontend
- Verifique configuração de CORS no backend

## 📝 Próximos Passos

- [ ] Autenticação multi-usuário
- [ ] PWA para uso offline
- [ ] Gráficos de evolução temporal
- [ ] Exportar relatórios em PDF
- [ ] Notificações de padrões detectados
- [ ] Integração com wearables

## 🤝 Suporte

Para dúvidas ou problemas:
1. Verifique os logs do backend (`pino-pretty`)
2. Inspecione Network tab no DevTools
3. Confira as variáveis de ambiente

## 📄 Licença

MIT
