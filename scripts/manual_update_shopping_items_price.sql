-- IMPORTANTE: Execute este script manualmente no seu banco de dados PostgreSQL.
-- Este script adiciona a coluna 'unit_price' na tabela 'shopping_items' para permitir o cálculo detalhado de preços.

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'shopping_items'
        AND column_name = 'unit_price'
    ) THEN
        ALTER TABLE shopping_items ADD COLUMN unit_price DECIMAL(10,2);
    END IF;
END $$;
