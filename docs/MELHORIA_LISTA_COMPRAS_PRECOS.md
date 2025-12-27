# Plano de Melhoria: Calculadora Inteligente de Preços (Lista de Compras)

Este documento descreve o plano técnico e de interface para implementar o cálculo automático de preços unitários e totais na lista de compras, permitindo melhor controle de gastos e histórico de inflação.

## 1. O Problema
Atualmente, o sistema armazena apenas o `price` (preço total) do item.
- **Cenário Ruim:** Usuário compra 3 itens de R$ 10,00. Precisa calcular mentalmente e digitar R$ 30,00. O sistema perde a informação de que a unidade custava R$ 10,00.
- **Cenário de Peso:** Usuário compra 1.2kg de frango que deu R$ 24,00. O sistema perde a informação do preço por kg.

## 2. A Solução: Calculadora Reativa
Implementar uma lógica de campos interligados onde preencher dois valores calcula automaticamente o terceiro.

**Fórmula:** `Quantidade × Preço Unitário = Preço Total`

### Comportamentos:
1.  **Inserir Unitário:** Usuário digita Qtd (3) e Unitário (10,00) -> Sistema preenche Total (30,00).
2.  **Inserir Total:** Usuário digita Qtd (1.2) e Total (24,00) -> Sistema calcula Unitário (20,00). *Ideal para itens pesáveis.*
3.  **Ajuste de Quantidade:** Alterar Qtd recalcula o Total (mantendo o Unitário fixo).

## 3. Implementação Técnica

### Fase 1: Banco de Dados e Backend
Precisamos armazenar o preço unitário para preservar o histórico real do valor do produto.

> **⚠️ IMPORTANTE: SEM MIGRATIONS AUTOMÁTICAS**
> Todas as alterações de banco de dados devem ser feitas via script SQL fornecido para execução manual pelo usuário.

1.  **Banco de Dados:**
    *   Adicionar coluna `unit_price` (DECIMAL/NUMERIC) na tabela `shopping_items`.
    *   *Ação:* Gerar script SQL `ALTER TABLE...` para o usuário rodar.

2.  **Repositório (`lib/repos/shopping-list.repo.ts`):**
    *   Atualizar métodos de `create` e `update` para aceitar e persistir `unit_price`.

3.  **API (`app/api/shopping-lists/items/route.ts`):**
    *   Atualizar validação e tipagem para receber `unit_price` no corpo das requisições POST e PATCH.

### Fase 2: Frontend (Interface e Lógica)

1.  **Tipagem:**
    *   Atualizar interface `ShoppingItem` para incluir `unit_price?: number`.

2.  **Componente de Item (`app/lista-compras/page.tsx`):**
    *   Criar um estado local para gerenciar a edição "inteligente".
    *   Substituir o input simples de preço por um componente composto (Unitário | Total) ou expandir a linha quando estiver em edição.

3.  **UX / Design:**
    *   **Modo Visualização:** Exibir o preço total destacado, mas mostrar discretamente o cálculo: `3 x R$ 10,00`.
    *   **Modo Edição:**
        *   Input de **Qtd** (já existe).
        *   Input de **R$ Unit** (Novo).
        *   Input de **R$ Total** (Existente).
    *   **Lógica JS:**
        *   `onChangeUnit`: `setTotal(qtd * unit)`
        *   `onChangeTotal`: `setUnit(total / qtd)`
        *   `onChangeQtd`: `setTotal(qtd * unit)` (Prioriza manter o preço da etiqueta fixo).

## 4. Casos de Uso (Testes)

| Cenário | Ação do Usuário | Resultado Esperado |
| :--- | :--- | :--- |
| **Itens Inteiros** | Compra 3 barras de proteína. Digita Qtd: 3, Unit: 10,00. | Total preenchido automaticamente como 30,00. Banco salva unit_price: 10. |
| **Pesáveis (KG)** | Pesa 0.500kg de carne. Etiqueta diz Total: 20,00. Digita Qtd: 0.5, Total: 20,00. | Unitário calculado como 40,00 (preço do kg). Banco salva unit_price: 40. |
| **Ajuste Rápido** | Percebe que pegou 4 itens em vez de 3. Muda Qtd para 4. | Total atualiza para 40,00 (mantendo unitário de 10,00). |
| **Compatibilidade** | Item antigo sem unit_price. | Interface assume `unit = total / qtd` visualmente, ou deixa unitário vazio até edição. |

## 5. Próximos Passos
1.  Fornecer o script SQL para execução manual.
2.  Atualizar a API.
3.  Atualizar o Frontend.
