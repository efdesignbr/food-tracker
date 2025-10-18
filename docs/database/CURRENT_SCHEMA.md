# 🗄️ DATABASE SCHEMA - Food Tracker

**Gerado automaticamente em**: 18/10/2025, 13:51:45

**⚠️ IMPORTANTE**: Este arquivo é gerado automaticamente. Sempre consulte este arquivo antes de criar migrações!

---

## 📊 Resumo

- **Total de tabelas**: 11
- **Total de colunas**: 101
- **Total de foreign keys**: 17
- **Total de índices**: 42
- **Total de políticas RLS**: 0

---

## 📋 Tabelas

### `bowel_movements`

#### Colunas

| Coluna | Tipo | Nullable | Default | Tipo Real |
|--------|------|----------|---------|----------|
| `id` | `uuid` | ❌ | `uuid_generate_v4()` | `uuid` |
| `user_id` | `uuid` | ❌ | `-` | `uuid` |
| `tenant_id` | `uuid` | ❌ | `-` | `uuid` |
| `occurred_at` | `timestamp without time zone` | ❌ | `now()` | `timestamp` |
| `bristol_type` | `integer` | ❌ | `-` | `int4` |
| `notes` | `text` | ✅ | `-` | `text` |
| `created_at` | `timestamp without time zone` | ✅ | `now()` | `timestamp` |
| `updated_at` | `timestamp without time zone` | ✅ | `now()` | `timestamp` |

#### Foreign Keys

| Coluna | Referencia | Constraint |
|--------|------------|------------|
| `tenant_id` | `tenants.id` | `bowel_movements_tenant_id_fkey` |
| `user_id` | `users.id` | `bowel_movements_user_id_fkey` |

#### Índices

| Nome | Coluna | Único |
|------|--------|-------|
| `idx_bowel_movements_occurred_at` | `occurred_at` | ❌ |
| `idx_bowel_movements_tenant_id` | `tenant_id` | ❌ |
| `idx_bowel_movements_user_date` | `user_id` | ❌ |
| `idx_bowel_movements_user_id` | `user_id` | ❌ |
| `idx_bowel_movements_user_occurred` | `occurred_at` | ❌ |
| `idx_bowel_movements_user_occurred` | `user_id` | ❌ |

---

### `food_bank`

#### Colunas

| Coluna | Tipo | Nullable | Default | Tipo Real |
|--------|------|----------|---------|----------|
| `id` | `uuid` | ❌ | `uuid_generate_v4()` | `uuid` |
| `tenant_id` | `uuid` | ❌ | `-` | `uuid` |
| `user_id` | `uuid` | ❌ | `-` | `uuid` |
| `name` | `character varying` | ❌ | `-` | `varchar` |
| `brand` | `character varying` | ✅ | `-` | `varchar` |
| `serving_size` | `character varying` | ✅ | `-` | `varchar` |
| `photo_url` | `text` | ✅ | `-` | `text` |
| `calories` | `numeric` | ✅ | `-` | `numeric` |
| `protein` | `numeric` | ✅ | `-` | `numeric` |
| `carbs` | `numeric` | ✅ | `-` | `numeric` |
| `fat` | `numeric` | ✅ | `-` | `numeric` |
| `fiber` | `numeric` | ✅ | `-` | `numeric` |
| `sodium` | `numeric` | ✅ | `-` | `numeric` |
| `sugar` | `numeric` | ✅ | `-` | `numeric` |
| `saturated_fat` | `numeric` | ✅ | `-` | `numeric` |
| `usage_count` | `integer` | ✅ | `0` | `int4` |
| `last_used_at` | `timestamp without time zone` | ✅ | `-` | `timestamp` |
| `source` | `character varying` | ✅ | `'manual'::character varying` | `varchar` |
| `created_at` | `timestamp without time zone` | ✅ | `now()` | `timestamp` |
| `updated_at` | `timestamp without time zone` | ✅ | `now()` | `timestamp` |

#### Foreign Keys

| Coluna | Referencia | Constraint |
|--------|------------|------------|
| `tenant_id` | `tenants.id` | `food_bank_tenant_id_fkey` |
| `user_id` | `users.id` | `food_bank_user_id_fkey` |

