# Custos e Planos - Food Tracker

## Modelo de IA Utilizado

**Gemini 2.5 Flash-Lite** (recomendado para produção)
- Input: $0.10 / 1M tokens
- Output: $0.40 / 1M tokens
- Estável, com suporte garantido
- 1M tokens de contexto
- Multimodal (texto + imagem)

---

## Consumo de Tokens por Funcionalidade

| Funcionalidade | Input (tokens) | Output (tokens) | Total |
|----------------|----------------|-----------------|-------|
| Análise de foto | ~750 (prompt+img) | ~500 | ~1.250 |
| Análise de texto | ~500 | ~500 | ~1.000 |
| Relatório IA | ~2.000 | ~800 | ~2.800 |
| Coach IA | ~5.000 | ~1.500 | ~6.500 |

---

## Estimativa de Uso - Usuário Ativo

| Funcionalidade | Uso/Mês | Tokens/Mês |
|----------------|---------|------------|
| Análise de foto | 150 (5/dia) | 187.500 |
| Análise de texto | 150 (5/dia) | 150.000 |
| Relatório IA | 3 | 8.400 |
| Coach IA | 3 | 19.500 |
| **Total** | - | **365.400** |

### Custo por Usuário Ativo/Mês

```
Input:  250.000 ÷ 1.000.000 × $0.10 = $0.025
Output: 115.000 ÷ 1.000.000 × $0.40 = $0.046
────────────────────────────────────────────
Total: $0.071 (~R$ 0,43)
```

---

## Custos Fixos Mensais

| Item | USD | BRL (câmbio 6,00) |
|------|-----|-------------------|
| Vercel Pro | $25 | R$ 150 |
| Supabase Pro | $25 | R$ 150 |
| **Total Fixo** | **$50** | **R$ 300** |

---

## Planos

### Plano FREE
- **Uso ilimitado**
- Rewarded ads antes de cada:
  - Análise de foto
  - Análise de texto
  - Relatório IA
  - Coach IA
- Histórico de 30 dias

### Plano PREMIUM (R$ 4,99/mês no plano anual | R$ 14,90 mensal)
- **Sem anúncios**
- **150 análises de foto/mês** (5/dia)
- **150 análises de texto/mês** (5/dia)
- **3 relatórios IA/mês**
- **3 coach IA/mês**
- Histórico ilimitado
- Suporte prioritário

---

## Receita e Margem (Plano Premium)

| Item | Valor |
|------|-------|
| Preço mensal (anual) | R$ 4,99 |
| Comissão lojas (30%)* | - R$ 1,50 |
| **Receita líquida** | **R$ 3,49** |
| Custo API (usuário ativo) | - R$ 0,43 |
| **Margem** | **R$ 3,06 (~61%)** |

*Apple/Google cobram 30% no 1º ano, 15% após.*

---

## Breakeven (Ponto de Equilíbrio)

```
Usuários = Custos Fixos ÷ Margem por Usuário
Usuários = R$ 300 ÷ R$ 3,06
Usuários = ~100 usuários pagantes
```

---

## Projeção de Lucro

| Usuários | Receita | Custos | Lucro |
|----------|---------|--------|-------|
| 50 | R$ 175 | R$ 322 | -R$ 147 |
| **100** | R$ 349 | R$ 343 | **R$ 6** (breakeven) |
| 150 | R$ 524 | R$ 365 | +R$ 159 |
| 300 | R$ 1.047 | R$ 429 | +R$ 618 |
| 500 | R$ 1.745 | R$ 515 | +R$ 1.230 |
| 1.000 | R$ 3.490 | R$ 730 | +R$ 2.760 |
| 5.000 | R$ 17.450 | R$ 2.450 | +R$ 15.000 |

---

## Notas

1. **TACO economiza API**: Alimentos encontrados na tabela TACO não chamam IA para estimativa nutricional
2. **Usuário típico**: Consome 50-70% do usuário ativo (~R$ 0,25-0,30/mês)
3. **Escalabilidade**: Custos fixos diluem rapidamente com crescimento
4. **Comissão reduzida**: Após 1 ano de assinatura, lojas cobram 15% (margem melhora)

---

*Última atualização: Janeiro/2025*
