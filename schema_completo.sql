-- =====================================================================
-- CAMPAIGN CREATOR HUB — SCHEMA COMPLETO (Custom Schema)
-- =====================================================================
-- Execute este arquivo no Supabase SQL Editor.
-- Importante: Após rodar, habilite este schema em:
-- Settings > API > Exposed schemas no painel do Supabase.
-- =====================================================================

-- Criar Schema
CREATE SCHEMA IF NOT EXISTS "facebook-campaigns";

-- Extensão UUID (mantida no public ou no banco)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- =====================================================================
-- 1. PROFILES (Perfis do Facebook)
-- =====================================================================
CREATE TABLE "facebook-campaigns".profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  full_name TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE "facebook-campaigns".profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profiles" ON "facebook-campaigns".profiles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profiles" ON "facebook-campaigns".profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profiles" ON "facebook-campaigns".profiles
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own profiles" ON "facebook-campaigns".profiles
  FOR DELETE USING (auth.uid() = user_id);


-- =====================================================================
-- 2. BUSINESS MANAGERS
-- =====================================================================
CREATE TABLE "facebook-campaigns".business_managers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES "facebook-campaigns".profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  business_manager_id TEXT NOT NULL,     -- Facebook BM ID
  access_token TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE "facebook-campaigns".business_managers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own BMs" ON "facebook-campaigns".business_managers
  FOR SELECT USING (
    profile_id IN (SELECT id FROM "facebook-campaigns".profiles WHERE user_id = auth.uid())
  );
CREATE POLICY "Users can insert own BMs" ON "facebook-campaigns".business_managers
  FOR INSERT WITH CHECK (
    profile_id IN (SELECT id FROM "facebook-campaigns".profiles WHERE user_id = auth.uid())
  );
CREATE POLICY "Users can update own BMs" ON "facebook-campaigns".business_managers
  FOR UPDATE USING (
    profile_id IN (SELECT id FROM "facebook-campaigns".profiles WHERE user_id = auth.uid())
  );
CREATE POLICY "Users can delete own BMs" ON "facebook-campaigns".business_managers
  FOR DELETE USING (
    profile_id IN (SELECT id FROM "facebook-campaigns".profiles WHERE user_id = auth.uid())
  );


