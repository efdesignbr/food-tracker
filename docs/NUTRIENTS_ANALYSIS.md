# 🥗 Análise Completa de Nutrientes - Food Tracker

**Data**: 18/10/2025
**Objetivo**: Definir lista completa de nutrientes para rastreamento
**Decisão**: Implementar AGORA antes de ter muitos dados

---

## 📊 Situação Atual

### Nutrientes JÁ Rastreados (7 + 1)

#### Tabela `nutrition_data` (refeições):
1. ✅ Calorias (kcal)
2. ✅ Proteínas (g)
3. ✅ Carboidratos (g)
4. ✅ Gorduras totais (g)
5. ✅ Fibras (g)
6. ✅ Sódio (mg)
7. ✅ Açúcares (g)

#### Tabela `food_bank` (banco de alimentos):
1-7. ✅ Todos acima
8. ✅ Gordura saturada (g) - **APENAS no food_bank**

---

## 🎯 Nutrientes que FALTAM (Importantes)

### Categoria: **MACRONUTRIENTES DETALHADOS**

#### 1. **Gordura Saturada** ⭐ PRIORIDADE MÁXIMA
- **Por quê**: Relacionada a doenças cardiovasculares
- **Recomendação OMS**: < 10% das calorias totais
- **Unidade**: gramas (g)
- **Status**: Existe no food_bank, falta em nutrition_data
- **Importância**: 🔴 CRÍTICA

#### 2. **Gordura Trans**
- **Por quê**: Altamente prejudicial, deve ser evitada
- **Recomendação OMS**: < 1% das calorias (ou zero)
- **Unidade**: gramas (g)
- **Importância**: 🔴 CRÍTICA

#### 3. **Gordura Monoinsaturada**
- **Por quê**: "Gordura boa" - benéfica para saúde
- **Fontes**: Azeite, abacate, oleaginosas
- **Unidade**: gramas (g)
- **Importância**: 🟡 MÉDIA

#### 4. **Gordura Polinsaturada**
- **Por quê**: Inclui ômega-3 e ômega-6 essenciais
- **Fontes**: Peixes, sementes, óleos vegetais
- **Unidade**: gramas (g)
- **Importância**: 🟡 MÉDIA

#### 5. **Colesterol**
- **Por quê**: Importante para quem tem problemas cardiovasculares
- **Recomendação**: < 300mg/dia (média)
- **Unidade**: miligramas (mg)
- **Importância**: 🟠 ALTA

---

### Categoria: **MICRONUTRIENTES - MINERAIS**

#### 6. **Cálcio** ⭐ MUITO IMPORTANTE
- **Por quê**: Saúde óssea, função muscular
- **Recomendação**: 1000-1200mg/dia
- **Unidade**: miligramas (mg)
- **Fontes**: Leite, queijo, vegetais verde-escuros
- **Importância**: 🔴 CRÍTICA

#### 7. **Ferro**
- **Por quê**: Transporte de oxigênio, anemia
- **Recomendação**: 8mg (homens), 18mg (mulheres)
- **Unidade**: miligramas (mg)
- **Fontes**: Carne vermelha, feijão, espinafre
- **Importância**: 🔴 CRÍTICA

#### 8. **Potássio**
- **Por quê**: Pressão arterial, função cardíaca
- **Recomendação**: 3500-4700mg/dia
- **Unidade**: miligramas (mg)
- **Relação**: Balanceia o sódio (já rastreado)
- **Importância**: 🔴 CRÍTICA

#### 9. **Magnésio**
- **Por quê**: 300+ funções no corpo, sono, músculos
- **Recomendação**: 400mg/dia
- **Unidade**: miligramas (mg)
- **Importância**: 🟠 ALTA

#### 10. **Zinco**
- **Por quê**: Sistema imunológico, cicatrização
- **Recomendação**: 8-11mg/dia
- **Unidade**: miligramas (mg)
- **Importância**: 🟡 MÉDIA

#### 11. **Fósforo**
- **Por quê**: Saúde óssea (junto com cálcio)
- **Recomendação**: 700mg/dia
- **Unidade**: miligramas (mg)
- **Importância**: 🟡 MÉDIA

---

### Categoria: **MICRONUTRIENTES - VITAMINAS**

#### 12. **Vitamina A**
- **Por quê**: Visão, pele, sistema imunológico
- **Recomendação**: 900mcg/dia (homens), 700mcg (mulheres)
- **Unidade**: microgramas (mcg) ou UI
- **Importância**: 🟠 ALTA

#### 13. **Vitamina C**
- **Por quê**: Antioxidante, sistema imunológico
- **Recomendação**: 90mg/dia
- **Unidade**: miligramas (mg)
- **Importância**: 🟠 ALTA

#### 14. **Vitamina D**
- **Por quê**: Absorção de cálcio, saúde óssea
- **Recomendação**: 600-800 UI/dia
- **Unidade**: UI (International Units) ou mcg
- **Importância**: 🔴 CRÍTICA (especialmente no Brasil)

