
-- Add receipt image column to transaction_requests
ALTER TABLE public.transaction_requests ADD COLUMN IF NOT EXISTS receipt_image_url TEXT;

-- Create storage bucket for receipts
INSERT INTO storage.buckets (id, name, public) VALUES ('receipts', 'receipts', false)
ON CONFLICT (id) DO NOTHING;

-- RLS: users can upload their own receipts
CREATE POLICY "Users can upload their own receipts"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]);

-- RLS: users can view their own receipts
CREATE POLICY "Users can view their own receipts"
ON storage.objects FOR SELECT
USING (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]);

-- RLS: admins can view all receipts
CREATE POLICY "Admins can view all receipts"
ON storage.objects FOR SELECT
USING (bucket_id = 'receipts' AND public.has_role(auth.uid(), 'admin'));