#### Índices

| Nome | Coluna | Único |
|------|--------|-------|
| `idx_food_bank_name` | `name` | ❌ |
| `idx_food_bank_tenant_id` | `tenant_id` | ❌ |
| `idx_food_bank_usage_count` | `usage_count` | ❌ |
| `idx_food_bank_user_id` | `user_id` | ❌ |

---

### `food_items`

#### Colunas

| Coluna | Tipo | Nullable | Default | Tipo Real |
|--------|------|----------|---------|----------|
| `id` | `uuid` | ❌ | `uuid_generate_v4()` | `uuid` |
| `meal_id` | `uuid` | ❌ | `-` | `uuid` |
| `name` | `character varying` | ❌ | `-` | `varchar` |
| `quantity` | `numeric` | ❌ | `-` | `numeric` |
| `unit` | `character varying` | ❌ | `-` | `varchar` |
| `confidence_score` | `numeric` | ✅ | `-` | `numeric` |
| `created_at` | `timestamp without time zone` | ❌ | `now()` | `timestamp` |
| `tenant_id` | `uuid` | ✅ | `-` | `uuid` |

#### Foreign Keys

| Coluna | Referencia | Constraint |
|--------|------------|------------|
| `meal_id` | `meals.id` | `food_items_meal_id_fkey` |
| `tenant_id` | `tenants.id` | `food_items_tenant_id_fkey` |

#### Índices

| Nome | Coluna | Único |
|------|--------|-------|
| `idx_food_items_meal_id` | `meal_id` | ❌ |
| `idx_food_items_tenant` | `tenant_id` | ❌ |

---

### `meals`

#### Colunas

| Coluna | Tipo | Nullable | Default | Tipo Real |
|--------|------|----------|---------|----------|
| `id` | `uuid` | ❌ | `uuid_generate_v4()` | `uuid` |
| `user_id` | `uuid` | ❌ | `-` | `uuid` |
| `image_url` | `character varying` | ✅ | `-` | `varchar` |
| `meal_type` | `character varying` | ❌ | `-` | `varchar` |
| `consumed_at` | `timestamp without time zone` | ❌ | `-` | `timestamp` |
| `status` | `character varying` | ❌ | `'approved'::character varying` | `varchar` |
| `notes` | `text` | ✅ | `-` | `text` |
| `created_at` | `timestamp without time zone` | ❌ | `now()` | `timestamp` |
| `updated_at` | `timestamp without time zone` | ❌ | `now()` | `timestamp` |
| `tenant_id` | `uuid` | ✅ | `-` | `uuid` |
| `location_type` | `character varying` | ✅ | `-` | `varchar` |
| `restaurant_id` | `uuid` | ✅ | `-` | `uuid` |

#### Foreign Keys

| Coluna | Referencia | Constraint |
|--------|------------|------------|
| `restaurant_id` | `restaurants.id` | `meals_restaurant_id_fkey` |
| `tenant_id` | `tenants.id` | `meals_tenant_id_fkey` |
| `user_id` | `users.id` | `meals_user_id_fkey` |

#### Índices

| Nome | Coluna | Único |
|------|--------|-------|
| `idx_meals_consumed_date` | `user_id` | ❌ |
| `idx_meals_location_type` | `location_type` | ❌ |
| `idx_meals_restaurant_id` | `restaurant_id` | ❌ |
| `idx_meals_tenant_consumed` | `tenant_id` | ❌ |
| `idx_meals_tenant_consumed` | `consumed_at` | ❌ |
| `idx_meals_user_consumed` | `consumed_at` | ❌ |
| `idx_meals_user_consumed` | `user_id` | ❌ |

---

### `nutrition_data`

#### Colunas