#### 15. **Vitamina E**
- **Por quê**: Antioxidante
- **Recomendação**: 15mg/dia
- **Unidade**: miligramas (mg)
- **Importância**: 🟡 MÉDIA

#### 16. **Vitamina K**
- **Por quê**: Coagulação sanguínea
- **Recomendação**: 120mcg/dia
- **Unidade**: microgramas (mcg)
- **Importância**: 🟡 MÉDIA

#### 17. **Vitamina B1 (Tiamina)**
- **Por quê**: Metabolismo energético
- **Recomendação**: 1.2mg/dia
- **Unidade**: miligramas (mg)
- **Importância**: 🟡 BAIXA

#### 18. **Vitamina B2 (Riboflavina)**
- **Por quê**: Metabolismo energético
- **Recomendação**: 1.3mg/dia
- **Unidade**: miligramas (mg)
- **Importância**: 🟡 BAIXA

#### 19. **Vitamina B3 (Niacina)**
- **Por quê**: Metabolismo, saúde da pele
- **Recomendação**: 16mg/dia
- **Unidade**: miligramas (mg)
- **Importância**: 🟡 BAIXA

#### 20. **Vitamina B6**
- **Por quê**: Metabolismo de proteínas
- **Recomendação**: 1.3-1.7mg/dia
- **Unidade**: miligramas (mg)
- **Importância**: 🟡 MÉDIA

#### 21. **Vitamina B12**
- **Por quê**: Formação de células vermelhas, sistema nervoso
- **Recomendação**: 2.4mcg/dia
- **Unidade**: microgramas (mcg)
- **Importância**: 🟠 ALTA (especialmente veganos)

#### 22. **Ácido Fólico (B9)**
- **Por quê**: DNA, gravidez
- **Recomendação**: 400mcg/dia
- **Unidade**: microgramas (mcg)
- **Importância**: 🔴 CRÍTICA (mulheres em idade fértil)

---

## 🎯 RECOMENDAÇÃO: Lista Priorizada

### Tier 1: **ESSENCIAIS** (Adicionar AGORA)
Nutrientes que **TODOS** devem rastrear:

1. ✅ **Gordura Saturada** (g) - JÁ planejado
2. ✅ **Gordura Trans** (g) - Crítica para saúde
3. ✅ **Cálcio** (mg) - Saúde óssea
4. ✅ **Ferro** (mg) - Anemia é comum
5. ✅ **Potássio** (mg) - Pressão arterial
6. ✅ **Vitamina D** (mcg ou UI) - Deficiência comum
7. ✅ **Colesterol** (mg) - Saúde cardiovascular

**Total: 7 novos campos** (todos CRÍTICOS)

---

### Tier 2: **IMPORTANTES** (Adicionar logo depois)
Nutrientes importantes, mas menos urgentes:

8. **Magnésio** (mg)
9. **Vitamina A** (mcg)
10. **Vitamina C** (mg)
11. **Vitamina B12** (mcg)
12. **Ácido Fólico** (mcg)

**Total: 5 campos**

---

### Tier 3: **COMPLEMENTARES** (Futuro)
Bom ter, mas não urgente:

13. **Gordura Monoinsaturada** (g)
14. **Gordura Polinsaturada** (g)
15. **Zinco** (mg)
16. **Fósforo** (mg)
17. **Vitamina E** (mg)
18. **Vitamina K** (mcg)
19. Vitaminas B (1, 2, 3, 6)

---

## 📋 PROPOSTA FINAL

### Implementação Sugerida: **Tier 1 (7 campos)**

**Justificativa**:
- ✅ São os mais pedidos em relatórios nutricionais
- ✅ Relacionados a problemas de saúde comuns
- ✅ IA consegue extrair de fotos/rótulos
- ✅ Não sobrecarrega a interface
- ✅ Fácil de expandir depois (Tier 2/3)

---

## 🗄️ Impacto no Banco de Dados

### **Tabelas afetadas**: 2

#### 1. `nutrition_data` (refeições)
**Colunas a adicionar**: 7
```sql
ALTER TABLE nutrition_data
ADD COLUMN saturated_fat_g NUMERIC(10,2) NULL,
ADD COLUMN trans_fat_g NUMERIC(10,2) NULL,
ADD COLUMN calcium_mg NUMERIC(10,2) NULL,
ADD COLUMN iron_mg NUMERIC(10,2) NULL,
ADD COLUMN potassium_mg NUMERIC(10,2) NULL,
ADD COLUMN vitamin_d_mcg NUMERIC(10,2) NULL,
ADD COLUMN cholesterol_mg NUMERIC(10,2) NULL;
```

#### 2. `food_bank` (banco de alimentos)
**Colunas a adicionar**: 6 (saturated_fat já existe)
```sql
ALTER TABLE food_bank
ADD COLUMN trans_fat NUMERIC(10,2) NULL,
ADD COLUMN calcium NUMERIC(10,2) NULL,
ADD COLUMN iron NUMERIC(10,2) NULL,
ADD COLUMN potassium NUMERIC(10,2) NULL,
ADD COLUMN vitamin_d NUMERIC(10,2) NULL,
ADD COLUMN cholesterol NUMERIC(10,2) NULL;
```

