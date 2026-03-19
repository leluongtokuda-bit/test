CREATE POLICY "Admins can insert transaction requests"
ON public.transaction_requests
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));