| Coluna | Tipo | Nullable | Default | Tipo Real |
|--------|------|----------|---------|----------|
| `id` | `uuid` | ❌ | `uuid_generate_v4()` | `uuid` |
| `food_item_id` | `uuid` | ❌ | `-` | `uuid` |
| `calories` | `numeric` | ❌ | `0` | `numeric` |
| `protein_g` | `numeric` | ❌ | `0` | `numeric` |
| `carbs_g` | `numeric` | ❌ | `0` | `numeric` |
| `fat_g` | `numeric` | ❌ | `0` | `numeric` |
| `fiber_g` | `numeric` | ❌ | `0` | `numeric` |
| `sodium_mg` | `numeric` | ✅ | `-` | `numeric` |
| `sugar_g` | `numeric` | ✅ | `-` | `numeric` |
| `created_at` | `timestamp without time zone` | ❌ | `now()` | `timestamp` |
| `tenant_id` | `uuid` | ✅ | `-` | `uuid` |

#### Foreign Keys

| Coluna | Referencia | Constraint |
|--------|------------|------------|
| `food_item_id` | `food_items.id` | `nutrition_data_food_item_id_fkey` |
| `tenant_id` | `tenants.id` | `nutrition_data_tenant_id_fkey` |

#### Índices

| Nome | Coluna | Único |
|------|--------|-------|
| `idx_nutrition_data_food_item_id` | `food_item_id` | ❌ |
| `idx_nutrition_tenant` | `tenant_id` | ❌ |
| `nutrition_data_food_item_unique` | `food_item_id` | ✅ |

---

### `restaurants`

#### Colunas

| Coluna | Tipo | Nullable | Default | Tipo Real |
|--------|------|----------|---------|----------|
| `id` | `uuid` | ❌ | `uuid_generate_v4()` | `uuid` |
| `tenant_id` | `uuid` | ❌ | `-` | `uuid` |
| `name` | `character varying` | ❌ | `-` | `varchar` |
| `address` | `text` | ✅ | `-` | `text` |
| `created_at` | `timestamp without time zone` | ✅ | `now()` | `timestamp` |
| `updated_at` | `timestamp without time zone` | ✅ | `now()` | `timestamp` |

#### Foreign Keys

| Coluna | Referencia | Constraint |
|--------|------------|------------|
| `tenant_id` | `tenants.id` | `restaurants_tenant_id_fkey` |

#### Índices

| Nome | Coluna | Único |
|------|--------|-------|
| `idx_restaurants_name` | `name` | ❌ |
| `idx_restaurants_tenant_id` | `tenant_id` | ❌ |

---

### `schema_migrations`

#### Colunas

| Coluna | Tipo | Nullable | Default | Tipo Real |
|--------|------|----------|---------|----------|
| `name` | `text` | ❌ | `-` | `text` |
| `applied_at` | `timestamp without time zone` | ❌ | `now()` | `timestamp` |

---

### `tenants`

#### Colunas

| Coluna | Tipo | Nullable | Default | Tipo Real |
|--------|------|----------|---------|----------|
| `id` | `uuid` | ❌ | `uuid_generate_v4()` | `uuid` |
| `slug` | `character varying` | ❌ | `-` | `varchar` |
| `name` | `character varying` | ❌ | `-` | `varchar` |
| `created_at` | `timestamp without time zone` | ❌ | `now()` | `timestamp` |

#### Índices

| Nome | Coluna | Único |
|------|--------|-------|
| `tenants_slug_key` | `slug` | ✅ |

---

### `users`

#### Colunas

| Coluna | Tipo | Nullable | Default | Tipo Real |
|--------|------|----------|---------|----------|
| `id` | `uuid` | ❌ | `uuid_generate_v4()` | `uuid` |
| `email` | `character varying` | ❌ | `-` | `varchar` |
| `name` | `character varying` | ❌ | `-` | `varchar` |
| `created_at` | `timestamp without time zone` | ❌ | `now()` | `timestamp` |
| `updated_at` | `timestamp without time zone` | ❌ | `now()` | `timestamp` |
| `tenant_id` | `uuid` | ✅ | `-` | `uuid` |
| `password_hash` | `text` | ✅ | `-` | `text` |
| `role` | `character varying` | ❌ | `'member'::character varying` | `varchar` |
| `phone` | `character varying` | ✅ | `-` | `varchar` |
| `goal_calories` | `integer` | ✅ | `2000` | `int4` |
| `goal_protein_g` | `integer` | ✅ | `150` | `int4` |
| `goal_carbs_g` | `integer` | ✅ | `250` | `int4` |
| `goal_fat_g` | `integer` | ✅ | `65` | `int4` |
| `goal_water_ml` | `integer` | ✅ | `2000` | `int4` |

