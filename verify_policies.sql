-- =====================================================================
-- VERIFICAÇÃO: Schema facebook_ads_manager
-- =====================================================================
-- Execute este script no Supabase SQL Editor para verificar que
-- todas as tabelas, RLS e policies estão configuradas corretamente.
-- =====================================================================

-- 1. Listar todas as tabelas do schema facebook_ads_manager
SELECT
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns c
   WHERE c.table_schema = t.table_schema AND c.table_name = t.table_name) AS column_count
FROM information_schema.tables t
WHERE table_schema = 'facebook_ads_manager'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Esperado: 13 tabelas
-- profiles, business_managers, ad_accounts, campaigns, ad_sets, ads,
-- pixels, ad_pages, instagram_accounts, websites,
-- bulk_templates, bulk_executions, advideos_tasks


-- 2. Verificar RLS habilitado em todas as tabelas
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'facebook_ads_manager'
ORDER BY tablename;

-- Todas devem ter rowsecurity = true


-- 3. Listar todas as policies e verificar que são "authenticated_all"
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'facebook_ads_manager'
ORDER BY tablename, policyname;

-- Cada tabela deve ter uma policy "authenticated_all"
-- com roles = {authenticated}, cmd = ALL, qual = true, with_check = true


-- 4. Verificar que o schema está exposto na API
-- ATENÇÃO: Isso não pode ser verificado via SQL.
-- Verifique manualmente em:
--   Supabase Dashboard > Settings > API > Exposed schemas
-- O schema "facebook_ads_manager" deve aparecer na lista.


-- 5. Teste rápido: contar registros em cada tabela (como usuário autenticado)
SELECT 'profiles' AS tabela, COUNT(*) AS registros FROM facebook_ads_manager.profiles
UNION ALL SELECT 'business_managers', COUNT(*) FROM facebook_ads_manager.business_managers
UNION ALL SELECT 'ad_accounts', COUNT(*) FROM facebook_ads_manager.ad_accounts
UNION ALL SELECT 'campaigns', COUNT(*) FROM facebook_ads_manager.campaigns
UNION ALL SELECT 'ad_sets', COUNT(*) FROM facebook_ads_manager.ad_sets
UNION ALL SELECT 'ads', COUNT(*) FROM facebook_ads_manager.ads
UNION ALL SELECT 'pixels', COUNT(*) FROM facebook_ads_manager.pixels
UNION ALL SELECT 'ad_pages', COUNT(*) FROM facebook_ads_manager.ad_pages
UNION ALL SELECT 'instagram_accounts', COUNT(*) FROM facebook_ads_manager.instagram_accounts
UNION ALL SELECT 'websites', COUNT(*) FROM facebook_ads_manager.websites
UNION ALL SELECT 'bulk_templates', COUNT(*) FROM facebook_ads_manager.bulk_templates
UNION ALL SELECT 'bulk_executions', COUNT(*) FROM facebook_ads_manager.bulk_executions
UNION ALL SELECT 'advideos_tasks', COUNT(*) FROM facebook_ads_manager.advideos_tasks
ORDER BY tabela;