-- =====================================================================
-- 3. AD ACCOUNTS (Contas de Anúncio)
-- =====================================================================
CREATE TABLE "facebook-campaigns".ad_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_manager_id UUID REFERENCES "facebook-campaigns".business_managers(id),
  account_id TEXT NOT NULL,              -- Facebook Account ID (act_XXXXX)
  account_name TEXT NOT NULL,
  currency TEXT DEFAULT 'BRL',
  timezone_name TEXT DEFAULT 'America/Sao_Paulo',
  status TEXT DEFAULT 'active',          -- active, paused, disabled
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE "facebook-campaigns".ad_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own ad accounts" ON "facebook-campaigns".ad_accounts
  FOR SELECT USING (
    business_manager_id IN (
      SELECT bm.id FROM "facebook-campaigns".business_managers bm
      JOIN "facebook-campaigns".profiles p ON bm.profile_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can insert their own ad accounts" ON "facebook-campaigns".ad_accounts
  FOR INSERT WITH CHECK (
    business_manager_id IN (
      SELECT bm.id FROM "facebook-campaigns".business_managers bm
      JOIN "facebook-campaigns".profiles p ON bm.profile_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can update their own ad accounts" ON "facebook-campaigns".ad_accounts
  FOR UPDATE USING (
    business_manager_id IN (
      SELECT bm.id FROM "facebook-campaigns".business_managers bm
      JOIN "facebook-campaigns".profiles p ON bm.profile_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can delete their own ad accounts" ON "facebook-campaigns".ad_accounts
  FOR DELETE USING (
    business_manager_id IN (
      SELECT bm.id FROM "facebook-campaigns".business_managers bm
      JOIN "facebook-campaigns".profiles p ON bm.profile_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );


-- =====================================================================
-- 4. CAMPAIGNS (Campanhas)
-- =====================================================================
CREATE TABLE "facebook-campaigns".campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ad_account_id UUID REFERENCES "facebook-campaigns".ad_accounts(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  objective TEXT NOT NULL,               -- CONVERSIONS, LEAD_GENERATION, REACH, etc.
  status TEXT DEFAULT 'DRAFT',           -- DRAFT, PENDING, ACTIVE, PAUSED, ERROR
  daily_budget BIGINT,                   -- Orçamento diário em centavos
  lifetime_budget BIGINT,                -- Orçamento total em centavos
  bid_strategy TEXT DEFAULT 'LOWEST_COST_WITHOUT_CAP',
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  facebook_campaign_id TEXT,             -- ID retornado pelo Facebook
  sync_status TEXT DEFAULT 'pending',    -- pending, syncing, synced, error
  sync_error TEXT,
  last_synced_at TIMESTAMPTZ,
  budget_type TEXT DEFAULT 'daily',      -- daily ou lifetime
  special_ad_categories TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE "facebook-campaigns".campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own campaigns" ON "facebook-campaigns".campaigns
  FOR SELECT USING (
    ad_account_id IN (
      SELECT aa.id FROM "facebook-campaigns".ad_accounts aa
      JOIN "facebook-campaigns".business_managers bm ON aa.business_manager_id = bm.id
      JOIN "facebook-campaigns".profiles p ON bm.profile_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can insert their own campaigns" ON "facebook-campaigns".campaigns
  FOR INSERT WITH CHECK (
    ad_account_id IN (
      SELECT aa.id FROM "facebook-campaigns".ad_accounts aa
      JOIN "facebook-campaigns".business_managers bm ON aa.business_manager_id = bm.id
      JOIN "facebook-campaigns".profiles p ON bm.profile_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can update their own campaigns" ON "facebook-campaigns".campaigns
  FOR UPDATE USING (
    ad_account_id IN (
      SELECT aa.id FROM "facebook-campaigns".ad_accounts aa
      JOIN "facebook-campaigns".business_managers bm ON aa.business_manager_id = bm.id
      JOIN "facebook-campaigns".profiles p ON bm.profile_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can delete their own campaigns" ON "facebook-campaigns".campaigns
  FOR DELETE USING (
    ad_account_id IN (
      SELECT aa.id FROM "facebook-campaigns".ad_accounts aa
      JOIN "facebook-campaigns".business_managers bm ON aa.business_manager_id = bm.id
      JOIN "facebook-campaigns".profiles p ON bm.profile_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );


-- =====================================================================
-- 5. AD SETS (Conjuntos de Anúncio)
-- =====================================================================
CREATE TABLE "facebook-campaigns".ad_sets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  campaign_id UUID REFERENCES "facebook-campaigns".campaigns(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'DRAFT',
  -- Targeting
  targeting_countries TEXT[] DEFAULT '{"BR"}',
  age_min INT DEFAULT 18,
  age_max INT DEFAULT 65,
  genders INT[] DEFAULT '{0}',           -- 0=todos, 1=masc, 2=fem
  -- Budget & Schedule
  daily_budget BIGINT,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  -- Meta API
  facebook_adset_id TEXT,
  sync_status TEXT DEFAULT 'pending',
  sync_error TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE "facebook-campaigns".ad_sets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ad_sets" ON "facebook-campaigns".ad_sets
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own ad_sets" ON "facebook-campaigns".ad_sets
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own ad_sets" ON "facebook-campaigns".ad_sets
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own ad_sets" ON "facebook-campaigns".ad_sets
  FOR DELETE USING (auth.uid() = user_id);


-- =====================================================================
-- 6. ADS (Anúncios)
-- =====================================================================
CREATE TABLE "facebook-campaigns".ads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  ad_set_id UUID REFERENCES "facebook-campaigns".ad_sets(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'DRAFT',
  -- Creative
  headline TEXT,
  primary_text TEXT,
  call_to_action TEXT DEFAULT 'LEARN_MORE',
  link_url TEXT,
  -- Media
  video_drive_url TEXT,
  video_facebook_id TEXT,
  thumbnail_url TEXT,
  -- Meta API
  facebook_ad_id TEXT,
  sync_status TEXT DEFAULT 'pending',
  sync_error TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE "facebook-campaigns".ads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ads" ON "facebook-campaigns".ads
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own ads" ON "facebook-campaigns".ads
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own ads" ON "facebook-campaigns".ads
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own ads" ON "facebook-campaigns".ads
  FOR DELETE USING (auth.uid() = user_id);


-- =====================================================================
-- 7. PIXELS
-- =====================================================================
CREATE TABLE "facebook-campaigns".pixels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_manager_id UUID REFERENCES "facebook-campaigns".business_managers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  pixel_id TEXT NOT NULL,                -- Facebook Pixel ID
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE "facebook-campaigns".pixels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage pixels via BM" ON "facebook-campaigns".pixels
  FOR ALL USING (
    business_manager_id IN (
      SELECT bm.id FROM "facebook-campaigns".business_managers bm
      JOIN "facebook-campaigns".profiles p ON bm.profile_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );


-- =====================================================================
-- 8. AD PAGES (Páginas do Facebook)
-- =====================================================================
CREATE TABLE "facebook-campaigns".ad_pages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_manager_id UUID REFERENCES "facebook-campaigns".business_managers(id) ON DELETE CASCADE,
  page_id TEXT NOT NULL,                 -- Facebook Page ID
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE "facebook-campaigns".ad_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage ad_pages via BM" ON "facebook-campaigns".ad_pages
  FOR ALL USING (
    business_manager_id IN (
      SELECT bm.id FROM "facebook-campaigns".business_managers bm
      JOIN "facebook-campaigns".profiles p ON bm.profile_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );


-- =====================================================================
-- 9. INSTAGRAM ACCOUNTS
-- =====================================================================
CREATE TABLE "facebook-campaigns".instagram_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_manager_id UUID REFERENCES "facebook-campaigns".business_managers(id) ON DELETE CASCADE,
  ad_page_id UUID REFERENCES "facebook-campaigns".ad_pages(id) ON DELETE SET NULL,
  instagram_actor_id TEXT NOT NULL,      -- Instagram Business Account ID
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE "facebook-campaigns".instagram_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage instagram_accounts via BM" ON "facebook-campaigns".instagram_accounts
  FOR ALL USING (
    business_manager_id IN (
      SELECT bm.id FROM "facebook-campaigns".business_managers bm
      JOIN "facebook-campaigns".profiles p ON bm.profile_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );


-- =====================================================================
-- 10. WEBSITES
-- =====================================================================
CREATE TABLE "facebook-campaigns".websites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_manager_id UUID REFERENCES "facebook-campaigns".business_managers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE "facebook-campaigns".websites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage websites via BM" ON "facebook-campaigns".websites
  FOR ALL USING (
    business_manager_id IN (
      SELECT bm.id FROM "facebook-campaigns".business_managers bm
      JOIN "facebook-campaigns".profiles p ON bm.profile_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );


-- =====================================================================
-- 11. BULK TEMPLATES (Templates de Criação em Massa)
-- =====================================================================
CREATE TABLE "facebook-campaigns".bulk_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  config JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE "facebook-campaigns".bulk_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own templates" ON "facebook-campaigns".bulk_templates
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users insert own templates" ON "facebook-campaigns".bulk_templates
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users update own templates" ON "facebook-campaigns".bulk_templates
  FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users delete own templates" ON "facebook-campaigns".bulk_templates
  FOR DELETE USING (user_id = auth.uid());


-- =====================================================================
-- HELPER: Auto-update updated_at
-- =====================================================================
CREATE OR REPLACE FUNCTION "facebook-campaigns".handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON "facebook-campaigns".profiles
  FOR EACH ROW EXECUTE PROCEDURE "facebook-campaigns".handle_updated_at();

CREATE TRIGGER business_managers_updated_at
  BEFORE UPDATE ON "facebook-campaigns".business_managers
  FOR EACH ROW EXECUTE PROCEDURE "facebook-campaigns".handle_updated_at();

CREATE TRIGGER ad_accounts_updated_at
  BEFORE UPDATE ON "facebook-campaigns".ad_accounts
  FOR EACH ROW EXECUTE PROCEDURE "facebook-campaigns".handle_updated_at();

CREATE TRIGGER campaigns_updated_at
  BEFORE UPDATE ON "facebook-campaigns".campaigns
  FOR EACH ROW EXECUTE PROCEDURE "facebook-campaigns".handle_updated_at();

CREATE TRIGGER ad_sets_updated_at
  BEFORE UPDATE ON "facebook-campaigns".ad_sets
  FOR EACH ROW EXECUTE PROCEDURE "facebook-campaigns".handle_updated_at();

CREATE TRIGGER ads_updated_at
  BEFORE UPDATE ON "facebook-campaigns".ads
  FOR EACH ROW EXECUTE PROCEDURE "facebook-campaigns".handle_updated_at();

CREATE TRIGGER pixels_updated_at
  BEFORE UPDATE ON "facebook-campaigns".pixels
  FOR EACH ROW EXECUTE PROCEDURE "facebook-campaigns".handle_updated_at();

CREATE TRIGGER ad_pages_updated_at
  BEFORE UPDATE ON "facebook-campaigns".ad_pages
  FOR EACH ROW EXECUTE PROCEDURE "facebook-campaigns".handle_updated_at();

CREATE TRIGGER instagram_accounts_updated_at
  BEFORE UPDATE ON "facebook-campaigns".instagram_accounts
  FOR EACH ROW EXECUTE PROCEDURE "facebook-campaigns".handle_updated_at();

CREATE TRIGGER websites_updated_at
  BEFORE UPDATE ON "facebook-campaigns".websites
  FOR EACH ROW EXECUTE PROCEDURE "facebook-campaigns".handle_updated_at();

CREATE TRIGGER bulk_templates_updated_at
  BEFORE UPDATE ON "facebook-campaigns".bulk_templates
  FOR EACH ROW EXECUTE PROCEDURE "facebook-campaigns".handle_updated_at();

