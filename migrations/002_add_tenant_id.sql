-- Ajuste os nomes de tabela conforme seu schema atual
ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS meals ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS food_items ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS nutrition_data ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_meals_tenant_consumed ON meals(tenant_id, consumed_at DESC);
CREATE INDEX IF NOT EXISTS idx_food_items_tenant ON food_items(tenant_id);
CREATE INDEX IF NOT EXISTS idx_nutrition_tenant ON nutrition_data(tenant_id);

