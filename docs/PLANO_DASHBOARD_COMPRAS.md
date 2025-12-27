# Plano de Implementação: Dashboard de Gastos de Compras

Este documento descreve o plano para criar um painel analítico das listas de compras, permitindo ao usuário controlar gastos e identificar inflação de preços.

## 1. Visão Geral
O dashboard será uma nova tela acessível a partir da página principal de Listas de Compras. Ele fornecerá insights visuais baseados nos dados históricos de listas **concluídas**.

## 2. Métricas Principais
1.  **Evolução Mensal (R$):** Quanto foi gasto em cada mês.
2.  **Top Lojas (Share):** Quanto é gasto em cada estabelecimento.
3.  **Inflação de Itens:** Histórico de variação do preço unitário (`unit_price`) dos produtos mais frequentes.

## 3. Implementação Técnica

### Fase 1: Backend e API
Criar um endpoint `/api/shopping-lists/stats` que executa as seguintes agregações SQL:

*   **Gastos Mensais:**
    ```sql
    SELECT TO_CHAR(completed_at, 'YYYY-MM') as month, SUM(si.price) as total
    FROM shopping_lists sl
    JOIN shopping_items si ON sl.id = si.list_id
    WHERE sl.status = 'completed' AND si.is_purchased = true
    GROUP BY 1 ORDER BY 1 DESC
    LIMIT 12
    ```

*   **Gastos por Loja:**
    ```sql
    SELECT s.name as store_name, SUM(si.price) as total
    FROM shopping_lists sl
    JOIN shopping_items si ON sl.id = si.list_id
    JOIN stores s ON sl.store_id = s.id
    WHERE sl.status = 'completed' AND si.is_purchased = true
    GROUP BY 1 ORDER BY 2 DESC
    ```

*   **Histórico de Preços (Top 5 Itens):**
    ```sql
    SELECT si.name, si.unit_price, si.created_at
    FROM shopping_items si
    WHERE si.unit_price IS NOT NULL
    AND si.name IN (/* Subquery dos 5 itens mais comprados */)
    ORDER BY si.created_at ASC
    ```

### Fase 2: Frontend (Nova Página)
1.  Criar rota: `app/lista-compras/dashboard/page.tsx`.
2.  Instalar biblioteca de gráficos: `npm install recharts`.
3.  Adicionar botão de acesso na página principal (`app/lista-compras/page.tsx`), ao lado do botão "Nova Lista".

### Fase 3: Componentes Visuais
*   **Card Resumo:** "Gasto Total este mês: R$ 500".
*   **BarChart (Recharts):** Eixo X = Meses, Eixo Y = Valor.
*   **PieChart (Recharts):** Fatias = Lojas.
*   **LineChart (Recharts):** Linhas coloridas para cada produto (Arroz, Feijão, Leite) mostrando a variação do preço unitário ao longo do tempo.

## 4. Requisitos e Restrições
*   Usa apenas listas com `status = 'completed'`.
*   Usa apenas itens com `is_purchased = true`.
*   Respeita rigorosamente o isolamento por `tenant_id` e `user_id`.

## 5. Próximos Passos
1.  Instalar `recharts` (`npm install recharts`).
2.  Criar o arquivo da API `app/api/shopping-lists/stats/route.ts`.
3.  Criar a página do dashboard.
