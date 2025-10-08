-- Disable RLS on users to avoid FK visibility issues during inserts into meals
ALTER TABLE IF EXISTS users NO FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;

