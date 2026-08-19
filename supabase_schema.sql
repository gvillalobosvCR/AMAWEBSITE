-- Supabase Schema for Arenal Mundo Aventura Digital Waiver System

-- 1. Profiles Table (Linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('ADMIN', 'KIOSK')),
  full_name TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Waiver Versions Table
CREATE TABLE IF NOT EXISTS public.waiver_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version TEXT NOT NULL UNIQUE,
  title_es TEXT NOT NULL,
  title_en TEXT NOT NULL,
  content_es TEXT NOT NULL,
  content_en TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Waiver Consecutives Table
CREATE TABLE IF NOT EXISTS public.waiver_consecutives (
  date_str TEXT PRIMARY KEY,
  last_value INTEGER NOT NULL DEFAULT 0
);

-- 4. Waivers Table
CREATE TABLE IF NOT EXISTS public.waivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  waiver_number TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  id_passport TEXT NOT NULL,
  age INTEGER NOT NULL,
  language TEXT NOT NULL CHECK (language IN ('es', 'en')),
  exact_content TEXT NOT NULL,
  version_id UUID REFERENCES public.waiver_versions(id),
  signature_path TEXT NOT NULL, -- Path in Supabase storage
  tablet_user_id UUID REFERENCES public.profiles(id),
  is_minor BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('America/Costa_Rica', NOW())
);

-- 5. Guardian Information Table (for minors)
CREATE TABLE IF NOT EXISTS public.guardian_information (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  waiver_id UUID NOT NULL UNIQUE REFERENCES public.waivers(id) ON DELETE CASCADE,
  guardian_name TEXT NOT NULL,
  guardian_id_passport TEXT NOT NULL,
  relationship TEXT NOT NULL,
  guardian_signature_path TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Application Settings Table
CREATE TABLE IF NOT EXISTS public.app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Functions and Triggers

-- Trigger to sync Supabase Auth users to profiles table
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, active)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', new.email),
    COALESCE(new.raw_user_meta_data->>'role', 'KIOSK'),
    TRUE
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Thread-safe, timezone-compliant waiver code generator function
CREATE OR REPLACE FUNCTION public.generate_waiver_number()
RETURNS TEXT AS $$
DECLARE
  today_str TEXT;
  next_val INTEGER;
BEGIN
  -- Costa Rica is UTC-6, retrieve date string in this timezone
  today_str := TO_CHAR(TIMEZONE('America/Costa_Rica', NOW()), 'YYYYMMDD');
  
  INSERT INTO public.waiver_consecutives (date_str, last_value)
  VALUES (today_str, 1)
  ON CONFLICT (date_str) DO UPDATE
  SET last_value = waiver_consecutives.last_value + 1
  RETURNING last_value INTO next_val;
  
  RETURN 'AMA-' || today_str || '-' || LPAD(next_val::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Seed Default Application Settings
INSERT INTO public.app_settings (key, value, updated_at) VALUES
('min_age', '{"value": 18}', NOW()),
('inactivity_timeout', '{"value": 120}', NOW()),
('confirmation_timeout', '{"value": 5}', NOW())
ON CONFLICT (key) DO NOTHING;

-- Seed Default Waiver Text Version 1.0
INSERT INTO public.waiver_versions (version, title_es, title_en, content_es, content_en, is_active) VALUES
('1.0', 
 'Formulario de Descargo de Responsabilidad y Aceptación de Riesgos', 
 'Liability Waiver, Release and Assumption of Risk Form',
 'Por medio de este documento acepto participar de manera voluntaria en las actividades de canopy, senderismo y turismo de aventura ofrecidas por ACSUFA Parque Ecológico S.A. (Arenal Mundo Aventura). Declaro bajo juramento que me encuentro en óptimas condiciones de salud física y mental para realizar estas actividades. Reconozco y asumo de manera libre todos los riesgos propios de estas actividades deportivas al aire libre, tales como caídas, condiciones del terreno, clima y contacto con flora y fauna. Libero de toda responsabilidad a ACSUFA Parque Ecológico S.A., sus directores, guías y colaboradores por cualquier accidente, lesión o pérdida material que pudiera sufrir durante mi participación.',
 'By this document, I agree to voluntarily participate in canopy, hiking, and adventure tourism activities offered by ACSUFA Parque Ecológico S.A. (Arenal Mundo Aventura). I declare under oath that I am in optimal physical and mental health to perform these activities. I freely recognize and assume all risks inherent in these outdoor sports activities, including falls, terrain conditions, weather, and contact with flora and fauna. I release ACSUFA Parque Ecológico S.A., its directors, guides, and staff from any liability for any accident, injury, or loss of property that I might suffer during my participation.',
 TRUE)
ON CONFLICT (version) DO NOTHING;

-- 9. Enable Row Level Security (RLS) on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waiver_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guardian_information ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- 10. Define RLS Policies

-- PROFILES policies
CREATE POLICY "Allow authenticated to read profiles" ON public.profiles
  FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "Allow ADMIN to insert profiles" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'ADMIN')
  );

