
-- Allow users to update receipt_image_url on their own pending requests
CREATE POLICY "Users can update own pending requests receipt"
ON public.transaction_requests
FOR UPDATE
USING (auth.uid() = user_id AND status = 'pending')
WITH CHECK (auth.uid() = user_id AND status = 'pending');
