-- =====================================================================
-- FIX: Permissões do schema facebook_ads_manager
-- =====================================================================
-- O PostgREST retorna "permission denied for schema facebook_ads_manager"
-- porque os roles anon/authenticated não têm USAGE no schema.
--
-- Execute este script no Supabase SQL Editor para corrigir.
-- =====================================================================

-- 1. Dar permissão de USAGE no schema (obrigatório para PostgREST)
GRANT USAGE ON SCHEMA facebook_ads_manager TO anon, authenticated, service_role;

-- 2. Dar permissão em todas as tabelas existentes
GRANT ALL ON ALL TABLES IN SCHEMA facebook_ads_manager TO anon, authenticated, service_role;

-- 3. Dar permissão em todas as sequences (para IDENTITY columns)
GRANT ALL ON ALL SEQUENCES IN SCHEMA facebook_ads_manager TO anon, authenticated, service_role;

-- 4. Garantir que futuras tabelas também tenham permissão
ALTER DEFAULT PRIVILEGES IN SCHEMA facebook_ads_manager
  GRANT ALL ON TABLES TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA facebook_ads_manager
  GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;

-- =====================================================================
-- IMPORTANTE: Após rodar este script, verifique também no Supabase:
-- Settings > API > "Exposed schemas" → facebook_ads_manager deve aparecer
-- Se não aparecer, adicione manualmente.
-- =====================================================================
