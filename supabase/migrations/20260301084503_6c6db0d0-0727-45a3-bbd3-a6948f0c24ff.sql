
-- Add new columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS full_name text,
ADD COLUMN IF NOT EXISTS date_of_birth date,
ADD COLUMN IF NOT EXISTS address text,
ADD COLUMN IF NOT EXISTS id_card_front_url text,
ADD COLUMN IF NOT EXISTS id_card_back_url text,
ADD COLUMN IF NOT EXISTS referral_code_used text;

-- Create unique index on phone
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone);

-- Create referral_codes table managed by admin
CREATE TABLE public.referral_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  created_by uuid NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  max_uses integer DEFAULT null,
  current_uses integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage referral codes"
ON public.referral_codes
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can validate referral codes"
ON public.referral_codes
FOR SELECT
TO authenticated, anon
USING (is_active = true);

-- Create storage bucket for ID card images
INSERT INTO storage.buckets (id, name, public) VALUES ('id-cards', 'id-cards', false);

-- Storage policies for id-cards bucket
CREATE POLICY "Users can upload own ID cards"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'id-cards' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own ID cards"
ON storage.objects FOR SELECT
USING (bucket_id = 'id-cards' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins can view all ID cards"
ON storage.objects FOR SELECT
USING (bucket_id = 'id-cards' AND public.has_role(auth.uid(), 'admin'::app_role));