---

## 🎨 Impacto na Interface

### `/capture` (Captura de Refeição)
**Campos atuais**: 7 editáveis
**Campos novos**: +7 = **14 campos totais**

**Layout sugerido**:
```
┌─────────────────────────────────────────────────┐
│ MACRONUTRIENTES PRINCIPAIS (4 campos)           │
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐            │
│ │ Cal. │ │ Prot.│ │ Carb.│ │Gord. │            │
│ └──────┘ └──────┘ └──────┘ └──────┘            │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ GORDURAS DETALHADAS (3 campos)                  │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐         │
│ │ Saturada │ │  Trans   │ │Colesterol│         │
│ └──────────┘ └──────────┘ └──────────┘         │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ CARBOIDRATOS E FIBRAS (2 campos)                │
│ ┌──────────┐ ┌──────────┐                       │
│ │  Fibras  │ │ Açúcares │                       │
│ └──────────┘ └──────────┘                       │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ MINERAIS (3 campos)                              │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐         │
│ │  Cálcio  │ │  Ferro   │ │ Potássio │         │
│ └──────────┘ └──────────┘ └──────────┘         │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ VITAMINAS (2 campos)                             │
│ ┌──────────┐ ┌──────────┐                       │
│ │  Sódio   │ │Vitamina D│                       │
│ └──────────┘ └──────────┘                       │
└─────────────────────────────────────────────────┘
```

**Organização por categorias** deixa mais limpo e navegável!

---

### `/meus-alimentos` (Banco de Alimentos)
Mesma estrutura, mesmos campos.

---

## 🤖 Impacto na IA

### Capacidade do Gemini

**Gemini consegue extrair**:
- ✅ Gorduras (saturada, trans) - **SIM** (rótulos têm)
- ✅ Cálcio, Ferro, Potássio - **SIM** (rótulos completos têm)
- ✅ Vitamina D - **SIM** (rótulos fortificados)
- ✅ Colesterol - **SIM** (rótulos têm)

**Limitação**: Fotos de refeições caseiras
- ⚠️ IA pode **estimar** valores aproximados
- ⚠️ Acurácia menor que para calorias/macros
- ✅ Usuário pode editar manualmente

---

## ⚠️ Riscos e Mitigações

### Risco 1: Interface muito poluída
**Mitigação**:
- Agrupar por categorias (seções)
- Usar tabs/accordion (colapsar seções)
- Tornar campos OPCIONAIS (não obrigatórios)

### Risco 2: IA não conseguir preencher tudo
**Mitigação**:
- Campos são NULLABLE
- Campos são OPTIONAL no TypeScript
- IA preenche o que conseguir
- Usuário completa manualmente se quiser

### Risco 3: Muito trabalho manual
**Mitigação**:
- Banco de alimentos facilita (cadastra 1x, usa N vezes)
- IA analisa rótulos completos
- Valores padrão razoáveis

### Risco 4: Performance
**Mitigação**:
- Campos NULLABLE não afetam queries antigas
- Índices não necessários (campos numéricos)
- Banco aguenta tranquilamente

---

## 💰 Custo vs. Benefício

### Benefícios:
- ✅ **Sistema completo e profissional**
- ✅ Dados valiosos para saúde
- ✅ Diferencial competitivo
- ✅ Relatórios mais ricos
- ✅ Melhor tracking de deficiências
- ✅ IA consegue analisar melhor

### Custos:
- ⚠️ 1-2h de desenvolvimento (migração + código)
- ⚠️ Interface um pouco mais complexa
- ⚠️ Mais campos para usuário revisar (opcional)

**VEREDICTO: VALE MUITO A PENA!** 🎯

---

## 🚀 RECOMENDAÇÃO FINAL

### Implementar AGORA (junto com saturated_fat):

**Tier 1 - 7 Nutrientes Essenciais**:

1. ✅ **Gordura Saturada** (saturated_fat_g)
2. ✅ **Gordura Trans** (trans_fat_g)
3. ✅ **Colesterol** (cholesterol_mg)
4. ✅ **Cálcio** (calcium_mg)
5. ✅ **Ferro** (iron_mg)
6. ✅ **Potássio** (potassium_mg)
7. ✅ **Vitamina D** (vitamin_d_mcg)

### Motivos:
1. **É o momento certo**: Pouco dado no sistema ainda
2. **Uma migração só**: Faz tudo de uma vez
3. **Sistema completo**: Nível de app profissional
4. **Fácil expansão**: Se quiser Tier 2 depois, já tem estrutura

### Plano atualizado:
Atualizar `PLAN_ADD_SATURATED_FAT.md` para incluir todos os 7 nutrientes.

---

**Quer prosseguir com os 7 nutrientes do Tier 1?** 🎯