#### Foreign Keys

| Coluna | Referencia | Constraint |
|--------|------------|------------|
| `tenant_id` | `tenants.id` | `users_tenant_id_fkey` |

#### Índices

| Nome | Coluna | Único |
|------|--------|-------|
| `idx_users_tenant` | `tenant_id` | ❌ |
| `uniq_users_tenant_email` | `email` | ✅ |
| `uniq_users_tenant_email` | `tenant_id` | ✅ |
| `users_email_key` | `email` | ✅ |

---

### `water_intake`

#### Colunas

| Coluna | Tipo | Nullable | Default | Tipo Real |
|--------|------|----------|---------|----------|
| `id` | `uuid` | ❌ | `uuid_generate_v4()` | `uuid` |
| `user_id` | `uuid` | ❌ | `-` | `uuid` |
| `tenant_id` | `uuid` | ❌ | `-` | `uuid` |
| `amount_ml` | `integer` | ❌ | `250` | `int4` |
| `consumed_at` | `timestamp without time zone` | ❌ | `now()` | `timestamp` |
| `notes` | `text` | ✅ | `-` | `text` |
| `created_at` | `timestamp without time zone` | ✅ | `now()` | `timestamp` |
| `updated_at` | `timestamp without time zone` | ✅ | `now()` | `timestamp` |

#### Foreign Keys

| Coluna | Referencia | Constraint |
|--------|------------|------------|
| `tenant_id` | `tenants.id` | `water_intake_tenant_id_fkey` |
| `user_id` | `users.id` | `water_intake_user_id_fkey` |

#### Índices

| Nome | Coluna | Único |
|------|--------|-------|
| `idx_water_intake_consumed_at` | `consumed_at` | ❌ |
| `idx_water_intake_tenant_id` | `tenant_id` | ❌ |
| `idx_water_intake_user_consumed` | `user_id` | ❌ |
| `idx_water_intake_user_consumed` | `consumed_at` | ❌ |
| `idx_water_intake_user_date` | `user_id` | ❌ |
| `idx_water_intake_user_id` | `user_id` | ❌ |

---

### `weight_logs`

#### Colunas

| Coluna | Tipo | Nullable | Default | Tipo Real |
|--------|------|----------|---------|----------|
| `id` | `uuid` | ❌ | `uuid_generate_v4()` | `uuid` |
| `tenant_id` | `uuid` | ❌ | `-` | `uuid` |
| `user_id` | `uuid` | ❌ | `-` | `uuid` |
| `weight` | `numeric` | ❌ | `-` | `numeric` |
| `log_date` | `date` | ❌ | `-` | `date` |
| `log_time` | `time without time zone` | ✅ | `CURRENT_TIME` | `time` |
| `notes` | `text` | ✅ | `-` | `text` |
| `created_at` | `timestamp without time zone` | ✅ | `now()` | `timestamp` |

#### Foreign Keys

| Coluna | Referencia | Constraint |
|--------|------------|------------|
| `tenant_id` | `tenants.id` | `weight_logs_tenant_id_fkey` |
| `user_id` | `users.id` | `weight_logs_user_id_fkey` |

#### Índices

| Nome | Coluna | Único |
|------|--------|-------|
| `idx_weight_logs_date` | `log_date` | ❌ |
| `idx_weight_logs_tenant_id` | `tenant_id` | ❌ |
| `idx_weight_logs_user_id` | `user_id` | ❌ |
| `weight_logs_user_id_log_date_log_time_tenant_id_key` | `user_id` | ✅ |
| `weight_logs_user_id_log_date_log_time_tenant_id_key` | `log_date` | ✅ |
| `weight_logs_user_id_log_date_log_time_tenant_id_key` | `tenant_id` | ✅ |
| `weight_logs_user_id_log_date_log_time_tenant_id_key` | `log_time` | ✅ |

---

