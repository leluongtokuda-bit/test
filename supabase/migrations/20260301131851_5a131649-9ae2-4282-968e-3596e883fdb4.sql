
-- Add bank card image URL column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bank_card_image_url text;

-- Create storage bucket for bank card images
INSERT INTO storage.buckets (id, name, public) VALUES ('bank-cards', 'bank-cards', false)
ON CONFLICT (id) DO NOTHING;

-- Users can upload their own bank card image
CREATE POLICY "Users can upload own bank card"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'bank-cards' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Users can view their own bank card image
CREATE POLICY "Users can view own bank card"
ON storage.objects FOR SELECT
USING (bucket_id = 'bank-cards' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Admins can view all bank card images
CREATE POLICY "Admins can view all bank cards"
ON storage.objects FOR SELECT
USING (bucket_id = 'bank-cards' AND public.has_role(auth.uid(), 'admin'));
