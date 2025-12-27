# Plano de Melhoria: Sugestões Inteligentes de Compras

Este documento detalha a implementação da abordagem híbrida para sugestões de lista de compras, visando eliminar itens irrelevantes (pratos prontos, comida de restaurante) e focar em reposição de despensa.

## 1. O Problema Atual
Atualmente, a query `getFoodSuggestions` olha apenas para a tabela `food_items` (consumo).
*   **Falha 1:** Inclui itens comidos fora de casa (restaurantes).
*   **Falha 2:** Inclui nomes de pratos (ex: "Bolo de Cenoura") em vez de ingredientes (Farinha, Cenoura), pois é assim que o usuário registra a refeição.

## 2. A Nova Abordagem Híbrida

A sugestão será composta por duas camadas de dados, unificadas e ordenadas por relevância.

### Camada 1: Histórico de Compras (Prioridade Alta)
Itens que o usuário já comprou e marcou como "comprado" no app.
*   **Tabela:** `shopping_items`
*   **Filtro:** `is_purchased = true` E `tenant_id` atual.
*   **Lógica:** Se eu compro "Café" todo mês, ele deve ser sugerido.

### Camada 2: Consumo em Casa (Prioridade Média)
Itens consumidos, mas filtrados estritamente pelo local.
*   **Tabela:** `meals` JOIN `food_items`
*   **Filtro:** `location_type = 'home'` (Isso elimina McDonald's, restaurantes, etc).
*   **Lógica:** Complementa a lista com itens que talvez eu nunca tenha marcado como comprado no app, mas consumo frequentemente em casa.

## 3. Implementação Técnica (Backend)

Alteração no arquivo `lib/repos/shopping-list.repo.ts`, função `getFoodSuggestions`.

**Pseudocódigo SQL da Nova Query:**

```sql
WITH 
-- 1. Dados de Compras Anteriores
purchase_stats AS (
    SELECT 
        LOWER(TRIM(name)) as food_name,
        COUNT(*) as score, -- Peso alto
        MAX(created_at) as last_date,
        MODE() WITHIN GROUP (ORDER BY unit) as common_unit,
        AVG(quantity) as avg_qty
    FROM shopping_items
    WHERE is_purchased = true 
      AND created_at >= NOW() - INTERVAL '90 days' -- Histórico de 3 meses
    GROUP BY 1
),

-- 2. Dados de Consumo em Casa
consumption_stats AS (
    SELECT 
        LOWER(TRIM(fi.name)) as food_name,
        COUNT(*) as score, -- Peso normal
        MAX(m.consumed_at) as last_date,
        MAX(fi.unit) as common_unit,
        AVG(fi.quantity) as avg_qty
    FROM food_items fi
    JOIN meals m ON fi.meal_id = m.id
    WHERE m.location_type = 'home' -- FILTRO CRÍTICO
      AND m.status = 'approved'
      AND m.consumed_at >= NOW() - INTERVAL '30 days'
    GROUP BY 1
),

-- 3. Unificação
combined AS (
    SELECT * FROM purchase_stats
    UNION ALL
    SELECT * FROM consumption_stats
)

-- 4. Agrupamento Final (Remove duplicatas entre compra e consumo)
SELECT 
    food_name,
    SUM(score) as consumption_count, -- Mantendo nome do campo para compatibilidade
    MAX(last_date) as last_consumed,
    AVG(avg_qty) as avg_quantity,
    MAX(common_unit) as common_unit
FROM combined
GROUP BY food_name
ORDER BY consumption_count DESC
LIMIT $limit
```

## 4. Segurança e Rollback
*   A alteração é puramente na camada de leitura (SELECT). Não há risco de corromper dados.
*   A interface de retorno TypeScript `FoodSuggestion` será mantida idêntica, garantindo que o Frontend continue funcionando sem alterações.
*   Caso a performance caia ou os resultados fiquem ruins, basta reverter o arquivo `shopping-list.repo.ts` para a versão anterior.

## 5. Próximos Passos
1.  Aguardar aprovação do usuário.
2.  Aplicar a nova query no arquivo `lib/repos/shopping-list.repo.ts`.
3.  Testar criando uma nova lista e verificando as sugestões.
