-- Drop all RLS policies and ensure RLS is disabled
-- This migration ensures no RLS interference with multi-tenant operations

-- Drop all existing policies
DROP POLICY IF EXISTS food_items_tenant_delete ON food_items;
DROP POLICY IF EXISTS food_items_tenant_insert ON food_items;
DROP POLICY IF EXISTS food_items_tenant_select ON food_items;
DROP POLICY IF EXISTS food_items_tenant_update ON food_items;

DROP POLICY IF EXISTS meals_tenant_delete ON meals;
DROP POLICY IF EXISTS meals_tenant_insert ON meals;
DROP POLICY IF EXISTS meals_tenant_select ON meals;
DROP POLICY IF EXISTS meals_tenant_update ON meals;

DROP POLICY IF EXISTS nutrition_tenant_delete ON nutrition_data;
DROP POLICY IF EXISTS nutrition_tenant_insert ON nutrition_data;
DROP POLICY IF EXISTS nutrition_tenant_select ON nutrition_data;
DROP POLICY IF EXISTS nutrition_tenant_update ON nutrition_data;

DROP POLICY IF EXISTS tenants_select_all ON tenants;

DROP POLICY IF EXISTS users_tenant_insert ON users;
DROP POLICY IF EXISTS users_tenant_select ON users;
DROP POLICY IF EXISTS users_tenant_update ON users;

-- Disable RLS on all tables
ALTER TABLE IF EXISTS tenants NO FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS users NO FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS meals NO FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS food_items NO FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS nutrition_data NO FORCE ROW LEVEL SECURITY;

ALTER TABLE IF EXISTS tenants DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS meals DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS food_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS nutrition_data DISABLE ROW LEVEL SECURITY;
