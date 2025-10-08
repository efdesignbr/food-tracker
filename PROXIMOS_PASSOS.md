# 🚀 Próximos Passos - Tudo Configurado!

## ✅ O que já está pronto:

- ✅ Backend configurado com Supabase
- ✅ Frontend configurado
- ✅ Todas as dependências instaladas
- ✅ Arquivos .env criados

## ⚠️ FALTA APENAS 1 COISA:

### Pegar sua API Key da Anthropic Claude

1. Acesse: https://console.anthropic.com
2. Faça login (ou crie conta se não tiver)
3. Vá em **API Keys**
4. Clique em **Create Key**
5. Copie a key (começa com `sk-ant-api03-...`)

6. Cole no arquivo `backend/.env` substituindo `COLOQUE_SUA_KEY_AQUI`:

```bash
# Abra o arquivo:
nano backend/.env

# Ou use seu editor preferido e altere esta linha:
ANTHROPIC_API_KEY=sk-ant-api03-SUA_KEY_AQUI
```

## 🎬 Depois de adicionar a key, rode:

### 1. Rodar as migrations (criar tabelas no banco)

```bash
cd /Users/edsonferreira/projetos/food-tracker/backend
npm run migrate
```

Você deve ver: `✅ Migrations completed successfully`

### 2. Iniciar o backend

**Terminal 1:**
```bash
cd /Users/edsonferreira/projetos/food-tracker/backend
npm run dev
```

Você deve ver:
```
🚀 Server running on port 3000
📊 Environment: development
Database connection successful
```

### 3. Iniciar o frontend

**Terminal 2 (novo terminal):**
```bash
cd /Users/edsonferreira/projetos/food-tracker/frontend
npm run dev
```

Você deve ver:
```
  ➜  Local:   http://localhost:5173/
```

### 4. Testar!

1. Abra http://localhost:5173 no navegador
2. Clique em **"Registrar Refeição"**
3. Tire uma foto de comida (ou use uma foto salva)
4. Clique em **"Analisar com IA"**
5. Veja a mágica acontecer! 🎉

## 📱 Testar no celular (mesma rede WiFi)

1. Descubra seu IP local:
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

2. Acesse do celular: `http://SEU_IP:5173`

## 🐛 Se der erro:

### "Failed to connect to database"
- Verifique se copiou corretamente a DATABASE_URL
- Teste a conexão:
```bash
psql "postgresql://postgres:u4NKz1mfKQMDzT3w@db.blxzmmrsucgqqopvrqxc.supabase.co:5432/postgres"
```

### "AI service error"
- Verifique se adicionou a ANTHROPIC_API_KEY
- Confirme se tem créditos na conta Anthropic

### "CORS error" no frontend
- Certifique-se que o backend está rodando
- Verifique se CORS_ORIGIN está correto no `.env`

## 🎯 Funcionalidades disponíveis:

1. **Registrar Refeição**: Fotografe e analise com IA
2. **Histórico**: Veja todas suas refeições
3. **Relatórios**: Identifique gatilhos inflamatórios

## 📊 Exemplo de uso:

1. Registre 3-4 refeições em dias diferentes
2. Vá em "Relatórios"
3. Selecione período (ex: últimos 7 dias)
4. Gere o relatório
5. Veja quais alimentos podem estar causando inflamação!

---

**Assim que adicionar a API key da Anthropic, me avise que eu te ajudo a rodar! 🚀**
