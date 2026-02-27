-- =====================================================================
-- BULK EXECUTIONS — Rastreamento de criações em massa
-- =====================================================================
-- Execute no Supabase SQL Editor após o schema principal.
-- =====================================================================

CREATE TABLE facebook_ads_manager.bulk_executions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'pending',         -- pending, completed, error
  total_campaigns INT DEFAULT 0,
  total_adsets INT DEFAULT 0,
  total_ads INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE facebook_ads_manager.bulk_executions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own executions" ON facebook_ads_manager.bulk_executions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own executions" ON facebook_ads_manager.bulk_executions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own executions" ON facebook_ads_manager.bulk_executions
  FOR UPDATE USING (auth.uid() = user_id);
