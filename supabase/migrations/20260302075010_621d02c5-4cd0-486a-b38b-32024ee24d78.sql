-- Allow admins to upload receipts to the receipts bucket
CREATE POLICY "Admins can upload receipts"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'receipts' AND public.has_role(auth.uid(), 'admin'));

-- Allow users to view their own receipts (path starts with their user_id)
CREATE POLICY "Users can view own receipts"
ON storage.objects
FOR SELECT
USING (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]);