CREATE POLICY "Allow ADMIN to update profiles" ON public.profiles
  FOR UPDATE TO authenticated USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'ADMIN')
  ) WITH CHECK (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'ADMIN')
  );

-- WAIVER_VERSIONS policies
CREATE POLICY "Allow authenticated to view waiver versions" ON public.waiver_versions
  FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "Allow ADMIN to manage waiver versions" ON public.waiver_versions
  FOR ALL TO authenticated USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'ADMIN')
  );

-- WAIVERS policies
CREATE POLICY "Allow authenticated to insert waivers" ON public.waivers
  FOR INSERT TO authenticated WITH CHECK (TRUE);

CREATE POLICY "Allow ADMIN to read waivers" ON public.waivers
  FOR SELECT TO authenticated USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'ADMIN')
  );

-- GUARDIAN_INFORMATION policies
CREATE POLICY "Allow authenticated to insert guardian info" ON public.guardian_information
  FOR INSERT TO authenticated WITH CHECK (TRUE);

CREATE POLICY "Allow ADMIN to read guardian info" ON public.guardian_information
  FOR SELECT TO authenticated USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'ADMIN')
  );

-- APP_SETTINGS policies
CREATE POLICY "Allow authenticated to read app settings" ON public.app_settings
  FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "Allow ADMIN to manage app settings" ON public.app_settings
  FOR ALL TO authenticated USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'ADMIN')
  );

-- 11. Storage Setup for private signature images

-- Create the waiver-signatures bucket if it does not exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'waiver-signatures',
  'waiver-signatures',
  FALSE, -- Private bucket
  524288, -- 500 KB size limit
  ARRAY['image/png']
) ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies for waiver-signatures
CREATE POLICY "Allow authenticated to upload signatures" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'waiver-signatures'
  );

CREATE POLICY "Allow ADMIN to read signatures" ON storage.objects
  FOR SELECT TO authenticated USING (
    bucket_id = 'waiver-signatures' AND
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'ADMIN'
  );

-- 12. Agencies Table & Relations
CREATE TABLE IF NOT EXISTS public.agencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow authenticated to view agencies" ON public.agencies
  FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "Allow ADMIN to manage agencies" ON public.agencies
  FOR ALL TO authenticated USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'ADMIN')
  );

-- Add column to waivers
ALTER TABLE public.waivers ADD COLUMN IF NOT EXISTS agency_id UUID REFERENCES public.agencies(id) ON DELETE SET NULL;

-- Seed Default Kiosk PIN
INSERT INTO public.app_settings (key, value, updated_at) VALUES
('kiosk_pin', '{"value": "1234"}', NOW())
ON CONFLICT (key) DO NOTHING;

-- 13. Add email column to waivers
ALTER TABLE public.waivers ADD COLUMN IF NOT EXISTS email TEXT;

