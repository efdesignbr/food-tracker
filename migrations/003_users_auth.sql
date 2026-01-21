ALTER TABLE IF EXISTS users
  ADD COLUMN IF NOT EXISTS password_hash TEXT,
  ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'member' CHECK (role IN ('owner','admin','member'));

-- Ensure uniqueness per tenant
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'uniq_users_tenant_email'
  ) THEN
    EXECUTE 'CREATE UNIQUE INDEX uniq_users_tenant_email ON users(tenant_id, email)';
  END IF;
END$$;

