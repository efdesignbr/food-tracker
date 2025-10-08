-- Enable RLS and add tenant-based policies using session GUC 'app.tenant_id'

ALTER TABLE IF EXISTS tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS food_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS nutrition_data ENABLE ROW LEVEL SECURITY;

-- Tenants: allow read for resolving slug -> id
DROP POLICY IF EXISTS tenants_select_all ON tenants;
CREATE POLICY tenants_select_all ON tenants FOR SELECT USING (true);

-- Users: tenant-isolated read/write
DROP POLICY IF EXISTS users_tenant_select ON users;
CREATE POLICY users_tenant_select ON users FOR SELECT USING (
  tenant_id = current_setting('app.tenant_id', true)::uuid
);

DROP POLICY IF EXISTS users_tenant_insert ON users;
CREATE POLICY users_tenant_insert ON users FOR INSERT WITH CHECK (
  tenant_id = current_setting('app.tenant_id', true)::uuid
);

DROP POLICY IF EXISTS users_tenant_update ON users;
CREATE POLICY users_tenant_update ON users FOR UPDATE USING (
  tenant_id = current_setting('app.tenant_id', true)::uuid OR tenant_id IS NULL
) WITH CHECK (
  tenant_id = current_setting('app.tenant_id', true)::uuid
);

-- Meals: tenant-isolated full access
DROP POLICY IF EXISTS meals_tenant_select ON meals;
CREATE POLICY meals_tenant_select ON meals FOR SELECT USING (
  tenant_id = current_setting('app.tenant_id', true)::uuid
);

DROP POLICY IF EXISTS meals_tenant_insert ON meals;
CREATE POLICY meals_tenant_insert ON meals FOR INSERT WITH CHECK (
  tenant_id = current_setting('app.tenant_id', true)::uuid
);

DROP POLICY IF EXISTS meals_tenant_update ON meals;
CREATE POLICY meals_tenant_update ON meals FOR UPDATE USING (
  tenant_id = current_setting('app.tenant_id', true)::uuid OR tenant_id IS NULL
) WITH CHECK (
  tenant_id = current_setting('app.tenant_id', true)::uuid
);

DROP POLICY IF EXISTS meals_tenant_delete ON meals;
CREATE POLICY meals_tenant_delete ON meals FOR DELETE USING (
  tenant_id = current_setting('app.tenant_id', true)::uuid
);

-- Food items
DROP POLICY IF EXISTS food_items_tenant_select ON food_items;
CREATE POLICY food_items_tenant_select ON food_items FOR SELECT USING (
  tenant_id = current_setting('app.tenant_id', true)::uuid
);

DROP POLICY IF EXISTS food_items_tenant_insert ON food_items;
CREATE POLICY food_items_tenant_insert ON food_items FOR INSERT WITH CHECK (
  tenant_id = current_setting('app.tenant_id', true)::uuid
);

DROP POLICY IF EXISTS food_items_tenant_update ON food_items;
CREATE POLICY food_items_tenant_update ON food_items FOR UPDATE USING (
  tenant_id = current_setting('app.tenant_id', true)::uuid OR tenant_id IS NULL
) WITH CHECK (
  tenant_id = current_setting('app.tenant_id', true)::uuid
);

DROP POLICY IF EXISTS food_items_tenant_delete ON food_items;
CREATE POLICY food_items_tenant_delete ON food_items FOR DELETE USING (
  tenant_id = current_setting('app.tenant_id', true)::uuid
);

-- Nutrition data
DROP POLICY IF EXISTS nutrition_tenant_select ON nutrition_data;
CREATE POLICY nutrition_tenant_select ON nutrition_data FOR SELECT USING (
  tenant_id = current_setting('app.tenant_id', true)::uuid
);

DROP POLICY IF EXISTS nutrition_tenant_insert ON nutrition_data;
CREATE POLICY nutrition_tenant_insert ON nutrition_data FOR INSERT WITH CHECK (
  tenant_id = current_setting('app.tenant_id', true)::uuid
);

DROP POLICY IF EXISTS nutrition_tenant_update ON nutrition_data;
CREATE POLICY nutrition_tenant_update ON nutrition_data FOR UPDATE USING (
  tenant_id = current_setting('app.tenant_id', true)::uuid OR tenant_id IS NULL
) WITH CHECK (
  tenant_id = current_setting('app.tenant_id', true)::uuid
);

DROP POLICY IF EXISTS nutrition_tenant_delete ON nutrition_data;
CREATE POLICY nutrition_tenant_delete ON nutrition_data FOR DELETE USING (
  tenant_id = current_setting('app.tenant_id', true)::uuid
);
